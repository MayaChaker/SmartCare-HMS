// src/components/DoctorAppointment/DoctorAppointments.jsx
import React from "react";
import {
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiRefreshCcw,
  FiXCircle,
  FiFileText,
} from "react-icons/fi";
import { useDoctor } from "../../context/DoctorContext";

const DoctorAppointments = ({ openModal = () => {} }) => {
  const { appointments = [] } = useDoctor();

  const toDateStr = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${dd}`;
  };

  const selectedDate = toDateStr(new Date());

  const todaysAppointments = appointments.filter(
    (a) => String(a.appointmentDate) === String(selectedDate)
  );

  return (
    <div className="doctor-section">
      <div className="section-header">
        <div className="section-title">
          <h1 className="appointments-title">
            Appointment Schedule
            <span className="section-count appointments-count">
              {todaysAppointments.length} Appointments on{" "}
              {new Date(selectedDate).toLocaleDateString()}
            </span>
          </h1>
        </div>
      </div>

      <div className="doctor-table-container">
        <table className="doctor-table">
          <thead>
            <tr>
              <th>Patient</th>
              <th>Date & Time</th>
              <th>Details</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {todaysAppointments.length > 0 ? (
              todaysAppointments.map((appointment) => (
                <tr key={appointment.id}>
                  <td>
                    <div className="patient-info">
                      <div className="patient-details">
                        <div className="patient-name">
                          {appointment.Patient
                            ? `${appointment.Patient.firstName} ${appointment.Patient.lastName}`
                            : "N/A"}
                        </div>
                        <div className="patient-id">
                          {appointment.Patient
                            ? `ID: ${appointment.Patient.id}`
                            : "Unknown Patient"}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="appointment-datetime">
                      <div className="appointment-date">
                        <span className="date-icon">
                          <FiCalendar />
                        </span>
                        <span className="date-text">
                          {new Date(
                            appointment.appointmentDate
                          ).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="appointment-time">
                        <span className="time-icon">
                          <FiClock />
                        </span>
                        <span className="time-text">
                          {new Date(
                            `${appointment.appointmentDate}T${appointment.appointmentTime}`
                          ).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true,
                          })}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="appointment-details">
                      <div className="detail-item">
                        <span className="detail-label">Reason:</span>
                        <span className="detail-value">
                          {appointment.reason || "General consultation"}
                        </span>
                      </div>
                      {appointment.notes && (
                        <div className="detail-item">
                          <span className="detail-label">Notes:</span>
                          <span className="detail-value">
                            {appointment.notes}
                          </span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    <span
                      className={`status-badge ${appointment.status
                        .toLowerCase()
                        .replace(" ", "-")}`}
                    >
                      {appointment.status === "scheduled" && <FiClock />}
                      {appointment.status === "in-progress" && <FiRefreshCcw />}
                      {appointment.status === "completed" && <FiCheckCircle />}
                      {appointment.status === "cancelled" && <FiXCircle />}
                      <span className="status-text">{appointment.status}</span>
                    </span>
                  </td>
                  <td>
                    <div className="table-actions">
                      {appointment.status === "completed" && (
                        <button
                          className="action-btn primary"
                          onClick={() =>
                            openModal("addRecord", appointment.Patient)
                          }
                          title="Add Medical Record"
                        >
                          <FiFileText />
                          Add Record
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5">
                  <div className="empty-state">
                    <span className="empty-icon">
                      <FiCalendar />
                    </span>
                    <p>No appointments for selected day</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DoctorAppointments;
