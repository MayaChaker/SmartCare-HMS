const { Appointment } = require("../models");

const APPOINTMENT_STATUSES = Appointment.getAttributes().status.values;
const FINAL_STATUSES = ["completed", "cancelled", "no-show"];
// Visits that no longer hold a slot for the doctor or the patient
const INACTIVE_STATUSES = ["cancelled", "no-show"];

// Who may move a visit from one status to the next. A visit only moves forward:
// reception checks the patient in, the doctor starts and completes the visit.
// Completed, cancelled and no-show visits are final.
const ALLOWED_CHANGES = {
  scheduled: {
    "checked-in": ["receptionist"],
    cancelled: ["receptionist", "patient"],
    "no-show": ["receptionist"],
  },
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
  if (FINAL_STATUSES.includes(current)) {
    return "This visit is already closed";
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

module.exports = { APPOINTMENT_STATUSES, FINAL_STATUSES, INACTIVE_STATUSES, ALLOWED_CHANGES, getStatusChangeError };
