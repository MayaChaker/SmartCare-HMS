const { Appointment } = require("../models");

const APPOINTMENT_STATUSES = Appointment.getAttributes().status.values;

// Returns an error message when the change is not allowed, otherwise null
const getStatusChangeError = (current, next) => {
  if (!APPOINTMENT_STATUSES.includes(next)) {
    return "Invalid status";
  }
  if (next === current) {
    return null;
  }
  if (current === "completed" || current === "cancelled") {
    return "This visit is already completed or cancelled";
  }
  if (next === "completed" && !(current === "checked-in" || current === "in-progress")) {
    return "A visit can only be completed after check-in";
  }
  return null;
};

module.exports = { APPOINTMENT_STATUSES, getStatusChangeError };
