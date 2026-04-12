const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patientController');
const { verifyToken, checkRole } = require('../middlewares/auth');

// Patient routes - protected by authentication and role
router.use(verifyToken);
router.use(checkRole(['patient']));

router.get('/profile', patientController.getProfile);
router.put('/profile', patientController.updateProfile);
router.get('/appointments', patientController.getAppointments);
router.post('/appointments', patientController.createAppointment);
router.put('/appointments/:id', patientController.updateAppointment);
router.delete('/appointments/:id', patientController.cancelAppointment);
router.get('/records', patientController.getMedicalRecords);
router.get('/available-slots', patientController.getAvailableSlots);
router.get('/doctors/:doctorId/booked-dates', patientController.getDoctorBookedDates);
router.get('/doctors/:doctorId/booked-times', patientController.getDoctorBookedTimes);

// Public route for doctors list (still requires authentication)
router.get('/doctors', patientController.getAllDoctors);

module.exports = router;