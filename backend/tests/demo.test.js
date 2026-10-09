const { PASSWORD, startApp, client, login, createStaff } = require("./helpers");
const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { SAMPLE_DOCTORS } = require("../demo/sampleData");

const DEMO_PASSWORD = process.env.DEMO_PASSWORD;
const RESET_HEADERS = { "X-Demo-Reset-Token": process.env.DEMO_RESET_TOKEN };

describe("public demo", () => {
  let app;
  let request;
  let tokens;

  before(async () => {
    app = await startApp();
    request = client(app.baseUrl);
    const res = await request("POST", "/demo/reset", { headers: RESET_HEADERS });
    assert.equal(res.status, 200);
    tokens = {
      admin: await login(request, "demo.admin", DEMO_PASSWORD),
      doctor: await login(request, "dr.karim.mansour", DEMO_PASSWORD),
      reception: await login(request, "demo.reception", DEMO_PASSWORD),
      patient: await login(request, "demo.patient", DEMO_PASSWORD),
    };
  });
  after(() => app.stop());

  it("protects the reset endpoint with a token", async () => {
    assert.equal((await request("POST", "/demo/reset")).status, 401);
    const wrong = await request("POST", "/demo/reset", { headers: { "X-Demo-Reset-Token": "wrong" } });
    assert.equal(wrong.status, 401);
  });

  it("creates the four demo accounts with data for every dashboard", async () => {
    for (const token of Object.values(tokens)) assert.ok(token);
    const doctors = await request("GET", "/doctors");
    assert.equal(doctors.body.length, SAMPLE_DOCTORS.length);
    const visits = await request("GET", "/patient/appointments", { token: tokens.patient });
    assert.ok(visits.body.length >= 2);
    const records = await request("GET", "/patient/records", { token: tokens.patient });
    assert.ok(records.body.length >= 1);
  });

  it("blocks user management and profile edits for demo accounts", async () => {
    const users = await request("GET", "/admin/users", { token: tokens.admin });
    const someone = users.body.find((u) => u.username === "dr.rania.nasr");
    const blocked = [
      ["POST", "/admin/users", tokens.admin, { username: "intruder", password: PASSWORD, role: "admin" }],
      ["PUT", `/admin/users/${someone.id}`, tokens.admin, { password: `${PASSWORD}-changed` }],
      ["DELETE", `/admin/users/${someone.id}`, tokens.admin],
      ["PUT", "/doctor/profile", tokens.doctor, { firstName: "Changed" }],
      ["PUT", "/doctor/availability", tokens.doctor, { availability: false }],
      ["PUT", "/patient/profile", tokens.patient, { firstName: "Changed" }],
    ];
    for (const [method, path, token, body] of blocked) {
      const res = await request(method, path, { token, body });
      assert.equal(res.status, 403, `${method} ${path}`);
      assert.equal(res.body.message, "This action is disabled in the demo");
    }
  });

  it("keeps the main flows open to demo accounts", async () => {
    const visits = await request("GET", "/patient/appointments", { token: tokens.patient });
    const upcoming = visits.body.find((a) => a.status === "scheduled");
    const res = await request("DELETE", `/patient/appointments/${upcoming.id}`, { token: tokens.patient });
    assert.equal(res.status, 200);
  });

  let newReceptionPassword;
  it("does not restrict other admins", async () => {
    await createStaff("real.admin", "admin");
    const token = await login(request, "real.admin");
    const res = await request("POST", "/admin/users", {
      token,
      body: { username: "new.reception", role: "receptionist" },
    });
    assert.equal(res.status, 201);
    newReceptionPassword = res.body.tempPassword;
  });

  it("restores the demo data and keeps staff accounts", async () => {
    const res = await request("POST", "/demo/reset", { headers: RESET_HEADERS });
    assert.equal(res.status, 200);
    const visits = await request("GET", "/patient/appointments", {
      token: await login(request, "demo.patient", DEMO_PASSWORD),
    });
    // The visit cancelled in the previous test is back to scheduled
    assert.equal(visits.body.filter((a) => a.status === "cancelled").length, 0);
    assert.ok(visits.body.filter((a) => a.status === "scheduled").length >= 2);
    assert.ok(await login(request, "new.reception", newReceptionPassword));
  });
});
