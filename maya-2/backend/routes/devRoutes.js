const express = require('express');
const router = express.Router();
const { verifyToken, checkRole } = require('../middlewares/auth');
const { User, Patient, Doctor, Appointment } = require('../models');

// Dev-only route to create a sample appointment for the logged-in doctor
// Requires doctor authentication; will auto-create a sample patient if missing
router.post('/seed-appointment', verifyToken, checkRole(['doctor']), async (req, res) => {
  try {
    // Resolve doctor profile for the authenticated user; create minimal profile if missing
    let doctor = await Doctor.findOne({ where: { userId: req.user.id } });
    if (!doctor) {
      const userRecord = await User.findByPk(req.user.id);
      const firstName = (userRecord && userRecord.username) ? 'Dr.' : 'Dr.';
      const lastName = (userRecord && userRecord.username) ? 'Dev' : 'Dev';
      doctor = await Doctor.create({
        firstName,
        lastName,
        specialization: 'General Practice',
        email: userRecord?.username || 'doctor.dev@example.com',
        phone: '000-000-0000',
        licenseNumber: 'DEV-SEED',
        experience: 1,
        qualification: 'MD',
        userId: req.user.id,
      });
    }

    // Ensure a sample patient exists
    const sampleUsername = 'dev.patient@example.com';
    let patientUser = await User.findOne({ where: { username: sampleUsername } });
    if (!patientUser) {
      patientUser = await User.create({
        username: sampleUsername,
        password: 'patient123', // User model handles hashing
        role: 'patient',
      });
    }

    let patient = await Patient.findOne({ where: { userId: patientUser.id } });
    if (!patient) {
      patient = await Patient.create({
        firstName: 'Dev',
        lastName: 'Patient',
        email: sampleUsername,
        phone: '111-222-3333',
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
      reason: 'Dev seeded appointment',
      status: 'scheduled',
    });

    res.status(201).json({
      message: 'Dev appointment created successfully',
      appointment,
    });
  } catch (error) {
    console.error('Error in dev seed-appointment:', error);
    res.status(500).json({ message: 'Server error creating dev appointment' });
  }
});

module.exports = router;