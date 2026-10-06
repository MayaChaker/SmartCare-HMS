const { startApp, client, login, createStaff, createDoctor, registerPatient, dateFromToday } = require("./helpers");
const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");

describe("role-based access and data ownership", () => {
  let app;
  let request;
  let tokens;
  let doctorA;
  let ownPatient;
  let otherPatient;

  before(async () => {
    app = await startApp();
    request = client(app.baseUrl);

    await createStaff("admin1", "admin");
    await createStaff("reception1", "receptionist");
    doctorA = (await createDoctor("doctor.a")).doctor;
    await createDoctor("doctor.b");
    ownPatient = await registerPatient(request, "patient.one");
    otherPatient = await registerPatient(request, "patient.two");

    tokens = {
      admin: await login(request, "admin1"),
      reception: await login(request, "reception1"),
      doctorA: await login(request, "doctor.a"),
      doctorB: await login(request, "doctor.b"),
      patient: await login(request, "patient.one"),
      otherPatient: await login(request, "patient.two"),
    };

    // patient.one has a visit with doctor.a
    await request("POST", "/patient/appointments", {
      token: tokens.patient,
      body: { doctorId: doctorA.id, appointmentDate: dateFromToday(1), appointmentTime: "10:00" },
    });
  });
  after(() => app.stop());

  it("blocks each role from the other roles' routes", async () => {
    const cases = [
      ["patient", "/admin/users"],
      ["patient", "/doctor/appointments"],
      ["patient", "/receptionist/patients"],
      ["doctorA", "/admin/users"],
      ["reception", "/admin/users"],
      ["admin", "/patient/profile"],
    ];
    for (const [role, path] of cases) {
      const res = await request("GET", path, { token: tokens[role] });
      assert.equal(res.status, 403, `${role} -> ${path}`);
    }
  });

  it("lets a doctor open only patients they have a visit with", async () => {
    let res = await request("GET", `/doctor/patients/${ownPatient.id}`, { token: tokens.doctorA });
    assert.equal(res.status, 200);
    res = await request("GET", `/doctor/patients/${ownPatient.id}`, { token: tokens.doctorB });
    assert.equal(res.status, 404);
    res = await request("GET", `/doctor/patients/${otherPatient.id}`, { token: tokens.doctorA });
    assert.equal(res.status, 404);
  });

  it("lets a doctor add records only for their own patients", async () => {
    let res = await request("POST", "/doctor/records", {
      token: tokens.doctorA,
      body: { patientId: ownPatient.id, diagnosis: "Healthy" },
    });
    assert.equal(res.status, 201);
    res = await request("POST", "/doctor/records", {
      token: tokens.doctorB,
      body: { patientId: ownPatient.id, diagnosis: "Not my patient" },
    });
    assert.equal(res.status, 404);
  });

  it("keeps patients to their own appointments", async () => {
    const mine = await request("GET", "/patient/appointments", { token: tokens.patient });
    assert.equal(mine.body.length, 1);
    const theirs = await request("GET", "/patient/appointments", { token: tokens.otherPatient });
    assert.equal(theirs.body.length, 0);

    const res = await request("DELETE", `/patient/appointments/${mine.body[0].id}`, { token: tokens.otherPatient });
    assert.equal(res.status, 404);
  });

  it("does not let an admin delete their own account", async () => {
    const users = await request("GET", "/admin/users", { token: tokens.admin });
    const self = users.body.find((u) => u.username === "admin1");
    const res = await request("DELETE", `/admin/users/${self.id}`, { token: tokens.admin });
    assert.equal(res.status, 400);
  });
});
