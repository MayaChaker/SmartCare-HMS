const { Patient, Appointment, MedicalRecord, Doctor } = require("../models");
const { Op } = require("sequelize");

const { isNonEmptyString } = require("../utils/validation");
const {
  isIsoDate,
  parseId,
  normalizeTimeToSql,
  isSlotAllowedByWorkingHours,
} = require("../utils/schedule");
const { isSlotInPast } = require("../utils/clinicTime");
const { getSlotConflictError } = require("../utils/bookingConflicts");
const { INACTIVE_STATUSES } = require("../utils/appointmentStatus");

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
    if (isSlotInPast(cleanDate, cleanTime)) {
      return res.status(400).json({ message: "Please choose a date and time in the future" });
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
    console.error("Error scheduling appointment:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update appointment
exports.updateAppointment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { appointmentDate, appointmentTime } = req.body;

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

    if ((appointmentDate || appointmentTime) && nextDate && nextTime) {
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

      const conflictError = await getSlotConflictError({
        doctorId: appointment.doctorId,
        patientId: appointment.patientId,
        date: nextDate,
        time: nextTime,
        excludeId: appointment.id,
      });
      if (conflictError) {
        return res.status(409).json({ message: conflictError });
      }
    }

    if (appointmentDate) appointment.appointmentDate = cleanDate;
    if (appointmentTime !== undefined) appointment.appointmentTime = cleanTime;

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

    // Visits are never deleted: they are part of the medical history, so they are only cancelled
    if (appointment.status !== "scheduled") {
      return res
        .status(400)
        .json({ message: "Only scheduled appointments can be cancelled" });
    }
    appointment.status = "cancelled";
    await appointment.save();
    return res.json({
      message: "Appointment cancelled successfully",
      appointment,
    });
  } catch (error) {
    console.error("Error cancelling appointment:", error);
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


    const appointments = await Appointment.findAll({
      where: {
        doctorId: parseInt(doctorId),
        status: { [Op.notIn]: INACTIVE_STATUSES },
      },
      attributes: ["appointmentDate", "status"],
      order: [["appointmentDate", "ASC"]],
    });

    // DATEONLY values are already "YYYY-MM-DD" strings; converting to Date could shift the day
    const bookedDatesSet = new Set(appointments.map((a) => a.appointmentDate));

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


    const appointments = await Appointment.findAll({
      where: {
        doctorId: parseInt(doctorId),
        appointmentDate: date,
        status: { [Op.notIn]: INACTIVE_STATUSES },
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
        "fee",
      ],
    });

    res.json(doctors);
  } catch (error) {
    console.error("Error fetching doctors:", error);
    res.status(500).json({ message: "Server error" });
  }
};
