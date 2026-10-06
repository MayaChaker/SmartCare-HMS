require("dotenv").config();

// Public demo accounts, all signed in with DEMO_PASSWORD. Demo mode is off when it is not set.
const DEMO_PASSWORD = process.env.DEMO_PASSWORD || "";
const DEMO_RESET_TOKEN = process.env.DEMO_RESET_TOKEN || "";

const DEMO_ACCOUNTS = {
  admin: "demo.admin",
  doctor: "dr.karim.mansour",
  receptionist: "demo.reception",
  patient: "demo.patient",
};

const isDemoEnabled = () => DEMO_PASSWORD.length >= 8;

const isDemoAccount = (username) =>
  isDemoEnabled() && Object.values(DEMO_ACCOUNTS).includes(username);

module.exports = {
  DEMO_PASSWORD,
  DEMO_RESET_TOKEN,
  DEMO_ACCOUNTS,
  isDemoEnabled,
  isDemoAccount,
};
