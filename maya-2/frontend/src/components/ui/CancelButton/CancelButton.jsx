import React from "react";
import "./CancelButton.css";

const CancelButton = ({
  openModal,
  appointment,
  onClick,
  disabled = false,
}) => {
  const handleClick = () => {
    if (openModal && appointment) {
      openModal("cancel", appointment);
      return;
    }
    if (onClick) onClick();
  };

  return (
    <button
      className="cancel-btn"
      type="button"
      onClick={handleClick}
      disabled={disabled}
    >
      Cancel
    </button>
  );
};

export default CancelButton;

export const CancelModal = ({ selectedAppointment, onCancel }) => {
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
    <div>
      <p>
        Are you sure you want to cancel your appointment with{" "}
        {selectedAppointment.doctor || selectedAppointment.doctorName} on{" "}
        {selectedAppointment.appointmentDate
          ? new Date(selectedAppointment.appointmentDate).toLocaleDateString()
          : "TBD"}{" "}
        {selectedAppointment.appointmentTime
          ? `at ${formatTimeWithMeridiem(
              String(selectedAppointment.appointmentTime).slice(0, 5)
            )}`
          : ""}
        ?
      </p>
      <div className="modal-actions">
        <button
          className="btn btn-cancel"
          onClick={() => onCancel(selectedAppointment.id)}
        >
          Cancel Appointment
        </button>
      </div>
    </div>
  );
};
