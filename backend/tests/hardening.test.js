// Regression tests for the production audit: error answers, duplicates, concurrent bookings,
// profile updates, what a doctor can read, and deleting accounts that have medical history.
const { PASSWORD, startApp, client, login, createStaff, createDoctor, registerPatient, dateFromToday } = require("./helpers");
const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");

describe("production hardening", () => {
  let app;
  let request;
  let tokens;
  let doctor;

  before(async () => {
    app = await startApp();
    request = client(app.baseUrl);
    await createStaff("admin.h", "admin");
    await createStaff("desk.h", "receptionist");
    doctor = (await createDoctor("doctor.h")).doctor;
    await registerPatient(request, "patient.h");
    await registerPatient(request, "patient.h2");
    tokens = {
      admin: await login(request, "admin.h"),
      desk: await login(request, "desk.h"),
      doctor: await login(request, "doctor.h"),
      patient: await login(request, "patient.h"),
      patient2: await login(request, "patient.h2"),
    };
  });
  after(() => app.stop());

  describe("error answers", () => {
    it("answers malformed JSON with 400, not 500", async () => {
      const res = await request("POST", "/auth/login", { headers: { "Content-Type": "application/json" }, form: "{not json" });
      assert.equal(res.status, 400);
      assert.equal(typeof res.body.message, "string");
    });

    it("answers unknown routes and removed endpoints with 404 and a message", async () => {
      // Each with the token of the role that owns the area, so the role check passes and the route is looked up
      for (const [method, path, role] of [
        ["GET", "/no-such-route", "admin"],
        ["PUT", "/doctor/profile", "doctor"],
        ["GET", "/admin/patients", "admin"],
        ["PUT", "/admin/users/1", "admin"],
        ["GET", "/receptionist/schedules", "desk"],
        ["GET", "/patient/doctors/1/booked-times?date=2030-01-01", "patient"],
      ]) {
        const res = await request(method, path, { token: tokens[role], ...(method === "GET" ? {} : { body: {} }) });
        assert.equal(res.status, 404, `${method} ${path}`);
        assert.equal(res.body.message, "Not found");
      }
    });

    it("refuses dates that do not exist", async () => {
      const res = await request("POST", "/patient/appointments", {
        token: tokens.patient,
        body: { doctorId: doctor.id, appointmentDate: "2030-02-30", appointmentTime: "10:00" },
      });
      assert.equal(res.status, 400);
    });
  });

  describe("usernames", () => {
    it("answers a taken username with 409 Conflict", async () => {
      const res = await request("POST", "/auth/register-patient", { body: { username: "patient.h", password: PASSWORD } });
      assert.equal(res.status, 409);
      const staff = await request("POST", "/admin/users", { token: tokens.admin, body: { username: "desk.h", role: "receptionist" } });
      assert.equal(staff.status, 409);
    });

    it("gives the same answer for an unknown username and a wrong password", async () => {
      const unknown = await request("POST", "/auth/login", { body: { username: "nobody.here", password: PASSWORD } });
      const wrong = await request("POST", "/auth/login", { body: { username: "patient.h", password: `${PASSWORD}-x` } });
      assert.equal(unknown.status, 401);
      assert.deepEqual(unknown.body, wrong.body);
    });
  });

  describe("bookings at the same moment", () => {
    it("books a slot once when two patients ask for it together", async () => {
      const body = { doctorId: doctor.id, appointmentDate: dateFromToday(3), appointmentTime: "11:00" };
      const results = await Promise.all([
        request("POST", "/patient/appointments", { token: tokens.patient, body }),
        request("POST", "/patient/appointments", { token: tokens.patient2, body }),
      ]);
      const statuses = results.map((r) => r.status).sort();
      assert.deepEqual(statuses, [201, 409]);
    });

    it("books a slot once when the patient and the front desk ask together", async () => {
      const profile = (await request("GET", "/patient/profile", { token: tokens.patient2 })).body;
      const slot = { doctorId: doctor.id, appointmentDate: dateFromToday(3), appointmentTime: "11:40" };
      const results = await Promise.all([
        request("POST", "/patient/appointments", { token: tokens.patient2, body: slot }),
        request("POST", "/receptionist/appointments", { token: tokens.desk, body: { ...slot, patientId: profile.id } }),
      ]);
      assert.deepEqual(results.map((r) => r.status).sort(), [201, 409]);
    });
  });

  describe("patient profile", () => {
    const put = (body) => request("PUT", "/patient/profile", { token: tokens.patient, body });

    it("lets a patient clear a field, and returns the whole saved profile", async () => {
      let res = await put({ allergies: "Penicillin", permanentMedicine: "Aspirin 100 mg" });
      assert.equal(res.status, 200);
      assert.equal(res.body.patient.permanentMedicine, "Aspirin 100 mg");

      res = await put({ allergies: "" });
      assert.equal(res.status, 200);
      assert.equal(res.body.patient.allergies, "");
      const saved = await request("GET", "/patient/profile", { token: tokens.patient });
      assert.equal(saved.body.allergies, "");
      assert.equal(saved.body.permanentMedicine, "Aspirin 100 mg");
    });

    it("checks what is saved", async () => {
      assert.equal((await put({ firstName: "" })).status, 400);
      assert.equal((await put({ email: "not-an-email" })).status, 400);
      assert.equal((await put({ dateOfBirth: "1990-13-01" })).status, 400);
      assert.equal((await put({ dateOfBirth: "2999-01-01" })).status, 400);
      assert.equal((await put({ bloodType: "Z+" })).status, 400);
      assert.equal((await put({ allergies: { $gt: "" } })).status, 400);
      assert.equal((await put({ bloodType: "O-", gender: "Female" })).status, 200);
    });
  });

  describe("what a doctor can read", () => {
    it("never shows the account link or the activation code's hash", async () => {
      const opened = await request("POST", "/receptionist/patients", {
        token: tokens.desk,
        body: { firstName: "Nadia", lastName: "Desk", phone: "+961 70 111 222" },
      });
      assert.equal(opened.status, 201);
      const booked = await request("POST", "/receptionist/appointments", {
        token: tokens.desk,
        body: { patientId: opened.body.patient.id, doctorId: doctor.id, appointmentDate: dateFromToday(4), appointmentTime: "09:20" },
      });
      assert.equal(booked.status, 201);

      const res = await request("GET", `/doctor/patients/${opened.body.patient.id}`, { token: tokens.doctor });
      assert.equal(res.status, 200);
      for (const key of ["activationCodeHash", "activationExpiresAt", "userId"]) {
        assert.equal(key in res.body.patient, false, key);
      }
    });

    it("lists patients without inventing a medical history", async () => {
      const res = await request("GET", "/doctor/patients", { token: tokens.doctor });
      assert.equal(res.status, 200);
      assert.ok(res.body.length > 0);
      for (const p of res.body) {
        assert.notEqual(p.medicalHistory, "Available");
        assert.equal(typeof p.hasMedicalRecords, "boolean");
      }
    });

    it("checks booking hours a doctor sets", async () => {
      const put = (body) => request("PUT", "/doctor/availability", { token: tokens.doctor, body });
      assert.equal((await put({ availability: "false" })).status, 400);
      assert.equal((await put({ workingHours: "whenever" })).status, 400);
      assert.equal((await put({ workingHours: "Mon - Fri 05:00 PM - 09:00 AM" })).status, 400);
      assert.equal((await put({ workingHours: "Sun, Mon, Tue, Wed, Thu, Fri, Sat 09:00 AM - 05:00 PM" })).status, 200);
    });
  });

  describe("deleting accounts", () => {
    it("keeps accounts that have medical history", async () => {
      const users = (await request("GET", "/admin/users", { token: tokens.admin })).body;
      // patient.h2 booked in both concurrent tests, so they certainly have a visit
      const withVisits = users.find((u) => u.username === "patient.h2");
      const res = await request("DELETE", `/admin/users/${withVisits.id}`, { token: tokens.admin });
      assert.equal(res.status, 409);
      const doctorAccount = users.find((u) => u.username === "doctor.h");
      assert.equal((await request("DELETE", `/admin/users/${doctorAccount.id}`, { token: tokens.admin })).status, 409);
    });

    it("deletes a staff account without history", async () => {
      await createStaff("desk.temp", "receptionist");
      const users = (await request("GET", "/admin/users", { token: tokens.admin })).body;
      const temp = users.find((u) => u.username === "desk.temp");
      assert.equal((await request("DELETE", `/admin/users/${temp.id}`, { token: tokens.admin })).status, 200);
      assert.equal((await request("DELETE", `/admin/users/${temp.id}`, { token: tokens.admin })).status, 404);
    });
  });
});
