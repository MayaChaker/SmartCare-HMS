const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyToken, checkRole } = require('../middlewares/auth');

// Admin routes - protected by authentication and role
router.use(verifyToken);
router.use(checkRole(['admin']));

// User management
router.get('/users', adminController.getAllUsers);
router.post('/users', adminController.createUser);
router.put('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);

// Analytics and reporting
router.get('/analytics', adminController.getAnalytics);
router.get('/doctors', adminController.getAllDoctors);
router.get('/patients', adminController.getAllPatients);
router.get('/appointments', adminController.getAllAppointments);
// Bulk doctor availability
router.put('/doctors/availability', adminController.makeAllDoctorsAvailable);

// System settings
router.get('/settings', adminController.getSystemSettings);
router.put('/settings', adminController.updateSystemSettings);

module.exports = router;