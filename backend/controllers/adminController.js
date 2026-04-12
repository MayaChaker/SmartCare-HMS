const {
  User,
  Doctor,
  Patient,
  Appointment,
  MedicalRecord,
} = require("../models");
const { sequelize } = require("../config/db");
const bcrypt = require("bcryptjs");
const { Op } = require("sequelize");

const isNonEmptyString = (v) => typeof v === "string" && v.trim().length > 0;

// Get all users (doctors, receptionists, patients)
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ["id", "username", "role", "createdAt"],
    });

    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Create new user (doctor or receptionist)
exports.createUser = async (req, res) => {
  try {
    const {
      username,
      password,
      role,
      firstName,
      lastName,
      specialization,
      phone,
      email,
      fee,
    } = req.body;

    if (!isNonEmptyString(username) || !isNonEmptyString(password)) {
      return res
        .status(400)
        .json({ message: "Username and password are required" });
    }
    if (String(username).trim().length < 3) {
      return res
        .status(400)
        .json({ message: "Username must be at least 3 characters" });
    }
    if (String(password).trim().length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }
    if (!["doctor", "receptionist", "admin"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    // Check if username already exists
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(400).json({ message: "Username already exists" });
    }

    // Create user (password will be automatically hashed by the User model's beforeCreate hook)
    const user = await User.create({
      username: String(username).trim(),
      password: String(password).trim(), // Don't hash here - let the model handle it
      role,
    });

    // If doctor, create doctor profile
    if (role === "doctor" && firstName && lastName && specialization) {
      await Doctor.create({
        firstName: String(firstName).trim(),
        lastName: String(lastName).trim(),
        specialization: String(specialization).trim(),
        phone: phone || "000-000-0000",
        email: email || username,
        fee: typeof fee === "number" ? fee : fee ? parseFloat(fee) : 0,
        userId: user.id,
      });
    }

    res.status(201).json({
      message: "User created successfully",
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update user
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, password, role } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (role && !["doctor", "receptionist", "admin"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    // Update user fields
    if (username) user.username = username;
    if (password) user.password = password; // Let the model's beforeUpdate hook handle hashing
    if (role) user.role = role;

    await user.save();

    res.json({
      message: "User updated successfully",
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete user
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Handle cascading deletes based on user role
    if (user.role === "doctor") {
      // Delete related appointments and medical records first
      const doctor = await Doctor.findOne({ where: { userId: id } });
      if (doctor) {
        await MedicalRecord.destroy({ where: { doctorId: doctor.id } });
        await Appointment.destroy({ where: { doctorId: doctor.id } });
        await doctor.destroy();
      }
    } else if (user.role === "patient") {
      // Delete related appointments and medical records first
      const patient = await Patient.findOne({ where: { userId: id } });
      if (patient) {
        await MedicalRecord.destroy({ where: { patientId: patient.id } });
        await Appointment.destroy({ where: { patientId: patient.id } });
        await patient.destroy();
      }
    } else if (user.role === "receptionist") {
      // Delete receptionist record first (using raw query since no model exists)
      try {
        await sequelize.query("DELETE FROM receptionists WHERE userId = ?", {
          replacements: [id],
          type: sequelize.QueryTypes.DELETE,
        });
      } catch (err) {
        console.warn(
          "Receptionist table missing or delete failed; continuing with user delete",
          err?.message || err,
        );
      }
    }

    await user.destroy();

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get system analytics
exports.getAnalytics = async (req, res) => {
  try {
    // Get counts
    const totalUsers = await User.count();
    const totalPatients = await Patient.count();
    const totalDoctors = await Doctor.count();
    const totalAppointments = await Appointment.count();

    // Get today's appointments
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    const todayYmd = `${y}-${m}-${d}`;

    const todayAppointments = await Appointment.count({
      where: { appointmentDate: todayYmd },
    });

    // Get appointments by status
    const appointmentsByStatus = await Appointment.findAll({
      attributes: [
        "status",
        [
          require("sequelize").fn("COUNT", require("sequelize").col("id")),
          "count",
        ],
      ],
      group: ["status"],
    });

    // Get recent registrations (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentRegistrations = await User.count({
      where: {
        createdAt: {
          [Op.gte]: thirtyDaysAgo,
        },
      },
    });

    res.json({
      totalUsers,
      totalPatients,
      totalDoctors,
      totalAppointments,
      todayAppointments,
      recentRegistrations,
      appointmentsByStatus: appointmentsByStatus.reduce((acc, item) => {
        acc[item.status] = parseInt(item.dataValues.count);
        return acc;
      }, {}),
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all doctors with details
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
      include: [{ model: User, attributes: ["username", "createdAt"] }],
    });

    res.json(doctors);
  } catch (error) {
    console.error("Error fetching doctors:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all patients with details
exports.getAllPatients = async (req, res) => {
  try {
    const patients = await Patient.findAll({
      include: [{ model: User, attributes: ["username", "createdAt"] }],
    });

    res.json(patients);
  } catch (error) {
    console.error("Error fetching patients:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all appointments with details
exports.getAllAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.findAll({
      include: [
        { model: Patient, attributes: ["firstName", "lastName", "email"] },
        {
          model: Doctor,
          attributes: ["firstName", "lastName", "specialization"],
        },
      ],
      order: [["appointmentDate", "DESC"]],
    });

    res.json(appointments);
  } catch (error) {
    console.error("Error fetching appointments:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Bulk: mark all doctors available (optionally set a default workingHours)
exports.makeAllDoctorsAvailable = async (req, res) => {
  try {
    const { workingHours } = req.body || {};
    const updateValues = { availability: true };
    if (typeof workingHours === "string" && workingHours.trim().length > 0) {
      updateValues.workingHours = workingHours.trim();
    }

    const [updatedCount] = await Doctor.update(updateValues, { where: {} });

    res.json({
      message: "All doctors marked available",
      updatedCount,
    });
  } catch (error) {
    console.error("Error updating doctors availability:", error);
    res.status(500).json({ message: "Server error" });
  }
};
