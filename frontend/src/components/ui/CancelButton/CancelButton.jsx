import React from "react";
import "./CancelButton.css";
import { formatTimeWithMeridiem, toHHMM } from "../../../utils/schedule";

const CancelButton = ({
  openModal,
  appointment,
  onClick,
  disabled = false,
}) => {
  // Decides whether to open modal
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
      Cancel visit
    </button>
  );
};

export default CancelButton;

export const CancelModal = ({ selectedAppointment, onCancel }) => {
  if (!selectedAppointment) return null;
  return (
    <div>
      <p>
        Do you want to cancel your visit with{" "}
        {selectedAppointment.doctor || selectedAppointment.doctorName} on{" "}
        {selectedAppointment.appointmentDate
          ? new Date(selectedAppointment.appointmentDate).toLocaleDateString()
          : "a date to be confirmed"}{" "}
        {selectedAppointment.appointmentTime
          ? `at ${formatTimeWithMeridiem(
              toHHMM(selectedAppointment.appointmentTime)
            )}`
          : ""}
        ?
      </p>
      <div className="modal-actions">
        <button
          className="btn btn-cancel"
          onClick={() => onCancel(selectedAppointment.id)}
        >
          Cancel visit
        </button>
      </div>
    </div>
  );
};
