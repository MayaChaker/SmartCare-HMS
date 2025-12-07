import React from "react";
import { GoChecklist } from "react-icons/go";
import "./AdminAppointmentsButton.css";
import { useAdmin } from "../../context/AdminContext";

const AdminAppointmentsButton = () => {
  const { activeSection, setActiveSection } = useAdmin();
  const isActive = activeSection === "appointments";

  return (
    <button
      className={`admin-nav-item ${isActive ? "active" : ""}`}
      onClick={() => setActiveSection("appointments")}
    >
      <span className="admin-nav-icon">
        <GoChecklist />
      </span>
      <span className="admin-nav-label">Appointments</span>
    </button>
  );
};

export default AdminAppointmentsButton;
