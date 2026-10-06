require("./setup");
const mysql = require("mysql2/promise");
const app = require("../app");
const { sequelize } = require("../config/db");
const { User, Doctor } = require("../models");

const PASSWORD = process.env.TEST_USER_PASSWORD;

// Creates the test database if needed, recreates every table, and starts the app on a free port
async function startApp() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });
  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\``);
  await connection.end();

  await sequelize.sync({ force: true });

  const server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  const baseUrl = `http://127.0.0.1:${server.address().port}/api`;

  const stop = async () => {
    await new Promise((resolve) => server.close(resolve));
    await sequelize.close();
  };
  return { baseUrl, stop };
}

// Small JSON client: returns { status, body }
const client = (baseUrl) => async (method, path, { token, body, form, headers } = {}) => {
  const init = { method, headers: { ...headers } };
  if (token) init.headers.Authorization = `Bearer ${token}`;
  if (form) {
    init.body = form;
  } else if (body !== undefined) {
    init.headers["Content-Type"] = "application/json";
    init.body = JSON.stringify(body);
  }
  const res = await fetch(baseUrl + path, init);
  const text = await res.text();
  let parsed = null;
  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = text;
  }
  return { status: res.status, body: parsed };
};

async function login(request, username, password = PASSWORD) {
  const res = await request("POST", "/auth/login", { body: { username, password } });
  return res.body?.token;
}

// Staff accounts are created directly; there is no public sign-up for them
async function createStaff(username, role, password = PASSWORD) {
  return User.create({ username, password, role });
}

async function createDoctor(username, profile = {}) {
  const user = await createStaff(username, "doctor");
  const doctor = await Doctor.create({
    userId: user.id,
    firstName: "Test",
    lastName: "Doctor",
    specialization: "Cardiology",
    workingHours: "Sun, Mon, Tue, Wed, Thu, Fri, Sat 09:00 AM - 05:00 PM",
    availability: true,
    ...profile,
  });
  return { user, doctor };
}

async function registerPatient(request, username) {
  const res = await request("POST", "/auth/register-patient", {
    body: { username, password: PASSWORD, firstName: "Pat", lastName: username, contact: "70123456" },
  });
  return res.body.patient;
}

// YYYY-MM-DD for a day relative to today, in local time
function dateFromToday(offset) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

module.exports = {
  PASSWORD,
  startApp,
  client,
  login,
  createStaff,
  createDoctor,
  registerPatient,
  dateFromToday,
};
