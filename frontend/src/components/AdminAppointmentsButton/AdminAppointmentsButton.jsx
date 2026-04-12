import React from "react";
import { GoChecklist } from "react-icons/go";
import "./AdminAppointmentsButton.css";

import { useAdmin } from "../../context/AdminContext";
import { AdminNavItem } from "../../pages/Admin/AdminPanel";

const AdminAppointmentsButton = ({ renderContent = false }) => {
  // Get admin state from context
  const { activeSection, setActiveSection, appointments } = useAdmin();

  // This section is active when sidebar = "appointments"
  const isActive = activeSection === "appointments";
  const formatStatusLabel = (raw) => {
    const s = String(raw || "").trim();
    if (!s) return "";
    return s
      .split("-")
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  };

  /* MAIN CONTENT (table view) */
  if (renderContent && isActive) {
    return (
      <div className="section-content admin-appointments">
        {/* Section header */}
        <div className="admin-appointments-header">
            <h2>Appointments</h2>
        </div>

        {/* Appointments table */}
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Doctor</th>
                <th>Date and time</th>
                <th>Status</th>
                <th>Visit reason</th>
              </tr>
            </thead>

            <tbody>
              {appointments.map((appointment) => (
                <tr key={appointment.id}>
                  {/* Patient name */}
                  <td>
                    {appointment.Patient
                      ? `${appointment.Patient.firstName} ${appointment.Patient.lastName}`
                      : "N/A"}
                  </td>

                  {/* Doctor name */}
                  <td>
                    {appointment.Doctor
                      ? `Dr. ${appointment.Doctor.firstName} ${appointment.Doctor.lastName}`
                      : "N/A"}
                  </td>

                  {/* Appointment date + time */}
                  <td>
                    <div>
                      {/* Date */}
                      <div>
                        {new Date(
                          appointment.appointmentDate
                        ).toLocaleDateString()}
                      </div>

                      {/* Time */}
                      <small>
                        {new Date(
                          `${appointment.appointmentDate}T${appointment.appointmentTime}`
                        ).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </small>
                    </div>
                  </td>

                  {/* Status badge */}
                  <td>
                    <span
                      className={`status-badge ${appointment.status.toLowerCase()}`}
                    >
                      {formatStatusLabel(appointment.status)}
                    </span>
                  </td>

                  {/* Appointment reason */}
                  <td>{appointment.reason || "General check-up"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  /* SIDEBAR BUTTON ONLY */
  return (
    <AdminNavItem
      active={isActive}
      onClick={() => setActiveSection("appointments")}
      icon={<GoChecklist />}
      label="Appointments"
    />
  );
};

export default AdminAppointmentsButton;
