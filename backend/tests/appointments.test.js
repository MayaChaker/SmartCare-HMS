const { startApp, client, login, createStaff, createDoctor, registerPatient, dateFromToday } = require("./helpers");
const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { Appointment } = require("../models");

describe("appointments", () => {
  let app;
  let request;
  let doctor;
  let weekdayDoctor;
  let patientToken;
  let receptionToken;
  let doctorToken;
  let walkIn;
  const day = dateFromToday(1);

  // Next Saturday, for the weekday-only doctor
  const nextSaturday = () => {
    for (let i = 1; i <= 7; i++) {
      const ymd = dateFromToday(i);
      if (new Date(`${ymd}T00:00:00`).getDay() === 6) return ymd;
    }
    return null;
  };

  before(async () => {
    app = await startApp();
    request = client(app.baseUrl);
    doctor = (await createDoctor("dr.allweek")).doctor;
    weekdayDoctor = (await createDoctor("dr.weekdays", { workingHours: "Mon - Fri 09:00 AM - 05:00 PM" })).doctor;
    await createStaff("front.desk", "receptionist");
    await registerPatient(request, "booker");
    walkIn = await registerPatient(request, "walkin");
    patientToken = await login(request, "booker");
    receptionToken = await login(request, "front.desk");
    doctorToken = await login(request, "dr.allweek");
  });
  after(() => app.stop());

  const book = (time, date = day, doctorId = doctor.id) =>
    request("POST", "/patient/appointments", {
      token: patientToken,
      body: { doctorId, appointmentDate: date, appointmentTime: time, reason: "Checkup" },
    });

  describe("booking", () => {
    it("books a free slot in the doctor's working hours", async () => {
      const res = await book("10:00");
      assert.equal(res.status, 201);
      assert.equal(res.body.appointment.status, "scheduled");
    });

    it("rejects a slot that is already taken", async () => {
      const res = await book("10:00");
      assert.equal(res.status, 409);
    });

    it("rejects times outside working hours and days off", async () => {
      assert.equal((await book("07:00")).status, 409);
      const saturday = nextSaturday();
      const res = await book("10:00", saturday, weekdayDoctor.id);
      assert.equal(res.status, 409);
      assert.match(res.body.message, /not available on Sat/);
    });

    it("validates the date and time format", async () => {
      assert.equal((await book("10:00", "05/10/2026")).status, 400);
      assert.equal((await book("10am")).status, 400);
    });

    it("rejects a date that has already passed", async () => {
      const res = await book("10:00", dateFromToday(-1));
      assert.equal(res.status, 400);
      assert.match(res.body.message, /in the future/);
    });

    it("does not book the same patient into two visits at the same time", async () => {
      const other = (await createDoctor("dr.second")).doctor;
      assert.equal((await book("10:40")).status, 201);
      const res = await book("10:40", day, other.id);
      assert.equal(res.status, 409);
      assert.match(res.body.message, /another visit at this time/);
    });

    it("frees the slot again when a visit is cancelled", async () => {
      const first = await book("11:00");
      const cancel = await request("DELETE", `/patient/appointments/${first.body.appointment.id}`, { token: patientToken });
      assert.equal(cancel.status, 200);
      const again = await book("11:00");
      assert.equal(again.status, 201);
    });
  });

  describe("patient changes", () => {
    it("reschedules a scheduled visit", async () => {
      const created = await book("12:00");
      const res = await request("PUT", `/patient/appointments/${created.body.appointment.id}`, {
        token: patientToken,
        body: { appointmentTime: "12:20:00" },
      });
      assert.equal(res.status, 200);
      assert.equal(res.body.appointment.appointmentTime, "12:20:00");
    });

    it("does not reschedule into the past", async () => {
      const created = await book("12:40");
      const res = await request("PUT", `/patient/appointments/${created.body.appointment.id}`, {
        token: patientToken,
        body: { appointmentDate: dateFromToday(-1) },
      });
      assert.equal(res.status, 400);
    });

    it("never deletes a visit, even when asked for a hard delete", async () => {
      const created = await book("16:00");
      const id = created.body.appointment.id;
      const res = await request("DELETE", `/patient/appointments/${id}?hard=true`, { token: patientToken });
      assert.equal(res.status, 200);
      const list = await request("GET", "/patient/appointments", { token: patientToken });
      assert.equal(list.body.find((a) => a.id === id)?.status, "cancelled");
    });

    it("ignores a status sent by the patient", async () => {
      const created = await book("13:00");
      const id = created.body.appointment.id;
      await request("PUT", `/patient/appointments/${id}`, { token: patientToken, body: { status: "completed" } });
      const list = await request("GET", "/patient/appointments", { token: patientToken });
      assert.equal(list.body.find((a) => a.id === id).status, "scheduled");
    });
  });

  describe("visit status flow", () => {
    let visitId;

    before(async () => {
      const res = await request("POST", "/receptionist/appointments", {
        token: receptionToken,
        body: { patientId: walkIn.id, doctorId: doctor.id, appointmentDate: day, appointmentTime: "14:00", reason: "Walk-in" },
      });
      visitId = res.body.appointment.id;
    });

    it("does not complete a visit before check-in", async () => {
      const res = await request("PUT", `/receptionist/appointments/${visitId}`, { token: receptionToken, body: { status: "completed" } });
      assert.equal(res.status, 400);
    });

    it("checks in, starts and completes a visit", async () => {
      let res = await request("PUT", `/receptionist/checkin/${visitId}`, { token: receptionToken });
      assert.equal(res.status, 200);
      res = await request("PUT", `/doctor/appointments/${visitId}`, { token: doctorToken, body: { status: "in-progress" } });
      assert.equal(res.status, 200);
      res = await request("PUT", `/doctor/appointments/${visitId}`, { token: doctorToken, body: { status: "completed" } });
      assert.equal(res.status, 200);

      // Each step keeps the time it happened, in order
      const { checkedInAt, startedAt, completedAt } = (await Appointment.findByPk(visitId)).toJSON();
      assert.ok(checkedInAt && startedAt && completedAt);
      assert.ok(checkedInAt <= startedAt && startedAt <= completedAt);
    });

    it("saves the full visit note and shows the chart in the doctor's list", async () => {
      let res = await request("POST", "/doctor/records", {
        token: doctorToken,
        body: {
          appointmentId: visitId,
          symptoms: "Headache for a week",
          diagnosis: "Tension headache",
          treatment: "Rest and water",
          prescriptions: "Paracetamol, 1 g, every 8 hours, 5 days",
          followUpDate: "2026-12-01",
        },
      });
      assert.equal(res.status, 201);
      assert.equal(res.body.record.symptoms, "Headache for a week");
      assert.equal(res.body.record.treatment, "Rest and water");
      assert.equal(res.body.record.followUpDate, "2026-12-01");

      res = await request("PUT", `/doctor/records/${res.body.record.id}`, { token: doctorToken, body: { treatment: "", followUpDate: "soon" } });
      assert.equal(res.status, 400, "a follow-up date must be a real date");

      res = await request("GET", "/doctor/appointments", { token: doctorToken });
      const visit = res.body.find((a) => a.id === visitId);
      assert.equal(visit.MedicalRecord.diagnosis, "Tension headache");
      assert.ok("allergies" in visit.Patient && "bloodType" in visit.Patient);
    });

    it("keeps each step with its own role", async () => {
      const created = await request("POST", "/receptionist/appointments", {
        token: receptionToken,
        body: { patientId: walkIn.id, doctorId: doctor.id, appointmentDate: day, appointmentTime: "14:20" },
      });
      const id = created.body.appointment.id;
      let res = await request("PUT", `/doctor/appointments/${id}`, { token: doctorToken, body: { status: "checked-in" } });
      assert.equal(res.status, 400);
      await request("PUT", `/receptionist/checkin/${id}`, { token: receptionToken });
      res = await request("PUT", `/receptionist/appointments/${id}`, { token: receptionToken, body: { status: "in-progress" } });
      assert.equal(res.status, 400);
      res = await request("PUT", `/doctor/appointments/${id}`, { token: doctorToken, body: { status: "scheduled" } });
      assert.equal(res.status, 400);
    });

    it("keeps completed visits final", async () => {
      let res = await request("PUT", `/doctor/appointments/${visitId}`, { token: doctorToken, body: { status: "scheduled" } });
      assert.equal(res.status, 400);
      res = await request("PUT", `/receptionist/checkin/${visitId}`, { token: receptionToken });
      assert.equal(res.status, 400);
      res = await request("PUT", `/receptionist/appointments/${visitId}`, { token: receptionToken, body: { appointmentTime: "16:20" } });
      assert.equal(res.status, 400);
    });

    it("rejects unknown statuses", async () => {
      const res = await request("PUT", `/doctor/appointments/${visitId}`, { token: doctorToken, body: { status: "done" } });
      assert.equal(res.status, 400);
    });

    it("lets the receptionist cancel before check-in", async () => {
      const created = await request("POST", "/receptionist/appointments", {
        token: receptionToken,
        body: { patientId: walkIn.id, doctorId: doctor.id, appointmentDate: day, appointmentTime: "15:00" },
      });
      const res = await request("PUT", `/receptionist/appointments/${created.body.appointment.id}`, {
        token: receptionToken,
        body: { status: "cancelled" },
      });
      assert.equal(res.status, 200);
    });

    it("does not book a walk-in in the past", async () => {
      const res = await request("POST", "/receptionist/appointments", {
        token: receptionToken,
        body: { patientId: walkIn.id, doctorId: doctor.id, appointmentDate: dateFromToday(-1), appointmentTime: "10:00" },
      });
      assert.equal(res.status, 400);
    });

    it("marks a no-show only after the visit time has passed", async () => {
      const upcoming = await request("POST", "/receptionist/appointments", {
        token: receptionToken,
        body: { patientId: walkIn.id, doctorId: doctor.id, appointmentDate: day, appointmentTime: "11:20" },
      });
      let res = await request("PUT", `/receptionist/appointments/${upcoming.body.appointment.id}`, {
        token: receptionToken,
        body: { status: "no-show" },
      });
      assert.equal(res.status, 400);

      const missed = await Appointment.create({
        patientId: walkIn.id,
        doctorId: doctor.id,
        appointmentDate: dateFromToday(-1),
        appointmentTime: "11:20:00",
      });
      res = await request("PUT", `/receptionist/appointments/${missed.id}`, { token: receptionToken, body: { status: "no-show" } });
      assert.equal(res.status, 200);
      assert.equal(res.body.appointment.status, "no-show");
    });

    it("returns 404 when booking for an unknown patient", async () => {
      const res = await request("POST", "/receptionist/appointments", {
        token: receptionToken,
        body: { patientId: 999999, doctorId: doctor.id, appointmentDate: day, appointmentTime: "16:00" },
      });
      assert.equal(res.status, 404);
    });
  });
  describe("availability", () => {
    it("lists free times per doctor, without booked slots or days off", async () => {
      const res = await request("GET", "/patient/availability?days=7", { token: patientToken });
      assert.equal(res.status, 200);
      assert.equal(res.body.days, 7);
      assert.equal(res.body.slotMinutes, 20);

      const allWeek = res.body.doctors.find((d) => d.doctorId === doctor.id);
      const booked = allWeek.days.find((d) => d.date === day);
      assert.ok(booked, "tomorrow is in the range");
      assert.ok(!booked.times.includes("10:00"), "the slot booked earlier is not offered");
      assert.ok(booked.times.includes("09:00"));

      const weekdays = res.body.doctors.find((d) => d.doctorId === weekdayDoctor.id);
      const saturday = weekdays.days.find((d) => new Date(`${d.date}T00:00:00Z`).getUTCDay() === 6);
      assert.deepEqual(saturday, { date: saturday.date, working: false, times: [] });
    });

    it("is only for patients", async () => {
      const res = await request("GET", "/patient/availability", { token: receptionToken });
      assert.equal(res.status, 403);
    });
  });
});
