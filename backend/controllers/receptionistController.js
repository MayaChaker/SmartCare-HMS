const { User, Patient, Doctor, Appointment } = require("../models");
const bcrypt = require("bcrypt");

const isIsoDate = (v) => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);
const parseId = (v) => {
  const n = Number.parseInt(String(v), 10);
  return Number.isFinite(n) ? n : null;
};
const normalizeTimeToSql = (v) => {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  if (!s) return null;
  if (/^\d{2}:\d{2}:\d{2}$/.test(s)) return s;
  if (/^\d{2}:\d{2}$/.test(s)) return `${s}:00`;
  return null;
};
const to24Hour = (t) => {
  if (!t || typeof t !== "string") return "";
  const m = t.trim().match(/^(\d{1,2}):(\d{2})(?:\s*([AP]M))?$/i);
  if (!m) return "";
  let h = Number.parseInt(m[1], 10);
  const minutes = m[2];
  const mer = String(m[3] || "").toUpperCase();
  if (mer === "PM" && h < 12) h += 12;
  if (mer === "AM" && h === 12) h = 0;
  if (h < 0 || h > 23) return "";
  return `${String(h).padStart(2, "0")}:${minutes}`;
};
const toMinutes = (hhmm) => {
  const [hh, mm] = String(hhmm || "").split(":");
  const h = Number.parseInt(hh, 10);
  const m = Number.parseInt(mm, 10);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  return h * 60 + m;
};
const expandDayRange = (start, end) => {
  const order = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const si = order.indexOf(start);
  const ei = order.indexOf(end);
  if (si === -1 || ei === -1) return [];
  const days = [];
  let i = si;
  for (let guard = 0; guard < 8; guard++) {
    days.push(order[i]);
    if (i === ei) break;
    i = (i + 1) % 7;
  }
  return days;
};
const parseWorkingHoursText = (workingHours) => {
  if (!workingHours || typeof workingHours !== "string") {
    return { days: [], start: "09:00", end: "17:00" };
  }
  const timePattern = "\\d{1,2}:\\d{2}(?:\\s*[AP]M)?";
  const fullPattern = new RegExp(
    `^(.*?)(\\s+(${timePattern})\\s*-\\s*(${timePattern}))$`,
    "i",
  );
  const match = String(workingHours).trim().match(fullPattern);
  let daysPart = String(workingHours).trim();
  let startRaw = "";
  let endRaw = "";
  if (match) {
    daysPart = String(match[1] || "").trim();
    startRaw = match[3];
    endRaw = match[4];
  } else {
    const timeOnlyPattern = new RegExp(
      `^\\s*(${timePattern})\\s*-\\s*(${timePattern})\\s*$`,
      "i",
    );
    const m2 = String(workingHours).trim().match(timeOnlyPattern);
    if (m2) {
      daysPart = "";
      startRaw = m2[1];
      endRaw = m2[2];
    } else {
      const parts = String(workingHours).split(/\d{1,2}:\d{2}/);
      daysPart = String(parts[0] || "").trim();
    }
  }

  const map = {
    Sunday: "Sun",
    Monday: "Mon",
    Tuesday: "Tue",
    Wednesday: "Wed",
    Thursday: "Thu",
    Friday: "Fri",
    Saturday: "Sat",
    Sun: "Sun",
    Mon: "Mon",
    Tue: "Tue",
    Wed: "Wed",
    Thu: "Thu",
    Fri: "Fri",
    Sat: "Sat",
  };
  const normalizeDayToken = (s) => {
    const raw = String(s || "").trim();
    if (!raw) return "";
    const t = raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
    return map[t] || map[raw] || "";
  };

  const dayTokens = [];
  const items = String(daysPart || "")
    .split(",")
    .map((d) => d.trim())
    .filter(Boolean);
  for (const item of items) {
    const range = item.match(/^(.+?)\s*-\s*(.+?)$/);
    if (range) {
      const a = normalizeDayToken(range[1]);
      const b = normalizeDayToken(range[2]);
      const expanded = expandDayRange(a, b);
      if (expanded.length) {
        dayTokens.push(...expanded);
        continue;
      }
    }
    const d = normalizeDayToken(item);
    if (d) dayTokens.push(d);
  }

  const days = Array.from(new Set(dayTokens));
  const start = to24Hour(startRaw) || "09:00";
  const end = to24Hour(endRaw) || "17:00";
  return { days, start, end };
};

const isSlotAllowedByWorkingHours = (doctor, isoDate, sqlTime) => {
  const parsed = parseWorkingHoursText(doctor?.workingHours || "");
  const days = parsed.days || [];
  if (Array.isArray(days) && days.length > 0) {
    const dt = new Date(`${isoDate}T00:00:00`);
    const dayMap = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const dow = dayMap[dt.getDay()];
    if (!days.includes(dow)) {
      return {
        ok: false,
        message: `Doctor is not available on ${dow}`,
      };
    }
  }
  const startM = toMinutes(parsed.start);
  const endM = toMinutes(parsed.end);
  const slotM = toMinutes(String(sqlTime || "").slice(0, 5));
  if (startM !== null && endM !== null && slotM !== null && startM < endM) {
    if (slotM < startM || slotM >= endM) {
      return {
        ok: false,
        message: "Selected time is outside doctor's working hours",
      };
    }
  }
  return { ok: true };
};

// Register new patient
exports.registerPatient = async (req, res) => {
  try {
    const {
      username,
      password,
      firstName,
      lastName,
      dob,
      contact,
      medicalHistory,
      email,
      phone,
      bloodType,
    } = req.body;

    // Check if username already exists
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(400).json({ message: "Username already exists" });
    }

    // Create user with patient role (password will be automatically hashed by the User model)
    const user = await User.create({
      username,
      password,
      role: "patient",
    });

    // Create patient profile
    const patient = await Patient.create({
      firstName: firstName || "Patient",
      lastName: lastName || "User",
      email: email || username,
      phone: phone || contact || "00-000-000",
      dateOfBirth: dob,
      contact: contact || "00-000-000",
      medicalHistory: medicalHistory || "",
      bloodType: bloodType || null,
      userId: user.id,
    });

    res.status(201).json({
      message: "Patient registered successfully",
      patient,
    });
  } catch (error) {
    console.error("Error registering patient:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// View all doctors' schedules
exports.getAllSchedules = async (req, res) => {
  try {
    const { Op } = require("sequelize");
    const doctors = await Doctor.findAll({
      where: {
        [Op.and]: [
          {
            [Op.or]: [
              { licenseNumber: { [Op.ne]: "DOC-DEMO" } },
              { licenseNumber: null },
            ],
          },
          { [Op.not]: { firstName: "Dr.", lastName: "Demo" } },
        ],
      },
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

    const { Op } = require("sequelize");
    const existing = await Appointment.findOne({
      where: {
        doctorId: cleanDoctorId,
        appointmentDate: cleanDate,
        appointmentTime: cleanTime,
        status: { [Op.not]: "cancelled" },
      },
    });
    if (existing) {
      return res.status(409).json({
        message: "Selected time slot is already booked for this doctor",
      });
    }

    const apptPayload = {
      patientId: cleanPatientId,
      doctorId: cleanDoctorId,
      appointmentDate: cleanDate,
      reason,
      status: "scheduled",
    };
    apptPayload.appointmentTime = cleanTime;
    try {
      const appointment = await Appointment.create(apptPayload);
      return res
        .status(201)
        .json({ message: "Appointment scheduled successfully", appointment });
    } catch (err) {
      if (err?.name === "SequelizeUniqueConstraintError") {
        return res.status(409).json({
          message: "Selected time slot is already booked for this doctor",
        });
      }
      throw err;
    }
  } catch (error) {
    console.error("Error scheduling appointment:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update appointment
exports.updateAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { appointmentDate, status } = req.body;

    const appointment = await Appointment.findByPk(id);
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    if (appointmentDate) {
      const cleanDate = String(appointmentDate || "").trim();
      if (!isIsoDate(cleanDate)) {
        return res
          .status(400)
          .json({ message: "appointmentDate must be YYYY-MM-DD" });
      }
      const doctor = await Doctor.findByPk(appointment.doctorId);
      if (!doctor) {
        return res.status(404).json({ message: "Doctor not found" });
      }
      if (doctor.availability === false) {
        return res.status(409).json({ message: "Doctor is not available" });
      }
      if (appointment.appointmentTime) {
        const whCheck = isSlotAllowedByWorkingHours(
          doctor,
          cleanDate,
          appointment.appointmentTime,
        );
        if (!whCheck.ok) {
          return res.status(409).json({ message: whCheck.message });
        }
        const { Op } = require("sequelize");
        const conflict = await Appointment.findOne({
          where: {
            id: { [Op.ne]: appointment.id },
            doctorId: appointment.doctorId,
            appointmentDate: cleanDate,
            appointmentTime: appointment.appointmentTime,
            status: { [Op.not]: "cancelled" },
          },
        });
        if (conflict) {
          return res.status(409).json({
            message: "Selected time slot is already booked for this doctor",
          });
        }
      }
      appointment.appointmentDate = cleanDate;
    }
    if (status) {
      const next = String(status).toLowerCase();
      const current = String(appointment.status).toLowerCase();
      if (
        (next === "completed" || next === "cancelled") &&
        !(current === "checked-in" || current === "in-progress")
      ) {
        return res
          .status(400)
          .json({ message: "Not allowed to finalize before check-in" });
      }
      appointment.status = next;
    }

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

// Check-in patient
exports.checkInPatient = async (req, res) => {
  try {
    const { appointmentId } = req.params;

    const appointment = await Appointment.findByPk(appointmentId);
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    // Update appointment status to indicate check-in
    appointment.status = "checked-in";
    await appointment.save();

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
      attributes: [
        "id",
        "firstName",
        "lastName",
        "phone",
        "dateOfBirth",
        "bloodType",
        "createdAt",
      ],
    });

    res.json(patients);
  } catch (error) {
    console.error("Error fetching patients:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all doctors
exports.getAllDoctors = async (req, res) => {
  try {
    console.log("Fetching all doctors for receptionist...");
    const { Op } = require("sequelize");
    const doctors = await Doctor.findAll({
      where: {
        [Op.and]: [
          {
            [Op.or]: [
              { licenseNumber: { [Op.ne]: "DOC-DEMO" } },
              { licenseNumber: null },
            ],
          },
          { [Op.not]: { firstName: "Dr.", lastName: "Demo" } },
        ],
      },
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
    console.log("Doctors fetched successfully:", doctors.length, "doctors");
    res.json(doctors);
  } catch (error) {
    console.error("Error fetching doctors:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({ message: "Server error" });
  }
};

// Get today's appointments
exports.getTodayAppointments = async (req, res) => {
  try {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    const todayYmd = `${y}-${m}-${d}`;

    const appointments = await Appointment.findAll({
      where: { appointmentDate: todayYmd },
      include: [
        {
          model: Patient,
          attributes: ["id", "firstName", "lastName", "phone"],
        },
        {
          model: Doctor,
          attributes: ["id", "firstName", "lastName", "specialization"],
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
    const date =
      req.query.date ||
      (() => {
        const now = new Date();
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, "0");
        const d = String(now.getDate()).padStart(2, "0");
        return `${y}-${m}-${d}`;
      })();
    const appointments = await Appointment.findAll({
      where: { appointmentDate: date },
      include: [
        {
          model: Patient,
          attributes: ["id", "firstName", "lastName", "phone"],
        },
        {
          model: Doctor,
          attributes: ["id", "firstName", "lastName", "specialization"],
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
          attributes: ["id", "firstName", "lastName", "phone"],
        },
        {
          model: Doctor,
          attributes: ["id", "firstName", "lastName", "specialization"],
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

    const { Op } = require("sequelize");
    const appts = await Appointment.findAll({
      where: {
        doctorId: id,
        appointmentDate: date,
        status: { [Op.not]: "cancelled" },
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
