const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctorController');
const { verifyToken, checkRole } = require('../middlewares/auth');

// Doctor routes - protected by authentication and role
// Trace requests entering doctor router to diagnose route matching issues
router.use((req, res, next) => {
  console.log('[DoctorRoutes]', req.method, req.originalUrl, '->', req.path);
  next();
});
router.use(verifyToken);
router.use(checkRole(['doctor']));

router.get('/profile', doctorController.getProfile);
router.put('/profile', doctorController.updateProfile);
router.post('/photo', doctorController.uploadPhoto);
router.get('/appointments', doctorController.getAppointments);
router.get('/schedule', doctorController.getSchedule);
router.get('/patients', doctorController.getPatients);
router.get('/patients/:id', doctorController.getPatientDetails);
router.post('/records', doctorController.createMedicalRecord);
router.put('/records/:id', doctorController.updateMedicalRecord);
router.put('/availability', doctorController.updateAvailability);
router.put('/appointments/:id', doctorController.updateAppointmentStatus);

module.exports = router;