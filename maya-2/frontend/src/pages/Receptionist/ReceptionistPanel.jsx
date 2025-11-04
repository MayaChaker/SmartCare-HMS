import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./ReceptionistPanel.css";
import { FaUserTie } from "react-icons/fa6";
import { IoIosLogOut } from "react-icons/io";
import { GrBarChart } from "react-icons/gr";
import { FaUserInjured, FaUserDoctor } from "react-icons/fa6";
import { GoChecklist } from "react-icons/go";
import { MdQueue } from "react-icons/md";
import { FaCalendarDay, FaPlus } from "react-icons/fa";
import { FaUsers } from "react-icons/fa";
import { FaClipboardList } from "react-icons/fa";
import { FaPen } from "react-icons/fa";
import { MdVisibility } from "react-icons/md";

const ReceptionistPanel = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("dashboard");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // State for data
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [queueStatus, setQueueStatus] = useState({
    totalInQueue: 0,
    appointments: [],
  });

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);

  // Form states
  const [patientForm, setPatientForm] = useState({
    username: "",
    password: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    medicalHistory: "",
  });

  const [appointmentForm, setAppointmentForm] = useState({
    patientId: "",
    doctorId: "",
    appointmentDate: "",
    reason: "",
  });

  useEffect(() => {
    loadReceptionistData();
  }, []);

  const loadReceptionistData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");

      // Load all data in parallel
      const [patientsRes, doctorsRes, todayAppointmentsRes, queueRes] =
        await Promise.all([
          fetch("/api/receptionist/patients", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("/api/receptionist/doctors", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("/api/receptionist/appointments/today", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("/api/receptionist/queue", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

      if (patientsRes.ok) {
        const patientsData = await patientsRes.json();
        setPatients(patientsData);
      }

      if (doctorsRes.ok) {
        const doctorsData = await doctorsRes.json();
        setDoctors(doctorsData);
      }

      if (todayAppointmentsRes.ok) {
        const todayData = await todayAppointmentsRes.json();
        setTodayAppointments(todayData);
      }

      if (queueRes.ok) {
        const queueData = await queueRes.json();
        setQueueStatus(queueData);
      }
    } catch (error) {
      console.error("Error loading receptionist data:", error);
      setError("Failed to load data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterPatient = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/receptionist/patients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(patientForm),
      });

      if (response.ok) {
        setSuccess("Patient registered successfully!");
        await loadReceptionistData();
        closeModal();
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Failed to register patient");
      }
    } catch (error) {
      console.error("Error registering patient:", error);
      setError("Failed to register patient. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleAppointment = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/receptionist/appointments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(appointmentForm),
      });

      if (response.ok) {
        setSuccess("Appointment scheduled successfully!");
        await loadReceptionistData();
        closeModal();
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Failed to schedule appointment");
      }
    } catch (error) {
      console.error("Error scheduling appointment:", error);
      setError("Failed to schedule appointment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async (appointmentId) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `/api/receptionist/checkin/${appointmentId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        setSuccess("Patient checked in successfully!");
        await loadReceptionistData();
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Failed to check in patient");
      }
    } catch (error) {
      console.error("Error checking in patient:", error);
      setError("Failed to check in patient. Please try again.");
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

    if (type === "registerPatient") {
      setPatientForm({
        username: "",
        password: "",
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        dateOfBirth: "",
        medicalHistory: "",
      });
    } else if (type === "scheduleAppointment") {
      setAppointmentForm({
        patientId: "",
        doctorId: "",
        appointmentDate: "",
        reason: "",
      });
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
    <div className="receptionist-dashboard">
      <div className="dashboard-header">
        <div className="header-content">
          <h2 className="dashboard-title">Reception Dashboard</h2>
        </div>
        <div className="header-actions">
          <div className="current-time">
            <span className="time-label">Current Time</span>
            <span className="time-value">
              {new Date().toLocaleTimeString()}
            </span>
          </div>
        </div>
      </div>

      <div className="dashboard-stats">
        <div className="stat-card primary">
          <div className="stat-icon">
            <FaCalendarDay />
          </div>
          <div className="stat-content">
            <h3>{todayAppointments.length}</h3>
            <p>Today's Appointments</p>
            <span className="stat-trend">+2 from yesterday</span>
          </div>
        </div>

        <div className="stat-card success">
          <div className="stat-icon">
            <MdQueue color="green" />
          </div>
          <div className="stat-content">
            <h3>{queueStatus.totalInQueue}</h3>
            <p>Patients in Queue</p>
            <span className="stat-trend">Active now</span>
          </div>
        </div>

        <div className="stat-card info">
          <div className="stat-icon">
            <FaUsers />
          </div>
          <div className="stat-content">
            <h3>{patients.length}</h3>
            <p>Total Patients</p>
            <span className="stat-trend">Registered</span>
          </div>
        </div>

        <div className="stat-card warning">
          <div className="stat-icon">
            <FaUserDoctor color="orange" />
          </div>
          <div className="stat-content">
            <h3>{doctors.length}</h3>
            <p>Available Doctors</p>
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
            <h4>Register New Patient</h4>
            <p>Add a new patient to the system</p>
          </div>
          <button
            className="action-button primary"
            onClick={() => openModal("registerPatient")}
          >
            Register
          </button>
        </div>

        <div className="action-card">
          <div className="action-icon">
            <FaClipboardList />
          </div>
          <div className="action-content">
            <h4>Schedule Appointment</h4>
            <p>Book a new appointment for a patient</p>
          </div>
          <button
            className="action-button primary"
            onClick={() => openModal("scheduleAppointment")}
          >
            Schedule
          </button>
        </div>
      </div>

      <div className="dashboard-table-section">
        <div className="table-header">
          <h4 className="table-title">Today's Appointments</h4>
          <div className="table-filters">
            <select className="filter-select">
              <option>All Status</option>
              <option>Scheduled</option>
              <option>Checked-in</option>
              <option>Completed</option>
            </select>
          </div>
        </div>

        <div className="table-container">
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
              {todayAppointments.length > 0 ? (
                todayAppointments.map((appointment) => (
                  <tr key={appointment.id} className="appointment-row">
                    <td className="doctor-cell">
                      <span className="doctor-name">
                        Dr. {appointment.Doctor?.firstName}{" "}
                        {appointment.Doctor?.lastName}
                      </span>
                    </td>
                    <td className="patient-cell">
                      <div className="patient-info">
                        <span className="patient-name">
                          {appointment.Patient?.firstName}{" "}
                          {appointment.Patient?.lastName}
                        </span>
                        <span className="patient-id">
                          ID: {appointment.Patient?.id}
                        </span>
                      </div>
                    </td>
                    <td className="status-cell">
                      <span className={`status-badge ${appointment.status}`}>
                        {appointment.status}
                      </span>
                    </td>
                    <td className="time-cell">
                      <span className="appointment-time">
                        {new Date(
                          appointment.appointmentDate
                        ).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </td>
                    <td className="actions-cell">
                      <div className="action-buttons">
                        <button
                          className="btn-icon edit"
                          onClick={() =>
                            openModal("editAppointment", appointment)
                          }
                          title="Edit Appointment"
                        >
                          <FaPen />
                        </button>
                        <button
                          className="btn-icon view"
                          onClick={() =>
                            openModal("viewPatient", appointment.Patient)
                          }
                          title="View Patient"
                        >
                          <MdVisibility />
                        </button>
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

  const renderPatients = () => (
    <div className="table-card">
      <div className="table-header">
        <h1 className="table-title">Patients</h1>
        <button
          className="btn btn-primary"
          onClick={() => openModal("registerPatient")}
        >
          Register New Patient
        </button>
      </div>
      <div className="table-container users-table">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Date of Birth</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {patients.map((patient) => (
              <tr key={patient.id}>
                <td>
                  {patient.firstName} {patient.lastName}
                </td>
                <td>{patient.email}</td>
                <td>{patient.phone}</td>
                <td>{patient.dateOfBirth}</td>
                <td>
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={() => openModal("viewPatient", patient)}
                  >
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderAppointments = () => (
    <div className="table-card">
      <div className="table-header">
        <h2 className="table-title">Appointment Management</h2>
        <button
          className="btn btn-primary"
          onClick={() => openModal("scheduleAppointment")}
        >
          Schedule New Appointment
        </button>
      </div>
      <div className="table-container appointments-table">
        <table>
          <thead>
            <tr>
              <th>Patient</th>
              <th>Doctor</th>
              <th>Date & Time</th>
              <th>Reason</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {todayAppointments.map((appointment) => (
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
                    <div style={{ fontSize: "12px", color: "#666" }}>
                      {new Date(
                        appointment.appointmentDate
                      ).toLocaleTimeString()}
                    </div>
                  </div>
                </td>
                <td>{appointment.reason || "General consultation"}</td>
                <td>
                  <span
                    className={`status-badge status-${appointment.status.toLowerCase()}`}
                  >
                    {appointment.status}
                  </span>
                </td>
                <td>
                  {appointment.status === "scheduled" && (
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={() => handleCheckIn(appointment.id)}
                    >
                      Check In
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderQueue = () => (
    <div className="table-card">
      <div className="table-header">
        <h2 className="table-title">Patient Queue</h2>
        <p className="table-subtitle">
          Total patients in queue: {queueStatus.totalInQueue}
        </p>
      </div>
      <div className="table-container">
        <div className="queue-list">
          {queueStatus.appointments.map((appointment, index) => (
            <div key={appointment.id} className="queue-item">
              <div className="queue-number">{index + 1}</div>
              <div className="queue-info">
                <h4>
                  {appointment.Patient
                    ? `${appointment.Patient.firstName} ${appointment.Patient.lastName}`
                    : "N/A"}
                </h4>
                <p>
                  Dr.{" "}
                  {appointment.Doctor
                    ? `${appointment.Doctor.firstName} ${appointment.Doctor.lastName}`
                    : "N/A"}
                </p>
                <p>
                  {new Date(appointment.appointmentDate).toLocaleTimeString()}
                </p>
              </div>
              <div className="queue-status">
                <span
                  className={`status-badge status-${appointment.status.toLowerCase()}`}
                >
                  {appointment.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderModal = () => {
    if (!showModal) return null;

    return (
      <div className="modal-overlay" onClick={closeModal}>
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h3>
              {modalType === "registerPatient" && "Register New Patient"}
              {modalType === "scheduleAppointment" && "Schedule Appointment"}
              {modalType === "viewPatient" && "Patient Details"}
            </h3>
            <button className="modal-close" onClick={closeModal}>
              ×
            </button>
          </div>
          <div className="modal-content">
            {error && <div className="alert alert-error">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            {modalType === "registerPatient" && (
              <form onSubmit={handleRegisterPatient}>
                <div className="form-group">
                  <label>Username</label>
                  <input
                    type="text"
                    value={patientForm.username}
                    onChange={(e) =>
                      setPatientForm({
                        ...patientForm,
                        username: e.target.value,
                      })
                    }
                    className="form-control"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Password</label>
                  <input
                    type="password"
                    value={patientForm.password}
                    onChange={(e) =>
                      setPatientForm({
                        ...patientForm,
                        password: e.target.value,
                      })
                    }
                    className="form-control"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>First Name</label>
                  <input
                    type="text"
                    value={patientForm.firstName}
                    onChange={(e) =>
                      setPatientForm({
                        ...patientForm,
                        firstName: e.target.value,
                      })
                    }
                    className="form-control"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Last Name</label>
                  <input
                    type="text"
                    value={patientForm.lastName}
                    onChange={(e) =>
                      setPatientForm({
                        ...patientForm,
                        lastName: e.target.value,
                      })
                    }
                    className="form-control"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={patientForm.email}
                    onChange={(e) =>
                      setPatientForm({ ...patientForm, email: e.target.value })
                    }
                    className="form-control"
                  />
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input
                    type="tel"
                    value={patientForm.phone}
                    onChange={(e) =>
                      setPatientForm({ ...patientForm, phone: e.target.value })
                    }
                    className="form-control"
                  />
                </div>
                <div className="form-group">
                  <label>Date of Birth</label>
                  <input
                    type="date"
                    value={patientForm.dateOfBirth}
                    onChange={(e) =>
                      setPatientForm({
                        ...patientForm,
                        dateOfBirth: e.target.value,
                      })
                    }
                    className="form-control"
                  />
                </div>
                <div className="form-group">
                  <label>Medical History</label>
                  <textarea
                    value={patientForm.medicalHistory}
                    onChange={(e) =>
                      setPatientForm({
                        ...patientForm,
                        medicalHistory: e.target.value,
                      })
                    }
                    className="form-control"
                    rows="3"
                  />
                </div>
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
                    {loading ? "Registering..." : "Register Patient"}
                  </button>
                </div>
              </form>
            )}

            {modalType === "scheduleAppointment" && (
              <form onSubmit={handleScheduleAppointment}>
                <div className="form-group">
                  <label>Patient</label>
                  <select
                    value={appointmentForm.patientId}
                    onChange={(e) =>
                      setAppointmentForm({
                        ...appointmentForm,
                        patientId: e.target.value,
                      })
                    }
                    className="form-control"
                    required
                  >
                    <option value="">Select Patient</option>
                    {patients.map((patient) => (
                      <option key={patient.id} value={patient.id}>
                        {patient.firstName} {patient.lastName}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Doctor</label>
                  <select
                    value={appointmentForm.doctorId}
                    onChange={(e) =>
                      setAppointmentForm({
                        ...appointmentForm,
                        doctorId: e.target.value,
                      })
                    }
                    className="form-control"
                    required
                  >
                    <option value="">Select Doctor</option>
                    {doctors.map((doctor) => (
                      <option key={doctor.id} value={doctor.id}>
                        Dr. {doctor.firstName} {doctor.lastName} -{" "}
                        {doctor.specialization}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Date & Time</label>
                  <input
                    type="datetime-local"
                    value={appointmentForm.appointmentDate}
                    onChange={(e) =>
                      setAppointmentForm({
                        ...appointmentForm,
                        appointmentDate: e.target.value,
                      })
                    }
                    className="form-control"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Reason</label>
                  <textarea
                    value={appointmentForm.reason}
                    onChange={(e) =>
                      setAppointmentForm({
                        ...appointmentForm,
                        reason: e.target.value,
                      })
                    }
                    className="form-control"
                    rows="3"
                    placeholder="Reason for appointment"
                  />
                </div>
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
                    {loading ? "Scheduling..." : "Schedule Appointment"}
                  </button>
                </div>
              </form>
            )}

            {modalType === "viewPatient" && selectedItem && (
              <div className="patient-details">
                <div className="profile-info">
                  <div className="profile-field">
                    <span className="profile-label">Name</span>
                    <span className="profile-value">
                      {selectedItem.firstName} {selectedItem.lastName}
                    </span>
                  </div>
                  <div className="profile-field">
                    <span className="profile-label">Email</span>
                    <span className="profile-value">{selectedItem.email}</span>
                  </div>
                  <div className="profile-field">
                    <span className="profile-label">Phone</span>
                    <span className="profile-value">{selectedItem.phone}</span>
                  </div>
                  <div className="profile-field">
                    <span className="profile-label">Date of Birth</span>
                    <span className="profile-value">
                      {selectedItem.dateOfBirth}
                    </span>
                  </div>
                  <div className="profile-field">
                    <span className="profile-label">Medical History</span>
                    <span className="profile-value">
                      {selectedItem.medicalHistory || "No history available"}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="receptionist-panel">
      <div className="receptionist-header">
        <div
          className="header-brand"
          onClick={() => navigate("/")}
          role="button"
          tabIndex={0}
          aria-label="Go to Home"
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") navigate("/");
          }}
          title="Go to Home"
        >
          <div>
            <FaUserTie className="receptionist-icon" />
          </div>
          <div className="brand-row">
            <h1 className="panel-title">
              SmartCare Receptionist
              <span className="welcome-inline">
                Welcome back, {user?.username}
              </span>
            </h1>
          </div>
        </div>
        <div className="header-user-info">
          <button onClick={logout} className="btn btn-outline">
            <span className="btn-icon">
              <IoIosLogOut />
            </span>
            Logout
          </button>
        </div>
      </div>

      <div className="receptionist-content">
        <div className="receptionist-sidebar">
          <nav className="sidebar-nav">
            <button
              className={`nav-button ${
                activeSection === "dashboard" ? "active" : ""
              }`}
              onClick={() => setActiveSection("dashboard")}
            >
              <span className="nav-icon">
                <GrBarChart />
              </span>
              <span className="nav-text">Dashboard</span>
            </button>
            <button
              className={`nav-button ${
                activeSection === "patients" ? "active" : ""
              }`}
              onClick={() => setActiveSection("patients")}
            >
              <span className="nav-icon">
                <FaUserInjured />
              </span>
              <span className="nav-text">Patients</span>
            </button>
            <button
              className={`nav-button ${
                activeSection === "appointments" ? "active" : ""
              }`}
              onClick={() => setActiveSection("appointments")}
            >
              <span className="nav-icon">
                <GoChecklist />
              </span>
              <span className="nav-text">Appointments</span>
            </button>
            <button
              className={`nav-button ${
                activeSection === "queue" ? "active" : ""
              }`}
              onClick={() => setActiveSection("queue")}
            >
              <span className="nav-icon">
                <MdQueue />
              </span>
              <span className="nav-text">Queue Management</span>
            </button>
          </nav>
        </div>

        <div className="receptionist-main">
          {loading ? (
            <div className="loading-spinner">Loading...</div>
          ) : (
            <>
              {activeSection === "dashboard" && renderDashboard()}
              {activeSection === "patients" && renderPatients()}
              {activeSection === "appointments" && renderAppointments()}
              {activeSection === "queue" && renderQueue()}
            </>
          )}
        </div>
      </div>

      {renderModal()}
    </div>
  );
};

export default ReceptionistPanel;
