const express = require("express");
const cors = require("cors");
const path = require("path");
const { sequelize } = require("./config/db");
require("dotenv").config();
require("./models");

// Import routes
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const patientRoutes = require("./routes/patientRoutes");
const doctorRoutes = require("./routes/doctorRoutes");
const receptionistRoutes = require("./routes/receptionistRoutes");

// Initialize express app
const app = express();
const PORT = process.env.PORT || 5000;
let server;

// Middleware
app.set("trust proxy", 1);

const corsOriginsFromEnv = String(process.env.CORS_ORIGINS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      const allowLocalhost = /^http:\/\/localhost:\d+$/i.test(origin);
      if (allowLocalhost) return cb(null, true);
      if (corsOriginsFromEnv.includes(origin)) return cb(null, true);
      return cb(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    optionsSuccessStatus: 200,
  }),
);
// Ensure preflight requests are handled for all routes
app.use((req, res, next) => {
  const origin = req.headers.origin || "unknown-origin";
  console.log(
    `[${new Date().toISOString()}] ${req.method} ${
      req.originalUrl
    } from ${origin}`,
  );
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});
app.use(express.json());

// Serve uploaded assets
app.use(
  "/uploads",
  (req, res, next) => {
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    next();
  },
  express.static(path.join(__dirname, "uploads")),
);

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

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled promise rejection:", reason);
});
process.on("uncaughtException", (err) => {
  console.error("Uncaught exception:", err);
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

// Creates the first admin from ADMIN_USERNAME / ADMIN_PASSWORD; never overwrites an existing account
async function createAdminUser() {
  const { User } = require("./models");
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

// Function to start the server
function startServer() {
  server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/patient", patientRoutes);
app.use("/api/doctor", doctorRoutes);
app.use("/api/receptionist", receptionistRoutes);

// Public doctor route for patients (no authentication required)
const patientController = require("./controllers/patientController");
app.get("/api/doctors", patientController.getAllDoctors);

// Root route
app.get("/", (req, res) => {
  res.json({
    message: "SmartCare Hospital Management System API",
    status: "running",
    version: "1.0.0",
  });
});

// 404 handler for API routes
app.use("/api", (req, res) => {
  console.warn("API 404:", req.method, req.originalUrl);
  res.status(404).json({
    error: "API endpoint not found",
    path: req.path,
    method: req.method,
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({
    error: "Internal server error",
    message:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Something went wrong",
  });
});

module.exports = app;
