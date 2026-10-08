const app = require("./app");
const { sequelize } = require("./config/db");
const { User, Appointment } = require("./models");
const { DEMO_ACCOUNTS, isDemoEnabled } = require("./config/demo");
const { resetDemoData } = require("./demo/resetDemo");

const PORT = process.env.PORT || 5000;

const allowStartWithoutDb =
  String(process.env.ALLOW_START_WITHOUT_DB || "").toLowerCase() === "true" ||
  process.env.NODE_ENV !== "production";

const dbConnectRetries = process.env.DB_CONNECT_RETRIES
  ? Number(process.env.DB_CONNECT_RETRIES)
  : 8;
const dbConnectRetryDelayMs = process.env.DB_CONNECT_RETRY_DELAY_MS
  ? Number(process.env.DB_CONNECT_RETRY_DELAY_MS)
  : 1500;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// After an unexpected error the process state is unknown; exit and let the host restart it
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled promise rejection:", reason);
  process.exit(1);
});
process.on("uncaughtException", (err) => {
  console.error("Uncaught exception:", err);
  process.exit(1);
});

async function init() {
  let lastError;
  const attempts = Number.isFinite(dbConnectRetries) && dbConnectRetries > 0 ? dbConnectRetries : 1;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      await sequelize.authenticate();
      await sequelize.sync({ alter: false });
      console.log("Database models synchronized successfully.");
      await createAdminUser();
      await ensureDoctorFeeColumn();
      await ensureMedicalRecordAppointmentColumn();
      await ensureAppointmentStatusValues();
      await ensureAppointmentSlotIndexNotUnique();
      await ensureDemoData();
      startServer();
      return;
    } catch (error) {
      lastError = error;
      console.error(`Error initializing database (attempt ${attempt}/${attempts}):`, error);
      if (attempt < attempts) {
        const delay = Number.isFinite(dbConnectRetryDelayMs) && dbConnectRetryDelayMs > 0 ? dbConnectRetryDelayMs : 1500;
        await sleep(delay);
      }
    }
  }

  if (allowStartWithoutDb) {
    startServer();
    return;
  }

  console.error("Database initialization failed after retries:", lastError);
  process.exit(1);
}

void init();

// Fills the demo the first time the server starts with DEMO_PASSWORD set
async function ensureDemoData() {
  if (!isDemoEnabled()) return;
  try {
    const exists = await User.findOne({ where: { username: DEMO_ACCOUNTS.admin } });
    if (!exists) {
      await resetDemoData();
      console.log("Demo data created.");
    }
  } catch (error) {
    console.error("Failed to create demo data:", error);
  }
}

// Creates the first admin from ADMIN_USERNAME / ADMIN_PASSWORD; never overwrites an existing account
async function createAdminUser() {
  const username = String(process.env.ADMIN_USERNAME || "").trim();
  const password = String(process.env.ADMIN_PASSWORD || "");

  if (!username || !password) {
    console.warn("ADMIN_USERNAME / ADMIN_PASSWORD not set; skipping admin seed.");
    return;
  }
  if (password.length < 8) {
    console.warn("ADMIN_PASSWORD must be at least 8 characters; skipping admin seed.");
    return;
  }

  try {
    const [, created] = await User.findOrCreate({
      where: { username },
      defaults: { username, password, role: "admin" },
    });
    if (created) console.log(`Admin user "${username}" created.`);
  } catch (error) {
    console.error("Error creating admin user:", error);
  }
}

// Older databases were created before medical records were linked to a visit.
// sync() does not add columns to existing tables, so add appointmentId (and its unique index) here.
async function ensureMedicalRecordAppointmentColumn() {
  try {
    const [tables] = await sequelize.query(
      "SELECT TABLE_NAME AS name FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND LOWER(TABLE_NAME) = 'medicalrecords' LIMIT 1",
    );
    const table = tables?.[0]?.name;
    if (!table) {
      return;
    }
    const [columns] = await sequelize.query(
      `SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = '${table}' AND COLUMN_NAME = 'appointmentId'`,
    );
    if (!Array.isArray(columns) || columns.length === 0) {
      await sequelize.query(`ALTER TABLE \`${table}\` ADD COLUMN appointmentId INT NULL`);
      await sequelize.query(`ALTER TABLE \`${table}\` ADD UNIQUE INDEX medical_records_appointment_id (appointmentId)`);
      console.log("Medical record appointmentId column added");
    }
  } catch (error) {
    console.error("Failed to ensure medical record appointmentId column:", error);
  }
}

async function ensureDoctorFeeColumn() {
  try {
    const [tableRows] = await sequelize.query(
      "SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'doctors' LIMIT 1",
    );
    if (!Array.isArray(tableRows) || tableRows.length === 0) {
      return;
    }
    const [rows] = await sequelize.query(
      "SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'doctors' AND COLUMN_NAME = 'fee'",
    );
    if (!Array.isArray(rows) || rows.length === 0) {
      await sequelize.query(
        "ALTER TABLE doctors ADD COLUMN fee DECIMAL(10,2) NULL DEFAULT 0",
      );
      console.log("Doctor fee column added");
    }
  } catch (error) {
    console.error("Failed to ensure doctor fee column:", error);
  }
}

// Older databases have a UNIQUE slot index that also counted cancelled visits,
// which blocked rebooking a cancelled slot. Swap it for a regular index.
// The status column is an ENUM; existing databases need new statuses (such as no-show) added to it
async function ensureAppointmentStatusValues() {
  const tableName = Appointment.getTableName();
  const statuses = Appointment.getAttributes().status.values;
  try {
    const [rows] = await sequelize.query(
      "SELECT COLUMN_TYPE AS type FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND LOWER(TABLE_NAME) = LOWER(?) AND COLUMN_NAME = 'status' LIMIT 1",
      { replacements: [tableName] },
    );
    const columnType = rows?.[0]?.type;
    if (!columnType) {
      return;
    }
    const missing = statuses.filter((s) => !columnType.includes(`'${s}'`));
    if (missing.length > 0) {
      const values = statuses.map((s) => `'${s}'`).join(", ");
      await sequelize.query(
        `ALTER TABLE \`${tableName}\` MODIFY COLUMN status ENUM(${values}) NOT NULL DEFAULT 'scheduled'`,
      );
      console.log(`Appointment statuses added: ${missing.join(", ")}`);
    }
  } catch (error) {
    console.error("Failed to update appointment statuses:", error);
  }
}

async function ensureAppointmentSlotIndexNotUnique() {
  const tableName = Appointment.getTableName();
  const indexName = "appointments_doctor_id_appointment_date_appointment_time";
  try {
    const [rows] = await sequelize.query(
      "SELECT NON_UNIQUE FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND LOWER(TABLE_NAME) = LOWER(?) AND INDEX_NAME = ? LIMIT 1",
      { replacements: [tableName, indexName] },
    );
    if (Array.isArray(rows) && rows.length > 0 && Number(rows[0].NON_UNIQUE) === 0) {
      await sequelize.query(
        `ALTER TABLE \`${tableName}\` DROP INDEX ${indexName}, ADD INDEX ${indexName} (doctorId, appointmentDate, appointmentTime)`,
      );
      console.log("Appointment slot index is no longer unique");
    }
  } catch (error) {
    console.error("Failed to update appointment slot index:", error);
  }
}

// Function to start the server
function startServer() {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}
