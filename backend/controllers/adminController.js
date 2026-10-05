const {
  User,
  Doctor,
  Patient,
  Appointment,
  MedicalRecord,
} = require("../models");
const { sequelize } = require("../config/db");
const { Op } = require("sequelize");
const { getCredentialsError } = require("../utils/validation");

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

    const credentialsError = getCredentialsError(username, password);
    if (credentialsError) {
      return res.status(400).json({ message: credentialsError });
    }
    if (!["doctor", "receptionist", "admin"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const cleanUsername = username.trim();
    const existingUser = await User.findOne({ where: { username: cleanUsername } });
    if (existingUser) {
      return res.status(400).json({ message: "Username already exists" });
    }

    // Password is hashed by the User model's beforeCreate hook
    const user = await sequelize.transaction(async (transaction) => {
      const user = await User.create(
        { username: cleanUsername, password: password.trim(), role },
        { transaction },
      );

      if (role === "doctor" && firstName && lastName && specialization) {
        await Doctor.create(
          {
            firstName: String(firstName).trim(),
            lastName: String(lastName).trim(),
            specialization: String(specialization).trim(),
            phone: phone || "000-000-0000",
            fee: typeof fee === "number" ? fee : fee ? parseFloat(fee) : 0,
            userId: user.id,
          },
          { transaction },
        );
      }

      return user;
    });

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

    const cleanUsername = typeof username === "string" ? username.trim() : "";
    if (cleanUsername && cleanUsername !== user.username) {
      const taken = await User.findOne({ where: { username: cleanUsername } });
      if (taken) {
        return res.status(400).json({ message: "Username already exists" });
      }
      user.username = cleanUsername;
    }
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
    if (user.id === req.user.id) {
      return res
        .status(400)
        .json({ message: "You cannot delete your own account" });
    }

    // Related rows are removed in one transaction so a failure cannot leave half a user behind
    await sequelize.transaction(async (transaction) => {
      if (user.role === "doctor") {
        const doctor = await Doctor.findOne({ where: { userId: user.id }, transaction });
        if (doctor) {
          await MedicalRecord.destroy({ where: { doctorId: doctor.id }, transaction });
          await Appointment.destroy({ where: { doctorId: doctor.id }, transaction });
          await doctor.destroy({ transaction });
        }
      } else if (user.role === "patient") {
        const patient = await Patient.findOne({ where: { userId: user.id }, transaction });
        if (patient) {
          await MedicalRecord.destroy({ where: { patientId: patient.id }, transaction });
          await Appointment.destroy({ where: { patientId: patient.id }, transaction });
          await patient.destroy({ transaction });
        }
      }

      await user.destroy({ transaction });
    });

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
    const doctors = await Doctor.findAll({
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
