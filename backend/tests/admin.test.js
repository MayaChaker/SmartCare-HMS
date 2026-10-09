const { startApp, client, login, createStaff, createDoctor, registerPatient, dateFromToday, PASSWORD } = require("./helpers");
const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { Appointment } = require("../models");

describe("administration", () => {
  let app;
  let request;
  let adminToken;
  let deskToken;

  before(async () => {
    app = await startApp();
    request = client(app.baseUrl);
    await createStaff("boss", "admin");
    await createStaff("desk.two", "receptionist");
    adminToken = await login(request, "boss");
    deskToken = await login(request, "desk.two");
  });
  after(() => app.stop());

  describe("staff accounts", () => {
    let temp;

    it("creates an account with a temporary password the person must change", async () => {
      const res = await request("POST", "/admin/users", { token: adminToken, body: { username: "new.desk", role: "receptionist" } });
      assert.equal(res.status, 201);
      assert.match(res.body.tempPassword, /^[A-Za-z2-9]{4}-[A-Za-z2-9]{4}-[A-Za-z2-9]{4}$/);
      temp = res.body.tempPassword;

      const signIn = await request("POST", "/auth/login", { body: { username: "new.desk", password: temp } });
      assert.equal(signIn.body.user.mustChangePassword, true);
      const blocked = await request("GET", "/receptionist/patients", { token: signIn.body.token });
      assert.equal(blocked.status, 403);
      assert.equal(blocked.body.code, "PASSWORD_CHANGE_REQUIRED");
    });

    it("lets them choose their own password, and only then use the system", async () => {
      const token = (await request("POST", "/auth/login", { body: { username: "new.desk", password: temp } })).body.token;
      const change = (body) => request("POST", "/auth/change-password", { token, body });
      // Test passwords come from the random value in setup.js, never from the source
      const ownPassword = `${PASSWORD}-own`;
      assert.equal((await change({ currentPassword: `${PASSWORD}-wrong`, newPassword: ownPassword })).status, 400);
      assert.equal((await change({ currentPassword: temp, newPassword: temp })).status, 400, "must differ");
      assert.equal((await change({ currentPassword: temp, newPassword: ownPassword })).status, 200);

      const again = await request("POST", "/auth/login", { body: { username: "new.desk", password: ownPassword } });
      assert.equal(again.body.user.mustChangePassword, false);
      assert.equal((await request("GET", "/receptionist/patients", { token: again.body.token })).status, 200);
    });

    it("resets a forgotten password, but not the administrator's own", async () => {
      const users = (await request("GET", "/admin/users", { token: adminToken })).body;
      const desk = users.find((u) => u.username === "new.desk");
      const me = users.find((u) => u.username === "boss");
      assert.ok(desk.lastLoginAt, "last sign-in is recorded");

      const res = await request("POST", `/admin/users/${desk.id}/reset-password`, { token: adminToken });
      assert.equal(res.status, 200);
      const signIn = await request("POST", "/auth/login", { body: { username: "new.desk", password: res.body.tempPassword } });
      assert.equal(signIn.body.user.mustChangePassword, true);

      assert.equal((await request("POST", `/admin/users/${me.id}/reset-password`, { token: adminToken })).status, 400);
    });

    it("refuses patient accounts and missing details", async () => {
      assert.equal((await request("POST", "/admin/users", { token: adminToken, body: { username: "pat.x", role: "patient" } })).status, 400);
      assert.equal((await request("POST", "/admin/users", { token: adminToken, body: { username: "dr.x", role: "doctor" } })).status, 400);
    });
  });

  describe("doctors", () => {
    let doctorId;

    it("adds a doctor with the profile patients see", async () => {
      const res = await request("POST", "/admin/users", {
        token: adminToken,
        body: { username: "dr.new", role: "doctor", firstName: "Maya", lastName: "Aoun", specialization: "Cardiology", fee: 70, experience: 9, workingHours: "Mon, Wed 09:00 AM - 01:00 PM" },
      });
      assert.equal(res.status, 201);
      doctorId = res.body.doctor.id;
      const list = (await request("GET", "/admin/doctors", { token: adminToken })).body;
      const added = list.find((d) => d.id === doctorId);
      assert.equal(Number(added.fee), 70);
      assert.equal(added.User.username, "dr.new");
      assert.ok(!("photoData" in added));
    });

    it("edits the fee and hours, and checks them", async () => {
      const put = (body) => request("PUT", `/admin/doctors/${doctorId}`, { token: adminToken, body });
      assert.equal((await put({ fee: -5 })).status, 400);
      assert.equal((await put({ workingHours: "whenever" })).status, 400);
      assert.equal((await put({ firstName: "" })).status, 400);
      const res = await put({ fee: 85, workingHours: "Tue - Thu 10:00 AM - 04:00 PM" });
      assert.equal(res.status, 200);
      assert.equal(Number(res.body.doctor.fee), 85);
      const publicList = (await request("GET", "/doctors")).body;
      assert.equal(Number(publicList.find((d) => d.id === doctorId).fee), 85, "patients see the new fee");
    });

    it("pauses bookings and says so in the activity log", async () => {
      await request("PUT", `/admin/doctors/${doctorId}`, { token: adminToken, body: { availability: false } });
      const log = (await request("GET", "/admin/activity", { token: adminToken })).body;
      const entry = log.find((e) => e.action === "doctor.updated");
      assert.equal(entry.detail, "Bookings paused");
      assert.equal(entry.targetName, "Dr. Maya Aoun");
    });
  });

  describe("activity and analytics", () => {
    let doctor;
    let patient;

    before(async () => {
      doctor = (await createDoctor("dr.figures")).doctor;
      patient = await registerPatient(request, "figures.patient");
      const today = dateFromToday(0);
      const at = (h, m) => new Date(`${today}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`);
      await Appointment.bulkCreate([
        // Waited 10 minutes, seen for 20
        { patientId: patient.id, doctorId: doctor.id, appointmentDate: today, appointmentTime: "09:00:00", status: "completed", checkedInAt: at(8, 55), startedAt: at(9, 5), completedAt: at(9, 25) },
        { patientId: patient.id, doctorId: doctor.id, appointmentDate: today, appointmentTime: "09:20:00", status: "no-show" },
        { patientId: patient.id, doctorId: doctor.id, appointmentDate: today, appointmentTime: "09:40:00", status: "cancelled" },
      ]);
    });

    it("records desk actions with names people recognise", async () => {
      const visit = await request("POST", "/receptionist/appointments", {
        token: deskToken,
        body: { patientId: patient.id, doctorId: doctor.id, appointmentDate: dateFromToday(1), appointmentTime: "11:00", reason: "Check-up" },
      });
      await request("PUT", `/receptionist/appointments/${visit.body.appointment.id}`, { token: deskToken, body: { status: "cancelled" } });

      const log = (await request("GET", "/admin/activity?role=receptionist", { token: adminToken })).body;
      assert.deepEqual(log.slice(0, 2).map((e) => e.action), ["visit.cancelled", "visit.booked"]);
      assert.equal(log[0].targetName, `Pat figures.patient`);
      assert.match(log[0].detail, /^Dr\. Test Doctor, \d{4}-\d{2}-\d{2} 11:00$/);
      assert.ok(log.every((e) => e.actorRole === "receptionist"));
      assert.equal((await request("GET", "/admin/activity", { token: deskToken })).status, 403);
    });

    it("works out visits, no-shows, waiting time and visit length", async () => {
      const res = await request("GET", "/admin/analytics?days=7", { token: adminToken });
      assert.equal(res.status, 200);
      assert.equal(res.body.perDay.length, 7);
      const row = res.body.doctors.find((d) => d.id === doctor.id);
      assert.equal(row.visits, 2, "cancelled visits do not count");
      assert.equal(row.noShowRate, 50);
      assert.equal(row.averageWait, 10);
      assert.equal(row.averageLength, 20);
      assert.equal(typeof row.bookedShare, "number");
      assert.ok(res.body.byDepartment.some((d) => d.name === "Cardiology"));
      assert.ok("noShowRate" in res.body.previous);
    });
  });
});
