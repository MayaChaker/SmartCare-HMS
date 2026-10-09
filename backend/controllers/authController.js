const jwt = require('jsonwebtoken');
const { User, Patient } = require('../models');
const { sequelize } = require('../config/db');
const { JWT_SECRET } = require('../config/auth');
const {
  isNonEmptyString,
  isValidEmail,
  getCredentialsError,
} = require('../utils/validation');
const { Op } = require('sequelize');
const { hashCode, normalize } = require('../utils/activation');

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
    const credentialsError = getCredentialsError(username, password);
    if (credentialsError) {
      return res.status(400).json({ message: credentialsError });
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

    // User and profile are created together so a failure never leaves an orphan login
    const { user, patient } = await sequelize.transaction(async (transaction) => {
      const user = await User.create(
        {
          username: cleanUsername,
          password: String(password).trim(),
          role: 'patient'
        },
        { transaction }
      );

      const patient = await Patient.create(
        {
          firstName: isNonEmptyString(firstName) ? firstName.trim() : 'New',
          lastName: isNonEmptyString(lastName) ? lastName.trim() : 'Patient',
          email: isNonEmptyString(email) ? email.trim() : cleanUsername, // Use email if provided, otherwise use username
          phone: isNonEmptyString(phone) ? phone.trim() : isNonEmptyString(contact) ? contact.trim() : '', // Use phone if provided, otherwise use contact
          dateOfBirth: dob || null,
          contact: isNonEmptyString(contact) ? contact.trim() : '',
          medicalHistory: isNonEmptyString(medicalHistory) ? medicalHistory.trim() : '',
          userId: user.id
        },
        { transaction }
      );

      return { user, patient };
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

// A patient whose file was opened at the front desk creates their own login with the one-time code
exports.activatePatient = async (req, res) => {
  try {
    const { code, username, password } = req.body;
    if (normalize(code).length !== 8) {
      return res.status(400).json({ message: 'Enter the 8-character code from reception' });
    }
    const credentialsError = getCredentialsError(username, password);
    if (credentialsError) {
      return res.status(400).json({ message: credentialsError });
    }

    const patient = await Patient.findOne({
      where: { activationCodeHash: hashCode(code), userId: null, activationExpiresAt: { [Op.gt]: new Date() } },
    });
    if (!patient) {
      return res.status(400).json({ message: 'This code is not valid or has expired. Reception can give you a new one.' });
    }

    const cleanUsername = String(username).trim();
    if (await User.findOne({ where: { username: cleanUsername } })) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    // The login is created and linked in one step, and the code can never be used again
    const user = await sequelize.transaction(async (transaction) => {
      const created = await User.create({ username: cleanUsername, password: String(password).trim(), role: 'patient' }, { transaction });
      patient.userId = created.id;
      patient.activationCodeHash = null;
      patient.activationExpiresAt = null;
      await patient.save({ transaction });
      return created;
    });

    res.status(201).json({
      message: 'Account activated',
      user: { id: user.id, username: user.username, role: user.role },
      patient: { id: patient.id, firstName: patient.firstName, lastName: patient.lastName },
    });
  } catch (error) {
    console.error('Activation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
