import React from "react";
import "./DeleteButton.css";

const DeleteButton = ({
  openModal,
  appointment,
  onClick,
  disabled = false,
}) => {
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
      Delete
    </button>
  );
};

export default DeleteButton;

export const DeleteModal = ({ selectedAppointment, closeModal, onDelete }) => {
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
        Delete this completed appointment with{" "}
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
        <button className="btn btn-outline" onClick={closeModal}>
          Keep Appointment
        </button>
        <button
          className="btn btn-danger"
          onClick={() => onDelete(selectedAppointment.id)}
        >
          Delete Appointment
        </button>
      </div>
    </div>
  );
};
