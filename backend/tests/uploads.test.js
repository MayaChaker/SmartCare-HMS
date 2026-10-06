const { startApp, client, login, createDoctor } = require("./helpers");
const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");

// A valid 1x1 PNG
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

describe("doctor photo upload", () => {
  let app;
  let request;
  let token;
  const saved = [];

  const upload = (content, type, name) => {
    const form = new FormData();
    form.append("photo", new Blob([content], { type }), name);
    return request("POST", "/doctor/photo", { token, form });
  };

  before(async () => {
    app = await startApp();
    request = client(app.baseUrl);
    await createDoctor("dr.photo");
    token = await login(request, "dr.photo");
  });

  after(async () => {
    for (const url of saved) {
      fs.rmSync(path.join(__dirname, "..", url), { force: true });
    }
    await app.stop();
  });

  it("accepts a PNG and saves it with a server-chosen name", async () => {
    const res = await upload(PNG, "image/png", "my photo.png");
    assert.equal(res.status, 200);
    assert.match(res.body.doctor.photoUrl, /^\/uploads\/doctors\/doctor_\d+_\d+\.png$/);
    saved.push(res.body.doctor.photoUrl);
  });

  it("rejects HTML disguised as an image", async () => {
    const res = await upload("<script>alert(1)</script>", "image/png", "evil.html");
    assert.equal(res.status, 400);
  });

  it("rejects SVG files", async () => {
    const res = await upload("<svg xmlns='http://www.w3.org/2000/svg'/>", "image/svg+xml", "icon.svg");
    assert.equal(res.status, 400);
  });

  it("rejects images over 3 MB", async () => {
    const res = await upload(Buffer.alloc(3 * 1024 * 1024 + 1), "image/png", "big.png");
    assert.equal(res.status, 400);
    assert.match(res.body.message, /3MB/);
  });
});
