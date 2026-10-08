const { Op } = require("sequelize");
const { Appointment } = require("../models");
const { INACTIVE_STATUSES } = require("./appointmentStatus");

// Returns an error message when the slot clashes with another active visit, otherwise null.
// A doctor sees one patient per slot, and a patient cannot be in two visits at the same time.
async function getSlotConflictError({ doctorId, patientId, date, time, excludeId }) {
  const sameSlot = {
    appointmentDate: date,
    appointmentTime: time,
    status: { [Op.notIn]: INACTIVE_STATUSES },
    ...(excludeId ? { id: { [Op.ne]: excludeId } } : {}),
  };
  if (await Appointment.findOne({ where: { ...sameSlot, doctorId } })) {
    return "Selected date/time is already booked for this doctor";
  }
  if (await Appointment.findOne({ where: { ...sameSlot, patientId } })) {
    return "The patient already has another visit at this time";
  }
  return null;
}

module.exports = { getSlotConflictError };
