const express = require("express");
const router = express.Router();
const doctorController = require("../controllers/doctorController");
const { verifyToken, checkRole } = require("../middlewares/auth");
const { blockDemoAccounts } = require("../middlewares/demo");

// Doctor routes - protected by authentication and role
router.use(verifyToken);
router.use(checkRole(["doctor"]));

router.get("/profile", doctorController.getProfile);
router.put("/profile", blockDemoAccounts, doctorController.updateProfile);
router.post("/photo", blockDemoAccounts, doctorController.uploadPhoto);
router.get("/appointments", doctorController.getAppointments);
router.get("/schedule", doctorController.getSchedule);
router.get("/patients", doctorController.getPatients);
router.get("/patients/:id", doctorController.getPatientDetails);
router.post("/records", doctorController.createMedicalRecord);
router.put("/records/:id", doctorController.updateMedicalRecord);
router.put("/availability", blockDemoAccounts, doctorController.updateAvailability);
router.put("/appointments/:id", doctorController.updateAppointmentStatus);

module.exports = router;
