const { PASSWORD, startApp, client, login, createStaff, registerPatient } = require("./helpers");
const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const jwt = require("jsonwebtoken");
const { User } = require("../models");

describe("authentication", () => {
  let app;
  let request;

  before(async () => {
    app = await startApp();
    request = client(app.baseUrl);
  });
  after(() => app.stop());

  it("registers a patient and signs them in", async () => {
    const patient = await registerPatient(request, "alice");
    assert.ok(patient.id);
    const token = await login(request, "alice");
    assert.ok(token);
  });

  it("validates registration input", async () => {
    let res = await request("POST", "/auth/register-patient", { body: { username: "ab", password: PASSWORD } });
    assert.equal(res.status, 400);
    res = await request("POST", "/auth/register-patient", { body: { username: "alice", password: PASSWORD } });
    assert.equal(res.status, 400);
    assert.equal(res.body.message, "Username already exists");
  });

  it("rejects a wrong password with 401", async () => {
    const res = await request("POST", "/auth/login", { body: { username: "alice", password: `${PASSWORD}-wrong` } });
    assert.equal(res.status, 401);
    assert.equal(res.body.message, "Invalid credentials");
  });

  it("stores passwords as bcrypt hashes", async () => {
    const user = await User.findOne({ where: { username: "alice" } });
    assert.notEqual(user.password, PASSWORD);
    assert.match(user.password, /^\$2[aby]\$/);
  });

  it("requires a valid token", async () => {
    let res = await request("GET", "/patient/profile");
    assert.equal(res.status, 401);
    res = await request("GET", "/patient/profile", { token: "not-a-token" });
    assert.equal(res.status, 401);
    const forged = jwt.sign({ id: 1, role: "admin" }, "some-other-secret");
    res = await request("GET", "/admin/users", { token: forged });
    assert.equal(res.status, 401);
  });

  it("rejects the token of a deleted user", async () => {
    const user = await createStaff("temp.staff", "receptionist");
    const token = await login(request, "temp.staff");
    await user.destroy();
    const res = await request("GET", "/receptionist/patients", { token });
    assert.equal(res.status, 401);
  });

  it("uses the current role, not the one inside the token", async () => {
    const user = await createStaff("promoted", "receptionist");
    const token = await login(request, "promoted");
    user.role = "patient";
    await user.save();
    const res = await request("GET", "/receptionist/patients", { token });
    assert.equal(res.status, 403);
  });

  it("limits failed logins to 10 per IP every 15 minutes", async () => {
    // Earlier tests in this file already failed once; successful logins are not counted
    let last;
    for (let i = 0; i < 10; i++) {
      last = await request("POST", "/auth/login", { body: { username: "alice", password: `${PASSWORD}-wrong` } });
    }
    assert.equal(last.status, 429);
  });
});
