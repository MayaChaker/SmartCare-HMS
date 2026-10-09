const { startApp, client, login, createDoctor, createStaff } = require("./helpers");
const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");

// A valid 1x1 PNG
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

describe("doctor photos", () => {
  let app;
  let request;
  let token;
  let adminToken;
  let doctor;

  const upload = (path, auth, content, type, name) => {
    const form = new FormData();
    form.append("photo", new Blob([content], { type }), name);
    return request("POST", path, { token: auth, form });
  };

  before(async () => {
    app = await startApp();
    request = client(app.baseUrl);
    doctor = (await createDoctor("dr.photo")).doctor;
    await createStaff("photo.admin", "admin");
    token = await login(request, "dr.photo");
    adminToken = await login(request, "photo.admin");
  });
  after(() => app.stop());

  it("keeps a doctor's own PNG in the database and serves it publicly", async () => {
    const res = await upload("/doctor/photo", token, PNG, "image/png", "my photo.png");
    assert.equal(res.status, 200);
    assert.match(res.body.photoUrl, new RegExp(`^/api/doctors/${doctor.id}/photo\\?v=\\d+$`));

    const photo = await fetch(app.baseUrl.replace(/\/api$/, "") + res.body.photoUrl);
    assert.equal(photo.status, 200);
    assert.equal(photo.headers.get("content-type"), "image/png");
    assert.equal(photo.headers.get("cross-origin-resource-policy"), "cross-origin");
    assert.ok(Buffer.from(await photo.arrayBuffer()).equals(PNG));
  });

  it("lets the administration set a doctor's portrait", async () => {
    const res = await upload(`/admin/doctors/${doctor.id}/photo`, adminToken, PNG, "image/png", "portrait.png");
    assert.equal(res.status, 200);
    const other = await upload(`/admin/doctors/${doctor.id}/photo`, token, PNG, "image/png", "portrait.png");
    assert.equal(other.status, 403, "doctors cannot use the admin route");
  });

  it("rejects HTML disguised as an image", async () => {
    const res = await upload("/doctor/photo", token, "<script>alert(1)</script>", "image/png", "evil.png");
    assert.equal(res.status, 400);
  });

  it("rejects SVG files", async () => {
    const res = await upload("/doctor/photo", token, "<svg xmlns='http://www.w3.org/2000/svg'/>", "image/svg+xml", "icon.svg");
    assert.equal(res.status, 400);
  });

  it("rejects images over 3 MB", async () => {
    const res = await upload("/doctor/photo", token, Buffer.alloc(3 * 1024 * 1024 + 1), "image/png", "big.png");
    assert.equal(res.status, 400);
    assert.match(res.body.message, /3 MB/);
  });

  it("answers 404 for a doctor without a photo, and never lists the image bytes", async () => {
    const plain = (await createDoctor("dr.nophoto")).doctor;
    const res = await fetch(`${app.baseUrl}/doctors/${plain.id}/photo`);
    assert.equal(res.status, 404);
    const list = await request("GET", "/doctors");
    assert.ok(list.body.every((d) => !("photoData" in d)));
  });
});
