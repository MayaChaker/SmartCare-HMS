const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Public routes
router.post('/login', authController.login);
router.post('/register-patient', authController.registerPatient);
// Dev-only helper to seed a doctor account quickly
router.post('/seed-doctor', authController.seedDoctor);

module.exports = router;