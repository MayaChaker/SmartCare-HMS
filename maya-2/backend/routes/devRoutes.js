const express = require("express");
const router = express.Router();
const { verifyToken, checkRole } = require("../middlewares/auth");
const { User, Patient, Doctor, Appointment } = require("../models");

// Dev-only route to create a sample appointment for the logged-in doctor
// Requires doctor authentication; will auto-create a sample patient if missing
router.post(
  "/seed-appointment",
  verifyToken,
  checkRole(["doctor"]),
  async (req, res) => {
    try {
      // Resolve doctor profile for the authenticated user; create minimal profile if missing
      let doctor = await Doctor.findOne({ where: { userId: req.user.id } });
      if (!doctor) {
        const userRecord = await User.findByPk(req.user.id);
        const firstName = userRecord && userRecord.username ? "Dr." : "Dr.";
        const lastName = userRecord && userRecord.username ? "Dev" : "Dev";
        doctor = await Doctor.create({
          firstName,
          lastName,
          specialization: "General Practice",
          email: userRecord?.username || "doctor.dev@example.com",
          phone: "000-000-0000",
          licenseNumber: "DEV-SEED",
          experience: 1,
          qualification: "MD",
          userId: req.user.id,
        });
      }

      // Ensure a sample patient exists
      const sampleUsername = "dev.patient@example.com";
      let patientUser = await User.findOne({
        where: { username: sampleUsername },
      });
      if (!patientUser) {
        patientUser = await User.create({
          username: sampleUsername,
          password: "patient123", // User model handles hashing
          role: "patient",
        });
      }

      let patient = await Patient.findOne({
        where: { userId: patientUser.id },
      });
      if (!patient) {
        patient = await Patient.create({
          firstName: "Dev",
          lastName: "Patient",
          email: sampleUsername,
          phone: "111-222-3333",
          dateOfBirth: new Date(1990, 0, 1),
          userId: patientUser.id,
        });
      }

      // Create an appointment soon (next hour)
      const appointmentDate = new Date();
      appointmentDate.setMinutes(appointmentDate.getMinutes() + 60);

      const appointment = await Appointment.create({
        patientId: patient.id,
        doctorId: doctor.id,
        appointmentDate,
        reason: "Dev seeded appointment",
        status: "scheduled",
      });

      res.status(201).json({
        message: "Dev appointment created successfully",
        appointment,
      });
    } catch (error) {
      console.error("Error in dev seed-appointment:", error);
      res
        .status(500)
        .json({ message: "Server error creating dev appointment" });
    }
  }
);

// Dev-only route to seed a receptionist user for testing login
router.post("/seed-receptionist", async (req, res) => {
  try {
    const username = "res";
    const password = "res123";
    const role = "receptionist";

    const [user, created] = await User.findOrCreate({
      where: { username },
      defaults: { username, password, role },
    });

    if (!created) {
      let changed = false;
      if (user.role !== role) {
        user.role = role;
        changed = true;
      }
      // Reset password to known value for testing
      if (password) {
        user.password = password;
        changed = true;
      }
      if (changed) {
        await user.save();
      }
    }

    return res.status(201).json({
      message: "Receptionist seeded",
      credentials: { username, password },
      user: { id: user.id, username: user.username, role: user.role },
    });
  } catch (error) {
    console.error("Error seeding receptionist:", error);
    return res
      .status(500)
      .json({ message: "Server error seeding receptionist" });
  }
});

// Dev-only route to seed a doctor user and profile for testing login
router.post("/seed-doctor", async (req, res) => {
  try {
    const username = "doc";
    const password = "doc123";
    const role = "doctor";

    const [user, created] = await User.findOrCreate({
      where: { username },
      defaults: { username, password, role },
    });

    let changed = false;
    if (!created) {
      if (user.role !== role) {
        user.role = role;
        changed = true;
      }
      if (password) {
        user.password = password;
        changed = true;
      }
      if (changed) {
        await user.save();
      }
    }

    let doctor = await Doctor.findOne({ where: { userId: user.id } });
    if (!doctor) {
      doctor = await Doctor.create({
        firstName: "Dr.",
        lastName: "Demo",
        specialization: "General Medicine",
        email: username,
        phone: "000-000-0000",
        licenseNumber: "DOC-DEMO",
        experience: 3,
        qualification: "MD",
        userId: user.id,
      });
    }

    return res.status(201).json({
      message: "Doctor seeded",
      credentials: { username, password },
      user: { id: user.id, username: user.username, role: user.role },
      doctor,
    });
  } catch (error) {
    console.error("Error seeding doctor:", error);
    return res.status(500).json({ message: "Server error seeding doctor" });
  }
});

module.exports = router;
// Admin-only dev helper: update a doctor's name and specialization
router.post(
  "/update-doctor",
  verifyToken,
  checkRole(["admin"]),
  async (req, res) => {
    try {
      const {
        matchFirstName,
        matchLastName,
        newFirstName,
        newLastName,
        newSpecialization,
      } = req.body;
      if (!matchFirstName || !matchLastName) {
        return res
          .status(400)
          .json({ message: "matchFirstName and matchLastName are required" });
      }
      const doctor = await Doctor.findOne({
        where: { firstName: matchFirstName, lastName: matchLastName },
      });
      if (!doctor) {
        return res.status(404).json({ message: "Doctor not found" });
      }
      if (newFirstName) doctor.firstName = newFirstName;
      if (newLastName) doctor.lastName = newLastName;
      if (newSpecialization) doctor.specialization = newSpecialization;
      await doctor.save();
      return res.json({ message: "Doctor updated", doctor });
    } catch (error) {
      console.error("Error updating doctor:", error);
      return res.status(500).json({ message: "Server error updating doctor" });
    }
  }
);
