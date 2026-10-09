const { User, Doctor, Patient, Appointment, MedicalRecord, AuditLog } = require("../models");
const { sequelize } = require("../config/db");
const { Op } = require("sequelize");
const { parseId } = require("../utils/schedule");
const { clinicToday } = require("../utils/clinicTime");
const { addDays } = require("../utils/availability");
const { parseWorkingHoursText } = require("../utils/schedule");
const { createTempPassword } = require("../utils/tempPassword");
const { record, doctorName } = require("../utils/audit");

const STAFF_ROLES = ["doctor", "receptionist", "admin"];
const ROLE_NAMES = { doctor: "Doctor", receptionist: "Reception", admin: "Administration", patient: "Patient" };
// Doctor fields as people call them, for the activity log
const FIELD_NAMES = {
  firstName: "first name",
  lastName: "last name",
  specialization: "department",
  qualification: "qualification",
  experience: "experience",
  fee: "fee",
  phone: "phone",
  licenseNumber: "licence number",
  workingHours: "hours",
  availability: "bookings",
};
const SLOT_MINUTES = Number(process.env.SLOT_MINUTES) || 20;

const clean = (v) => (typeof v === "string" ? v.trim() : "");

// ---------- Staff accounts ----------

// Every account with the name people know it by. Patients create their own accounts and are listed for completeness.
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ["id", "username", "role", "createdAt", "lastLoginAt", "mustChangePassword"],
      include: [
        { model: Doctor, attributes: ["firstName", "lastName", "specialization"] },
        { model: Patient, attributes: ["firstName", "lastName"] },
      ],
      order: [["role", "ASC"], ["username", "ASC"]],
    });

    res.json(
      users.map((u) => ({
        id: u.id,
        username: u.username,
        role: u.role,
        name: u.Doctor ? doctorName(u.Doctor) : u.Patient ? `${u.Patient.firstName} ${u.Patient.lastName}` : null,
        detail: u.Doctor?.specialization || null,
        createdAt: u.createdAt,
        lastLoginAt: u.lastLoginAt,
        mustChangePassword: u.mustChangePassword,
      })),
    );
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Doctor profile fields the administration manages, with their checks
function doctorFields(body) {
  const fields = {};
  for (const key of ["firstName", "lastName", "specialization", "qualification", "phone", "licenseNumber", "workingHours"]) {
    if (body[key] !== undefined) fields[key] = clean(body[key]) || null;
  }
  if (body.fee !== undefined) {
    const fee = Number(body.fee);
    if (!Number.isFinite(fee) || fee < 0) return { error: "The fee must be a number of 0 or more" };
    fields.fee = fee;
  }
  if (body.experience !== undefined && body.experience !== "") {
    const years = Number(body.experience);
    if (!Number.isInteger(years) || years < 0 || years > 70) return { error: "Experience must be a whole number of years" };
    fields.experience = years;
  }
  if (body.availability !== undefined) fields.availability = Boolean(body.availability);
  for (const key of ["firstName", "lastName", "specialization"]) {
    if (key in fields && !fields[key]) return { error: "First name, last name and department are required" };
  }
  return { fields };
}

// A staff account with a temporary password, shown once. The person must choose their own at first sign-in.
exports.createUser = async (req, res) => {
  try {
    const { role } = req.body;
    const username = clean(req.body.username);
    if (!STAFF_ROLES.includes(role)) {
      return res.status(400).json({ message: "Choose a role: doctor, reception or administration" });
    }
    if (username.length < 3) {
      return res.status(400).json({ message: "The username needs at least 3 characters" });
    }
    if (await User.findOne({ where: { username } })) {
      return res.status(400).json({ message: "Username already exists" });
    }

    let profile = null;
    if (role === "doctor") {
      const { fields, error } = doctorFields(req.body);
      if (error) return res.status(400).json({ message: error });
      if (!fields.firstName || !fields.lastName || !fields.specialization) {
        return res.status(400).json({ message: "First name, last name and department are required" });
      }
      profile = fields;
    }

    const tempPassword = createTempPassword();
    const { user, doctor } = await sequelize.transaction(async (transaction) => {
      const user = await User.create({ username, password: tempPassword, role, mustChangePassword: true }, { transaction });
      const doctor = profile ? await Doctor.create({ ...profile, userId: user.id, availability: profile.availability ?? true }, { transaction }) : null;
      return { user, doctor };
    });

    await record(req.user, "account.created", { type: "user", id: user.id, name: doctor ? doctorName(doctor) : username }, ROLE_NAMES[role]);
    res.status(201).json({
      message: "Account created",
      user: { id: user.id, username: user.username, role: user.role },
      doctor: doctor ? { id: doctor.id } : null,
      tempPassword,
    });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// A new temporary password, for someone who forgot theirs
exports.resetPassword = async (req, res) => {
  try {
    const user = await User.findByPk(parseId(req.params.id));
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.id === req.user.id) {
      return res.status(400).json({ message: "Change your own password from your account instead" });
    }
    const tempPassword = createTempPassword();
    user.password = tempPassword;
    user.mustChangePassword = true;
    await user.save();
    await record(req.user, "account.password_reset", { type: "user", id: user.id, name: user.username });
    res.json({ message: "Password reset", tempPassword });
  } catch (error) {
    console.error("Error resetting password:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Rename an account or change its role
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, role } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (role && ![...STAFF_ROLES, "patient"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const cleanUsername = clean(username);
    if (cleanUsername && cleanUsername !== user.username) {
      if (await User.findOne({ where: { username: cleanUsername } })) {
        return res.status(400).json({ message: "Username already exists" });
      }
      user.username = cleanUsername;
    }
    if (role) user.role = role;
    await user.save();
    await record(req.user, "account.updated", { type: "user", id: user.id, name: user.username });

    res.json({ message: "User updated successfully", user: { id: user.id, username: user.username, role: user.role } });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete an account and everything linked to it
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (user.id === req.user.id) {
      return res.status(400).json({ message: "You cannot delete your own account" });
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

    await record(req.user, "account.deleted", { type: "user", id: user.id, name: user.username }, ROLE_NAMES[user.role]);
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ---------- Doctors ----------

exports.getAllDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.findAll({
      include: [{ model: User, attributes: ["username", "lastLoginAt"] }],
      order: [["lastName", "ASC"]],
    });
    res.json(doctors);
  } catch (error) {
    console.error("Error fetching doctors:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Details patients see when they book, the fee, and the hours they can book
exports.updateDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.findByPk(parseId(req.params.id));
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });
    const { fields, error } = doctorFields(req.body);
    if (error) return res.status(400).json({ message: error });
    if (fields.workingHours !== undefined) {
      const { days } = parseWorkingHoursText(fields.workingHours || "");
      if (fields.workingHours && days.length === 0) {
        return res.status(400).json({ message: "Working hours need at least one day, for example \"Mon - Fri 09:00 AM - 05:00 PM\"" });
      }
    }

    const changed = Object.keys(fields).filter((key) => String(doctor[key] ?? "") !== String(fields[key] ?? ""));
    Object.assign(doctor, fields);
    await doctor.save();
    if (changed.length) {
      const what = changed.includes("availability") && changed.length === 1 ? (doctor.availability ? "Bookings reopened" : "Bookings paused") : `Changed ${changed.map((key) => FIELD_NAMES[key] || key).join(", ")}`;
      await record(req.user, "doctor.updated", { type: "doctor", id: doctor.id, name: doctorName(doctor) }, what);
    }
    res.json({ message: "Doctor updated", doctor });
  } catch (error) {
    console.error("Error updating doctor:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// The portrait patients see; stored in the database and served by GET /api/doctors/:id/photo
exports.uploadDoctorPhoto = async (req, res) => {
  try {
    const doctor = await Doctor.findByPk(parseId(req.params.id));
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });
    doctor.photoData = req.photo.data;
    doctor.photoType = req.photo.type;
    // The version in the address makes browsers fetch the new photo instead of a cached one
    doctor.photoUrl = `/api/doctors/${doctor.id}/photo?v=${Date.now()}`;
    await doctor.save();
    await record(req.user, "doctor.photo_changed", { type: "doctor", id: doctor.id, name: doctorName(doctor) });
    res.json({ message: "Photo saved", photoUrl: doctor.photoUrl });
  } catch (error) {
    console.error("Error saving doctor photo:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Public: the portrait itself
exports.getDoctorPhoto = async (req, res) => {
  try {
    const doctor = await Doctor.scope("withPhoto").findByPk(parseId(req.params.id), { attributes: ["photoData", "photoType"] });
    if (!doctor?.photoData) return res.status(404).json({ message: "No photo" });
    res.set({
      "Content-Type": doctor.photoType,
      "Cache-Control": "public, max-age=86400",
      "X-Content-Type-Options": "nosniff",
    });
    res.send(doctor.photoData);
  } catch (error) {
    console.error("Error sending doctor photo:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ---------- Activity ----------

// Newest first; ?role=receptionist|doctor|patient|admin, ?before=<id> for the next page
exports.getActivity = async (req, res) => {
  try {
    const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 100, 1), 200);
    const where = {};
    if (req.query.role) where.actorRole = String(req.query.role);
    const before = parseId(req.query.before);
    if (before) where.id = { [Op.lt]: before };
    const rows = await AuditLog.findAll({ where, order: [["id", "DESC"]], limit });
    res.json(rows);
  } catch (error) {
    console.error("Error fetching activity:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ---------- Analytics ----------

const minutesBetween = (a, b) => (new Date(b) - new Date(a)) / 60000;
const average = (values) => (values.length ? values.reduce((s, v) => s + v, 0) / values.length : null);
const round1 = (v) => (v === null ? null : Math.round(v * 10) / 10);

// Open 20-minute slots a doctor had on the given days, from their working hours
function openSlots(workingHours, dates) {
  const { days, start, end } = parseWorkingHoursText(workingHours || "");
  const toMin = (t) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
  const perDay = Math.max(0, Math.floor((toMin(end) - toMin(start)) / SLOT_MINUTES));
  const weekday = (ymd) => ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][new Date(`${ymd}T00:00:00Z`).getUTCDay()];
  return dates.filter((d) => days.length === 0 || days.includes(weekday(d))).length * perDay;
}

// Figures for one period of visits
function summarize(visits) {
  const held = visits.filter((v) => v.status !== "cancelled");
  const completed = held.filter((v) => v.status === "completed");
  const noShows = held.filter((v) => v.status === "no-show");
  const waits = held.filter((v) => v.checkedInAt && v.startedAt).map((v) => minutesBetween(v.checkedInAt, v.startedAt));
  const lengths = completed.filter((v) => v.startedAt && v.completedAt).map((v) => minutesBetween(v.startedAt, v.completedAt));
  const closed = completed.length + noShows.length;
  return {
    visits: held.length,
    noShowRate: closed ? round1((noShows.length / closed) * 100) : null,
    averageWait: round1(average(waits)),
    averageLength: round1(average(lengths)),
  };
}

// How the hospital is doing over the last ?days= days (7 or 30), with the period before for comparison
exports.getAnalytics = async (req, res) => {
  try {
    const days = Number(req.query.days) === 7 ? 7 : 30;
    const today = clinicToday();
    const from = addDays(today, -(days - 1));
    const prevFrom = addDays(from, -days);
    const prevTo = addDays(from, -1);
    const dates = Array.from({ length: days }, (_, i) => addDays(from, i));

    const [visits, doctors, newPatients, prevNewPatients, waitingToActivate] = await Promise.all([
      Appointment.findAll({
        where: { appointmentDate: { [Op.between]: [prevFrom, today] } },
        attributes: ["id", "doctorId", "appointmentDate", "status", "checkedInAt", "startedAt", "completedAt"],
      }),
      Doctor.findAll({ attributes: ["id", "firstName", "lastName", "specialization", "photoUrl", "workingHours", "availability"] }),
      Patient.count({ where: { createdAt: { [Op.gte]: new Date(`${from}T00:00:00`) } } }),
      Patient.count({ where: { createdAt: { [Op.between]: [new Date(`${prevFrom}T00:00:00`), new Date(`${from}T00:00:00`)] } } }),
      Patient.count({ where: { userId: null, activationExpiresAt: { [Op.gt]: new Date() } } }),
    ]);

    const current = visits.filter((v) => v.appointmentDate >= from);
    const previous = visits.filter((v) => v.appointmentDate <= prevTo);
    const doctorById = new Map(doctors.map((d) => [d.id, d]));

    const perDay = dates.map((date) => {
      const day = current.filter((v) => v.appointmentDate === date);
      return {
        date,
        visits: day.filter((v) => v.status !== "cancelled").length,
        noShows: day.filter((v) => v.status === "no-show").length,
      };
    });

    const departments = {};
    current
      .filter((v) => v.status !== "cancelled")
      .forEach((v) => {
        const name = doctorById.get(v.doctorId)?.specialization || "Other";
        departments[name] = (departments[name] || 0) + 1;
      });

    const doctorRows = doctors
      .map((d) => {
        const own = current.filter((v) => v.doctorId === d.id);
        const figures = summarize(own);
        const slots = openSlots(d.workingHours, dates);
        return {
          id: d.id,
          name: doctorName(d),
          specialization: d.specialization,
          photoUrl: d.photoUrl,
          availability: d.availability,
          ...figures,
          bookedShare: slots ? round1(Math.min(100, (figures.visits / slots) * 100)) : null,
        };
      })
      .filter((d) => d.visits > 0 || d.availability)
      .sort((a, b) => b.visits - a.visits);

    res.json({
      days,
      from,
      to: today,
      current: { ...summarize(current), newPatients },
      previous: { ...summarize(previous), newPatients: prevNewPatients },
      waitingToActivate,
      perDay,
      byDepartment: Object.entries(departments)
        .map(([name, count]) => ({ name, visits: count }))
        .sort((a, b) => b.visits - a.visits),
      doctors: doctorRows,
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ---------- Lists kept for other screens ----------

exports.getAllPatients = async (req, res) => {
  try {
    const patients = await Patient.findAll({ include: [{ model: User, attributes: ["username", "createdAt"] }] });
    res.json(patients);
  } catch (error) {
    console.error("Error fetching patients:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getAllAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.findAll({
      include: [
        { model: Patient, attributes: ["firstName", "lastName", "email"] },
        { model: Doctor, attributes: ["firstName", "lastName", "specialization"] },
      ],
      order: [["appointmentDate", "DESC"]],
    });
    res.json(appointments);
  } catch (error) {
    console.error("Error fetching appointments:", error);
    res.status(500).json({ message: "Server error" });
  }
};
