import React, { useEffect, useState } from "react";
import "./AdminDashboardButton.css";

import { FaUsersCog } from "react-icons/fa";
import { FaUserDoctor, FaUserInjured } from "react-icons/fa6";
import { GrBarChart } from "react-icons/gr";
import { CiSettings } from "react-icons/ci";
import { FaUser } from "react-icons/fa";

import { AdminNavItem } from "../../pages/Admin/AdminPanel";
import { useAdmin } from "../../context/AdminContext";

const AdminDashboardButton = ({ renderContent = false }) => {
  // Admin global state
  const {
    activeSection,
    setActiveSection,
    analytics,
    systemSettings,
    openModal,
  } = useAdmin();

  // This tab is active when activeSection === "dashboard"
  const isActive = activeSection === "dashboard";

  // Live clock shown in the dashboard header
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Safe fallback numbers (keeps UI stable if analytics missing)
  const totalUsers = analytics.totalUsers || 0;
  const totalDoctors = analytics.totalDoctors || 0;
  const totalPatients = analytics.totalPatients || 0;
  const todayAppointments = analytics.todayAppointments || 0;
  const totalAppointments = analytics.totalAppointments || 0;
  const recentRegistrations = analytics.recentRegistrations || 0;
  // Maintenance mode affects the status text
  const systemStatus = systemSettings.maintenanceMode
    ? "Under maintenance"
    : "Running";

  const formatStatusLabel = (raw) => {
    const s = String(raw || "").trim();
    if (!s) return "";
    return s
      .split("-")
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  };

  return (
    <>
      {/*Sidebar button only*/}
      {!renderContent && (
        <AdminNavItem
          active={isActive}
          onClick={() => setActiveSection("dashboard")}
          icon={<GrBarChart />}
          label="Dashboard"
        />
      )}

      {/*  Main dashboard content*/}
      {renderContent && isActive && (
        <div className="dashboard-content">
          {/* Header + live time */}
          <div className="dashboard-header">
            <div className="dashboard-title">
              <h2>Overview</h2>
              <p className="dashboard-subtitle">
                Key platform metrics at a glance.
              </p>
            </div>

            <div className="current-time">
              <span className="time-label">Time now</span>
              <span className="time-value">
                {currentTime.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}
              </span>
            </div>
          </div>

          {/* Top stats cards */}
          <div className="stats-grid">
            <div className="stat-card primary">
              <div className="stat-icon">
                <FaUsersCog />
              </div>
              <div className="stat-info">
                <p>Total Users</p>
                <h3>{totalUsers}</h3>
              </div>
            </div>

            <div className="stat-card success">
              <div className="stat-icon">
                <FaUserDoctor />
              </div>
              <div className="stat-info">
                <p>Doctors</p>
                <h3>{totalDoctors}</h3>
              </div>
            </div>

            <div className="stat-card info">
              <div className="stat-icon">
                <FaUserInjured />
              </div>
              <div className="stat-info">
                <p>Patients</p>
                <h3>{totalPatients}</h3>
              </div>
            </div>

            <div className="stat-card warning">
              <div className="stat-icon">
                <GrBarChart />
              </div>
              <div className="stat-info">
                <p>Appointments today</p>
                <h3>{todayAppointments}</h3>
              </div>
            </div>
          </div>

          {/* Two main dashboard cards */}
          <div className="dashboard-grid">
            {/* Recent Activity card */}
            <div className="dashboard-card">
              <div className="card-header">
                <h3>Recent updates</h3>
              </div>

              <div className="card-content">
                <div className="activity-item">
                  <span className="activity-icon">
                    <GrBarChart />
                  </span>
                  <div className="activity-info">
                    <p>Total appointments: {totalAppointments}</p>
                    <small>Overall</small>
                  </div>
                </div>

                <div className="activity-item">
                  <span className="activity-icon">
                    <FaUser />
                  </span>
                  <div className="activity-info">
                    <p>New users: {recentRegistrations}</p>
                    <small>Last 30 days</small>
                  </div>
                </div>

                <div className="activity-item">
                  <span className="activity-icon">
                    <CiSettings />
                  </span>
                  <div className="activity-info">
                    <p>
                      Service status: <span>{systemStatus}</span>
                    </p>
                    <small>Right now</small>
                  </div>
                </div>
              </div>
            </div>

            {/* Appointment Status card */}
            <div className="dashboard-card">
              <div className="card-header">
                <h3>Appointment Status</h3>
              </div>

              <div className="card-content">
                <div className="status-grid">
                  {/* Loop through status counts */}
                  {Object.entries(analytics.appointmentsByStatus || {}).map(
                    ([status, count]) => (
                      <div key={status} className="status-item">
                        {/* status affects CSS class for color indicator */}
                        <div
                          className={`status-indicator ${status.toLowerCase()}`}
                        ></div>

                        <span className="status-label">
                          {formatStatusLabel(status)}
                        </span>
                        <span className="status-count">{count}</span>
                      </div>
                    ),
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Quick action buttons */}
          <div className="quick-actions">
            <h3>Quick Actions</h3>

            <div className="action-buttons">
              <button
                className="action-btn primary"
                // Open modal to create user
                onClick={() => openModal && openModal("createUser")}
              >
                <span className="btn-icon">
                  <FaUser />
                </span>
                Add user
              </button>

              <button
                className="action-btn info"
                // Switch sidebar to "reports" section
                onClick={() => setActiveSection("reports")}
              >
                <span className="btn-icon">
                  <GrBarChart />
                </span>
                View reports
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminDashboardButton;
