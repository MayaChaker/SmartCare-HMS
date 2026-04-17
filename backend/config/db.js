const { Sequelize } = require("sequelize");
require("dotenv").config();

function envFlag(name) {
  const raw = process.env[name];
  if (raw == null) return undefined;
  return ["1", "true", "yes", "on"].includes(String(raw).toLowerCase());
}

function getCaCert() {
  const ca = process.env.DB_SSL_CA;
  if (ca && ca.includes("BEGIN CERTIFICATE")) return ca;
  const caBase64 = process.env.DB_SSL_CA_BASE64;
  if (!caBase64) return undefined;
  try {
    return Buffer.from(caBase64, "base64").toString("utf8");
  } catch {
    return undefined;
  }
}

const dbHost = process.env.DB_HOST || "localhost";
const shouldUseSSL =
  envFlag("DB_SSL") ??
  (process.env.NODE_ENV === "production" ||
    /tidbcloud\.com$/i.test(dbHost) ||
    /tidbcloud/i.test(dbHost));

const sslRejectUnauthorized = envFlag("DB_SSL_REJECT_UNAUTHORIZED") ?? true;
const caCert = getCaCert();

const dialectOptions = shouldUseSSL
  ? {
      ssl: {
        rejectUnauthorized: sslRejectUnauthorized,
        ...(caCert ? { ca: caCert } : {}),
      },
    }
  : {};

// Create a new Sequelize instance with MySQL
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: dbHost,
    dialect: process.env.DB_DIALECT || "mysql",
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    dialectOptions,
  }
);

module.exports = { sequelize };
