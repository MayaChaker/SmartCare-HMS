const { User, Patient, Doctor, Appointment } = require("../models");
const { sequelize } = require("../config/db");
const { isValidEmail, getCredentialsError } = require("../utils/validation");
const { getStatusChangeError } = require("../utils/appointmentStatus");
const {
  isIsoDate,
  parseId,
  normalizeTimeToSql,
  isSlotAllowedByWorkingHours,
} = require("../utils/schedule");

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

    const credentialsError = getCredentialsError(username, password);
    if (credentialsError) {
      return res.status(400).json({ message: credentialsError });
    }
    if (email && !isValidEmail(email)) {
      return res.status(400).json({ message: "Invalid email address" });
    }
    if (dob && !isIsoDate(dob)) {
      return res.status(400).json({ message: "dob must be YYYY-MM-DD" });
    }

    const cleanUsername = username.trim();
    const existingUser = await User.findOne({ where: { username: cleanUsername } });
    if (existingUser) {
      return res.status(400).json({ message: "Username already exists" });
    }

    // User and profile are created together so a failure never leaves an orphan login
    const patient = await sequelize.transaction(async (transaction) => {
      const user = await User.create(
        { username: cleanUsername, password: password.trim(), role: "patient" },
        { transaction },
      );

      return Patient.create(
        {
          firstName: firstName || "Patient",
          lastName: lastName || "User",
          email: email || cleanUsername,
          phone: phone || contact || "00-000-000",
          dateOfBirth: dob || null,
          contact: contact || "00-000-000",
          medicalHistory: medicalHistory || "",
          bloodType: bloodType || null,
          userId: user.id,
        },
        { transaction },
      );
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
    const { appointmentDate, appointmentTime, status } = req.body;

    const appointment = await Appointment.findByPk(id);
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

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
        const { Op } = require("sequelize");
        const conflict = await Appointment.findOne({
          where: {
            id: { [Op.ne]: appointment.id },
            doctorId: appointment.doctorId,
            appointmentDate: cleanDate,
            appointmentTime: cleanTime,
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
      appointment.appointmentTime = cleanTime;
    }
    if (status) {
      const next = String(status).toLowerCase();
      const statusError = getStatusChangeError(appointment.status, next);
      if (statusError) {
        return res.status(400).json({ message: statusError });
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

    if (appointment.status !== "scheduled") {
      return res
        .status(400)
        .json({ message: "Only scheduled visits can be checked in" });
    }

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
