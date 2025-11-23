import React from "react";
import "./DashboardAppointment.css";

const DashboardAppointment = ({
  variant = "content",
  active = false,
  onClick = () => {},
  appointments = [],
  loading = false,
  error = "",
  success = "",
  openModal,
  doctors = [],
  resolveDoctorImage,
}) => {
  if (variant === "tabButton") {
    return (
      <button
        className={`tab-button ${active ? "active" : ""}`}
        onClick={onClick}
      >
        Appointments
      </button>
    );
  }

  if (!active) {
    return null;
  }

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">My Appointments</h3>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {success && <div className="alert alert-success">{success}</div>}

      {loading ? (
        <div className="loading">
          <div className="spinner"></div>
        </div>
      ) : appointments.filter(
          (a) => String(a.status).toLowerCase() !== "cancelled"
        ).length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📅</div>
          <div className="empty-state-text">No appointments scheduled</div>
          <div className="empty-state-subtext">
            Book your first appointment to get started
          </div>
        </div>
      ) : (
        <div className="appointments-list">
          {appointments
            .filter((a) => String(a.status).toLowerCase() !== "cancelled")
            .map((appointment) => (
              <div key={appointment.id} className="appointment-item">
                <div className="appointment-header">
                  <div
                    className="appointment-doctor"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    {(() => {
                      const doctorObj = doctors.find(
                        (d) => d.id === parseInt(appointment.doctorId)
                      );
                      const displayName =
                        appointment.doctorName ||
                        appointment.doctor ||
                        "Doctor";
                      const imgSrc = resolveDoctorImage
                        ? resolveDoctorImage(doctorObj, displayName)
                        : "";
                      return (
                        <>
                          <img
                            src={imgSrc}
                            alt={displayName}
                            style={{
                              width: "28px",
                              height: "28px",
                              borderRadius: "50%",
                              objectFit: "cover",
                              border: "1px solid #e5e5ea",
                              background: "#fff",
                            }}
                          />
                          <span>{displayName}</span>
                        </>
                      );
                    })()}
                  </div>
                  <span
                    className={`appointment-status status-${appointment.status
                      .toLowerCase()
                      .replace(" ", "-")}`}
                  >
                    {appointment.status}
                  </span>
                </div>
                <div className="appointment-details">
                  <div>
                    <strong>Specialty:</strong> {appointment.specialty}
                  </div>
                  <div>
                    <strong>Date & Time:</strong>{" "}
                    {appointment.appointmentDate
                      ? new Date(
                          appointment.appointmentDate
                        ).toLocaleDateString()
                      : "TBD"}{" "}
                    {appointment.appointmentTime
                      ? `at ${String(appointment.appointmentTime).slice(0, 5)}`
                      : ""}
                  </div>
                  <div>
                    <strong>Type:</strong> {appointment.type}
                  </div>
                  <div>
                    <strong>Location:</strong>{" "}
                    {appointment.location || "SmartCare Hospital"}
                  </div>
                  {appointment.notes && (
                    <div>
                      <strong>Notes:</strong> {appointment.notes}
                    </div>
                  )}
                </div>
                {String(appointment.status).toLowerCase() === "scheduled" && (
                  <div
                    className="appointment-actions"
                    style={{ marginTop: "15px", display: "flex", gap: "10px" }}
                  >
                    <button
                      className="btn btn-outline"
                      type="button"
                      onClick={() => openModal && openModal("reschedule", appointment)}
                    >
                      Reschedule
                    </button>
                    <button
                      className="btn btn-outline"
                      style={{ color: "#dc3545", borderColor: "#dc3545" }}
                      onClick={() => openModal && openModal("cancel", appointment)}
                      disabled={loading}
                    >
                      Cancel
                    </button>
                  </div>
                )}
                {String(appointment.status).toLowerCase() === "completed" && (
                  <div
                    className="appointment-actions"
                    style={{ marginTop: "15px", display: "flex", gap: "10px" }}
                  >
                    <button
                      className="btn btn-outline"
                      style={{ color: "#dc3545", borderColor: "#dc3545" }}
                      type="button"
                      onClick={() => openModal && openModal("delete", appointment)}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            ))}
        </div>
      )}
    </div>
  );
};

export default DashboardAppointment;

