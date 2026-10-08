const { Appointment } = require("../models");

const APPOINTMENT_STATUSES = Appointment.getAttributes().status.values;

// Who may move a visit from one status to the next. A visit only moves forward:
// reception checks the patient in, the doctor starts and completes the visit.
// Completed and cancelled visits are final.
const ALLOWED_CHANGES = {
  scheduled: { "checked-in": ["receptionist"], cancelled: ["receptionist", "patient"] },
  "checked-in": { "in-progress": ["doctor"], cancelled: ["receptionist"] },
  "in-progress": { completed: ["doctor"] },
};

// Returns an error message when `role` may not change a visit from `current` to `next`, otherwise null
const getStatusChangeError = (current, next, role) => {
  if (!APPOINTMENT_STATUSES.includes(next)) {
    return "Invalid status";
  }
  if (next === current) {
    return null;
  }
  if (current === "completed" || current === "cancelled") {
    return "This visit is already completed or cancelled";
  }
  const allowedRoles = ALLOWED_CHANGES[current]?.[next];
  if (!allowedRoles) {
    if (next === "completed") return "A visit can only be completed after it has started";
    return `A visit cannot go from ${current} to ${next}`;
  }
  if (!allowedRoles.includes(role)) {
    return `Your role cannot set a visit to ${next}`;
  }
  return null;
};

module.exports = { APPOINTMENT_STATUSES, ALLOWED_CHANGES, getStatusChangeError };
