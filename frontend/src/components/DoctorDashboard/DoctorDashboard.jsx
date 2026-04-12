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
import { useDoctor } from "../../context/DoctorContext";
import "./DoctorDashboard.css";
const DoctorDashboard = ({ setActiveSection }) => {
  const {
    appointments = [],
    patients = [],
    doctorProfile,
    openModal,
  } = useDoctor();
  const today = new Date();
  const todayStr = today.toDateString();
  // Completed appointments
  const completedAppointments = appointments.filter(
    (a) => a.status && a.status.toLowerCase() === "completed"
  );
  // Scheduled  appointments
  const scheduledAppointments = appointments.filter(
    (a) => a.status && a.status.toLowerCase() === "scheduled"
  );
  // Appointments occurring today
  const todayAppointments = appointments.filter(
    (a) =>
      a.appointmentDate &&
      new Date(a.appointmentDate).toDateString() === todayStr
  );
  // Upcoming scheduled appointments
  const upcomingScheduled = appointments
    .filter(
      (a) =>
        a.status === "scheduled" &&
        a.appointmentDate &&
        new Date(a.appointmentDate) > new Date()
    )
    .sort(
      (a, b) =>
        new Date(`${a.appointmentDate}T${a.appointmentTime}`) -
        new Date(`${b.appointmentDate}T${b.appointmentTime}`)
    );
  const nextAppointmentTime =
    upcomingScheduled.length > 0
      ? new Date(
          `${upcomingScheduled[0].appointmentDate}T${upcomingScheduled[0].appointmentTime}`
        ).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })
      : "None";

  // Completion rate
  const completionRate =
    appointments.length > 0
      ? Math.round((completedAppointments.length / appointments.length) * 100)
      : 0;

  return (
    <div className="dashboard-content doctor-dashboard">
      {/*  Dashboard Header */}
      <div className="dashboard-header">
        {/* Welcome + current date */}
        <div className="dashboard-welcome">
          <div className="welcome-text">
            <h1 className="doctor-dashboard-title">My Dashboard</h1>
          </div>

          {/* Current date display  */}
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

        {/* Right of header */}
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

      {/* Stats Cards Section*/}
      <div className="stats-dashboard">
        <div className="stats-grid">
          {/* Total appointments */}
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

          {/* Completed appointments card */}
          <div className="stat-card completed-card">
            <div className="stat-header">
              <div className="stat-icon-wrapper">
                <span className="stat-icon">
                  <FiCheckCircle />
                </span>
              </div>
              <div className="stat-info">
                <div className="trend-text">Completed visits</div>
                <div className="stat-number">
                  {completedAppointments.length}
                </div>
                <div className="stat-label">Completed</div>
              </div>
            </div>
          </div>

          {/* Scheduled appointments card */}
          <div className="stat-card scheduled-card">
            <div className="stat-header">
              <div className="stat-icon-wrapper">
                <span className="stat-icon">
                  <FiClock />
                </span>
              </div>
              <div className="stat-info">
                <div className="trend-text">Upcoming appointments</div>
                <div className="stat-number">
                  {scheduledAppointments.length}
                </div>
                <div className="stat-label">Scheduled</div>
              </div>
            </div>
          </div>

          {/* Total patients card */}
          <div className="stat-card patients-card">
            <div className="stat-header">
              <div className="stat-icon-wrapper">
                <span className="stat-icon">
                  <FiUsers />
                </span>
              </div>
              <div className="stat-info">
                <div className="trend-text">Your patients</div>
                <div className="stat-number">{patients.length}</div>
                <div className="stat-label">Total Patients</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Dashboard Content */}
      <div className="dashboard-main">
        {/*completed appointments preview list */}
        <div className="dashboard-left">
          <div className="section-card recent-appointments">
            <div className="section-header">
              <div className="section-title">
                <h1>
                  Recent Appointments
                  <span className="section-count">
                    {completedAppointments.slice(0, 5).length} of{" "}
                    {completedAppointments.length}
                  </span>
                </h1>
              </div>
            </div>

            {/* last completed appointments */}
            <div className="appointments-preview">
              {completedAppointments.slice(0, 5).length > 0 ? (
                <div className="appointments-list">
                  {completedAppointments.slice(0, 5).map((appointment) => (
                    <div key={appointment.id} className="appointment-item">
                      {/* Patient avatar icon */}
                      <div className="appointment-avatar">
                        <span className="avatar-icon">
                          <FiUser />
                        </span>
                      </div>

                      {/* Basic appointment info */}
                      <div className="appointment-info">
                        <div className="patient-name">
                          {appointment.Patient
                            ? `${appointment.Patient.firstName} ${appointment.Patient.lastName}`
                            : "N/A"}
                        </div>
                        <div className="appointment-details">
                          <span className="appointment-date">
                            <FiCalendar />{" "}
                            {new Date(
                              appointment.appointmentDate
                            ).toLocaleDateString()}
                          </span>
                          <span className="appointment-time">
                            <FiClock />{" "}
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

                      {/* Status label*/}
                      <div className="appointment-status">
                        <span
                          className={`status-badge status-${appointment.status.toLowerCase()}`}
                        >
                          {appointment.status}
                        </span>
                      </div>

                      {/* add record for completed appointments */}
                      {appointment.status === "completed" && (
                        <div
                          className="appointment-actions"
                          style={{ marginLeft: "auto" }}
                        >
                          <button
                            className="action-btn primary"
                            type="button"
                            onClick={() =>
                              openModal &&
                              openModal("addRecord", appointment.Patient)
                            }
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
                /* Empty state when no completed appointments */
                <div className="empty-state">
                  <div className="empty-icon">
                    <FiCalendar />
                  </div>
                  <div className="empty-content">
                    <h4>No completed visits yet</h4>
                    <p>Completed visits will show here</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* quick actions + today summary */}
        <div className="dashboard-right">
          <div className="section-card quick-actions">
            <div className="section-header">
              <h1>Quick Actions</h1>
            </div>
            <div className="actions-grid">
              <button
                className="action-card patients-action"
                onClick={() => setActiveSection && setActiveSection("patients")}
              >
                <div className="action-icon">
                  <FiUsers />
                </div>
                <div className="action-content">
                  <span className="action-title">Patients</span>
                  <span className="action-desc">View patient list</span>
                </div>
                <div className="action-arrow">
                  <FiArrowRight />
                </div>
              </button>

              <button
                className="action-card appointments-action"
                onClick={() =>
                  setActiveSection && setActiveSection("appointments")
                }
              >
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

              <button
                className="action-card profile-action"
                onClick={() => setActiveSection && setActiveSection("profile")}
              >
                <div className="action-icon">
                  <FiUser />
                </div>
                <div className="action-content">
                  <span className="action-title">My profile</span>
                  <span className="action-desc">View or edit profile</span>
                </div>
                <div className="action-arrow">
                  <FiArrowRight />
                </div>
              </button>
            </div>
          </div>

          {/* Today's summary*/}
          <div className="section-card today-summary">
            <div className="section-header">
              <h1>Today</h1>
            </div>
            <div className="summary-content">
              {/* Total appointments scheduled for today */}
              <div className="summary-item">
                <div className="summary-icon">
                  <FiBarChart2 />
                </div>
                <div className="summary-info">
                  <span className="summary-label">Visits today</span>
                  <span className="summary-value">
                    {todayAppointments.length}
                  </span>
                </div>
              </div>

              {/* Next upcoming appointment time */}
              <div className="summary-item">
                <div className="summary-icon">
                  <FiClock />
                </div>
                <div className="summary-info">
                  <span className="summary-label">Next visit</span>
                  <span className="summary-value">{nextAppointmentTime}</span>
                </div>
              </div>

              {/* Completion rate percentage */}
              <div className="summary-item">
                <div className="summary-icon">
                  <FiPieChart />
                </div>
                <div className="summary-info">
                  <span className="summary-label">Completion</span>
                  <span className="summary-value">{completionRate}%</span>
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
