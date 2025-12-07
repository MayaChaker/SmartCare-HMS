import React from "react";
import "./ReceptionistAppointments.css";
import { useReceptionist } from "../../context/ReceptionistContext";

const ReceptionistAppointments = () => {
  const {
    appointments = [],
    todayAppointments = [],
    openModal,
    handleUpdateAppointmentStatus,
    handleCheckIn,
    loadReceptionistData,
    loading,
  } = useReceptionist();

  // إذا في appointments كاملة استعملها، غير هيك استعمل todayAppointments
  const rows =
    appointments && appointments.length > 0 ? appointments : todayAppointments;

  const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString();

  const formatTime = (dateStr, timeStr) => {
    const base = timeStr
      ? new Date(`${dateStr}T${timeStr}`)
      : new Date(dateStr);

    return base.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const canFinish = (status) =>
    status === "checked-in" || status === "in-progress";

  const handleStatusChange = (appointment, nextStatus) => {
    // ما منسمح يروح مباشرة على completed / cancelled
    // إلا إذا كان Checked-in أو In-progress
    if (
      (nextStatus === "completed" || nextStatus === "cancelled") &&
      !canFinish(appointment.status)
    ) {
      return;
    }

    handleUpdateAppointmentStatus(appointment.id, nextStatus);
  };

  return (
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
              <th>Date &amp; Time</th>
              <th>Reason</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {rows && rows.length > 0 ? (
              rows.map((appointment) => (
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
                      <div>{formatDate(appointment.appointmentDate)}</div>
                      <div style={{ fontSize: "12px", color: "#666" }}>
                        {formatTime(
                          appointment.appointmentDate,
                          appointment.appointmentTime
                        )}
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
                        onChange={(e) =>
                          handleStatusChange(appointment, e.target.value)
                        }
                        className="status-select"
                        disabled={loading}
                      >
                        <option value="scheduled">Scheduled</option>
                        <option value="checked-in">Checked-in</option>
                        <option value="in-progress">In-progress</option>
                        <option
                          value="completed"
                          disabled={!canFinish(appointment.status)}
                        >
                          Completed
                        </option>
                        <option
                          value="cancelled"
                          disabled={!canFinish(appointment.status)}
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
                <td colSpan={6} style={{ textAlign: "center", padding: 16 }}>
                  No appointments found.
                  <button
                    className="btn btn-sm btn-secondary"
                    onClick={loadReceptionistData}
                    style={{ marginLeft: 8 }}
                    disabled={loading}
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
};

export default ReceptionistAppointments;
