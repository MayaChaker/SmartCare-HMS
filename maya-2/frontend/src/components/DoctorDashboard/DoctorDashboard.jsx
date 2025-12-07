import React from "react";
import {
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiPieChart,
  FiUsers,
  FiUser,
  FiArrowRight,
  FiFileText,
  FiBarChart2,
} from "react-icons/fi";
import "./DoctorDashboard.css";

const DoctorDashboard = ({ appointments = [], patients = [], doctorProfile, openModal, setActiveSection }) => {
  const today = new Date();
  const completedCount = appointments.filter((a) => a.status && a.status.toLowerCase() === "completed").length;
  const scheduledCount = appointments.filter((a) => a.status === "scheduled").length;

  return (
    <div className="dashboard-content">
      <div className="dashboard-header">
        <div className="dashboard-welcome">
          <div className="welcome-text">
            <h1 className="doctor-dashboard-title">Doctor Dashboard</h1>
          </div>
          <div className="dashboard-date">
            <div className="current-date">
              <FiCalendar />{" "}
              {today.toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </div>
          </div>
        </div>

        <div className="doctor-status-section">
          <div className="status-card">
            <div className="status-header">
              <div className="status-indicator-wrapper">
                <div className="status-details">
                  <div className="status-specialization">
                    {doctorProfile?.specialization || "General Practice"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="stats-dashboard">
        <div className="stats-grid">
          <div className="stat-card appointments-card">
            <div className="stat-header">
              <div className="stat-icon-wrapper">
                <span className="stat-icon">
                  <FiCalendar />
                </span>
              </div>
              <div className="stat-info">
                <div className="trend-text">This month</div>
                <div className="stat-number">{appointments.length}</div>
                <div className="stat-label">Total Appointments</div>
              </div>
            </div>
          </div>

          <div className="stat-card completed-card">
            <div className="stat-header">
              <div className="stat-icon-wrapper">
                <span className="stat-icon">
                  <FiCheckCircle />
                </span>
              </div>
              <div className="stat-info">
                <div className="trend-text">Successfully treated</div>
                <div className="stat-number">{completedCount}</div>
                <div className="stat-label">Completed</div>
              </div>
            </div>
          </div>

          <div className="stat-card scheduled-card">
            <div className="stat-header">
              <div className="stat-icon-wrapper">
                <span className="stat-icon">
                  <FiClock />
                </span>
              </div>
              <div className="stat-info">
                <div className="trend-text">Upcoming appointments</div>
                <div className="stat-number">{scheduledCount}</div>
                <div className="stat-label">Scheduled</div>
              </div>
            </div>
          </div>

          <div className="stat-card patients-card">
            <div className="stat-header">
              <div className="stat-icon-wrapper">
                <span className="stat-icon">
                  <FiUsers />
                </span>
              </div>
              <div className="stat-info">
                <div className="trend-text">Under your care</div>
                <div className="stat-number">{patients.length}</div>
                <div className="stat-label">Total Patients</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-main">
        <div className="dashboard-left">
          <div className="section-card recent-appointments">
            <div className="section-header">
              <div className="section-title">
                <h1>
                  Recent Appointments
                  <span className="section-count">
                    {appointments
                      .filter((a) => a.status && a.status.toLowerCase() === "completed")
                      .slice(0, 5).length}{" "}
                    of{" "}
                    {appointments.filter((a) => a.status && a.status.toLowerCase() === "completed").length}
                  </span>
                </h1>
              </div>
            </div>
            <div className="appointments-preview">
              {appointments
                .filter((a) => a.status && a.status.toLowerCase() === "completed")
                .slice(0, 5).length > 0 ? (
                <div className="appointments-list">
                  {appointments
                    .filter((a) => a.status && a.status.toLowerCase() === "completed")
                    .slice(0, 5)
                    .map((appointment) => (
                      <div key={appointment.id} className="appointment-item">
                        <div className="appointment-avatar">
                          <span className="avatar-icon">
                            <FiUser />
                          </span>
                        </div>
                        <div className="appointment-info">
                          <div className="patient-name">
                            {appointment.Patient
                              ? `${appointment.Patient.firstName} ${appointment.Patient.lastName}`
                              : "N/A"}
                          </div>
                          <div className="appointment-details">
                            <span className="appointment-date">
                              <FiCalendar />{" "}
                              {new Date(appointment.appointmentDate).toLocaleDateString()}
                            </span>
                            <span className="appointment-time">
                              <FiClock />{" "}
                              {new Date(`${appointment.appointmentDate}T${appointment.appointmentTime}`).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        </div>
                        <div className="appointment-status">
                          <span className={`status-badge status-${appointment.status.toLowerCase()}`}>
                            {appointment.status}
                          </span>
                        </div>
                        {appointment.status === "completed" && (
                          <div className="appointment-actions" style={{ marginLeft: "auto" }}>
                            <button
                              className="action-btn primary"
                              type="button"
                              onClick={() => openModal && openModal("addRecord", appointment.Patient)}
                              title="Add Medical Record"
                            >
                              <FiFileText />
                              Add Record
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              ) : (
                <div className="empty-state">
                  <div className="empty-icon">
                    <FiCalendar />
                  </div>
                  <div className="empty-content">
                    <h4>No completed appointments</h4>
                    <p>Completed appointments will appear here</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="dashboard-right">
          <div className="section-card quick-actions">
            <div className="section-header">
              <h1>Quick Actions</h1>
            </div>
            <div className="actions-grid">
              <button className="action-card patients-action" onClick={() => setActiveSection && setActiveSection("patients")}>
                <div className="action-icon">
                  <FiUsers />
                </div>
                <div className="action-content">
                  <span className="action-title">View Patients</span>
                  <span className="action-desc">Manage patient records</span>
                </div>
                <div className="action-arrow">
                  <FiArrowRight />
                </div>
              </button>

              <button className="action-card appointments-action" onClick={() => setActiveSection && setActiveSection("appointments")}>
                <div className="action-icon">
                  <FiCalendar />
                </div>
                <div className="action-content">
                  <span className="action-title">Appointments</span>
                  <span className="action-desc">View schedule</span>
                </div>
                <div className="action-arrow">
                  <FiArrowRight />
                </div>
              </button>

              <button className="action-card profile-action" onClick={() => setActiveSection && setActiveSection("profile")}>
                <div className="action-icon">
                  <FiUser />
                </div>
                <div className="action-content">
                  <span className="action-title">Profile</span>
                  <span className="action-desc">View & edit profile</span>
                </div>
                <div className="action-arrow">
                  <FiArrowRight />
                </div>
              </button>
            </div>
          </div>

          <div className="section-card today-summary">
            <div className="section-header">
              <h1>Today's Summary</h1>
            </div>
            <div className="summary-content">
              <div className="summary-item">
                <div className="summary-icon">
                  <FiBarChart2 />
                </div>
                <div className="summary-info">
                  <span className="summary-label">Appointments Today</span>
                  <span className="summary-value">
                    {appointments.filter(
                      (a) => new Date(a.appointmentDate).toDateString() === new Date().toDateString()
                    ).length}
                  </span>
                </div>
              </div>

              <div className="summary-item">
                <div className="summary-icon">
                  <FiClock />
                </div>
                <div className="summary-info">
                  <span className="summary-label">Next Appointment</span>
                  <span className="summary-value">
                    {appointments.filter((a) => new Date(a.appointmentDate) > new Date() && a.status === "scheduled").length > 0
                      ? new Date(
                          `${appointments.filter((a) => new Date(a.appointmentDate) > new Date() && a.status === "scheduled")[0]?.appointmentDate}T${appointments.filter((a) => new Date(a.appointmentDate) > new Date() && a.status === "scheduled")[0]?.appointmentTime}`
                        ).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "None"}
                  </span>
                </div>
              </div>

              <div className="summary-item">
                <div className="summary-icon">
                  <FiPieChart />
                </div>
                <div className="summary-info">
                  <span className="summary-label">Completion Rate</span>
                  <span className="summary-value">
                    {appointments.length > 0
                      ? Math.round((appointments.filter((a) => a.status === "completed").length / appointments.length) * 100)
                      : 0}
                    %
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;
