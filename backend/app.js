// Express app: middleware and routes only. server.js connects the database and starts listening,
// so tests can use the app without starting a server.
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
const demoRoutes = require("./routes/demoRoutes");
const patientController = require("./controllers/patientController");
const adminController = require("./controllers/adminController");

// Initialize express app
const app = express();

// Middleware
app.set("trust proxy", 1);
app.disable("x-powered-by");

// The API only returns JSON and images, so pages served from it may not run scripts or be framed
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'");
  if (process.env.NODE_ENV === "production") {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
  next();
});

const corsOriginsFromEnv = String(process.env.CORS_ORIGINS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const isProduction = process.env.NODE_ENV === "production";

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      const allowLocalhost =
        !isProduction && /^http:\/\/localhost:\d+$/i.test(origin);
      cb(null, allowLocalhost || corsOriginsFromEnv.includes(origin));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    optionsSuccessStatus: 200,
  }),
);
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

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/patient", patientRoutes);
app.use("/api/doctor", doctorRoutes);
app.use("/api/receptionist", receptionistRoutes);
app.use("/api/demo", demoRoutes);

// Public doctor route for patients (no authentication required)
app.get("/api/doctors", patientController.getAllDoctors);

// Public doctor portraits, shown on the website and in the portals (another origin)
app.get(
  "/api/doctors/:id/photo",
  (req, res, next) => {
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    next();
  },
  adminController.getDoctorPhoto,
);

// Health check for uptime monitoring: also verifies the database connection
app.get("/api/health", async (req, res) => {
  try {
    await sequelize.authenticate();
    res.json({ status: "ok", database: "up" });
  } catch {
    res.status(503).json({ status: "error", database: "down" });
  }
});

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
