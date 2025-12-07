const { User, Patient, Doctor, Appointment } = require("../models");
const bcrypt = require("bcrypt");

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
      phone: phone || contact || "000-000-0000",
      dateOfBirth: dob,
      contact: contact || "000-000-0000",
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
    const apptPayload = {
      patientId,
      doctorId,
      appointmentDate,
      reason,
      status: "scheduled",
    };
    if (appointmentTime) {
      apptPayload.appointmentTime = `${String(appointmentTime).slice(0, 5)}:00`;
    }
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

    if (appointmentDate) appointment.appointmentDate = appointmentDate;
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
