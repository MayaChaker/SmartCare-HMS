import React from "react";
import "./ReceptionistAppointments.css";

const ReceptionistAppointments = ({
  appointments = [],
  todayAppointments = [],
  openModal,
  handleUpdateAppointmentStatus,
  handleCheckIn,
  loadReceptionistData,
  loading,
}) => (
  <div className="receptionist-appointments table-card">
    <div className="table-header">
      <h2 className="table-title">Appointment Management</h2>
      <button
        className="btn btn-primary"
        onClick={() => openModal("scheduleAppointment")}
      >
        Schedule New Appointment
      </button>
    </div>
    <div className="table-container appointments-table">
      <table>
        <thead>
          <tr>
            <th>Patient</th>
            <th>Doctor</th>
            <th>Date & Time</th>
            <th>Reason</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {(appointments && appointments.length > 0
            ? appointments
            : todayAppointments
          ).length > 0 ? (
            (appointments && appointments.length > 0
              ? appointments
              : todayAppointments
            ).map((appointment) => (
              <tr key={appointment.id}>
                <td>
                  {appointment.Patient
                    ? `${appointment.Patient.firstName} ${appointment.Patient.lastName}`
                    : "N/A"}
                </td>
                <td>
                  {appointment.Doctor
                    ? `Dr. ${appointment.Doctor.firstName} ${appointment.Doctor.lastName}`
                    : "N/A"}
                </td>
                <td>
                  <div>
                    <div>
                      {new Date(
                        appointment.appointmentDate
                      ).toLocaleDateString()}
                    </div>
                    <div style={{ fontSize: "12px", color: "#666" }}>
                      {appointment.appointmentTime
                        ? new Date(
                            `${appointment.appointmentDate}T${appointment.appointmentTime}`
                          ).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true,
                          })
                        : new Date(
                            appointment.appointmentDate
                          ).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true,
                          })}
                    </div>
                  </div>
                </td>
                <td>{appointment.reason || "General consultation"}</td>
                <td>
                  <span
                    className={`status-badge status-${String(
                      appointment.status || ""
                    ).toLowerCase()}`}
                  >
                    {appointment.status}
                  </span>
                </td>
                <td>
                  <div
                    style={{
                      display: "flex",
                      gap: "8px",
                      alignItems: "center",
                    }}
                  >
                    <select
                      value={appointment.status}
                      onChange={(e) => {
                        const next = e.target.value;
                        if (
                          (next === "completed" || next === "cancelled") &&
                          !(
                            appointment.status === "checked-in" ||
                            appointment.status === "in-progress"
                          )
                        ) {
                          return;
                        }
                        handleUpdateAppointmentStatus(appointment.id, next);
                      }}
                      className="status-select"
                      disabled={loading}
                    >
                      <option value="scheduled">Scheduled</option>
                      <option value="checked-in">Checked-in</option>
                      <option value="in-progress">In-progress</option>
                      <option
                        value="completed"
                        disabled={
                          !(
                            appointment.status === "checked-in" ||
                            appointment.status === "in-progress"
                          )
                        }
                      >
                        Completed
                      </option>
                      <option
                        value="cancelled"
                        disabled={
                          !(
                            appointment.status === "checked-in" ||
                            appointment.status === "in-progress"
                          )
                        }
                      >
                        Cancelled
                      </option>
                    </select>
                    {appointment.status === "scheduled" && (
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => handleCheckIn(appointment.id)}
                        title="Quick Check In"
                      >
                        Check In
                      </button>
                    )}
                    {appointment.status === "checked-in" && (
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() =>
                          handleUpdateAppointmentStatus(
                            appointment.id,
                            "in-progress"
                          )
                        }
                        title="Take Appointment"
                      >
                        Take
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="6" style={{ textAlign: "center", padding: "16px" }}>
                No appointments found.
                <button
                  className="btn btn-sm btn-secondary"
                  onClick={loadReceptionistData}
                  style={{ marginLeft: 8 }}
                >
                  Refresh
                </button>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
);

export default ReceptionistAppointments;
