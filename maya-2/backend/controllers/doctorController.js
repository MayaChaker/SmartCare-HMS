const { Doctor, Appointment, Patient, MedicalRecord, User } = require('../models');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

// Configure upload storage for doctor photos
const uploadBaseDir = path.join(__dirname, '..', 'uploads');
const doctorUploadDir = path.join(uploadBaseDir, 'doctors');
try {
  fs.mkdirSync(doctorUploadDir, { recursive: true });
} catch (e) {
  console.warn('Could not ensure upload directory exists:', e);
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, doctorUploadDir);
  },
  filename: function (req, file, cb) {
    const userId = req.user?.id || 'unknown';
    const ext = path.extname(file.originalname) || '';
    const safeExt = ext.toLowerCase();
    cb(null, `doctor_${userId}_${Date.now()}${safeExt}`);
  }
});

function imageFileFilter(req, file, cb) {
  if (!file.mimetype.startsWith('image/')) {
    return cb(new Error('Only image files are allowed'));
  }
  cb(null, true);
}

const upload = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: { fileSize: 3 * 1024 * 1024 } // 3MB limit
});

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
      include: [{ model: Patient, attributes: ['id', 'firstName', 'lastName', 'email', 'phone'] }],
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
      include: [{ model: Patient, attributes: ['id', 'firstName', 'lastName'] }]
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
    // Validate patient exists
    const patient = await Patient.findByPk(patientId);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    
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

// Update doctor profile
exports.updateProfile = async (req, res) => {
  try {
    console.log('[DoctorController] PUT /api/doctor/profile invoked');
    const userId = req.user.id;
    const {
      firstName,
      lastName,
      phone,
      specialization,
      photoUrl,
      availability,
      workingHours,
      availableDay,
      availableStartTime,
      availableEndTime,
      availableDate,
      licenseNumber,
      experience,
      qualification
    } = req.body;

    // Ensure a profile exists; auto-create with safe defaults if missing
    const doctor = await ensureDoctorForUser(userId);

    if (firstName) doctor.firstName = firstName;
    if (lastName) doctor.lastName = lastName;
    if (phone) doctor.phone = phone;
    if (specialization) doctor.specialization = specialization;
    if (photoUrl) doctor.photoUrl = photoUrl;
    if (availability !== undefined) doctor.availability = availability;
    if (workingHours) doctor.workingHours = workingHours;
    if (availableDay) doctor.availableDay = availableDay;
    if (availableStartTime) doctor.availableStartTime = availableStartTime;
    if (availableEndTime) doctor.availableEndTime = availableEndTime;
    if (availableDate) doctor.availableDate = availableDate;
    if (licenseNumber) doctor.licenseNumber = licenseNumber;
    if (experience !== undefined) doctor.experience = experience;
    if (qualification) doctor.qualification = qualification;

    await doctor.save();

    res.json({
      message: 'Profile updated successfully',
      doctor,
    });
  } catch (error) {
    console.error('Error updating doctor profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Upload doctor profile photo (multipart/form-data)
exports.uploadPhoto = (req, res) => {
  const single = upload.single('photo');
  single(req, res, async (err) => {
    if (err) {
      console.error('Upload error:', err);
      return res.status(400).json({ message: err.message || 'Upload error' });
    }
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ message: 'Unauthorized: missing user context' });
      }
      const userId = req.user.id;
      const doctor = await ensureDoctorForUser(userId);
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }
      const publicPath = `/uploads/doctors/${req.file.filename}`;
      doctor.photoUrl = publicPath;
      await doctor.save();
      return res.json({
        message: 'Photo uploaded successfully',
        doctor
      });
    } catch (error) {
      console.error('Error saving uploaded photo:', error);
      return res.status(500).json({ message: 'Server error', detail: error.message || 'unknown' });
    }
  });
};

// Update doctor availability
exports.updateAvailability = async (req, res) => {
  try {
    const userId = req.user.id;
    const { availability, workingHours, availableDay, availableStartTime, availableEndTime, availableDate } = req.body;
    // Ensure a profile exists; auto-create with safe defaults if missing
    const doctor = await ensureDoctorForUser(userId);
    
    if (availability !== undefined) doctor.availability = availability;
    if (workingHours) doctor.workingHours = workingHours;
    if (availableDay) doctor.availableDay = availableDay;
    if (availableStartTime) doctor.availableStartTime = availableStartTime;
    if (availableEndTime) doctor.availableEndTime = availableEndTime;
    if (availableDate) doctor.availableDate = availableDate;
    
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
    where: { id },
    include: [{ model: Doctor, attributes: ['id', 'userId'] }]
  });
    
  if (!appointment) {
    return res.status(404).json({ message: 'Appointment not found' });
  }
  // Ensure the appointment belongs to the currently authenticated doctor (by userId)
  if (!appointment.Doctor || appointment.Doctor.userId !== userId) {
    return res.status(403).json({ message: 'Forbidden: appointment does not belong to current doctor' });
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
    
    const rawPatients = appointments.map(app => app.Patient).filter(Boolean);
    const patients = await Promise.all(
      rawPatients.map(async (p) => {
        const count = await MedicalRecord.count({ where: { patientId: p.id } });
        const obj = p.toJSON();
        obj.hasMedicalRecords = count > 0;
        if (!obj.medicalHistory && count > 0) {
          obj.medicalHistory = 'Available';
        }
        return obj;
      })
    );
    
    res.json(patients);
  } catch (error) {
    console.error('Error fetching patients:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
