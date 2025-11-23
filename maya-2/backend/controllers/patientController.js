const { Patient, Appointment, MedicalRecord, Doctor } = require("../models");

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
      dateOfBirth: patient.dateOfBirth || patient.dob || "",
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
      patient.dob = dateOfBirth; // Keep legacy field in sync
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
      })
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

    const patient = await Patient.findOne({ where: { userId } });
    if (!patient) {
      return res.status(404).json({ message: "Patient profile not found" });
    }

    // Prevent double booking: pre-check for an existing active appointment with same doctor/date/time
    try {
      const { Op } = require("sequelize");
      if (doctorId && appointmentDate && appointmentTime) {
        const existing = await Appointment.findOne({
          where: {
            doctorId,
            appointmentDate,
            appointmentTime,
            status: { [Op.not]: "cancelled" },
          },
        });
        if (existing) {
          return res.status(409).json({ message: "Selected date/time is already booked for this doctor" });
        }
      }
    } catch (err) {
      console.warn("Pre-check for slot conflict failed", err);
    }

    const appointment = await Appointment.create({
      patientId: patient.id,
      doctorId,
      appointmentDate,
      appointmentTime: appointmentTime || null,
      reason,
      status: "scheduled",
    });

    res.status(201).json({
      message: "Appointment scheduled successfully",
      appointment,
    });
  } catch (error) {
    if (error && String(error.name).includes("UniqueConstraintError")) {
      return res.status(409).json({ message: "Selected date/time is already booked for this doctor" });
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

    if (appointmentDate) appointment.appointmentDate = appointmentDate;
    if (appointmentTime !== undefined) appointment.appointmentTime = appointmentTime || null;
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
    const hard = String(req.query.hard || '').toLowerCase() === 'true';

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
      return res.json({ message: "Appointment cancelled successfully", appointment });
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
      })
    );

    res.json({ doctorId: parseInt(doctorId), bookedDates: Array.from(bookedDatesSet) });
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
      return res.status(400).json({ message: "doctorId and date are required" });
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
      ],
    });

    res.json(doctors);
  } catch (error) {
    console.error("Error fetching doctors:", error);
    res.status(500).json({ message: "Server error" });
  }
};
