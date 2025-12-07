import React from "react";
import "./RescduleButton.css";

const ReshcduleButton = ({
  openModal,
  appointment,
  onClick,
  disabled = false,
  style,
}) => {
  const handleClick = () => {
    if (openModal && appointment) {
      openModal("reschedule", appointment);
      return;
    }
    if (onClick) onClick();
  };

  return (
    <button
      className="reschedule-btn"
      type="button"
      onClick={handleClick}
      disabled={disabled}
      style={style}
    >
      Reschedule
    </button>
  );
};

export default ReshcduleButton;

export const ReshcduleModal = ({
  selectedAppointment,
  availableTimesForReschedule,
  availableDatesForReschedule = [],
  selectedDateForReschedule = "",
  setSelectedDateForReschedule,
  onReschedule,
}) => {
  if (!selectedAppointment) return null;

  const formatTimeWithMeridiem = (hhmm) => {
    const [hStr, mStr] = String(hhmm || "").split(":");
    const h = parseInt(hStr, 10);
    if (Number.isNaN(h)) return hhmm;
    const meridiem = h < 12 ? "AM" : "PM";
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${h12}:${mStr} ${meridiem}`;
  };
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const newDate = String(formData.get("newDate"));
        const tRaw = String(formData.get("newSlotId"));
        const newTime = tRaw ? `${tRaw.slice(0, 5)}:00` : "";
        onReschedule(selectedAppointment.id, {
          appointmentDate: newDate || selectedAppointment.appointmentDate,
          appointmentTime: newTime,
        });
      }}
    >
      <p>
        Current appointment: {selectedAppointment.doctor || selectedAppointment.doctorName} on {selectedAppointment.appointmentDate ? new Date(selectedAppointment.appointmentDate).toLocaleDateString() : "TBD"} {selectedAppointment.appointmentTime ? `at ${formatTimeWithMeridiem(String(selectedAppointment.appointmentTime).slice(0, 5))}` : ""}
      </p>
      <div className="form-group">
        <label>New Appointment Date</label>
        <select
          name="newDate"
          className="form-control"
          value={selectedDateForReschedule || selectedAppointment.appointmentDate || ""}
          onChange={(e) => setSelectedDateForReschedule && setSelectedDateForReschedule(e.target.value)}
          required
        >
          <option value="">Select a date</option>
          {(availableDatesForReschedule || []).map((d) => (
            <option key={d} value={d}>
              {new Date(d).toLocaleDateString()}
            </option>
          ))}
        </select>
      </div>
      <div className="form-group">
        <label>New Appointment Time</label>
        <select name="newSlotId" className="form-control" required>
          <option value="">Select a new time</option>
          {availableTimesForReschedule && availableTimesForReschedule.length > 0 ? (
            availableTimesForReschedule.map((t) => (
              <option key={t} value={t}>
                {formatTimeWithMeridiem(t)}
              </option>
            ))
          ) : (
            <option value="" disabled>
              No available times
            </option>
          )}
        </select>
      </div>
      <div className="modal-actions">
        <button type="submit" className="btn btn-primary">Reschedule</button>
      </div>
    </form>
  );
};
