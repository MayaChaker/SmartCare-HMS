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

const DoctorAppointments = () => {
  const { appointments = [], openModal } = useDoctor();
  const toDateStr = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${dd}`;
  };
  const selectedDate = toDateStr(new Date());

  // Filter appointments to only those scheduled for today
  const todaysAppointments = appointments.filter(
    (a) => String(a.appointmentDate) === String(selectedDate)
  );

  return (
    <div className="doctor-section">
      {/* Section header: */}
      <div className="section-header">
        <div className="section-title">
          <h1 className="appointments-title">
            Appointment Schedule
            {/* Shows number of appointments for today */}
            <span className="section-count appointments-count">
              {todaysAppointments.length} Appointments on{" "}
              {new Date(selectedDate).toLocaleDateString()}
            </span>
          </h1>
        </div>
      </div>

      {/* Table container + layout */}
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
            {/* Render rows when there are today's appointments */}
            {todaysAppointments.length > 0 ? (
              todaysAppointments.map((appointment) => (
                <tr key={appointment.id}>
                  <td>
                    <div className="patient-info">
                      <div className="patient-details">
                        <div className="patient-name">
                          {/* Display patient name if available */}
                          {appointment.Patient
                            ? `${appointment.Patient.firstName} ${appointment.Patient.lastName}`
                            : "N/A"}
                        </div>
                        <div className="patient-id">
                          {/* Display patient ID if available */}
                          {appointment.Patient
                            ? `ID: ${appointment.Patient.id}`
                            : "Unknown Patient"}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="appointment-datetime">
                      {/* Appointment date */}
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

                      {/* Appointment time */}
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

                  {/* Appointment details */}
                  <td>
                    <div className="appointment-details">
                      <div className="detail-item">
                        <span className="detail-label">Reason:</span>
                        <span className="detail-value">
                          {/* Default reason if not provided */}
                          {appointment.reason || "General consultation"}
                        </span>
                      </div>

                      {/* Optional notes */}
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

                  {/* Appointment status column */}
                  <td>
                    <span
                      className={`status-badge ${appointment.status
                        .toLowerCase()
                        .replace(" ", "-")}`}
                    >
                      {/* Status icons based on appointment status */}
                      {appointment.status === "scheduled" && <FiClock />}
                      {appointment.status === "in-progress" && <FiRefreshCcw />}
                      {appointment.status === "completed" && <FiCheckCircle />}
                      {appointment.status === "cancelled" && <FiXCircle />}

                      {/* Status text */}
                      <span className="status-text">{appointment.status}</span>
                    </span>
                  </td>

                  {/* Actions column*/}
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
              /* Empty state when there are no appointments */
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
