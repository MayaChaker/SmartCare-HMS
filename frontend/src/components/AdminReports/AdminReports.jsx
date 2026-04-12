import React from "react";
import "./AdminReports.css";
import { FaUsersCog } from "react-icons/fa";
import { FaUserDoctor, FaUserInjured } from "react-icons/fa6";
import { GrBarChart } from "react-icons/gr";
import { RiCalendarEventLine, RiUserAddLine } from "react-icons/ri";
import { useAdmin } from "../../context/AdminContext";

const AdminReports = () => {
  const { activeSection, analytics, appointments } = useAdmin();
  if (activeSection !== "reports") return null;
  const formatStatusLabel = (raw) => {
    const s = String(raw || "").trim();
    if (!s) return "";
    return s
      .split("-")
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  };
  const doctorCounts = appointments.reduce((acc, a) => {
    // Build the doctor display name
    const doctorName = a.Doctor
      ? `Dr. ${a.Doctor.firstName} ${a.Doctor.lastName}`
      : "Unknown";

    // Increase count
    acc[doctorName] = (acc[doctorName] || 0) + 1;
    return acc;
  }, {});

  // Convert object to array and sort by highest count first
  const doctorSummary = Object.entries(doctorCounts).sort(
    (a, b) => b[1] - a[1],
  );

  const statusEntries = Object.entries(analytics.appointmentsByStatus || {});
  const statusTotal = statusEntries.reduce(
    (sum, [, c]) => sum + Number(c || 0),
    0,
  );

  return (
    <div className="section-content admin-reports">
      {/*  Header*/}
      <div className="admin-reports-header">
        <h2>Reports</h2>
      </div>

      {/*  Top Stats Cards */}
      <div className="stats-grid">
        {/* Total Users */}
        <div className="stat-card primary">
          <div className="stat-icon">
            <FaUsersCog />
          </div>
          <div className="stat-info">
            <h3>{analytics.totalUsers}</h3>
            <p>Total Users</p>
          </div>
        </div>

        {/* Total Doctors */}
        <div className="stat-card success">
          <div className="stat-icon">
            <FaUserDoctor />
          </div>
          <div className="stat-info">
            <h3>{analytics.totalDoctors}</h3>
            <p>Doctors</p>
          </div>
        </div>

        {/* Total Patients */}
        <div className="stat-card info">
          <div className="stat-icon">
            <FaUserInjured />
          </div>
          <div className="stat-info">
            <h3>{analytics.totalPatients}</h3>
            <p>Patients</p>
          </div>
        </div>

        {/* Today's Appointments */}
        <div className="stat-card warning">
          <div className="stat-icon">
            <GrBarChart />
          </div>
          <div className="stat-info">
            <h3>{analytics.todayAppointments}</h3>
            <p>Appointments today</p>
          </div>
        </div>

        <div className="stat-card primary">
          <div className="stat-icon">
            <RiCalendarEventLine />
          </div>
          <div className="stat-info">
            <h3>{analytics.totalAppointments}</h3>
            <p>Appointments total</p>
          </div>
        </div>

        <div className="stat-card success">
          <div className="stat-icon">
            <RiUserAddLine />
          </div>
          <div className="stat-info">
            <h3>{analytics.recentRegistrations}</h3>
            <p>New users (last 30 days)</p>
          </div>
        </div>
      </div>

      {/* Appointment Status Summary */}
      <div className="dashboard-card">
        <div className="card-header">
          <h3>Appointment Status</h3>
        </div>

        <div className="card-content">
          <div className="status-grid">
            {/* Loop through status counts*/}
            {Object.entries(analytics.appointmentsByStatus || {}).map(
              ([status, count]) => {
                const statusClass = String(status).toLowerCase();

                return (
                  <div key={status} className={`status-item ${statusClass}`}>
                    {/* Small colored indicator  */}
                    <div className={`status-indicator ${statusClass}`}></div>

                    {/* Status text */}
                    <span className="status-label">
                      {formatStatusLabel(status)}
                    </span>

                    {/* Count number */}
                    <span className="status-count">{count}</span>
                  </div>
                );
              },
            )}
          </div>

          <div
            className="status-bars"
            aria-label="Appointment status breakdown"
          >
            {statusEntries.map(([status, count]) => {
              const statusClass = String(status).toLowerCase();
              const pct = statusTotal
                ? (Number(count || 0) / statusTotal) * 100
                : 0;
              return (
                <div key={status} className="status-bar-row">
                  <div className="status-bar-label">
                    <span className={`status-indicator ${statusClass}`}></span>
                    <span>{formatStatusLabel(status)}</span>
                  </div>
                  <div className="status-bar-track">
                    <div
                      className={`status-bar-fill ${statusClass}`}
                      style={{ width: `${Math.max(0, Math.min(100, pct))}%` }}
                    ></div>
                  </div>
                  <div className="status-bar-count">{count}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Doctor Appointments Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Doctor</th>
              <th>Appointments</th>
            </tr>
          </thead>

          <tbody>
            {/* doctorSummary is an array*/}
            {doctorSummary.map(([doctorName, count]) => (
              <tr key={doctorName}>
                <td>{doctorName}</td>
                <td>{count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminReports;
