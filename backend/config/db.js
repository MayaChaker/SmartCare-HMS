const { Sequelize } = require("sequelize");
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

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

function sslRequiredFromDatabaseUrl(databaseUrl) {
  try {
    const url = new URL(databaseUrl);
    const candidates = [
      "ssl",
      "sslmode",
      "ssl-mode",
      "sslMode",
      "ssl_mode",
      "tls",
      "tlsMode",
    ];
    for (const key of candidates) {
      const value = url.searchParams.get(key);
      if (!value) continue;
      const normalized = value.toLowerCase();
      if (["1", "true", "required", "require", "on"].includes(normalized)) {
        return true;
      }
      if (["0", "false", "off", "disable", "disabled"].includes(normalized)) {
        return false;
      }
    }
    return undefined;
  } catch {
    return undefined;
  }
}

const databaseUrl = process.env.DATABASE_URL;
const shouldUseSSL =
  envFlag("DB_SSL") ??
  sslRequiredFromDatabaseUrl(databaseUrl) ??
  process.env.NODE_ENV === "production";

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

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: "mysql",
  dialectOptions,
  logging: false,
});

module.exports = { sequelize };
