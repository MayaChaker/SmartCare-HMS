import React from "react";
import "./DeleteButton.css";
import { formatTimeWithMeridiem, toHHMM } from "../../../utils/schedule";

const DeleteButton = ({
  openModal,
  appointment,
  onClick,
  disabled = false,
}) => {
  // Decide whether to open modal or use direct handler
  const handleClick = () => {
    if (openModal && appointment) {
      openModal("delete", appointment);
      return;
    }
    if (onClick) onClick();
  };

  return (
    <button
      className="delete-btn"
      type="button"
      onClick={handleClick}
      disabled={disabled}
    >
      Remove
    </button>
  );
};

export default DeleteButton;

export const DeleteModal = ({ selectedAppointment, closeModal, onDelete }) => {
  if (!selectedAppointment) return null;
  return (
    <div>
      <p>
        Remove this visit with{" "}
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
        <button className="btn btn-outline" onClick={closeModal}>
          Keep
        </button>
        <button
          className="btn btn-danger"
          onClick={() => onDelete(selectedAppointment.id)}
        >
          Remove
        </button>
      </div>
    </div>
  );
};
