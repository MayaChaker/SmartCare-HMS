import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { FaUser } from "react-icons/fa";
import { FaUsersCog } from "react-icons/fa";
import { FaUserDoctor } from "react-icons/fa6";
import { FaUserInjured } from "react-icons/fa6";
import { GrBarChart } from "react-icons/gr";
import { CiSettings } from "react-icons/ci";
import "./AdminPanel.css";
import AdminHeader from "../../components/AdminHeader/AdminHeader";
import AdminSidebar from "../../components/AdminSidebar/AdminSidebar";
import AdminUsersButton from "../../components/AdminUsersButton/AdminUsersButton";
import AdminDashboardButton from "../../components/AdminDashboardButton/AdminDashboardButton";
import AdminDoctorsButton from "../../components/AdminDoctorsButton/AdminDoctorsButton";
import AdminPatientsButton from "../../components/AdminPatientsButton/AdminPatientsButton";

const AdminPanel = () => {
  const { user, logout } = useAuth();
  const [activeSection, setActiveSection] = useState("dashboard");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  // Live current time for dashboard header
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Data states
  const [analytics, setAnalytics] = useState({
    totalUsers: 0,
    totalPatients: 0,
    totalDoctors: 0,
    totalAppointments: 0,
    todayAppointments: 0,
    recentRegistrations: 0,
    appointmentsByStatus: {},
  });
  const [users, setUsers] = useState([]);
  const [doctors, setDoctors] = useState([]);
  // Patients state removed - now handled by AdminPatientsButton component
  const [appointments, setAppointments] = useState([]);
  const [systemSettings, setSystemSettings] = useState({});

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);

  // Form states
  const [userForm, setUserForm] = useState({
    username: "",
    password: "",
    role: "doctor",
    firstName: "",
    lastName: "",
    specialization: "",
    phone: "",
    email: "",
  });

  const [settingsForm, setSettingsForm] = useState({
    maintenanceMode: false,
    allowRegistration: true,
    maxAppointmentsPerDay: 0,
    unlimitedAppointments: true,
  });

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        setError("No authentication token found. Please login again.");
        return;
      }

      // Load analytics
      try {
        const analyticsResponse = await fetch(
          "/api/admin/analytics",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (analyticsResponse.ok) {
          const analyticsData = await analyticsResponse.json();
          setAnalytics(analyticsData);
        } else if (analyticsResponse.status === 401) {
          setError("Session expired. Please login again.");
          logout();
          return;
        } else {
          console.warn("Failed to load analytics:", analyticsResponse.status);
        }
      } catch (err) {
        console.warn("Analytics API error:", err);
      }

      // Load users
      try {
        const usersResponse = await fetch(
          "/api/admin/users",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (usersResponse.ok) {
          const usersData = await usersResponse.json();
          setUsers(usersData);
        } else if (usersResponse.status === 401) {
          setError("Session expired. Please login again.");
          logout();
          return;
        } else {
          console.warn("Failed to load users:", usersResponse.status);
        }
      } catch (err) {
        console.warn("Users API error:", err);
      }

      // Load doctors
      try {
        const doctorsResponse = await fetch(
          "/api/admin/doctors",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (doctorsResponse.ok) {
          const doctorsData = await doctorsResponse.json();
          setDoctors(doctorsData);
        } else if (doctorsResponse.status === 401) {
          setError("Session expired. Please login again.");
          logout();
          return;
        } else {
          console.warn("Failed to load doctors:", doctorsResponse.status);
        }
      } catch (err) {
        console.warn("Doctors API error:", err);
      }

      // Patients are now handled by AdminPatientsButton component

      // Load appointments
      try {
        const appointmentsResponse = await fetch(
          "/api/admin/appointments",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (appointmentsResponse.ok) {
          const appointmentsData = await appointmentsResponse.json();
          setAppointments(appointmentsData);
        } else if (appointmentsResponse.status === 401) {
          setError("Session expired. Please login again.");
          logout();
          return;
        } else {
          console.warn(
            "Failed to load appointments:",
            appointmentsResponse.status
          );
        }
      } catch (err) {
        console.warn("Appointments API error:", err);
      }

      // Load system settings
      try {
        const settingsResponse = await fetch(
          "/api/admin/settings",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (settingsResponse.ok) {
          const settingsData = await settingsResponse.json();
          setSystemSettings(settingsData);
          const isUnlimited =
            settingsData.maxAppointmentsPerDay === null ||
            settingsData.maxAppointmentsPerDay === 0;
          setSettingsForm({
            maintenanceMode: settingsData.maintenanceMode || false,
            allowRegistration:
              settingsData.allowRegistration !== undefined
                ? settingsData.allowRegistration
                : true,
            maxAppointmentsPerDay:
              isUnlimited
                ? 0
                : typeof settingsData.maxAppointmentsPerDay === "number"
                ? settingsData.maxAppointmentsPerDay
                : 50,
            unlimitedAppointments: isUnlimited,
          });
        } else if (settingsResponse.status === 401) {
          setError("Session expired. Please login again.");
          logout();
          return;
        } else {
          console.warn("Failed to load settings:", settingsResponse.status);
        }
      } catch (err) {
        console.warn("Settings API error:", err);
      }
    } catch (error) {
      console.error("Error loading admin data:", error);
      setError(
        "Failed to load data. Please check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitUser = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const isEdit = modalType === "editUser" && selectedItem?.id;
      const url = isEdit ? `/api/admin/users/${selectedItem.id}` : "/api/admin/users";
      const method = isEdit ? "PUT" : "POST";

      const payload = { ...userForm };
      // If editing and password left blank, do not send password to avoid conflict with validation
      if (isEdit && !payload.password) {
        delete payload.password;
      }

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setSuccess(isEdit ? "User updated successfully!" : "User created successfully!");
        await loadAdminData();
        closeModal();
      } else {
        const errorData = await response.json();
        setError(errorData.message || (isEdit ? "Failed to update user" : "Failed to create user"));
      }
    } catch (error) {
      console.error("Error submitting user:", error);
      setError(isEdit ? "Failed to update user. Please try again." : "Failed to create user. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Open confirmation modal instead of deleting immediately
  const handleDeleteUser = (userId) => {
    const user = users.find((u) => u.id === userId);
    openModal("confirmDeleteUser", user);
  };

  // Perform deletion after user confirms in the modal
  const confirmDeleteUser = async () => {
    if (!selectedItem?.id) {
      closeModal();
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/admin/users/${selectedItem.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setSuccess("User deleted successfully!");
        await loadAdminData();
        closeModal();
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Failed to delete user");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      setError("Failed to delete user. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSettings = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(settingsForm),
      });

      if (response.ok) {
        setSuccess("Settings updated successfully!");
        await loadAdminData();
        closeModal();
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Failed to update settings");
      }
    } catch (error) {
      console.error("Error updating settings:", error);
      setError("Failed to update settings. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const openModal = (type, item = null) => {
    setModalType(type);
    setSelectedItem(item);
    setShowModal(true);
    setError("");
    setSuccess("");

    if (type === "createUser") {
      setUserForm({
        username: "",
        password: "",
        role: "doctor",
        firstName: "",
        lastName: "",
        specialization: "",
        phone: "",
        email: "",
      });
    } else if (type === "editUser" && item) {
      setUserForm({
        username: item.username,
        password: "",
        role: item.role,
        firstName: item.firstName || "",
        lastName: item.lastName || "",
        specialization: item.specialization || "",
        phone: item.phone || "",
        email: item.email || "",
      });
    } else if (type === "confirmDeleteUser") {
      // No form changes needed for delete confirmation
      setUserForm((prev) => ({ ...prev }));
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setModalType("");
    setSelectedItem(null);
    setError("");
    setSuccess("");
  };

  const renderDashboard = () => (
    <div className="dashboard-content">
      <div className="dashboard-header">
        <h2>System Overview</h2>
        <div className="current-time">
          <span className="time-label">Current Time</span>
          <span className="time-value">
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card primary">
          <div className="stat-icon">
            {" "}
            <FaUsersCog />
          </div>
          <div className="stat-info">
            <h3>{analytics.totalUsers}</h3>
            <p>Total Users</p>
          </div>
        </div>
        <div className="stat-card success">
          <div className="stat-icon">
            {" "}
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
            {" "}
            <GrBarChart color="orange" />
          </div>
          <div className="stat-info">
            <h3>{analytics.todayAppointments}</h3>
            <p>Today's Appointments</p>
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
                <GrBarChart color="orange" />
              </span>
              <div className="activity-info">
                <p>Total Appointments: {analytics.totalAppointments}</p>
                <small>System-wide</small>
              </div>
            </div>
            <div className="activity-item">
              <span className="activity-icon">
                <FaUser />
              </span>
              <div className="activity-info">
                <p>New Registrations: {analytics.recentRegistrations}</p>
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
                  {systemSettings.maintenanceMode ? "Maintenance" : "Active"}
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
            onClick={() => openModal("createUser")}
          >
            <span className="btn-icon">
              {" "}
              <FaUser color="blue" />
            </span>
            Add New User
          </button>
          <button
            className="action-btn secondary"
            onClick={() => setActiveSection("settings")}
          >
            <span className="btn-icon">
              {" "}
              <CiSettings />
            </span>
            System Settings
          </button>
          <button
            className="action-btn info"
            onClick={() => setActiveSection("reports")}
          >
            <span className="btn-icon">
              <GrBarChart color="orange" />
            </span>
            View Reports
          </button>
        </div>
      </div>
    </div>
  );

  const renderUserManagement = () => (
    <AdminUsersButton
      activeSection={activeSection}
      setActiveSection={setActiveSection}
      renderContent={true}
      users={users}
      openModal={openModal}
      handleDeleteUser={handleDeleteUser}
    />
  );

  const renderDoctors = () => (
    <div className="section-content">
      <div className="section-header">
        <h2>Doctors Management</h2>
      </div>

      <div className="cards-grid">
        {doctors.map((doctor) => (
          <div key={doctor.id} className="doctor-card">
            <div className="doctor-header">
              <h3>
                Dr. {doctor.firstName} {doctor.lastName}
              </h3>
              <span className="specialization">{doctor.specialization}</span>
            </div>
            <div className="doctor-info">
              <p>
                <strong>Email:</strong> {doctor.email}
              </p>
              <p>
                <strong>Phone:</strong> {doctor.phone}
              </p>
              <p>
                <strong>License:</strong> {doctor.licenseNumber}
              </p>
              <p>
                <strong>Experience:</strong> {doctor.experience} years
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // renderPatients function removed - now handled by AdminPatientsButton component

  const renderAppointments = () => (
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
                        appointment.appointmentDate
                      ).toLocaleTimeString()}
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

  const renderReports = () => {
    const doctorCounts = appointments.reduce((acc, a) => {
      const key = a.Doctor ? `Dr. ${a.Doctor.firstName} ${a.Doctor.lastName}` : "Unknown";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    const doctorSummary = Object.entries(doctorCounts).sort((a, b) => b[1] - a[1]);

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
              {Object.entries(analytics.appointmentsByStatus || {}).map(([status, count]) => (
                <div key={status} className="status-item">
                  <div className={`status-indicator ${String(status).toLowerCase()}`}></div>
                  <span className="status-label">{status}</span>
                  <span className="status-count">{count}</span>
                </div>
              ))}
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

  const renderSettings = () => (
    <div className="section-content admin-settings">
      <div className="admin-settings-header">
        <h2>System Settings</h2>
      </div>

      <div className="settings-container">
        <div className="settings-card">
          <div className="card-header">
            <h3>System Configuration</h3>
          </div>
          <form onSubmit={handleUpdateSettings} className="settings-form">
            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={settingsForm.maintenanceMode}
                  onChange={(e) =>
                    setSettingsForm({
                      ...settingsForm,
                      maintenanceMode: e.target.checked,
                    })
                  }
                />
                <span className="checkmark"></span>
                Maintenance Mode
              </label>
              <small>Enable maintenance mode to restrict system access</small>
            </div>

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={settingsForm.allowRegistration}
                  onChange={(e) =>
                    setSettingsForm({
                      ...settingsForm,
                      allowRegistration: e.target.checked,
                    })
                  }
                />
                <span className="checkmark"></span>
                Allow New Registrations
              </label>
              <small>Allow new patient registrations</small>
            </div>

            <div className="form-group">
              <label>Maximum Appointments Per Day</label>
              <input
                type="number"
                value={settingsForm.unlimitedAppointments ? "" : settingsForm.maxAppointmentsPerDay}
                onChange={(e) =>
                  setSettingsForm({
                    ...settingsForm,
                    unlimitedAppointments: e.target.value === "",
                    maxAppointmentsPerDay:
                      e.target.value === "" ? 0 : parseInt(e.target.value),
                  })
                }
                className="form-control"
                placeholder="Unlimited"
              />
              <small>
                Leave blank to set Unlimited, or enter a number for a limit.
              </small>
            </div>

            <div className="form-actions">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? "Updating..." : "Update Settings"}
              </button>
            </div>
          </form>
        </div>

        <div className="settings-card">
          <div className="card-header">
            <h3>System Information</h3>
          </div>
          <div className="system-info">
            <div className="info-item">
              <span className="info-label">System Name:</span>
              <span className="info-value">
                {systemSettings.systemName || "SmartCare Medical System"}
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">Version:</span>
              <span className="info-value">
                {systemSettings.version || "1.0.0"}
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">Status:</span>
              <span
                className={`info-value ${
                  systemSettings.maintenanceMode ? "maintenance" : "active"
                }`}
              >
                {systemSettings.maintenanceMode ? "Maintenance Mode" : "Active"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderModal = () => {
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
                {/* First name, Last name */}
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

                {/* Username, Password */}
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

                {/* Phone, Role */}
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

                {/* Specialization (doctor only) */}
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
                    {loading
                      ? "Saving..."
                      : modalType === "createUser"
                      ? "Create User"
                      : "Update User"}
                  </button>
                </div>
              </form>
            )}

            {modalType === "confirmDeleteUser" && (
              <div className="confirm-delete">
                <p>
                  Are you sure you want to delete user
                  {" "}
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
                    {loading ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="admin-panel">
      <AdminHeader user={user} logout={logout} />

      <div className="admin-layout">
        <AdminSidebar
          activeSection={activeSection}
          setActiveSection={setActiveSection}
        />

        <main className="admin-main">
          {loading && (
            <div className="loading-overlay">
              <div className="loading-spinner"></div>
              <p>Loading...</p>
            </div>
          )}

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
          {activeSection === "users" && renderUserManagement()}
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
          {activeSection === "appointments" && renderAppointments()}
          {activeSection === "reports" && renderReports()}
          {activeSection === "settings" && renderSettings()}
        </main>
      </div>

      {renderModal()}
    </div>
  );
};

export default AdminPanel;
