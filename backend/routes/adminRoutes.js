const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const { verifyToken, checkRole } = require("../middlewares/auth");
const { blockDemoAccounts } = require("../middlewares/demo");
const { readPhoto } = require("../utils/doctorPhoto");

// Admin routes - protected by authentication and role
router.use(verifyToken);
router.use(checkRole(["admin"]));

// Accounts
router.get("/users", adminController.getAllUsers);
router.post("/users", blockDemoAccounts, adminController.createUser);
router.put("/users/:id", blockDemoAccounts, adminController.updateUser);
router.post("/users/:id/reset-password", blockDemoAccounts, adminController.resetPassword);
router.delete("/users/:id", blockDemoAccounts, adminController.deleteUser);

// Doctors
router.get("/doctors", adminController.getAllDoctors);
router.put("/doctors/:id", blockDemoAccounts, adminController.updateDoctor);
router.post("/doctors/:id/photo", blockDemoAccounts, readPhoto, adminController.uploadDoctorPhoto);

// Reading
router.get("/analytics", adminController.getAnalytics);
router.get("/activity", adminController.getActivity);
router.get("/patients", adminController.getAllPatients);
router.get("/appointments", adminController.getAllAppointments);

module.exports = router;
