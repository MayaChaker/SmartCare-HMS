import React from "react";
import {
  FaCalendarDay,
  FaPlus,
  FaUsers,
  FaClipboardList,
  FaPen,
} from "react-icons/fa";
import { MdVisibility } from "react-icons/md";
import { MdNotifications } from "react-icons/md";
import { FaUserDoctor } from "react-icons/fa6";
import RegisterButton from "../ui/RegisterButton/RegisterButton";
import ScheduleButton from "../ui/ScheduleButton/ScheduleButton";

const ReceptionistDashboard = ({
  todayAppointments = [],
  patients = [],
  doctors = [],
  appointments = [],
  openModal,
  handleCheckIn,
  handleUpdateAppointmentStatus,
}) => {
  const toYmd = (d) => {
    if (!d) return "";
    const dt = new Date(d);
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, "0");
    const dd = String(dt.getDate()).padStart(2, "0");
    return `${y}-${m}-${dd}`;
  };
  const now = new Date();
  const todayYmd = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const notificationsCount = (patients || []).filter((p) => toYmd(p.createdAt) === todayYmd).length + (appointments || []).filter((a) => toYmd(a.createdAt) === todayYmd).length;

  return (
  <div className="receptionist-dashboard">
    <div className="dashboard-header">
      <div className="header-content">
        <h2 className="dashboard-title">Reception Dashboard</h2>
      </div>
      <div className="header-actions">
        <div className="current-time">
          <div className="time-row">
            <span className="time-label">Current Time</span>
            <span className="time-value">{new Date().toLocaleTimeString()}</span>
          </div>
        </div>
      </div>
    </div>

    <div className="dashboard-stats">
      <div className="stat-card primary">
        <div className="stat-icon">
          <FaCalendarDay />
        </div>
        <div className="stat-content">
          <p>Today's Appointments</p>
          <h3>{todayAppointments.length}</h3>
          <span className="stat-trend">+2 from yesterday</span>
        </div>
      </div>

      <div className="stat-card info">
        <div className="stat-icon">
          <MdNotifications />
        </div>
        <div className="stat-content">
          <p>Notifications Today</p>
          <h3>{notificationsCount}</h3>
          <span className="stat-trend">New items</span>
        </div>
      </div>

      <div className="stat-card info">
        <div className="stat-icon">
          <FaUsers />
        </div>
        <div className="stat-content">
          <p>Total Patients</p>
          <h3>{patients.length}</h3>
          <span className="stat-trend">Registered</span>
        </div>
      </div>

      <div className="stat-card warning">
        <div className="stat-icon">
          <FaUserDoctor color="orange" />
        </div>
        <div className="stat-content">
          <p>Available Doctors</p>
          <h3>{doctors.length}</h3>
          <span className="stat-trend">On duty</span>
        </div>
      </div>
    </div>

    <div className="dashboard-actions">
      <div className="action-card">
        <div className="action-icon">
          <FaPlus />
        </div>
        <div className="action-content">
          <div className="action-text">
            <h4>Register New Patient</h4>
            <p>Add a new patient to the system</p>
          </div>
        </div>
        <RegisterButton onClick={() => openModal("registerPatient")} />
      </div>

      <div className="action-card">
        <div className="action-icon">
          <FaClipboardList />
        </div>
        <div className="action-content">
          <div className="action-text">
            <h4>Schedule Appointment</h4>
            <p>Book a new appointment for a patient</p>
          </div>
        </div>
        <ScheduleButton onClick={() => openModal("scheduleAppointment")} />
      </div>
    </div>

    <div className="dashboard-table-section">
      <div className="table-header">
        <h4 className="table-title">Today's Appointments</h4>
        <div className="table-filters" style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <select className="filter-select">
            <option>All Status</option>
            <option>Scheduled</option>
            <option>Checked-in</option>
            <option>In-progress</option>
            <option>Completed</option>
          </select>
        </div>
      </div>

      <div className="table-container appointments-table">
        <table className="appointments-table">
          <colgroup>
            <col />
            <col />
            <col />
            <col />
            <col style={{ width: "120px" }} />
          </colgroup>
          <thead>
            <tr>
              <th>Doctor</th>
              <th>Patient</th>
              <th>Status</th>
              <th>Time</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {(todayAppointments || []).length > 0 ? (
              todayAppointments.map((appointment) => (
                <tr key={appointment.id} className="appointment-row">
                  <td className="doctor-cell">
                    <span className="doctor-name">
                      Dr. {appointment.Doctor?.firstName} {appointment.Doctor?.lastName}
                    </span>
                  </td>
                  <td className="patient-cell">
                    <div className="patient-info">
                      <span className="patient-name">
                        {appointment.Patient?.firstName} {appointment.Patient?.lastName}
                      </span>
                      <span className="patient-id">ID: {appointment.Patient?.id}</span>
                    </div>
                  </td>
                  <td className="status-cell">
                    <span className={`status-badge ${appointment.status}`}>{appointment.status}</span>
                  </td>
                  <td className="time-cell">
                    <span className="appointment-time">
                      {appointment.appointmentTime
                        ? new Date(`${appointment.appointmentDate}T${appointment.appointmentTime}`).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true,
                          })
                        : new Date(appointment.appointmentDate).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true,
                          })}
                    </span>
                  </td>
                  <td className="actions-cell">
                    <div className="action-buttons">
                      <button
                        className="btn-icon edit"
                        onClick={() => openModal("editAppointment", appointment)}
                        title="Edit Appointment"
                        aria-label="Edit Appointment"
                      >
                        <FaPen />
                      </button>
                      <button
                        className="btn-icon view"
                        onClick={() => openModal("viewPatient", appointment.Patient)}
                        title="View Patient"
                      >
                        <MdVisibility />
                      </button>
                      {appointment.status === "scheduled" && (
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => handleCheckIn(appointment.id)}
                          title="Quick Check In"
                          style={{ marginLeft: "8px" }}
                        >
                          Check In
                        </button>
                      )}
                      {appointment.status === "checked-in" && (
                        <button
                          className="btn btn-sm btn-secondary"
                          onClick={() => handleUpdateAppointmentStatus(appointment.id, "in-progress")}
                          title="Take Appointment"
                          style={{ marginLeft: "8px" }}
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
                <td colSpan="5" className="no-data">
                  <div className="no-data-content">
                    <span className="no-data-icon">
                      <FaCalendarDay />
                    </span>
                    <p>No appointments scheduled for today</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  </div>
  );
};

export default ReceptionistDashboard;
