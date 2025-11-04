const { User, Patient, Doctor, Appointment } = require('../models');
const bcrypt = require('bcrypt');

// Register new patient
exports.registerPatient = async (req, res) => {
  try {
    const { username, password, firstName, lastName, dob, contact, medicalHistory, email, phone } = req.body;
    
    // Check if username already exists
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }
    
    // Create user with patient role (password will be automatically hashed by the User model)
    const user = await User.create({
      username,
      password,
      role: 'patient'
    });
    
    // Create patient profile
    const patient = await Patient.create({
      firstName: firstName || 'Patient',
      lastName: lastName || 'User',
      email: email || username,
      phone: phone || contact || '000-000-0000',
      dateOfBirth: dob,
      contact: contact || '000-000-0000',
      medicalHistory: medicalHistory || '',
      userId: user.id
    });
    
    res.status(201).json({
      message: 'Patient registered successfully',
      patient
    });
  } catch (error) {
    console.error('Error registering patient:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// View all doctors' schedules
exports.getAllSchedules = async (req, res) => {
  try {
    const doctors = await Doctor.findAll({
      attributes: ['id', 'firstName', 'lastName', 'specialization']
    });
    
    const schedules = [];
    
    for (const doctor of doctors) {
      const appointments = await Appointment.findAll({
        where: { doctorId: doctor.id },
        include: [{ model: Patient, attributes: ['firstName', 'lastName'] }]
      });
      
      schedules.push({
        doctor,
        appointments
      });
    }
    
    res.json(schedules);
  } catch (error) {
    console.error('Error fetching schedules:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Schedule appointment for patient
exports.createAppointment = async (req, res) => {
  try {
    const { patientId, doctorId, appointmentDate, reason } = req.body;
    
    const appointment = await Appointment.create({
      patientId,
      doctorId,
      appointmentDate,
      reason,
      status: 'scheduled'
    });
    
    res.status(201).json({
      message: 'Appointment scheduled successfully',
      appointment
    });
  } catch (error) {
    console.error('Error scheduling appointment:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update appointment
exports.updateAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { appointmentDate, status } = req.body;
    
    const appointment = await Appointment.findByPk(id);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    
    if (appointmentDate) appointment.appointmentDate = appointmentDate;
    if (status) appointment.status = status;
    
    await appointment.save();
    
    res.json({
      message: 'Appointment updated successfully',
      appointment
    });
  } catch (error) {
    console.error('Error updating appointment:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Check-in patient
exports.checkInPatient = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    
    const appointment = await Appointment.findByPk(appointmentId);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    
    // Update appointment status to indicate check-in
    appointment.status = 'checked-in';
    await appointment.save();
    
    res.json({
      message: 'Patient checked in successfully',
      appointment
    });
  } catch (error) {
    console.error('Error checking in patient:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all patients
exports.getAllPatients = async (req, res) => {
  try {
    const patients = await Patient.findAll({
      attributes: ['id', 'firstName', 'lastName', 'email', 'phone', 'dateOfBirth']
    });
    
    res.json(patients);
  } catch (error) {
    console.error('Error fetching patients:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all doctors
exports.getAllDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.findAll({
      attributes: ['id', 'firstName', 'lastName', 'specialization', 'phone', 'email']
    });
    
    res.json(doctors);
  } catch (error) {
    console.error('Error fetching doctors:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get today's appointments
exports.getTodayAppointments = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const appointments = await Appointment.findAll({
      where: {
        appointmentDate: {
          [require('sequelize').Op.gte]: today,
          [require('sequelize').Op.lt]: tomorrow
        }
      },
      include: [
        { model: Patient, attributes: ['firstName', 'lastName', 'phone'] },
        { model: Doctor, attributes: ['firstName', 'lastName', 'specialization'] }
      ],
      order: [['appointmentDate', 'ASC']]
    });
    
    res.json(appointments);
  } catch (error) {
    console.error('Error fetching today\'s appointments:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get queue status
exports.getQueueStatus = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const queue = await Appointment.findAll({
      where: {
        appointmentDate: {
          [require('sequelize').Op.gte]: today,
          [require('sequelize').Op.lt]: tomorrow
        },
        status: ['scheduled', 'checked-in']
      },
      include: [
        { model: Patient, attributes: ['firstName', 'lastName'] },
        { model: Doctor, attributes: ['firstName', 'lastName'] }
      ],
      order: [['appointmentDate', 'ASC']]
    });
    
    res.json({
      totalInQueue: queue.length,
      appointments: queue
    });
  } catch (error) {
    console.error('Error fetching queue status:', error);
    res.status(500).json({ message: 'Server error' });
  }
};