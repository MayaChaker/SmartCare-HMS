const express = require('express');
const router = express.Router();
const receptionistController = require('../controllers/receptionistController');
const { getAvailability } = require('../controllers/availabilityController');
const { verifyToken, checkRole } = require('../middlewares/auth');

// Receptionist routes - protected by authentication and role
router.use(verifyToken);
router.use(checkRole(['receptionist']));

router.get('/patients', receptionistController.getAllPatients);
router.post('/patients', receptionistController.registerPatient);
router.put('/patients/:id', receptionistController.updatePatient);
router.post('/patients/:id/activation-code', receptionistController.newActivationCode);
router.get('/availability', getAvailability);
router.get('/doctors', receptionistController.getAllDoctors);
router.get('/doctors/:id/booked-times', receptionistController.getDoctorBookedTimes);
router.get('/schedules', receptionistController.getAllSchedules);
router.get('/appointments/today', receptionistController.getTodayAppointments);
router.get('/appointments/day', receptionistController.getAppointmentsByDate);
router.get('/appointments', receptionistController.getAllAppointments);
router.post('/appointments', receptionistController.createAppointment);
router.put('/appointments/:id', receptionistController.updateAppointment);
router.put('/checkin/:appointmentId', receptionistController.checkInPatient);

module.exports = router;
