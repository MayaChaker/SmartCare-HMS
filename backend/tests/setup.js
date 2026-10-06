// Loaded first by every test file, before dotenv reads backend/.env (dotenv never overrides existing values).
const crypto = require("crypto");

// Secrets are random on every run, so none are written in the repository
const randomSecret = () => crypto.randomBytes(16).toString("hex");

process.env.NODE_ENV = "test";
process.env.DB_NAME = process.env.TEST_DB_NAME || "smartcare_test";
// Never let tests reach a hosted database through DATABASE_URL
process.env.DATABASE_URL = "";
process.env.JWT_SECRET = randomSecret();
process.env.DEMO_PASSWORD = randomSecret();
process.env.DEMO_RESET_TOKEN = randomSecret();
process.env.TEST_USER_PASSWORD = randomSecret();
process.env.ADMIN_USERNAME = "";
process.env.ADMIN_PASSWORD = "";

if (!process.env.DB_NAME.endsWith("_test")) {
  throw new Error(`Refusing to run tests against "${process.env.DB_NAME}": the name must end with _test`);
}
