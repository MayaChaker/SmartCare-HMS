const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const { verifyToken, checkRole } = require("../middlewares/auth");
const { blockDemoAccounts } = require("../middlewares/demo");

// Admin routes - protected by authentication and role
router.use(verifyToken);
router.use(checkRole(["admin"]));

// User management
router.get("/users", adminController.getAllUsers);
router.post("/users", blockDemoAccounts, adminController.createUser);
router.put("/users/:id", blockDemoAccounts, adminController.updateUser);
router.delete("/users/:id", blockDemoAccounts, adminController.deleteUser);

// Analytics and reporting
router.get("/analytics", adminController.getAnalytics);
router.get("/doctors", adminController.getAllDoctors);
router.get("/patients", adminController.getAllPatients);
router.get("/appointments", adminController.getAllAppointments);
// Bulk doctor availability
router.put("/doctors/availability", blockDemoAccounts, adminController.makeAllDoctorsAvailable);

// System settings routes removed

module.exports = router;
