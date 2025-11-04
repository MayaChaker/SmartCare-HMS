const { User, Doctor, Patient, Appointment, MedicalRecord } = require('../models');
const { sequelize } = require('../config/db');
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');

// Get all users (doctors, receptionists, patients)
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'username', 'role', 'createdAt']
    });
    
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create new user (doctor or receptionist)
exports.createUser = async (req, res) => {
  try {
    const { username, password, role, firstName, lastName, specialization, phone, email } = req.body;
    
    if (!['doctor', 'receptionist', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }
    
    // Check if username already exists
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }
    
    // Create user (password will be automatically hashed by the User model's beforeCreate hook)
    const user = await User.create({
      username,
      password, // Don't hash here - let the model handle it
      role
    });
    
    // If doctor, create doctor profile
    if (role === 'doctor' && firstName && lastName && specialization) {
      await Doctor.create({
        firstName,
        lastName,
        specialization,
        phone: phone || '000-000-0000',
        email: email || username,
        userId: user.id
      });
    }
    
    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update user
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, password, role } = req.body;
    
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Update user fields
    if (username) user.username = username;
    if (password) user.password = password; // Let the model's beforeUpdate hook handle hashing
    if (role) user.role = role;
    
    await user.save();
    
    res.json({
      message: 'User updated successfully',
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete user
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Handle cascading deletes based on user role
    if (user.role === 'doctor') {
      // Delete related appointments and medical records first
      const doctor = await Doctor.findOne({ where: { userId: id } });
      if (doctor) {
        await MedicalRecord.destroy({ where: { doctorId: doctor.id } });
        await Appointment.destroy({ where: { doctorId: doctor.id } });
        await doctor.destroy();
      }
    } else if (user.role === 'patient') {
      // Delete related appointments and medical records first
      const patient = await Patient.findOne({ where: { userId: id } });
      if (patient) {
        await MedicalRecord.destroy({ where: { patientId: patient.id } });
        await Appointment.destroy({ where: { patientId: patient.id } });
        await patient.destroy();
      }
    } else if (user.role === 'receptionist') {
      // Delete receptionist record first (using raw query since no model exists)
      await sequelize.query('DELETE FROM receptionists WHERE userId = ?', {
        replacements: [id],
        type: sequelize.QueryTypes.DELETE
      });
    }
    
    await user.destroy();
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get system analytics
exports.getAnalytics = async (req, res) => {
  try {
    // Get counts
    const totalUsers = await User.count();
    const totalPatients = await Patient.count();
    const totalDoctors = await Doctor.count();
    const totalAppointments = await Appointment.count();
    
    // Get today's appointments
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const todayAppointments = await Appointment.count({
      where: {
        appointmentDate: {
          [Op.gte]: today,
          [Op.lt]: tomorrow
        }
      }
    });
    
    // Get appointments by status
    const appointmentsByStatus = await Appointment.findAll({
      attributes: [
        'status',
        [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
      ],
      group: ['status']
    });
    
    // Get recent registrations (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentRegistrations = await User.count({
      where: {
        createdAt: {
          [Op.gte]: thirtyDaysAgo
        }
      }
    });
    
    res.json({
      totalUsers,
      totalPatients,
      totalDoctors,
      totalAppointments,
      todayAppointments,
      recentRegistrations,
      appointmentsByStatus: appointmentsByStatus.reduce((acc, item) => {
        acc[item.status] = parseInt(item.dataValues.count);
        return acc;
      }, {})
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all doctors with details
exports.getAllDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.findAll({
      include: [{ model: User, attributes: ['username', 'createdAt'] }]
    });
    
    res.json(doctors);
  } catch (error) {
    console.error('Error fetching doctors:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all patients with details
exports.getAllPatients = async (req, res) => {
  try {
    const patients = await Patient.findAll({
      include: [{ model: User, attributes: ['username', 'createdAt'] }]
    });
    
    res.json(patients);
  } catch (error) {
    console.error('Error fetching patients:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all appointments with details
exports.getAllAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.findAll({
      include: [
        { model: Patient, attributes: ['firstName', 'lastName', 'email'] },
        { model: Doctor, attributes: ['firstName', 'lastName', 'specialization'] }
      ],
      order: [['appointmentDate', 'DESC']]
    });
    
    res.json(appointments);
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// System settings (placeholder for future implementation)
exports.getSystemSettings = async (req, res) => {
  try {
    // This would typically fetch from a settings table
    const settings = {
      systemName: 'SmartCare Medical System',
      version: '1.0.0',
      maintenanceMode: false,
      allowRegistration: true,
      maxAppointmentsPerDay: 50
    };
    
    res.json(settings);
  } catch (error) {
    console.error('Error fetching system settings:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update system settings (placeholder for future implementation)
exports.updateSystemSettings = async (req, res) => {
  try {
    const { maintenanceMode, allowRegistration, maxAppointmentsPerDay } = req.body;
    
    // This would typically update a settings table
    const updatedSettings = {
      systemName: 'SmartCare Medical System',
      version: '1.0.0',
      maintenanceMode: maintenanceMode || false,
      allowRegistration: allowRegistration !== undefined ? allowRegistration : true,
      maxAppointmentsPerDay: maxAppointmentsPerDay || 50
    };
    
    res.json({
      message: 'System settings updated successfully',
      settings: updatedSettings
    });
  } catch (error) {
    console.error('Error updating system settings:', error);
    res.status(500).json({ message: 'Server error' });
  }
};