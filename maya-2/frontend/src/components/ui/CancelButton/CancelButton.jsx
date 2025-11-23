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

export const CancelModal = ({ selectedAppointment, closeModal, onCancel }) => {
  if (!selectedAppointment) return null;
  return (
    <div>
      <p>
        Are you sure you want to cancel your appointment with {selectedAppointment.doctor || selectedAppointment.doctorName} on {selectedAppointment.appointmentDate ? new Date(selectedAppointment.appointmentDate).toLocaleDateString() : "TBD"} {selectedAppointment.appointmentTime ? `at ${String(selectedAppointment.appointmentTime).slice(0, 5)}` : ""}?
      </p>
      <div className="modal-actions">
        <button className="btn btn-outline" onClick={closeModal}>Keep Appointment</button>
        <button className="btn btn-danger" onClick={() => onCancel(selectedAppointment.id)}>Cancel Appointment</button>
      </div>
    </div>
  );
};
