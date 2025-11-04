const { Doctor, Appointment, Patient, MedicalRecord, User } = require('../models');

// Helper: ensure a Doctor profile exists for the current user
async function ensureDoctorForUser(userId) {
  let doctor = await Doctor.findOne({ where: { userId } });
  if (doctor) return doctor;

  // Derive safe defaults to satisfy non-null constraints
  const user = await User.findByPk(userId);
  const username = user?.username || 'doctor';
  // Try to split a sensible first/last from the username
  const base = username.split('@')[0];
  const parts = base.split(/[._\-\s]+/).filter(Boolean);
  const firstName = parts[0] || 'Doctor';
  const lastName = parts[1] || 'User';
  const specialization = 'General Medicine';

  doctor = await Doctor.create({
    firstName,
    lastName,
    specialization,
    email: user?.username || null,
    userId,
    availability: false,
    workingHours: null,
  });

  return doctor;
}

// Get doctor's appointments
exports.getAppointments = async (req, res) => {
  try {
    const userId = req.user.id;
    // Ensure a profile exists; auto-create with safe defaults if missing
    const doctor = await ensureDoctorForUser(userId);
    
    const appointments = await Appointment.findAll({
      where: { doctorId: doctor.id },
      include: [{ model: Patient, attributes: ['firstName', 'lastName', 'email', 'phone'] }],
      order: [['appointmentDate', 'ASC'], ['appointmentTime', 'ASC']]
    });
    
    res.json(appointments);
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get doctor's schedule
exports.getSchedule = async (req, res) => {
  try {
    const userId = req.user.id;
    // Ensure a profile exists; auto-create with safe defaults if missing
    const doctor = await ensureDoctorForUser(userId);
    
    const appointments = await Appointment.findAll({
      where: { doctorId: doctor.id },
      include: [{ model: Patient, attributes: ['firstName', 'lastName'] }]
    });
    
    res.json(appointments);
  } catch (error) {
    console.error('Error fetching schedule:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get patient details
exports.getPatientDetails = async (req, res) => {
  try {
    const { id } = req.params;
    
    const patient = await Patient.findByPk(id);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    
    // Get patient's medical records
    const records = await MedicalRecord.findAll({
      where: { patientId: patient.id },
      include: [{ model: Doctor, attributes: ['firstName', 'lastName'] }]
    });
    
    res.json({
      patient,
      medicalRecords: records
    });
  } catch (error) {
    console.error('Error fetching patient details:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create medical record
exports.createMedicalRecord = async (req, res) => {
  try {
    const userId = req.user.id;
    const { patientId, notes, prescriptions, testResults, diagnosis, medications } = req.body;
    // Ensure a profile exists; auto-create with safe defaults if missing
    const doctor = await ensureDoctorForUser(userId);
    
    const record = await MedicalRecord.create({
      patientId,
      doctorId: doctor.id,
      visitDate: new Date(),
      notes,
      prescriptions,
      testResults,
      diagnosis,
      medications
    });
    
    res.status(201).json({
      message: 'Medical record created successfully',
      record
    });
  } catch (error) {
    console.error('Error creating medical record:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update medical record
exports.updateMedicalRecord = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { notes, prescriptions, testResults, diagnosis, medications } = req.body;
    // Ensure a profile exists; auto-create with safe defaults if missing
    const doctor = await ensureDoctorForUser(userId);
    
    const record = await MedicalRecord.findOne({
      where: { id, doctorId: doctor.id }
    });
    
    if (!record) {
      return res.status(404).json({ message: 'Medical record not found' });
    }
    
    if (notes) record.notes = notes;
    if (prescriptions) record.prescriptions = prescriptions;
    if (testResults) record.testResults = testResults;
    if (diagnosis) record.diagnosis = diagnosis;
    if (medications) record.medications = medications;
    
    await record.save();
    
    res.json({
      message: 'Medical record updated successfully',
      record
    });
  } catch (error) {
    console.error('Error updating medical record:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get doctor profile
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    // Ensure a profile exists; auto-create with safe defaults if missing
    const doctor = await ensureDoctorForUser(userId);

    res.json(doctor);
  } catch (error) {
    console.error('Error fetching doctor profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update doctor availability
exports.updateAvailability = async (req, res) => {
  try {
    const userId = req.user.id;
    const { availability, workingHours } = req.body;
    // Ensure a profile exists; auto-create with safe defaults if missing
    const doctor = await ensureDoctorForUser(userId);
    
    if (availability !== undefined) doctor.availability = availability;
    if (workingHours) doctor.workingHours = workingHours;
    
    await doctor.save();
    
    res.json({
      message: 'Availability updated successfully',
      doctor
    });
  } catch (error) {
    console.error('Error updating availability:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update appointment status
exports.updateAppointmentStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { status, notes } = req.body;
    // Ensure a profile exists; auto-create with safe defaults if missing
    const doctor = await ensureDoctorForUser(userId);
    
    const appointment = await Appointment.findOne({
      where: { id, doctorId: doctor.id }
    });
    
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    
    if (status) appointment.status = status;
    if (notes) appointment.notes = notes;
    
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

// Get all patients for the doctor
exports.getPatients = async (req, res) => {
  try {
    const userId = req.user.id;
    // Ensure a profile exists; auto-create with safe defaults if missing
    const doctor = await ensureDoctorForUser(userId);
    
    // Get unique patients from appointments
    const appointments = await Appointment.findAll({
      where: { doctorId: doctor.id },
      include: [{ model: Patient, attributes: ['id', 'firstName', 'lastName', 'email', 'phone', 'dateOfBirth', 'medicalHistory'] }],
      attributes: ['patientId'],
      group: ['patientId']
    });
    
    const patients = appointments.map(app => app.Patient);
    
    res.json(patients);
  } catch (error) {
    console.error('Error fetching patients:', error);
    res.status(500).json({ message: 'Server error' });
  }
};