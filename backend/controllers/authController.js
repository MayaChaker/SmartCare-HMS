const jwt = require('jsonwebtoken');
const { User, Patient } = require('../models');
const { JWT_SECRET } = require('../config/auth');

const isNonEmptyString = (v) => typeof v === 'string' && v.trim().length > 0;
const isValidEmail = (v) =>
  typeof v === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

// Login controller
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!isNonEmptyString(username) || !isNonEmptyString(password)) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    // Find user by username
    const user = await User.findOne({ where: { username: username.trim() } });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password.trim());
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
    if (!isNonEmptyString(username) || !isNonEmptyString(password)) {
      return res.status(400).json({ message: 'Username and password are required' });
    }
    if (String(username).trim().length < 3) {
      return res.status(400).json({ message: 'Username must be at least 3 characters' });
    }
    if (String(password).trim().length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }
    if (email && !isValidEmail(email)) {
      return res.status(400).json({ message: 'Invalid email address' });
    }

    // Check if username already exists
    const cleanUsername = String(username).trim();
    const existingUser = await User.findOne({ where: { username: cleanUsername } });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    // Create user with patient role
    const user = await User.create({
      username: cleanUsername,
      password: String(password).trim(),
      role: 'patient'
    });

    // Create patient profile with all available fields
    const patient = await Patient.create({
      firstName: isNonEmptyString(firstName) ? firstName.trim() : 'New',
      lastName: isNonEmptyString(lastName) ? lastName.trim() : 'Patient',
      email: isNonEmptyString(email) ? email.trim() : cleanUsername, // Use email if provided, otherwise use username
      phone: isNonEmptyString(phone) ? phone.trim() : isNonEmptyString(contact) ? contact.trim() : '', // Use phone if provided, otherwise use contact
      dateOfBirth: dob || null,
      contact: isNonEmptyString(contact) ? contact.trim() : '',
      medicalHistory: isNonEmptyString(medicalHistory) ? medicalHistory.trim() : '',
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
