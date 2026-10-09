const { startApp, client, login, createStaff, createDoctor, PASSWORD } = require("./helpers");
const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { Patient, User } = require("../models");

describe("front desk", () => {
  let app;
  let request;
  let deskToken;
  let doctorToken;
  let opened;

  before(async () => {
    app = await startApp();
    request = client(app.baseUrl);
    await createStaff("desk.one", "receptionist");
    await createDoctor("dr.desk");
    deskToken = await login(request, "desk.one");
    doctorToken = await login(request, "dr.desk");
  });
  after(() => app.stop());

  const openFile = (body) => request("POST", "/receptionist/patients", { token: deskToken, body });

  describe("opening a file", () => {
    it("opens a file without a login and returns a one-time code", async () => {
      const res = await openFile({ firstName: "Rana", lastName: "Haddad", phone: "70111222", dateOfBirth: "1990-03-14" });
      assert.equal(res.status, 201);
      assert.match(res.body.activationCode, /^[A-Z2-9]{4}-[A-Z2-9]{4}$/);
      assert.equal(res.body.patient.hasAccount, false);
      assert.equal(res.body.patient.activationPending, true);
      opened = res.body;

      const stored = await Patient.findByPk(opened.patient.id);
      assert.equal(stored.userId, null);
      assert.notEqual(stored.activationCodeHash, opened.activationCode, "only a hash is stored");
    });

    it("needs a name and a mobile, and refuses the same person twice", async () => {
      assert.equal((await openFile({ firstName: "No", lastName: "Phone" })).status, 400);
      assert.equal((await openFile({ firstName: "Bad", lastName: "Date", phone: "70000000", dateOfBirth: "14/03/1990" })).status, 400);
      const again = await openFile({ firstName: "Rana", lastName: "Haddad", phone: "70111222", dateOfBirth: "1990-03-14" });
      assert.equal(again.status, 409);
      assert.equal(again.body.patient.id, opened.patient.id);
    });

    it("lets the desk correct contact details but not health information", async () => {
      const res = await request("PUT", `/receptionist/patients/${opened.patient.id}`, {
        token: deskToken,
        body: { phone: "70999888", allergies: "Penicillin" },
      });
      assert.equal(res.status, 200);
      assert.equal(res.body.patient.phone, "70999888");
      assert.equal((await Patient.findByPk(opened.patient.id)).allergies ?? null, null);
    });
  });

  describe("activation by the patient", () => {
    const activate = (body) => request("POST", "/auth/activate", { body });

    it("rejects a wrong code", async () => {
      const res = await activate({ code: "AAAA-BBBB", username: "rana.h", password: PASSWORD });
      assert.equal(res.status, 400);
    });

    it("creates the patient's own login on the existing file, once", async () => {
      // Codes are read out loud: case and the dash do not matter
      const typed = opened.activationCode.toLowerCase().replace("-", " ");
      let res = await activate({ code: typed, username: "rana.h", password: PASSWORD });
      assert.equal(res.status, 201);
      assert.equal(res.body.patient.id, opened.patient.id);

      const token = await login(request, "rana.h");
      res = await request("GET", "/patient/profile", { token });
      assert.equal(res.body.id, opened.patient.id);
      assert.equal(res.body.phone, "70999888");

      res = await activate({ code: opened.activationCode, username: "someone.else", password: PASSWORD });
      assert.equal(res.status, 400, "a used code cannot be used again");
      assert.equal(await User.count({ where: { username: "someone.else" } }), 0);
    });

    it("refuses a new code once the patient has an account", async () => {
      const res = await request("POST", `/receptionist/patients/${opened.patient.id}/activation-code`, { token: deskToken });
      assert.equal(res.status, 409);
    });

    it("gives a new code for a file that is still waiting, and the old code stops working", async () => {
      const file = await openFile({ firstName: "Karl", lastName: "Nader", phone: "71222333" });
      const res = await request("POST", `/receptionist/patients/${file.body.patient.id}/activation-code`, { token: deskToken });
      assert.equal(res.status, 200);
      assert.notEqual(res.body.activationCode, file.body.activationCode);
      const old = await activate({ code: file.body.activationCode, username: "karl.n", password: PASSWORD });
      assert.equal(old.status, 400);
    });
  });

  describe("desk lists", () => {
    it("shows each patient's account and health-information state", async () => {
      const res = await request("GET", "/receptionist/patients", { token: deskToken });
      const rana = res.body.find((p) => p.id === opened.patient.id);
      assert.equal(rana.hasAccount, true);
      assert.equal(rana.healthInfoComplete, false);
      assert.ok(!("activationCodeHash" in rana));
    });

    it("shows free times to the desk but not to doctors", async () => {
      let res = await request("GET", "/receptionist/availability?days=3", { token: deskToken });
      assert.equal(res.status, 200);
      assert.equal(res.body.days, 3);
      res = await request("GET", "/receptionist/availability", { token: doctorToken });
      assert.equal(res.status, 403);
    });

    it("rejects a day list with a bad date", async () => {
      const res = await request("GET", "/receptionist/appointments/day?date=tomorrow", { token: deskToken });
      assert.equal(res.status, 400);
    });
  });
});
