const {
  Doctor,
  Appointment,
  Patient,
  MedicalRecord,
  User,
} = require("../models");
const { getStatusChangeError } = require("../utils/appointmentStatus");
const { isIsoDate, parseId } = require("../utils/schedule");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

// Configure upload storage for doctor photos
const uploadBaseDir = path.join(__dirname, "..", "uploads");
const doctorUploadDir = path.join(uploadBaseDir, "doctors");
try {
  fs.mkdirSync(doctorUploadDir, { recursive: true });
} catch (e) {
  console.warn("Could not ensure upload directory exists:", e);
}

// The extension comes from this list, never from the client's filename
const ALLOWED_IMAGE_TYPES = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, doctorUploadDir);
  },
  filename: function (req, file, cb) {
    const ext = ALLOWED_IMAGE_TYPES[file.mimetype];
    cb(null, `doctor_${req.user.id}_${Date.now()}${ext}`);
  },
});

function imageFileFilter(req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExts = [".jpg", ".jpeg", ".png", ".webp"];
  if (!ALLOWED_IMAGE_TYPES[file.mimetype] || !allowedExts.includes(ext)) {
    return cb(new Error("Only JPG, PNG or WEBP images are allowed"));
  }
  cb(null, true);
}

const upload = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: { fileSize: 3 * 1024 * 1024 }, // 3MB limit
});

// Helper: ensure a Doctor profile exists for the current user
async function ensureDoctorForUser(userId) {
  let doctor = await Doctor.findOne({ where: { userId } });
  if (doctor) return doctor;

  // Derive safe defaults to satisfy non-null constraints
  const user = await User.findByPk(userId);
  const username = user?.username || "doctor";
  // Try to split a sensible first/last from the username
  const base = username.split("@")[0];
  const parts = base.split(/[._\-\s]+/).filter(Boolean);
  const firstName = parts[0] || "Doctor";
  const lastName = parts[1] || "User";
  const specialization = "General Medicine";

  doctor = await Doctor.create({
    firstName,
    lastName,
    specialization,
    userId,
    availability: true,
    workingHours: null,
  });

  return doctor;
}

// A doctor may only access patients they have at least one appointment with
async function isDoctorsPatient(doctorId, patientId) {
  const count = await Appointment.count({ where: { doctorId, patientId } });
  return count > 0;
}

// Get doctor's appointments
exports.getAppointments = async (req, res) => {
  try {
    const userId = req.user.id;
    // Ensure a profile exists; auto-create with safe defaults if missing
    const doctor = await ensureDoctorForUser(userId);

    const appointments = await Appointment.findAll({
      where: { doctorId: doctor.id },
      include: [
        { model: Patient, attributes: CHART_FIELDS },
        // Lets the dashboard know which visits already have a note
        { model: MedicalRecord, attributes: ["id", "diagnosis"] },
      ],
      order: [
        ["appointmentDate", "ASC"],
        ["appointmentTime", "ASC"],
      ],
    });

    res.json(appointments);
  } catch (error) {
    console.error("Error fetching appointments:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// What a doctor needs to see about a patient before and during a visit
const CHART_FIELDS = [
  "id",
  "firstName",
  "lastName",
  "email",
  "phone",
  "dateOfBirth",
  "gender",
  "bloodType",
  "allergies",
  "permanentMedicine",
  "medicalHistory",
];

// Get doctor's schedule
exports.getSchedule = async (req, res) => {
  try {
    const userId = req.user.id;
    // Ensure a profile exists; auto-create with safe defaults if missing
    const doctor = await ensureDoctorForUser(userId);

    const appointments = await Appointment.findAll({
      where: { doctorId: doctor.id },
      include: [
        { model: Patient, attributes: ["id", "firstName", "lastName"] },
      ],
    });

    res.json(appointments);
  } catch (error) {
    console.error("Error fetching schedule:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get patient details
exports.getPatientDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const doctor = await ensureDoctorForUser(req.user.id);

    const patient = await Patient.findByPk(id);
    if (!patient || !(await isDoctorsPatient(doctor.id, patient.id))) {
      return res.status(404).json({ message: "Patient not found" });
    }

    // Get patient's medical records
    const records = await MedicalRecord.findAll({
      where: { patientId: patient.id },
      include: [{ model: Doctor, attributes: ["firstName", "lastName", "specialization"] }],
      order: [["visitDate", "DESC"]],
    });

    res.json({
      patient,
      medicalRecords: records,
    });
  } catch (error) {
    console.error("Error fetching patient details:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// The text parts of a visit note that the doctor can write
const NOTE_FIELDS = ["symptoms", "notes", "diagnosis", "treatment", "prescriptions", "medications", "testResults"];
const noteFields = (body) =>
  Object.fromEntries(NOTE_FIELDS.filter((key) => typeof body[key] === "string").map((key) => [key, body[key].trim()]));

// Statuses where the doctor writes the visit note: during the visit or right after it
const NOTE_STATUSES = ["in-progress", "completed"];

// Create the medical record (visit note) for one of the doctor's visits
exports.createMedicalRecord = async (req, res) => {
  try {
    const userId = req.user.id;
    const { appointmentId, followUpDate } = req.body;
    const fields = noteFields(req.body);
    // Ensure a profile exists; auto-create with safe defaults if missing
    const doctor = await ensureDoctorForUser(userId);

    const cleanAppointmentId = parseId(appointmentId);
    if (!cleanAppointmentId) {
      return res.status(400).json({ message: "appointmentId is required: a record belongs to a visit" });
    }
    const appointment = await Appointment.findOne({
      where: { id: cleanAppointmentId, doctorId: doctor.id },
    });
    if (!appointment) {
      return res.status(404).json({ message: "Visit not found" });
    }
    if (!NOTE_STATUSES.includes(appointment.status)) {
      return res.status(400).json({ message: "A record can only be added once the visit has started" });
    }
    const existing = await MedicalRecord.findOne({ where: { appointmentId: appointment.id } });
    if (existing) {
      return res.status(409).json({ message: "This visit already has a medical record" });
    }

    if (followUpDate && !isIsoDate(followUpDate)) {
      return res.status(400).json({ message: "followUpDate must be YYYY-MM-DD" });
    }

    const record = await MedicalRecord.create({
      appointmentId: appointment.id,
      patientId: appointment.patientId,
      doctorId: doctor.id,
      visitDate: appointment.appointmentDate,
      ...fields,
      followUpDate: followUpDate || null,
    });

    res.status(201).json({
      message: "Medical record created successfully",
      record,
    });
  } catch (error) {
    console.error("Error creating medical record:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update medical record
exports.updateMedicalRecord = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const fields = noteFields(req.body);
    const { followUpDate } = req.body;
    // Ensure a profile exists; auto-create with safe defaults if missing
    const doctor = await ensureDoctorForUser(userId);

    const record = await MedicalRecord.findOne({
      where: { id, doctorId: doctor.id },
    });

    if (!record) {
      return res.status(404).json({ message: "Medical record not found" });
    }

    if (followUpDate && !isIsoDate(followUpDate)) {
      return res.status(400).json({ message: "followUpDate must be YYYY-MM-DD" });
    }
    // Sent fields replace the old text, so a doctor can also clear a part of the note
    Object.assign(record, fields);
    if (followUpDate !== undefined) record.followUpDate = followUpDate || null;

    await record.save();

    res.json({
      message: "Medical record updated successfully",
      record,
    });
  } catch (error) {
    console.error("Error updating medical record:", error);
    res.status(500).json({ message: "Server error" });
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
    console.error("Error fetching doctor profile:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update doctor profile
exports.updateProfile = async (req, res) => {
  try {
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
      qualification,
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
      message: "Profile updated successfully",
      doctor,
    });
  } catch (error) {
    console.error("Error updating doctor profile:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Upload doctor profile photo (multipart/form-data)
exports.uploadPhoto = (req, res) => {
  const single = upload.single("photo");
  single(req, res, async (err) => {
    if (err) {
      const message =
        err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE"
          ? "Image must be 3MB or smaller"
          : err.message;
      return res.status(400).json({ message });
    }
    try {
      const userId = req.user.id;
      const doctor = await ensureDoctorForUser(userId);
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      const publicPath = `/uploads/doctors/${req.file.filename}`;
      doctor.photoUrl = publicPath;
      await doctor.save();
      return res.json({
        message: "Photo uploaded successfully",
        doctor,
      });
    } catch (error) {
      console.error("Error saving uploaded photo:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });
};

// Update doctor availability
exports.updateAvailability = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      availability,
      workingHours,
      availableDay,
      availableStartTime,
      availableEndTime,
      availableDate,
    } = req.body;
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
      message: "Availability updated successfully",
      doctor,
    });
  } catch (error) {
    console.error("Error updating availability:", error);
    res.status(500).json({ message: "Server error" });
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
      include: [{ model: Doctor, attributes: ["id", "userId"] }],
    });

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }
    // Ensure the appointment belongs to the currently authenticated doctor (by userId)
    if (!appointment.Doctor || appointment.Doctor.userId !== userId) {
      return res
        .status(403)
        .json({
          message: "Forbidden: appointment does not belong to current doctor",
        });
    }

    if (status) {
      const next = String(status).toLowerCase();
      const statusError = getStatusChangeError(appointment.status, next, "doctor");
      if (statusError) {
        return res.status(400).json({ message: statusError });
      }
      appointment.status = next;
    }
    if (notes) appointment.notes = notes;

    await appointment.save();

    res.json({
      message: "Appointment updated successfully",
      appointment,
    });
  } catch (error) {
    console.error("Error updating appointment:", error);
    res.status(500).json({ message: "Server error" });
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
      include: [
        {
          model: Patient,
          attributes: CHART_FIELDS,
        },
      ],
      attributes: ["patientId"],
      group: ["patientId"],
    });

    const rawPatients = appointments.map((app) => app.Patient).filter(Boolean);
    const patients = await Promise.all(
      rawPatients.map(async (p) => {
        const count = await MedicalRecord.count({ where: { patientId: p.id } });
        const obj = p.toJSON();
        obj.hasMedicalRecords = count > 0;
        if (!obj.medicalHistory && count > 0) {
          obj.medicalHistory = "Available";
        }
        return obj;
      })
    );

    res.json(patients);
  } catch (error) {
    console.error("Error fetching patients:", error);
    res.status(500).json({ message: "Server error" });
  }
};
