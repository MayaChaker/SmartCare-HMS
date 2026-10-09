const { Patient, Doctor, Appointment } = require("../models");
const { Op } = require("sequelize");
const { getStatusChangeError, INACTIVE_STATUSES } = require("../utils/appointmentStatus");
const {
  isIsoDate,
  parseId,
  normalizeTimeToSql,
  isSlotAllowedByWorkingHours,
} = require("../utils/schedule");
const { clinicToday, isSlotInPast } = require("../utils/clinicTime");
const { getSlotConflictError } = require("../utils/bookingConflicts");
const { createActivationCode } = require("../utils/activation");
const audit = require("../utils/audit");

// What the front desk sees about a patient: who they are, how to reach them, and what staff must know
const DESK_PATIENT_FIELDS = ["id", "firstName", "lastName", "phone", "dateOfBirth", "insurance", "allergies", "bloodType"];

// The patient's own health information is complete enough for a visit
const healthInfoComplete = (p) => Boolean(p.bloodType && p.allergies);

const deskPatient = (p) => {
  const data = p.toJSON ? p.toJSON() : p;
  return {
    id: data.id,
    firstName: data.firstName,
    lastName: data.lastName,
    phone: data.phone,
    dateOfBirth: data.dateOfBirth,
    insurance: data.insurance,
    allergies: data.allergies,
    bloodType: data.bloodType,
    createdAt: data.createdAt,
    hasAccount: Boolean(data.userId),
    activationPending: !data.userId && Boolean(data.activationExpiresAt) && new Date(data.activationExpiresAt) > new Date(),
    healthInfoComplete: healthInfoComplete(data),
  };
};

const cleanName = (v) => (typeof v === "string" ? v.trim() : "");

// Open a file at the desk for a patient who calls or walks in without an account.
// Staff never choose the patient's username or password: the patient activates the file
// with the one-time code returned here, which is shown once and stored only as a hash.
exports.registerPatient = async (req, res) => {
  try {
    const firstName = cleanName(req.body.firstName);
    const lastName = cleanName(req.body.lastName);
    const phone = cleanName(req.body.phone);
    const { dateOfBirth } = req.body;

    if (!firstName || !lastName || !phone) {
      return res.status(400).json({ message: "First name, last name and mobile are required" });
    }
    if (dateOfBirth && !isIsoDate(dateOfBirth)) {
      return res.status(400).json({ message: "dateOfBirth must be YYYY-MM-DD" });
    }

    // The same person registered twice would split their history across two files
    const duplicate = await Patient.findOne({ where: { phone, ...(dateOfBirth ? { dateOfBirth } : { firstName, lastName }) } });
    if (duplicate) {
      return res.status(409).json({ message: "A patient with these details already has a file", patient: deskPatient(duplicate) });
    }

    const activation = createActivationCode();
    const patient = await Patient.create({
      firstName,
      lastName,
      phone,
      contact: phone,
      dateOfBirth: dateOfBirth || null,
      activationCodeHash: activation.hash,
      activationExpiresAt: activation.expiresAt,
    });

    await audit.record(req.user, "file.opened", { type: "patient", id: patient.id, name: audit.personName(patient) });
    res.status(201).json({
      message: "Patient file opened",
      patient: deskPatient(patient),
      activationCode: activation.code,
      activationExpiresAt: activation.expiresAt,
    });
  } catch (error) {
    console.error("Error registering patient:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// A new activation code, for a patient who lost theirs or let it expire
exports.newActivationCode = async (req, res) => {
  try {
    const patient = await Patient.findByPk(parseId(req.params.id));
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }
    if (patient.userId) {
      return res.status(409).json({ message: "This patient already has an account" });
    }
    const activation = createActivationCode();
    patient.activationCodeHash = activation.hash;
    patient.activationExpiresAt = activation.expiresAt;
    await patient.save();
    await audit.record(req.user, "file.code_reissued", { type: "patient", id: patient.id, name: audit.personName(patient) });
    res.json({ activationCode: activation.code, activationExpiresAt: activation.expiresAt });
  } catch (error) {
    console.error("Error creating activation code:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// The desk can correct how to reach a patient; health information stays with the patient and their doctors
exports.updatePatient = async (req, res) => {
  try {
    const patient = await Patient.findByPk(parseId(req.params.id));
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }
    const { dateOfBirth } = req.body;
    if (dateOfBirth && !isIsoDate(dateOfBirth)) {
      return res.status(400).json({ message: "dateOfBirth must be YYYY-MM-DD" });
    }
    for (const key of ["firstName", "lastName", "phone"]) {
      if (req.body[key] !== undefined) {
        const value = cleanName(req.body[key]);
        if (!value) return res.status(400).json({ message: `${key} cannot be empty` });
        patient[key] = value;
      }
    }
    if (dateOfBirth !== undefined) patient.dateOfBirth = dateOfBirth || null;
    await patient.save();
    await audit.record(req.user, "patient.contact_updated", { type: "patient", id: patient.id, name: audit.personName(patient) });
    res.json({ message: "Patient updated", patient: deskPatient(patient) });
  } catch (error) {
    console.error("Error updating patient:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// View all doctors' schedules
exports.getAllSchedules = async (req, res) => {
  try {
    const doctors = await Doctor.findAll({
      attributes: ["id", "firstName", "lastName", "specialization"],
    });

    const schedules = [];

    for (const doctor of doctors) {
      const appointments = await Appointment.findAll({
        where: { doctorId: doctor.id },
        include: [{ model: Patient, attributes: ["firstName", "lastName"] }],
      });

      schedules.push({
        doctor,
        appointments,
      });
    }

    res.json(schedules);
  } catch (error) {
    console.error("Error fetching schedules:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Schedule appointment for patient
exports.createAppointment = async (req, res) => {
  try {
    let { patientId, doctorId, appointmentDate, appointmentTime, reason } =
      req.body;
    // Allow passing a combined datetime from the UI
    if (
      appointmentDate &&
      String(appointmentDate).includes("T") &&
      !appointmentTime
    ) {
      const [d, t] = String(appointmentDate).split("T");
      appointmentDate = d;
      appointmentTime = (t || "").slice(0, 5);
    }
    const cleanPatientId = parseId(patientId);
    const cleanDoctorId = parseId(doctorId);
    const cleanDate = String(appointmentDate || "").trim();
    const cleanTime = normalizeTimeToSql(appointmentTime);

    if (!cleanPatientId) {
      return res.status(400).json({ message: "patientId is required" });
    }
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

    const patient = await Patient.findByPk(cleanPatientId);
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
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

    const conflictError = await getSlotConflictError({
      doctorId: cleanDoctorId,
      patientId: patient.id,
      date: cleanDate,
      time: cleanTime,
    });
    if (conflictError) {
      return res.status(409).json({ message: conflictError });
    }

    const appointment = await Appointment.create({
      patientId: cleanPatientId,
      doctorId: cleanDoctorId,
      appointmentDate: cleanDate,
      appointmentTime: cleanTime,
      reason,
      status: "scheduled",
    });
    await audit.recordVisit(req.user, "visit.booked", appointment);
    return res
      .status(201)
      .json({ message: "Appointment scheduled successfully", appointment });
  } catch (error) {
    console.error("Error scheduling appointment:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update appointment
exports.updateAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { appointmentDate, appointmentTime, status } = req.body;

    const appointment = await Appointment.findByPk(id);
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }
    const before = { status: appointment.status, slot: `${appointment.appointmentDate} ${String(appointment.appointmentTime).slice(0, 5)}` };

    const cleanDate = appointmentDate
      ? String(appointmentDate).trim()
      : appointment.appointmentDate;
    const cleanTime = appointmentTime
      ? normalizeTimeToSql(appointmentTime)
      : appointment.appointmentTime;

    if (!isIsoDate(cleanDate)) {
      return res
        .status(400)
        .json({ message: "appointmentDate must be YYYY-MM-DD" });
    }
    if (appointmentTime && !cleanTime) {
      return res
        .status(400)
        .json({ message: "appointmentTime must be HH:MM or HH:MM:SS" });
    }

    const slotChanged =
      cleanDate !== appointment.appointmentDate ||
      cleanTime !== appointment.appointmentTime;

    if (slotChanged) {
      if (appointment.status !== "scheduled") {
        return res.status(400).json({ message: "Only scheduled appointments can be rescheduled" });
      }
      if (cleanTime && isSlotInPast(cleanDate, cleanTime)) {
        return res.status(400).json({ message: "Please choose a date and time in the future" });
      }
      const doctor = await Doctor.findByPk(appointment.doctorId);
      if (!doctor) {
        return res.status(404).json({ message: "Doctor not found" });
      }
      if (doctor.availability === false) {
        return res.status(409).json({ message: "Doctor is not available" });
      }
      if (cleanTime) {
        const whCheck = isSlotAllowedByWorkingHours(doctor, cleanDate, cleanTime);
        if (!whCheck.ok) {
          return res.status(409).json({ message: whCheck.message });
        }
        const conflictError = await getSlotConflictError({
          doctorId: appointment.doctorId,
          patientId: appointment.patientId,
          date: cleanDate,
          time: cleanTime,
          excludeId: appointment.id,
        });
        if (conflictError) {
          return res.status(409).json({ message: conflictError });
        }
      }
      appointment.appointmentDate = cleanDate;
      appointment.appointmentTime = cleanTime;
    }
    if (status) {
      const next = String(status).toLowerCase();
      const statusError = getStatusChangeError(appointment.status, next, "receptionist");
      if (statusError) {
        return res.status(400).json({ message: statusError });
      }
      if (next === "no-show" && !isSlotInPast(appointment.appointmentDate, appointment.appointmentTime)) {
        return res.status(400).json({ message: "A visit can only be marked as a no-show after its time has passed" });
      }
      appointment.status = next;
    }

    await appointment.save();

    const STATUS_ACTIONS = { cancelled: "visit.cancelled", "no-show": "visit.no_show", "checked-in": "visit.checked_in" };
    if (appointment.status !== before.status && STATUS_ACTIONS[appointment.status]) {
      await audit.recordVisit(req.user, STATUS_ACTIONS[appointment.status], appointment);
    } else if (`${appointment.appointmentDate} ${String(appointment.appointmentTime).slice(0, 5)}` !== before.slot) {
      await audit.recordVisit(req.user, "visit.moved", appointment, `was ${before.slot}`);
    }

    res.json({
      message: "Appointment updated successfully",
      appointment,
    });
  } catch (error) {
    console.error("Error updating appointment:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Check-in patient
exports.checkInPatient = async (req, res) => {
  try {
    const { appointmentId } = req.params;

    const appointment = await Appointment.findByPk(appointmentId);
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    if (appointment.status !== "scheduled") {
      return res
        .status(400)
        .json({ message: "Only scheduled visits can be checked in" });
    }

    appointment.status = "checked-in";
    await appointment.save();
    await audit.recordVisit(req.user, "visit.checked_in", appointment);

    res.json({
      message: "Patient checked in successfully",
      appointment,
    });
  } catch (error) {
    console.error("Error checking in patient:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all patients
exports.getAllPatients = async (req, res) => {
  try {
    const patients = await Patient.findAll({
      attributes: [...DESK_PATIENT_FIELDS, "createdAt", "userId", "activationExpiresAt"],
      order: [["lastName", "ASC"], ["firstName", "ASC"]],
    });

    res.json(patients.map(deskPatient));
  } catch (error) {
    console.error("Error fetching patients:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all doctors
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
        "phone",
        "photoUrl",
        "fee",
      ],
    });
    res.json(doctors);
  } catch (error) {
    console.error("Error fetching doctors:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get today's appointments
exports.getTodayAppointments = async (req, res) => {
  try {
    // "Today" in Beirut, not on the server's UTC clock
    const todayYmd = clinicToday();

    const appointments = await Appointment.findAll({
      where: { appointmentDate: todayYmd },
      include: [
        {
          model: Patient,
          attributes: DESK_PATIENT_FIELDS,
        },
        {
          model: Doctor,
          attributes: ["id", "firstName", "lastName", "specialization", "photoUrl", "workingHours"],
        },
      ],
      order: [["appointmentTime", "ASC"]],
    });

    res.json(appointments);
  } catch (error) {
    console.error("Error fetching today's appointments:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getAppointmentsByDate = async (req, res) => {
  try {
    const date = req.query.date || clinicToday();
    if (!isIsoDate(date)) {
      return res.status(400).json({ message: "date must be YYYY-MM-DD" });
    }
    const appointments = await Appointment.findAll({
      where: { appointmentDate: date },
      include: [
        {
          model: Patient,
          attributes: DESK_PATIENT_FIELDS,
        },
        {
          model: Doctor,
          attributes: ["id", "firstName", "lastName", "specialization", "photoUrl", "workingHours"],
        },
      ],
      order: [["appointmentTime", "ASC"]],
    });
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
// Get all appointments (upcoming and past)
exports.getAllAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.findAll({
      include: [
        {
          model: Patient,
          attributes: DESK_PATIENT_FIELDS,
        },
        {
          model: Doctor,
          attributes: ["id", "firstName", "lastName", "specialization", "photoUrl", "workingHours"],
        },
      ],
      order: [
        ["appointmentDate", "ASC"],
        ["appointmentTime", "ASC"],
      ],
    });

    res.json(appointments);
  } catch (error) {
    console.error("Error fetching all appointments:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getDoctorBookedTimes = async (req, res) => {
  try {
    const { id } = req.params;
    const { date } = req.query;
    if (!id) {
      return res.status(400).json({ message: "Missing doctor id" });
    }
    if (!date) {
      return res
        .status(400)
        .json({ message: "Missing date query parameter (YYYY-MM-DD)" });
    }

    const appts = await Appointment.findAll({
      where: {
        doctorId: id,
        appointmentDate: date,
        status: { [Op.notIn]: INACTIVE_STATUSES },
      },
      attributes: ["appointmentTime"],
      order: [["appointmentTime", "ASC"]],
    });

    const bookedTimes = (appts || [])
      .map((a) => (a.appointmentTime || "").slice(0, 5))
      .filter((t) => t && t.includes(":"));

    return res.json({ bookedTimes });
  } catch (error) {
    console.error("Error fetching booked times:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
