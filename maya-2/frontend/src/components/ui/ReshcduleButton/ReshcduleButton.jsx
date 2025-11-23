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
  closeModal,
  onReschedule,
}) => {
  if (!selectedAppointment) return null;
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        onReschedule(
          selectedAppointment.id,
          String(formData.get("newSlotId"))
        );
      }}
    >
      <p>
        Current appointment: {selectedAppointment.doctor || selectedAppointment.doctorName} on {selectedAppointment.appointmentDate ? new Date(selectedAppointment.appointmentDate).toLocaleDateString() : "TBD"} at {selectedAppointment.appointmentTime ? String(selectedAppointment.appointmentTime).slice(0, 5) : ""}
      </p>
      <div className="form-group">
        <label>New Appointment Time</label>
        <select name="newSlotId" className="form-control" required>
          <option value="">Select a new time</option>
          {availableTimesForReschedule && availableTimesForReschedule.length > 0 ? (
            availableTimesForReschedule.map((t) => (
              <option key={t} value={t}>
                {t}
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
        <button type="button" className="btn btn-outline" onClick={closeModal}>Cancel</button>
        <button type="submit" className="btn btn-primary">Reschedule</button>
      </div>
    </form>
  );
};
