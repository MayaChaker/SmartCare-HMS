// Writes one line to the activity log. Logging must never break the action it describes,
// so failures are reported to the server log and swallowed.
const { AuditLog, Doctor, Patient } = require("../models");

// The name people recognise: a doctor's or patient's full name, otherwise the username
async function displayName(user) {
  if (!user) return "System";
  try {
    if (user.role === "doctor") {
      const doctor = await Doctor.findOne({ where: { userId: user.id }, attributes: ["firstName", "lastName"] });
      if (doctor) return `Dr. ${doctor.firstName} ${doctor.lastName}`;
    }
    if (user.role === "patient") {
      const patient = await Patient.findOne({ where: { userId: user.id }, attributes: ["firstName", "lastName"] });
      if (patient) return `${patient.firstName} ${patient.lastName}`;
    }
  } catch {
    // fall back to the username
  }
  return user.username;
}

const personName = (p) => (p ? [p.firstName, p.lastName].filter(Boolean).join(" ") : null);
const doctorName = (d) => (d ? `Dr. ${[d.firstName, d.lastName].filter(Boolean).join(" ")}` : null);

/**
 * @param {{ id: number, username: string, role: string } | null} actor  usually req.user
 * @param {string} action  a fixed key, for example "visit.checked_in"
 * @param {{ type?: string, id?: number, name?: string }} [target]
 * @param {string} [detail]  a short human-readable detail
 */
async function record(actor, action, target = {}, detail = null) {
  try {
    await AuditLog.create({
      actorUserId: actor?.id ?? null,
      actorName: await displayName(actor),
      actorRole: actor?.role || "system",
      action,
      targetType: target.type || null,
      targetId: target.id ?? null,
      targetName: target.name || null,
      detail: detail ? String(detail).slice(0, 500) : null,
    });
  } catch (error) {
    console.error("Could not write the activity log:", error.message);
  }
}

// An action on a visit: the patient is the target, the doctor and time are the detail
async function recordVisit(actor, action, appointment, extra = "") {
  try {
    const [patient, doctor] = await Promise.all([
      Patient.findByPk(appointment.patientId, { attributes: ["id", "firstName", "lastName"] }),
      Doctor.findByPk(appointment.doctorId, { attributes: ["firstName", "lastName"] }),
    ]);
    const when = `${appointment.appointmentDate} ${String(appointment.appointmentTime || "").slice(0, 5)}`.trim();
    const detail = [doctorName(doctor), when, extra].filter(Boolean).join(", ");
    await record(actor, action, { type: "patient", id: patient?.id, name: personName(patient) }, detail);
  } catch (error) {
    console.error("Could not write the activity log:", error.message);
  }
}

module.exports = { record, recordVisit, personName, doctorName };
