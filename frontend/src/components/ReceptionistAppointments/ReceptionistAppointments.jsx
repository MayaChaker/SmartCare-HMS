import React from "react";
import "./ReceptionistAppointments.css";
import { useReceptionist } from "../../context/ReceptionistContext";
import { APPOINTMENT_STATUSES, hasVisitTimePassed } from "../../utils/schedule";

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
  // Reception checks patients in and can cancel before the visit starts.
  // Starting and completing the visit belongs to the doctor (same rule as the API).
  // A no-show can only be recorded once the visit time has passed.
  const RECEPTION_CHANGES = {
    scheduled: ["checked-in", "cancelled", "no-show"],
    "checked-in": ["cancelled"],
  };
  const canChangeStatus = (appointment, next) =>
    next === appointment.status ||
    ((RECEPTION_CHANGES[appointment.status] || []).includes(next) &&
      (next !== "no-show" || hasVisitTimePassed(appointment.appointmentDate, appointment.appointmentTime)));
  const formatStatusLabel = (raw) => {
    const s = String(raw || "").trim();
    if (!s) return "";
    return s
      .split("-")
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  };
  const handleStatusChange = (appointment, nextStatus) => {
    if (!canChangeStatus(appointment, nextStatus)) {
      return;
    }

    handleUpdateAppointmentStatus(appointment.id, nextStatus);
  };
  // Top-right button opens scheduling modal
  return (
    <div className="receptionist-appointments table-card">
      <div className="table-header">
        <h2 className="table-title">Appointments</h2>
        <button
          className="btn btn-primary"
          onClick={() => openModal("scheduleAppointment")}
        >
          Add appointment
        </button>
      </div>

      <div className="table-container appointments-table">
        <table>
          <thead>
            <tr>
              <th>Patient</th>
              <th>Doctor</th>
              <th>Date and time</th>
              <th>Visit reason</th>
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
                      <div className="time-subtext">
                        {formatTime(
                          appointment.appointmentDate,
                          appointment.appointmentTime
                        )}
                      </div>
                    </div>
                  </td>

                  <td>{appointment.reason || "General check-up"}</td>

                  <td>
                    <span
                      className={`status-badge status-${String(
                        appointment.status || ""
                      ).toLowerCase()}`}
                    >
                      {formatStatusLabel(appointment.status)}
                    </span>
                  </td>

                  <td>
                    <div className="action-controls">
                      {/* Status select */}
                      <select
                        value={appointment.status}
                        onChange={(e) =>
                          handleStatusChange(appointment, e.target.value)
                        }
                        className="status-select"
                        disabled={loading}
                      >
                        {APPOINTMENT_STATUSES.map((s) => (
                          <option
                            key={s}
                            value={s}
                            disabled={!canChangeStatus(appointment, s)}
                          >
                            {formatStatusLabel(s)}
                          </option>
                        ))}
                      </select>

                      {/* Quick actions*/}
                      {appointment.status === "scheduled" && (
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => handleCheckIn(appointment.id)}
                          title="Mark as arrived"
                        >
                          Mark arrived
                        </button>
                      )}

                      {canChangeStatus(appointment, "no-show") && appointment.status === "scheduled" && (
                        <button
                          className="btn btn-sm btn-secondary"
                          onClick={() => handleUpdateAppointmentStatus(appointment.id, "no-show")}
                          title="The patient did not come"
                        >
                          No-show
                        </button>
                      )}

                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: 16 }}>
                  {/* Empty state */}
                  No appointments yet.
                  <button
                    className="btn btn-sm btn-secondary"
                    onClick={loadReceptionistData}
                    style={{ marginLeft: 8 }}
                    disabled={loading}
                  >
                    Reload
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
