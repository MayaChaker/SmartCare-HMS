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
import { usePatientDashboard } from "../../../context/PatientContext";

export const PatientBookAppointmentButton = ({
  doctorId,
  label = "Book a visit",
}) => {
  const { setSelectedDoctorId, openModal } = usePatientDashboard();

  //  updates context state
  const handleClick = React.useCallback(() => {
    if (typeof doctorId !== "undefined") {
      setSelectedDoctorId(doctorId);
    }
    openModal("book");
  }, [doctorId, setSelectedDoctorId, openModal]);

  return (
    <div className="doctor-actions">
      <button className="btn btn-primary" type="button" onClick={handleClick}>
        {label}
      </button>
    </div>
  );
};

export default BookAppointmentButton;
