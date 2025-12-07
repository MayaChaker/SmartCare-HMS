const jwt = require('jsonwebtoken');
const { User, Patient } = require('../models');
require('dotenv').config();
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

// Login controller
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find user by username
    const user = await User.findOne({ where: { username } });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Register patient controller
exports.registerPatient = async (req, res) => {
  try {
    const { username, password, firstName, lastName, dob, contact, email, phone, medicalHistory } = req.body;

    // Check if username already exists
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    // Create user with patient role
    const user = await User.create({
      username,
      password,
      role: 'patient'
    });

    // Create patient profile with all available fields
    const patient = await Patient.create({
      firstName: firstName || 'New',
      lastName: lastName || 'Patient',
      email: email || username, // Use email if provided, otherwise use username
      phone: phone || contact || '', // Use phone if provided, otherwise use contact
      dateOfBirth: dob || null,
      contact: contact || '',
      medicalHistory: medicalHistory || '',
      userId: user.id
    });

    res.status(201).json({
      message: 'Patient registered successfully',
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      },
      patient: {
        id: patient.id,
        firstName: patient.firstName,
        lastName: patient.lastName,
        name: patient.name,
        email: patient.email,
        phone: patient.phone
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Dev-only: seed a doctor user and profile for testing
exports.seedDoctor = async (req, res) => {
  try {
    const { User, Doctor } = require('../models');
    const username = 'doc';
    const password = 'doc123';
    const role = 'doctor';

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
        firstName: 'Dr.',
        lastName: 'Demo',
        specialization: 'General Medicine',
        email: username,
        phone: '000-000-0000',
        licenseNumber: 'DOC-DEMO',
        experience: 3,
        qualification: 'MD',
        userId: user.id,
      });
    }

    return res.status(201).json({
      message: 'Doctor seeded',
      credentials: { username, password },
      user: { id: user.id, username: user.username, role: user.role },
      doctor,
    });
  } catch (error) {
    console.error('Error seeding doctor (authController):', error);
    return res.status(500).json({ message: 'Server error seeding doctor' });
  }
};
