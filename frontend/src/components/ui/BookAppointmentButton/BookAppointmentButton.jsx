import React from "react";
import "./BookAppointmentButton.css";
const BookAppointmentButton = ({ onClick, label = "Book a visit" }) => {
  return (
    <div className="doctor-actions">
      <button className="btn btn-primary" type="button" onClick={onClick}>
        {label}
      </button>
    </div>
  );
};

export default BookAppointmentButton;
