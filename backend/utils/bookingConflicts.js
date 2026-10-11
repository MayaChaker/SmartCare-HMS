const { Op } = require("sequelize");
const { sequelize } = require("../config/db");
const { Appointment, Doctor, Patient } = require("../models");
const { INACTIVE_STATUSES } = require("./appointmentStatus");

// Returns an error message when the slot clashes with another active visit, otherwise null.
// A doctor sees one patient per slot, and a patient cannot be in two visits at the same time.
async function getSlotConflictError({ doctorId, patientId, date, time, excludeId, transaction }) {
  const sameSlot = {
    appointmentDate: date,
    appointmentTime: time,
    status: { [Op.notIn]: INACTIVE_STATUSES },
    ...(excludeId ? { id: { [Op.ne]: excludeId } } : {}),
  };
  if (await Appointment.findOne({ where: { ...sameSlot, doctorId }, transaction })) {
    return "Selected date/time is already booked for this doctor";
  }
  if (await Appointment.findOne({ where: { ...sameSlot, patientId }, transaction })) {
    return "The patient already has another visit at this time";
  }
  return null;
}

// Books or moves a visit only if the slot is still free, as one step.
// The doctor's and the patient's rows stay locked until the visit is saved, so two requests for the same
// slot at the same moment run one after the other and the second one sees the first visit.
// `save(transaction)` writes the visit. Returns { error } or { appointment }.
async function saveIfSlotFree({ doctorId, patientId, date, time, excludeId }, save) {
  return sequelize.transaction(async (transaction) => {
    // Always doctor first, then patient, so two bookings can never wait on each other
    await Doctor.findByPk(doctorId, { attributes: ["id"], lock: transaction.LOCK.UPDATE, transaction });
    await Patient.findByPk(patientId, { attributes: ["id"], lock: transaction.LOCK.UPDATE, transaction });
    const error = await getSlotConflictError({ doctorId, patientId, date, time, excludeId, transaction });
    if (error) return { error };
    return { appointment: await save(transaction) };
  });
}

module.exports = { getSlotConflictError, saveIfSlotFree };
