import React from "react";
import { useNavigate } from "react-router-dom";
import { RiAdminLine } from "react-icons/ri";
import { FaUsersCog } from "react-icons/fa";
import { FaUser } from "react-icons/fa";
import { FaUserDoctor } from "react-icons/fa6";
import { FaUserInjured } from "react-icons/fa6";
import { GrBarChart } from "react-icons/gr";

import "./AdminPanel.css";

import { useAuth } from "../../context/useAuth";
import LogoutButton from "../../components/ui/LogoutButton/LogoutButton";

import AdminUsersButton from "../../components/AdminUsersButton/AdminUsersButton";
import AdminDashboardButton from "../../components/AdminDashboardButton/AdminDashboardButton";
import AdminDoctorsButton from "../../components/AdminDoctorsButton/AdminDoctorsButton";
import AdminPatientsButton from "../../components/AdminPatientsButton/AdminPatientsButton";
import AdminAppointmentsButton from "../../components/AdminAppointmentsButton/AdminAppointmentsButton";

import { AdminProvider, useAdmin } from "../../context/AdminContext";

// ---------- Header ----------
const AdminHeader = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="admin-header">
      <div className="admin-header-content">
        <div className="admin-header-left">
          <div
            className="admin-title-group"
            onClick={() => navigate("/")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") navigate("/");
            }}
            title="Go to Home"
          >
            <RiAdminLine className="admin-icon" />
            <div className="admin-title-text">
              <h1 className="admin-title">SmartCare Admin</h1>
              <span className="user-name admin-user-name">
                Welcome, {user?.username}
              </span>
            </div>
          </div>
        </div>
        <div className="admin-header-right">
          <LogoutButton>Logout</LogoutButton>
        </div>
      </div>
    </div>
  );
};

// ---------- Sidebar ----------
const AdminSidebar = () => {
  const { activeSection, setActiveSection } = useAdmin();

  return (
    <nav className="admin-sidebar">
      <div className="sidebar-content">
        <div className="admin-nav-section">
          <AdminDashboardButton
            activeSection={activeSection}
            setActiveSection={setActiveSection}
          />
          <AdminUsersButton
            activeSection={activeSection}
            setActiveSection={setActiveSection}
          />
          <AdminDoctorsButton
            activeSection={activeSection}
            setActiveSection={setActiveSection}
          />
          <AdminPatientsButton
            activeSection={activeSection}
            setActiveSection={setActiveSection}
          />
          <AdminAppointmentsButton
            activeSection={activeSection}
            setActiveSection={setActiveSection}
          />
        </div>
      </div>
    </nav>
  );
};

// ---------- Users section wrapper ----------
const UsersSection = () => {
  const {
    activeSection,
    setActiveSection,
    users,
    openModal,
    handleDeleteUser,
  } = useAdmin();

  if (activeSection !== "users") return null;

  return (
    <AdminUsersButton
      activeSection={activeSection}
      setActiveSection={setActiveSection}
      renderContent={true}
      users={users}
      openModal={openModal}
      handleDeleteUser={handleDeleteUser}
    />
  );
};

// ---------- Appointments section ----------
const AppointmentsSection = () => {
  const { activeSection, appointments } = useAdmin();
  if (activeSection !== "appointments") return null;

  return (
    <div className="section-content admin-appointments">
      <div className="admin-appointments-header">
        <h2>Appointments Overview</h2>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Patient</th>
              <th>Doctor</th>
              <th>Date & Time</th>
              <th>Status</th>
              <th>Reason</th>
            </tr>
          </thead>
          <tbody>
            {appointments.map((appointment) => (
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
                    <small>
                      {new Date(
                        `${appointment.appointmentDate}T${appointment.appointmentTime}`
                      ).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </small>
                  </div>
                </td>
                <td>
                  <span
                    className={`status-badge ${appointment.status.toLowerCase()}`}
                  >
                    {appointment.status}
                  </span>
                </td>
                <td>{appointment.reason || "General consultation"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ---------- Reports section ----------
const ReportsSection = () => {
  const { activeSection, analytics, appointments } = useAdmin();
  if (activeSection !== "reports") return null;

  const doctorCounts = appointments.reduce((acc, a) => {
    const key = a.Doctor
      ? `Dr. ${a.Doctor.firstName} ${a.Doctor.lastName}`
      : "Unknown";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const doctorSummary = Object.entries(doctorCounts).sort(
    (a, b) => b[1] - a[1]
  );

  return (
    <div className="section-content admin-reports">
      <div className="admin-reports-header">
        <h2>Reports</h2>
      </div>

      <div className="stats-grid">
        <div className="stat-card primary">
          <div className="stat-icon">
            <FaUsersCog />
          </div>
          <div className="stat-info">
            <h3>{analytics.totalUsers}</h3>
            <p>Total Users</p>
          </div>
        </div>
        <div className="stat-card success">
          <div className="stat-icon">
            <FaUserDoctor color="green" />
          </div>
          <div className="stat-info">
            <h3>{analytics.totalDoctors}</h3>
            <p>Doctors</p>
          </div>
        </div>
        <div className="stat-card info">
          <div className="stat-icon">
            <FaUserInjured />
          </div>
          <div className="stat-info">
            <h3>{analytics.totalPatients}</h3>
            <p>Patients</p>
          </div>
        </div>
        <div className="stat-card warning">
          <div className="stat-icon">
            <GrBarChart color="orange" />
          </div>
          <div className="stat-info">
            <h3>{analytics.todayAppointments}</h3>
            <p>Today's Appointments</p>
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
                    className={`status-indicator ${String(
                      status
                    ).toLowerCase()}`}
                  ></div>
                  <span className="status-label">{status}</span>
                  <span className="status-count">{count}</span>
                </div>
              )
            )}
          </div>
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Doctor</th>
              <th>Total Appointments</th>
            </tr>
          </thead>
          <tbody>
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

// ---------- Modal ----------
const AdminModal = () => {
  const {
    showModal,
    modalType,
    error,
    success,
    userForm,
    setUserForm,
    selectedItem,
    closeModal,
    handleSubmitUser,
    confirmDeleteUser,
    loading,
  } = useAdmin();

  if (!showModal) return null;

  return (
    <div className="modal-overlay" onClick={closeModal}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>
            {modalType === "createUser" && "Create New User"}
            {modalType === "editUser" && "Edit User"}
            {modalType === "confirmDeleteUser" && "Confirm Delete"}
          </h3>
          <button className="modal-close" onClick={closeModal}>
            ×
          </button>
        </div>

        <div className="modal-content">
          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          {(modalType === "createUser" || modalType === "editUser") && (
            <form onSubmit={handleSubmitUser} className="user-form">
              <div className="form-row">
                <div className="form-group">
                  <label>First Name</label>
                  <input
                    type="text"
                    value={userForm.firstName}
                    onChange={(e) =>
                      setUserForm({ ...userForm, firstName: e.target.value })
                    }
                    className="form-control"
                    placeholder="Enter first name"
                  />
                </div>
                <div className="form-group">
                  <label>Last Name</label>
                  <input
                    type="text"
                    value={userForm.lastName}
                    onChange={(e) =>
                      setUserForm({ ...userForm, lastName: e.target.value })
                    }
                    className="form-control"
                    placeholder="Enter last name"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Username</label>
                  <input
                    type="text"
                    value={userForm.username}
                    onChange={(e) =>
                      setUserForm({ ...userForm, username: e.target.value })
                    }
                    className="form-control"
                    required
                    placeholder="Enter a unique username"
                  />
                </div>
                <div className="form-group">
                  <label>Password</label>
                  <input
                    type="password"
                    value={userForm.password}
                    onChange={(e) =>
                      setUserForm({ ...userForm, password: e.target.value })
                    }
                    className="form-control"
                    required={modalType === "createUser"}
                    placeholder={
                      modalType === "editUser"
                        ? "Leave blank to keep current password"
                        : "Set a secure password"
                    }
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Phone</label>
                  <input
                    type="tel"
                    value={userForm.phone}
                    onChange={(e) =>
                      setUserForm({ ...userForm, phone: e.target.value })
                    }
                    className="form-control"
                    placeholder="Enter phone number"
                  />
                </div>
                <div className="form-group">
                  <label>Role</label>
                  <select
                    value={userForm.role}
                    onChange={(e) =>
                      setUserForm({ ...userForm, role: e.target.value })
                    }
                    className="form-control"
                    required
                  >
                    <option value="doctor">Doctor</option>
                    <option value="receptionist">Receptionist</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>

              {userForm.role === "doctor" && (
                <div className="form-row">
                  <div className="form-group">
                    <label>Specialization</label>
                    <input
                      type="text"
                      value={userForm.specialization}
                      onChange={(e) =>
                        setUserForm({
                          ...userForm,
                          specialization: e.target.value,
                        })
                      }
                      className="form-control"
                      placeholder="e.g., Cardiology, Pediatrics"
                    />
                  </div>
                </div>
              )}

              <div className="form-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={closeModal}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {modalType === "createUser" ? "Create User" : "Update User"}
                </button>
              </div>
            </form>
          )}

          {modalType === "confirmDeleteUser" && (
            <div className="confirm-delete">
              <p>
                Are you sure you want to delete user{" "}
                <strong>{selectedItem?.username}</strong>?
              </p>
              <div className="form-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={closeModal}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={confirmDeleteUser}
                  disabled={loading}
                >
                  Delete
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ---------- Main layout ----------
const AdminMain = () => {
  const {
    activeSection,
    loading,
    error,
    success,
    analytics,
    systemSettings,
    openModal,
    doctors,
  } = useAdmin();
  const { setActiveSection } = useAdmin();

  return (
    <div className="admin-layout">
      <AdminSidebar />

      <main className="admin-main">
        {loading && <div className="loading-overlay"></div>}

        {error && (
          <div className="alert alert-error">
            <span className="alert-icon">⚠️</span>
            {error}
          </div>
        )}

        {success && (
          <div className="alert alert-success">
            <span className="alert-icon">✅</span>
            {success}
          </div>
        )}

        {activeSection === "dashboard" && (
          <AdminDashboardButton
            activeSection={activeSection}
            setActiveSection={setActiveSection}
            renderContent={true}
            analytics={analytics}
            systemSettings={systemSettings}
            openModal={openModal}
          />
        )}

        <UsersSection />

        {activeSection === "doctors" && (
          <AdminDoctorsButton
            activeSection={activeSection}
            setActiveSection={setActiveSection}
            renderContent={true}
            doctors={doctors}
            openModal={openModal}
          />
        )}

        {activeSection === "patients" && (
          <AdminPatientsButton
            activeSection={activeSection}
            setActiveSection={setActiveSection}
            renderContent={true}
          />
        )}

        <AppointmentsSection />
        <ReportsSection />
      </main>

      <AdminModal />
    </div>
  );
};

const AdminPanel = () => {
  return (
    <AdminProvider>
      <div className="admin-panel">
        <AdminHeader />
        <AdminMain />
      </div>
    </AdminProvider>
  );
};

export default AdminPanel;
