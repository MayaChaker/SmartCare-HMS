import React, { useEffect, useState } from "react";
import "./AdminDashboardButton.css";
import { FaUsersCog } from "react-icons/fa";
import { FaUserDoctor } from "react-icons/fa6";
import { FaUserInjured } from "react-icons/fa6";
import { GrBarChart } from "react-icons/gr";
import { CiSettings } from "react-icons/ci";
import { FaUser } from "react-icons/fa";
import "./AdminDashboardButton.css";

const AdminDashboardButton = ({
  activeSection,
  setActiveSection,
  renderContent = false,
  analytics = {},
  systemSettings = {},
  openModal,
}) => {
  const isActive = activeSection === "dashboard";
  // Live current time for dashboard header
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <>
      {!renderContent && (
        <button
          className={`admin-nav-item ${isActive ? "active" : ""}`}
          onClick={() => setActiveSection("dashboard")}
        >
          <span className="admin-nav-icon">
            <GrBarChart />
          </span>
          <span className="admin-nav-label">Dashboard</span>
        </button>
      )}

      {renderContent && isActive && (
        <div className="dashboard-content">
          <div className="dashboard-header">
            <h2>System Overview</h2>
            <div className="current-time">
              <span className="time-label">Current Time</span>
              <span className="time-value">
                {currentTime.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}
              </span>
            </div>
          </div>

          <div className="stats-grid">
            <div className="stat-card primary">
              <div className="stat-icon">
                <FaUsersCog />
              </div>
              <div className="stat-info">
                <p>Total Users</p>
                <h3>{analytics.totalUsers || 0}</h3>
              </div>
            </div>
            <div className="stat-card success">
              <div className="stat-icon">
                <FaUserDoctor />
              </div>
              <div className="stat-info">
                <p>Doctors</p>
                <h3>{analytics.totalDoctors || 0}</h3>
              </div>
            </div>
            <div className="stat-card info">
              <div className="stat-icon">
                <FaUserInjured />
              </div>
              <div className="stat-info">
                <p>Patients</p>
                <h3>{analytics.totalPatients || 0}</h3>
              </div>
            </div>
            <div className="stat-card warning">
              <div className="stat-icon">
                <GrBarChart />
              </div>
              <div className="stat-info">
                <p>Today's Appointments</p>
                <h3>{analytics.todayAppointments || 0}</h3>
              </div>
            </div>
          </div>

          <div className="dashboard-grid">
            <div className="dashboard-card">
              <div className="card-header">
                <h3>Recent Activity</h3>
              </div>
              <div className="card-content">
                <div className="activity-item">
                  <span className="activity-icon">
                    <GrBarChart />
                  </span>
                  <div className="activity-info">
                    <p>
                      Total Appointments: {analytics.totalAppointments || 0}
                    </p>
                    <small>System-wide</small>
                  </div>
                </div>
                <div className="activity-item">
                  <span className="activity-icon">
                    <FaUser />
                  </span>
                  <div className="activity-info">
                    <p>
                      New Registrations: {analytics.recentRegistrations || 0}
                    </p>
                    <small>Last 30 days</small>
                  </div>
                </div>
                <div className="activity-item">
                  <span className="activity-icon">
                    <CiSettings />
                  </span>
                  <div className="activity-info">
                    <p>
                      System Status:{" "}
                      {systemSettings.maintenanceMode
                        ? "Maintenance"
                        : "Active"}
                    </p>
                    <small>Current status</small>
                  </div>
                </div>
              </div>
            </div>

            <div className="dashboard-card">
              <div className="card-header">
                <h3>Appointment Status</h3>
              </div>
              <div className="card-content">
                <div className="status-grid">
                  {Object.entries(analytics.appointmentsByStatus || {}).map(
                    ([status, count]) => (
                      <div key={status} className="status-item">
                        <div
                          className={`status-indicator ${status.toLowerCase()}`}
                        ></div>
                        <span className="status-label">{status}</span>
                        <span className="status-count">{count}</span>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="quick-actions">
            <h3>Quick Actions</h3>
            <div className="action-buttons">
              <button
                className="action-btn primary"
                onClick={() => openModal && openModal("createUser")}
              >
                <span className="btn-icon">
                  <FaUser />
                </span>
                Add New User
              </button>
              <button
                className="action-btn info"
                onClick={() => setActiveSection("reports")}
              >
                <span className="btn-icon">
                  <GrBarChart />
                </span>
                View Reports
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminDashboardButton;
