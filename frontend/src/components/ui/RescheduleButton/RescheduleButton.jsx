import React from "react";
import "./RescheduleButton.css";
import { formatTimeWithMeridiem, toHHMM } from "../../../utils/schedule";

const RescheduleButton = ({
  openModal,
  appointment,
  onClick,
  disabled = false,
  style,
}) => {
  // Decides whether to open modal or call the fallback click handler
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
      Change time
    </button>
  );
};

export default RescheduleButton;

export const RescheduleModal = ({
  selectedAppointment,
  availableTimesForReschedule,
  availableDatesForReschedule = [],
  selectedDateForReschedule = "",
  setSelectedDateForReschedule,
  onReschedule,
}) => {
  if (!selectedAppointment) return null;
  const minDate =
    Array.isArray(availableDatesForReschedule) && availableDatesForReschedule.length
      ? availableDatesForReschedule[0]
      : "";
  const maxDate =
    Array.isArray(availableDatesForReschedule) && availableDatesForReschedule.length
      ? availableDatesForReschedule[availableDatesForReschedule.length - 1]
      : "";
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const newDate = String(formData.get("newDate"));
        const tRaw = String(formData.get("newSlotId"));
        const newTime = tRaw ? `${toHHMM(tRaw)}:00` : "";
        onReschedule(selectedAppointment.id, {
          appointmentDate: newDate || selectedAppointment.appointmentDate,
          appointmentTime: newTime,
        });
      }}
    >
      <p>
        Current visit:{" "}
        {selectedAppointment.doctor || selectedAppointment.doctorName} on{" "}
        {selectedAppointment.appointmentDate
          ? new Date(selectedAppointment.appointmentDate).toLocaleDateString()
          : "TBD"}{" "}
        {selectedAppointment.appointmentTime
          ? `at ${formatTimeWithMeridiem(
              toHHMM(selectedAppointment.appointmentTime)
            )}`
          : ""}
      </p>
      <div className="form-group">
        <label>New date</label>
        <input
          name="newDate"
          className="form-control"
          type="date"
          min={minDate || undefined}
          max={maxDate || undefined}
          value={selectedDateForReschedule || selectedAppointment.appointmentDate || ""}
          onChange={(e) =>
            setSelectedDateForReschedule &&
            setSelectedDateForReschedule(e.target.value)
          }
          required
          list="reschedule-allowed-dates"
        />
        {Array.isArray(availableDatesForReschedule) &&
        availableDatesForReschedule.length > 0 ? (
          <datalist id="reschedule-allowed-dates">
            {availableDatesForReschedule.map((d) => (
              <option key={d} value={d} />
            ))}
          </datalist>
        ) : null}
      </div>
      <div className="form-group">
        <label>New time</label>
        <select name="newSlotId" className="form-control" required>
          <option value="">Choose a time</option>
          {availableTimesForReschedule &&
          availableTimesForReschedule.length > 0 ? (
            availableTimesForReschedule.map((t) => (
              <option key={t} value={t}>
                {formatTimeWithMeridiem(t)}
              </option>
            ))
          ) : (
            <option value="" disabled>
              No times available
            </option>
          )}
        </select>
      </div>
      <div className="modal-actions">
        <button type="submit" className="btn btn-primary">
          Save changes
        </button>
      </div>
    </form>
  );
};
