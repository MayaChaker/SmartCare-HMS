const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Public routes
router.post('/login', authController.login);
router.post('/register-patient', authController.registerPatient);

module.exports = router;