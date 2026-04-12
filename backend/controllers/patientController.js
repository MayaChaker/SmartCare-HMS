const { Patient, Appointment, MedicalRecord, Doctor } = require("../models");

const isNonEmptyString = (v) => typeof v === "string" && v.trim().length > 0;
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

// Get patient profile
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const patient = await Patient.findOne({ where: { userId } });
    if (!patient) {
      return res.status(404).json({ message: "Patient profile not found" });
    }

    // Return profile in the format expected by frontend
    res.json({
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
  } catch (error) {
    console.error("Error fetching patient profile:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update patient profile
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      name,
      firstName,
      lastName,
      email,
      phone,
      dateOfBirth,
      gender,
      address,
      emergencyContact,
      bloodType,
      allergies,
      insurance,
      medicalHistory,
      permanentMedicine,
    } = req.body;

    const patient = await Patient.findOne({ where: { userId } });
    if (!patient) {
      return res.status(404).json({ message: "Patient profile not found" });
    }

    // Handle name field - split into firstName and lastName if provided
    if (name && !firstName && !lastName) {
      const nameParts = name.trim().split(" ");
      patient.firstName = nameParts[0] || patient.firstName;
      patient.lastName = nameParts.slice(1).join(" ") || patient.lastName;
    }

    // Update patient fields
    if (firstName) patient.firstName = firstName;
    if (lastName) patient.lastName = lastName;
    if (email) patient.email = email;
    if (phone) patient.phone = phone;
    if (dateOfBirth) {
      patient.dateOfBirth = dateOfBirth;
    }
    if (gender) patient.gender = gender;
    if (address) patient.address = address;
    if (emergencyContact) patient.emergencyContact = emergencyContact;
    if (bloodType) patient.bloodType = bloodType;
    if (allergies) patient.allergies = allergies;
    if (insurance) patient.insurance = insurance;
    if (medicalHistory) patient.medicalHistory = medicalHistory;
    if (permanentMedicine) patient.permanentMedicine = permanentMedicine;

    await patient.save();

    res.json({
      message: "Profile updated successfully",
      patient: {
        id: patient.id,
        name: patient.name,
        firstName: patient.firstName,
        lastName: patient.lastName,
        email: patient.email,
        phone: patient.phone,
        dateOfBirth: patient.dateOfBirth,
        gender: patient.gender,
        address: patient.address,
        emergencyContact: patient.emergencyContact,
        bloodType: patient.bloodType,
        allergies: patient.allergies,
        insurance: patient.insurance,
      },
    });
  } catch (error) {
    console.error("Error updating patient profile:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get patient appointments
exports.getAppointments = async (req, res) => {
  try {
    const userId = req.user.id;

    const patient = await Patient.findOne({ where: { userId } });
    if (!patient) {
      return res.status(404).json({ message: "Patient profile not found" });
    }

    const appointments = await Appointment.findAll({
      where: { patientId: patient.id },
    });

    // Get doctor information separately for each appointment
    const appointmentsWithDoctors = await Promise.all(
      appointments.map(async (appointment) => {
        const doctor = await Doctor.findByPk(appointment.doctorId);
        return {
          ...appointment.toJSON(),
          doctorName: doctor
            ? `${doctor.firstName} ${doctor.lastName}`
            : "Unknown Doctor",
          specialty: doctor ? doctor.specialization : "Unknown",
        };
      }),
    );

    res.json(appointmentsWithDoctors);
  } catch (error) {
    console.error("Error fetching appointments:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Schedule new appointment
exports.createAppointment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { doctorId, appointmentDate, appointmentTime, reason } = req.body;

    const cleanDoctorId = parseId(doctorId);
    const cleanDate = String(appointmentDate || "").trim();
    const cleanTime = normalizeTimeToSql(appointmentTime);
    const cleanReason = isNonEmptyString(reason) ? reason.trim() : "";

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

    const patient = await Patient.findOne({ where: { userId } });
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

    // Prevent double booking: pre-check for an existing active appointment with same doctor/date/time
    try {
      const { Op } = require("sequelize");
      if (cleanDoctorId && cleanDate && cleanTime) {
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
            message: "Selected date/time is already booked for this doctor",
          });
        }
      }
    } catch (err) {
      console.warn("Pre-check for slot conflict failed", err);
    }

    const appointment = await Appointment.create({
      patientId: patient.id,
      doctorId: cleanDoctorId,
      appointmentDate: cleanDate,
      appointmentTime: cleanTime,
      reason: cleanReason,
      status: "scheduled",
    });

    res.status(201).json({
      message: "Appointment scheduled successfully",
      appointment,
    });
  } catch (error) {
    if (error && String(error.name).includes("UniqueConstraintError")) {
      return res.status(409).json({
        message: "Selected date/time is already booked for this doctor",
      });
    }
    console.error("Error scheduling appointment:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update appointment
exports.updateAppointment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { appointmentDate, appointmentTime, status } = req.body;

    const patient = await Patient.findOne({ where: { userId } });
    if (!patient) {
      return res.status(404).json({ message: "Patient profile not found" });
    }

    const appointment = await Appointment.findOne({
      where: { id, patientId: patient.id },
    });

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    if (
      appointment.status === "cancelled" &&
      (appointmentDate || appointmentTime)
    ) {
      return res
        .status(400)
        .json({ message: "Cancelled appointments cannot be rescheduled" });
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

    if ((appointmentDate || appointmentTime) && nextDate && nextTime) {
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

      const { Op } = require("sequelize");
      const conflict = await Appointment.findOne({
        where: {
          id: { [Op.ne]: appointment.id },
          doctorId: appointment.doctorId,
          appointmentDate: nextDate,
          appointmentTime: nextTime,
          status: { [Op.not]: "cancelled" },
        },
      });
      if (conflict) {
        return res.status(409).json({
          message: "Selected date/time is already booked for this doctor",
        });
      }
    }

    if (appointmentDate) appointment.appointmentDate = cleanDate;
    if (appointmentTime !== undefined) appointment.appointmentTime = cleanTime;
    if (status) appointment.status = status;

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

// Get medical records
exports.getMedicalRecords = async (req, res) => {
  try {
    const userId = req.user.id;

    const patient = await Patient.findOne({ where: { userId } });
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
    const userId = req.user.id;
    const { id } = req.params;
    const hard = String(req.query.hard || "").toLowerCase() === "true";

    const patient = await Patient.findOne({ where: { userId } });
    if (!patient) {
      return res.status(404).json({ message: "Patient profile not found" });
    }

    const appointment = await Appointment.findOne({
      where: { id, patientId: patient.id },
    });

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    if (hard) {
      await appointment.destroy();
      return res.json({ message: "Appointment deleted successfully" });
    } else {
      appointment.status = "cancelled";
      await appointment.save();
      return res.json({
        message: "Appointment cancelled successfully",
        appointment,
      });
    }
  } catch (error) {
    console.error("Error cancelling appointment:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get available appointment slots
exports.getAvailableSlots = async (req, res) => {
  try {
    // Mock available slots for now - in real app, this would check doctor availability
    const mockSlots = [
      {
        id: 1,
        doctor: "Dr. Sarah Wilson",
        specialty: "Cardiology",
        date: "2024-02-15",
        time: "09:00 AM",
      },
      {
        id: 2,
        doctor: "Dr. Michael Chen",
        specialty: "General Practice",
        date: "2024-02-16",
        time: "10:30 AM",
      },
      {
        id: 3,
        doctor: "Dr. Emily Rodriguez",
        specialty: "Dermatology",
        date: "2024-02-17",
        time: "02:00 PM",
      },
    ];

    res.json(mockSlots);
  } catch (error) {
    console.error("Error fetching available slots:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get booked dates for a specific doctor (active appointments only)
exports.getDoctorBookedDates = async (req, res) => {
  try {
    const { doctorId } = req.params;
    if (!doctorId) {
      return res.status(400).json({ message: "doctorId is required" });
    }

    const { Op } = require("sequelize");

    const appointments = await Appointment.findAll({
      where: {
        doctorId: parseInt(doctorId),
        status: { [Op.not]: "cancelled" },
      },
      attributes: ["appointmentDate", "status"],
      order: [["appointmentDate", "ASC"]],
    });

    const bookedDatesSet = new Set(
      appointments.map((a) => {
        const d = new Date(a.appointmentDate);
        // Normalize to YYYY-MM-DD in UTC
        return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
          .toISOString()
          .split("T")[0];
      }),
    );

    res.json({
      doctorId: parseInt(doctorId),
      bookedDates: Array.from(bookedDatesSet),
    });
  } catch (error) {
    console.error("Error fetching doctor's booked dates:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get booked times for a specific doctor on a given date (active appointments only)
exports.getDoctorBookedTimes = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { date } = req.query;
    if (!doctorId || !date) {
      return res
        .status(400)
        .json({ message: "doctorId and date are required" });
    }

    const { Op } = require("sequelize");

    const appointments = await Appointment.findAll({
      where: {
        doctorId: parseInt(doctorId),
        appointmentDate: date,
        status: { [Op.not]: "cancelled" },
      },
      attributes: ["appointmentTime"],
      order: [["appointmentTime", "ASC"]],
    });

    // Return times in HH:mm format for frontend simplicity
    const bookedTimes = appointments
      .map((a) => a.appointmentTime)
      .filter(Boolean)
      .map((t) => {
        // t may be a string 'HH:MM:SS'
        const parts = String(t).split(":");
        return `${parts[0].padStart(2, "0")}:${parts[1].padStart(2, "0")}`;
      });

    res.json({ doctorId: parseInt(doctorId), date, bookedTimes });
  } catch (error) {
    console.error("Error fetching doctor's booked times:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all doctors (for booking)
exports.getAllDoctors = async (req, res) => {
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
