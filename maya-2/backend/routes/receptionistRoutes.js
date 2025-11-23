const express = require('express');
const router = express.Router();
const receptionistController = require('../controllers/receptionistController');
const { verifyToken, checkRole } = require('../middlewares/auth');

// Receptionist routes - protected by authentication and role
router.use(verifyToken);
router.use(checkRole(['receptionist']));

router.get('/patients', receptionistController.getAllPatients);
router.post('/patients', receptionistController.registerPatient);
router.get('/doctors', receptionistController.getAllDoctors);
router.get('/doctors/:id/booked-times', receptionistController.getDoctorBookedTimes);
router.get('/schedules', receptionistController.getAllSchedules);
router.get('/appointments/today', receptionistController.getTodayAppointments);
router.get('/appointments/day', receptionistController.getAppointmentsByDate);
router.get('/appointments', receptionistController.getAllAppointments);
router.get('/queue', receptionistController.getQueueStatus);
router.post('/appointments', receptionistController.createAppointment);
router.put('/appointments/:id', receptionistController.updateAppointment);
router.put('/checkin/:appointmentId', receptionistController.checkInPatient);

module.exports = router;
