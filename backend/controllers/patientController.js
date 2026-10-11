const { Patient, Appointment, MedicalRecord, Doctor } = require("../models");

const { isNonEmptyString, isValidEmail } = require("../utils/validation");
const {
  isIsoDate,
  parseId,
  normalizeTimeToSql,
  isSlotAllowedByWorkingHours,
} = require("../utils/schedule");
const { clinicToday, isSlotInPast } = require("../utils/clinicTime");
const { saveIfSlotFree } = require("../utils/bookingConflicts");
const audit = require("../utils/audit");

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const GENDERS = ["Female", "Male"];
const MAX_TEXT = 2000;

// The patient's own file, as the portal shows it (never the account link or activation details)
const ownProfile = (patient) => ({
  id: patient.id,
  name: patient.name,
  firstName: patient.firstName,
  lastName: patient.lastName,
  email: patient.email || "",
  phone: patient.phone || patient.contact || "",
  dateOfBirth: patient.dateOfBirth || "",
  gender: patient.gender || "",
  address: patient.address || "",
  emergencyContact: patient.emergencyContact || "",
  bloodType: patient.bloodType || "",
  allergies: patient.allergies || "",
  insurance: patient.insurance || "",
  medicalHistory: patient.medicalHistory || "",
  permanentMedicine: patient.permanentMedicine || "",
});

// Fields a patient may change. Names are required; every other field can be cleared with an empty value.
const REQUIRED_FIELDS = ["firstName", "lastName"];
const OPTIONAL_FIELDS = ["email", "phone", "dateOfBirth", "gender", "address", "emergencyContact", "bloodType", "allergies", "insurance", "medicalHistory", "permanentMedicine"];

// Returns { changes } or { error }
function profileChanges(body) {
  const changes = {};
  for (const key of [...REQUIRED_FIELDS, ...OPTIONAL_FIELDS]) {
    if (body[key] === undefined) continue;
    if (body[key] !== null && typeof body[key] !== "string") return { error: `${key} must be text` };
    const value = (body[key] || "").trim();
    if (value.length > MAX_TEXT) return { error: `${key} is too long` };
    if (REQUIRED_FIELDS.includes(key) && !value) return { error: "First and last name cannot be empty" };
    changes[key] = value || null;
  }
  if (changes.email && !isValidEmail(changes.email)) return { error: "Enter a valid email address" };
  if (changes.dateOfBirth && (!isIsoDate(changes.dateOfBirth) || changes.dateOfBirth > clinicToday())) {
    return { error: "Enter a valid date of birth" };
  }
  if (changes.gender && !GENDERS.includes(changes.gender)) return { error: "Choose a gender from the list" };
  if (changes.bloodType && !BLOOD_TYPES.includes(changes.bloodType)) return { error: "Choose a blood type from the list" };
  return { changes };
}

const findOwnPatient = (req) => Patient.findOne({ where: { userId: req.user.id } });

// Get patient profile
exports.getProfile = async (req, res) => {
  try {
    const patient = await findOwnPatient(req);
    if (!patient) {
      return res.status(404).json({ message: "Patient profile not found" });
    }
    res.json(ownProfile(patient));
  } catch (error) {
    console.error("Error fetching patient profile:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update patient profile: only the fields sent are changed
exports.updateProfile = async (req, res) => {
  try {
    const { changes, error } = profileChanges(req.body || {});
    if (error) {
      return res.status(400).json({ message: error });
    }

    const patient = await findOwnPatient(req);
    if (!patient) {
      return res.status(404).json({ message: "Patient profile not found" });
    }

    Object.assign(patient, changes);
    await patient.save();

    // The whole profile, so the portal shows exactly what was saved
    res.json({ message: "Profile updated successfully", patient: ownProfile(patient) });
  } catch (error) {
    console.error("Error updating patient profile:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get patient appointments
exports.getAppointments = async (req, res) => {
  try {
    const patient = await findOwnPatient(req);
    if (!patient) {
      return res.status(404).json({ message: "Patient profile not found" });
    }

    // The doctor is loaded with the visits in one query
    const appointments = await Appointment.findAll({
      where: { patientId: patient.id },
      include: [{ model: Doctor, attributes: ["firstName", "lastName", "specialization"] }],
    });

    res.json(
      appointments.map((appointment) => {
        const { Doctor: doctor, ...visit } = appointment.toJSON();
        return {
          ...visit,
          doctorName: doctor ? `${doctor.firstName} ${doctor.lastName}` : "Unknown Doctor",
          specialty: doctor ? doctor.specialization : "Unknown",
        };
      }),
    );
  } catch (error) {
    console.error("Error fetching appointments:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Schedule new appointment
exports.createAppointment = async (req, res) => {
  try {
    const { doctorId, appointmentDate, appointmentTime, reason } = req.body;

    const cleanDoctorId = parseId(doctorId);
    const cleanDate = String(appointmentDate || "").trim();
    const cleanTime = normalizeTimeToSql(appointmentTime);
    const cleanReason = isNonEmptyString(reason) ? reason.trim().slice(0, 255) : "";

    if (!cleanDoctorId) {
      return res.status(400).json({ message: "doctorId is required" });
    }
    if (!isIsoDate(cleanDate)) {
      return res
        .status(400)
        .json({ message: "appointmentDate must be YYYY-MM-DD" });
    }
    if (!cleanTime) {
      return res.status(400).json({ message: "appointmentTime is required" });
    }
    if (isSlotInPast(cleanDate, cleanTime)) {
      return res.status(400).json({ message: "Please choose a date and time in the future" });
    }

    const patient = await findOwnPatient(req);
    if (!patient) {
      return res.status(404).json({ message: "Patient profile not found" });
    }

    const doctor = await Doctor.findByPk(cleanDoctorId);
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }
    if (doctor.availability === false) {
      return res.status(409).json({ message: "Doctor is not available" });
    }
    const whCheck = isSlotAllowedByWorkingHours(doctor, cleanDate, cleanTime);
    if (!whCheck.ok) {
      return res.status(409).json({ message: whCheck.message });
    }

    const { error, appointment } = await saveIfSlotFree(
      { doctorId: cleanDoctorId, patientId: patient.id, date: cleanDate, time: cleanTime },
      (transaction) =>
        Appointment.create(
          {
            patientId: patient.id,
            doctorId: cleanDoctorId,
            appointmentDate: cleanDate,
            appointmentTime: cleanTime,
            reason: cleanReason,
            status: "scheduled",
          },
          { transaction },
        ),
    );
    if (error) {
      return res.status(409).json({ message: error });
    }

    await audit.recordVisit(req.user, "visit.booked", appointment);
    res.status(201).json({
      message: "Appointment scheduled successfully",
      appointment,
    });
  } catch (error) {
    console.error("Error scheduling appointment:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Move one of the patient's own visits to another day or time
exports.updateAppointment = async (req, res) => {
  try {
    const { appointmentDate, appointmentTime } = req.body;

    const patient = await findOwnPatient(req);
    if (!patient) {
      return res.status(404).json({ message: "Patient profile not found" });
    }

    const appointment = await Appointment.findOne({
      where: { id: parseId(req.params.id), patientId: patient.id },
    });

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    if (appointment.status !== "scheduled") {
      return res
        .status(400)
        .json({ message: "Only scheduled appointments can be rescheduled" });
    }

    const cleanDate = appointmentDate ? String(appointmentDate).trim() : "";
    const cleanTime =
      appointmentTime !== undefined
        ? normalizeTimeToSql(appointmentTime)
        : undefined;

    if (appointmentDate && !isIsoDate(cleanDate)) {
      return res
        .status(400)
        .json({ message: "appointmentDate must be YYYY-MM-DD" });
    }
    if (
      appointmentTime !== undefined &&
      appointmentTime !== null &&
      !cleanTime
    ) {
      return res
        .status(400)
        .json({ message: "appointmentTime must be HH:MM or HH:MM:SS" });
    }

    const nextDate = appointmentDate ? cleanDate : appointment.appointmentDate;
    const nextTime =
      appointmentTime !== undefined ? cleanTime : appointment.appointmentTime;
    if (!nextDate || !nextTime) {
      return res.status(400).json({ message: "Choose a day and a time" });
    }

    if (isSlotInPast(nextDate, nextTime)) {
      return res.status(400).json({ message: "Please choose a date and time in the future" });
    }
    const doctor = await Doctor.findByPk(appointment.doctorId);
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }
    if (doctor.availability === false) {
      return res.status(409).json({ message: "Doctor is not available" });
    }
    const whCheck = isSlotAllowedByWorkingHours(doctor, nextDate, nextTime);
    if (!whCheck.ok) {
      return res.status(409).json({ message: whCheck.message });
    }

    const was = `${appointment.appointmentDate} ${String(appointment.appointmentTime).slice(0, 5)}`;
    const { error } = await saveIfSlotFree(
      { doctorId: appointment.doctorId, patientId: appointment.patientId, date: nextDate, time: nextTime, excludeId: appointment.id },
      (transaction) => {
        appointment.appointmentDate = nextDate;
        appointment.appointmentTime = nextTime;
        return appointment.save({ transaction });
      },
    );
    if (error) {
      return res.status(409).json({ message: error });
    }
    await audit.recordVisit(req.user, "visit.moved", appointment, `was ${was}`);

    res.json({
      message: "Appointment updated successfully",
      appointment,
    });
  } catch (error) {
    console.error("Error updating appointment:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get medical records
exports.getMedicalRecords = async (req, res) => {
  try {
    const patient = await findOwnPatient(req);
    if (!patient) {
      return res.status(404).json({ message: "Patient profile not found" });
    }

    const records = await MedicalRecord.findAll({
      where: { patientId: patient.id },
      include: [
        {
          model: Doctor,
          attributes: ["firstName", "lastName", "specialization"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.json(records);
  } catch (error) {
    console.error("Error fetching medical records:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Cancel appointment
exports.cancelAppointment = async (req, res) => {
  try {
    const patient = await findOwnPatient(req);
    if (!patient) {
      return res.status(404).json({ message: "Patient profile not found" });
    }

    const appointment = await Appointment.findOne({
      where: { id: parseId(req.params.id), patientId: patient.id },
    });

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    // Visits are never deleted: they are part of the medical history, so they are only cancelled
    if (appointment.status !== "scheduled") {
      return res
        .status(400)
        .json({ message: "Only scheduled appointments can be cancelled" });
    }
    appointment.status = "cancelled";
    await appointment.save();
    await audit.recordVisit(req.user, "visit.cancelled", appointment);
    return res.json({
      message: "Appointment cancelled successfully",
      appointment,
    });
  } catch (error) {
    console.error("Error cancelling appointment:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Every doctor with what patients see when they book (also served publicly at GET /api/doctors)
exports.getAllDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.findAll({
      attributes: [
        "id",
        "firstName",
        "lastName",
        "specialization",
        "availability",
        "workingHours",
        "photoUrl",
        "phone",
        "qualification",
        "experience",
        "fee",
      ],
    });

    res.json(doctors);
  } catch (error) {
    console.error("Error fetching doctors:", error);
    res.status(500).json({ message: "Server error" });
  }
};
