import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaUserMd, FaStethoscope, FaBirthdayCake, FaPills } from "react-icons/fa";
import { IoIosLogOut } from "react-icons/io";
import {
  FiCalendar,
  FiSettings,
  FiClock,
  FiCheckCircle,
  FiClipboard,
  FiEye,
  FiUser,
  FiArrowRight,
  FiBarChart2,
  FiMail,
  FiPhone,
  FiFileText,
  FiAlertTriangle,
  FiX,
  FiRefreshCcw,
  FiPieChart,
  FiUsers,
  FiLoader,
  FiXCircle,
  FiEdit,
} from "react-icons/fi";
import { TbMicroscope } from "react-icons/tb";
import { useAuth } from "../../context/AuthContext";
import "./DoctorPanel.css";

const DoctorPanel = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("dashboard");
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const DAYS_OF_WEEK = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  // Real data from backend
  const [doctorProfile, setDoctorProfile] = useState(null);
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);

  // Form states
  const [medicalRecordForm, setMedicalRecordForm] = useState({
    patientId: "",
    notes: "",
    prescriptions: "",
    testResults: "",
    diagnosis: "",
    medications: "",
  });

  const [availabilityForm, setAvailabilityForm] = useState({
    availability: true,
    workingHours: "",
    workingDays: [],
    startTime: "",
    endTime: "",
  });

  const [editProfileForm, setEditProfileForm] = useState({
    specialization: "",
    experience: "",
    qualification: "",
    licenseNumber: "",
    email: "",
    phone: "",
  });

  // Helper to parse working hours string into days and time range
  const parseWorkingHours = (wh) => {
    if (!wh || typeof wh !== "string") {
      return { days: [], time: "" };
    }
    const timePattern = "\\d{1,2}:\\d{2}(?:\\s*[AP]M)?";
    const fullPattern = new RegExp(`^(.*?)(\\s+(${timePattern})\\s*-\\s*(${timePattern}))$`, "i");
    const match = wh.match(fullPattern);
    let daysPart = wh;
    let time = "";
    if (match) {
      daysPart = (match[1] || "").trim();
      time = `${match[3]} - ${match[4]}`;
    } else {
      const timeOnlyPattern = new RegExp(`^\\s*(${timePattern})\\s*-\\s*(${timePattern})\\s*$`, "i");
      const m2 = wh.match(timeOnlyPattern);
      if (m2) {
        daysPart = "";
        time = `${m2[1]} - ${m2[2]}`;
      }
    }
    const days = daysPart
      .split(",")
      .map((d) => d.trim())
      .filter(Boolean);
    return { days, time };
  };

  useEffect(() => {
    loadDoctorData();
  }, []);

  const loadDoctorData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");

      // Load doctor profile
      const profileResponse = await fetch("/api/doctor/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        setDoctorProfile(profileData);
      }

      // Load patients
      const patientsResponse = await fetch("/api/doctor/patients", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (patientsResponse.ok) {
        const patientsData = await patientsResponse.json();
        setPatients(patientsData);
      }

      // Load appointments
      const appointmentsResponse = await fetch("/api/doctor/appointments", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (appointmentsResponse.ok) {
        const appointmentsData = await appointmentsResponse.json();
        setAppointments(appointmentsData);
      }
    } catch (error) {
      console.error("Error loading doctor data:", error);
      setError("Failed to load data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Format 24-hour time (HH:mm) into 12-hour (h:mm AM/PM)
  const formatTime12 = (t) => {
    if (!t || typeof t !== "string") return "";
    const [hhStr, mm] = t.split(":");
    const hh = parseInt(hhStr, 10);
    if (isNaN(hh) || !mm) return t;
    const ampm = hh >= 12 ? "PM" : "AM";
    const hour12 = hh % 12 === 0 ? 12 : hh % 12;
    return `${hour12}:${mm} ${ampm}`;
  };

  // Parse flexible time input into 24-hour HH:mm
  const parseTimeTo24 = (input) => {
    if (!input || typeof input !== "string") return "";
    const s = input.trim().toUpperCase();
    const m12 = s.match(/^([0-1]?\d):([0-5]\d)\s*([AP]M)$/);
    if (m12) {
      let hh = parseInt(m12[1], 10);
      const mm = m12[2];
      const ap = m12[3];
      if (ap === "PM" && hh !== 12) hh += 12;
      if (ap === "AM" && hh === 12) hh = 0;
      return `${String(hh).padStart(2, "0")}:${mm}`;
    }
    const m24 = s.match(/^([0-2]?\d):([0-5]\d)$/);
    if (m24) {
      let hh = parseInt(m24[1], 10);
      const mm = m24[2];
      if (hh > 23) return "";
      return `${String(hh).padStart(2, "0")}:${mm}`;
    }
    return "";
  };

  const handleUpdateAvailability = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const days = availabilityForm.workingDays || [];
      const startNorm = parseTimeTo24(availabilityForm.startTime?.trim());
      const endNorm = parseTimeTo24(availabilityForm.endTime?.trim());
      const startDisp = startNorm ? formatTime12(startNorm) : "";
      const endDisp = endNorm ? formatTime12(endNorm) : "";
      const daysString = days.join(", ");
      const timeRange = startDisp && endDisp ? `${startDisp} - ${endDisp}` : "";
      const composed = daysString ? `${daysString}${timeRange ? ` ${timeRange}` : ""}` : (timeRange ? timeRange : "");
      const workingHoursString = composed || availabilityForm.workingHours || "";
      const newAvailability = availabilityForm.availability || Boolean(workingHoursString.trim());

      const token = localStorage.getItem("token");
      const response = await fetch(
        "/api/doctor/availability",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            availability: newAvailability,
            workingHours: workingHoursString,
          }),
        }
      );

      if (response.ok) {
        const respData = await response.json();
        const updatedDoctor = respData?.doctor;
        setSuccess("Availability updated successfully!");
        if (updatedDoctor) {
          setDoctorProfile(updatedDoctor);
        } else if (doctorProfile) {
          setDoctorProfile({
            ...doctorProfile,
            availability: newAvailability,
            workingHours: workingHoursString || doctorProfile.workingHours || "",
          });
        } else {
          await loadDoctorData();
        }
        await loadDoctorData();
        closeModal();
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Failed to update availability");
      }
    } catch (error) {
      console.error("Error updating availability:", error);
      setError("Failed to update availability. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddMedicalRecord = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5000/api/doctor/records", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(medicalRecordForm),
      });

      if (response.ok) {
        setSuccess("Medical record added successfully!");
        await loadDoctorData();
        closeModal();
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Failed to add medical record");
      }
    } catch (error) {
      console.error("Error adding medical record:", error);
      setError("Failed to add medical record. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAppointmentStatus = async (
    appointmentId,
    status,
    notes = ""
  ) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:5000/api/doctor/appointments/${appointmentId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status, notes }),
        }
      );

      if (response.ok) {
        setSuccess("Appointment status updated successfully!");
        await loadDoctorData();
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Failed to update appointment status");
      }
    } catch (error) {
      console.error("Error updating appointment status:", error);
      setError("Failed to update appointment status. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/doctor/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editProfileForm),
      });

      if (response.ok) {
        const data = await response.json();
        setDoctorProfile(data.doctor || { ...doctorProfile, ...editProfileForm });
        setSuccess("Profile updated successfully!");
        closeModal();
        await loadDoctorData();
      } else {
        const err = await response.json();
        setError(err.message || "Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      setError("Failed to update profile. Please try again.");
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

    if (type === "addRecord" && item) {
      setMedicalRecordForm({
        patientId: item.id,
        notes: "",
        prescriptions: "",
        testResults: "",
        diagnosis: "",
        medications: "",
      });
    } else if (type === "updateAvailability" && doctorProfile) {
      setAvailabilityForm({
        availability: typeof doctorProfile.availability === "boolean" ? doctorProfile.availability : true,
        workingHours: doctorProfile.workingHours || "",
        workingDays: [],
        startTime: "",
        endTime: "",
      });
    } else if (type === "editProfile" && doctorProfile) {
      setEditProfileForm({
        specialization: doctorProfile.specialization || "",
        experience: doctorProfile.experience || "",
        qualification: doctorProfile.qualification || "",
        licenseNumber: doctorProfile.licenseNumber || "",
        email: doctorProfile.email || "",
        phone: doctorProfile.phone || "",
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

  const renderDashboard = () => {
    const today = new Date();
    const completedAppointments = appointments.filter(
      (apt) => apt.status === "completed"
    );

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
                <button
                  className="btn-status-update"
                  onClick={() => openModal("updateAvailability")}
                >
                  <FiSettings className="btn-icon" />
                  Update Status
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="stats-dashboard">
          <div className="stats-grid">
            <div className="stat-card appointments-card">
              <div className="stat-header">
                <div className="stat-icon-wrapper">
                  <span className="stat-icon"><FiCalendar /></span>
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
                  <span className="stat-icon"><FiCheckCircle /></span>
                </div>
                <div className="stat-info">
                  <div className="trend-text">Successfully treated</div>
                  <div className="stat-number">{completedAppointments.length}</div>
                  <div className="stat-label">Completed</div>
                </div>
              </div>
            </div>

            <div className="stat-card scheduled-card">
              <div className="stat-header">
                <div className="stat-icon-wrapper">
                  <span className="stat-icon"><FiClock /></span>
                </div>
                <div className="stat-info">
                  <div className="trend-text">Upcoming appointments</div>
                  <div className="stat-number">{appointments.filter((a) => a.status === "scheduled").length}</div>
                  <div className="stat-label">Scheduled</div>
                </div>
              </div>
            </div>

            <div className="stat-card patients-card">
              <div className="stat-header">
                <div className="stat-icon-wrapper">
                  <span className="stat-icon"><FiUsers /></span>
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
                      {appointments.slice(0, 5).length} of {appointments.length}
                    </span>
                  </h1>
                </div>
              </div>
              <div className="appointments-preview">
                {appointments.slice(0, 5).length > 0 ? (
                  <div className="appointments-list">
                    {appointments.slice(0, 5).map((appointment) => (
                      <div key={appointment.id} className="appointment-item">
                        <div className="appointment-avatar">
                          <span className="avatar-icon"><FiUser /></span>
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
                              {new Date(
                                appointment.appointmentDate
                              ).toLocaleDateString()}
                            </span>
                            <span className="appointment-time">
                              <FiClock />{" "}
                              {new Date(
                                appointment.appointmentDate
                              ).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        </div>
                        <div className="appointment-status">
                          <span
                            className={`status-badge status-${(appointment.status || "").toLowerCase()}`}
                          >
                            {appointment.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    <div className="empty-icon"><FiCalendar /></div>
                    <div className="empty-content">
                      <h4>No appointments scheduled</h4>
                      <p>Your schedule is clear for today</p>
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
                <button
                  className="action-card patients-action"
                  onClick={() => setActiveSection("patients")}
                >
                  <div className="action-icon"><FiUsers /></div>
                  <div className="action-content">
                    <span className="action-title">View Patients</span>
                    <span className="action-desc">Manage patient records</span>
                  </div>
                  <div className="action-arrow"><FiArrowRight /></div>
                </button>

                <button
                  className="action-card appointments-action"
                  onClick={() => setActiveSection("appointments")}
                >
                  <div className="action-icon"><FiCalendar /></div>
                  <div className="action-content">
                    <span className="action-title">Appointments</span>
                    <span className="action-desc">View schedule</span>
                  </div>
                  <div className="action-arrow"><FiArrowRight /></div>
                </button>

                <button
                  className="action-card availability-action"
                  onClick={() => openModal("updateAvailability")}
                >
                  <div className="action-icon"><FiSettings /></div>
                  <div className="action-content">
                    <span className="action-title">Availability</span>
                    <span className="action-desc">Update status</span>
                  </div>
                  <div className="action-arrow"><FiArrowRight /></div>
                </button>
              </div>
            </div>

            <div className="section-card today-summary">
              <div className="section-header">
                <h1>Today's Summary</h1>
              </div>
              <div className="summary-content">
                <div className="summary-item">
                  <div className="summary-icon"><FiBarChart2 /></div>
                  <div className="summary-info">
                    <span className="summary-label">Appointments Today</span>
                    <span className="summary-value">
                      {
                        appointments.filter(
                          (a) =>
                            new Date(a.appointmentDate).toDateString() ===
                            new Date().toDateString()
                        ).length
                      }
                    </span>
                  </div>
                </div>

                <div className="summary-item">
                  <div className="summary-icon"><FiClock /></div>
                  <div className="summary-info">
                    <span className="summary-label">Next Appointment</span>
                    <span className="summary-value">
                      {appointments.filter(
                        (a) =>
                          new Date(a.appointmentDate) > new Date() &&
                          a.status === "scheduled"
                      ).length > 0
                        ? new Date(
                            appointments.filter(
                              (a) =>
                                new Date(a.appointmentDate) > new Date() &&
                                a.status === "scheduled"
                            )[0]?.appointmentDate
                          ).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "None"}
                    </span>
                  </div>
                </div>

                <div className="summary-item">
                  <div className="summary-icon"><FiPieChart /></div>
                  <div className="summary-info">
                    <span className="summary-label">Completion Rate</span>
                    <span className="summary-value">
                      {appointments.length > 0
                        ? Math.round(
                            (appointments.filter((a) => a.status === "completed").length /
                              appointments.length) *
                              100
                          )
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

  const renderPatients = () => (
    <div className="doctor-section">
      <div className="section-header">
        <div className="section-title">
          <h1 className="patients-title">
            My Patients
            <span className="section-count patients-count">{patients.length} Total Patients</span>
          </h1>
        </div>
      </div>
      <div className="patients-grid">
        {patients.length > 0 ? (
          patients.map((patient) => (
            <div key={patient.id} className="patient-card">
              <div className="patient-header">
                <div className="patient-avatar"><FiUser /></div>
                <div className="patient-details">
                  <div className="patient-name">
                    {patient.firstName} {patient.lastName}
                  </div>
                  <div className="patient-id">ID: {patient.id}</div>
                </div>
              </div>

              <div className="patient-row">
                <div className="patient-content">
                  <div className="patient-contact">
                    <div className="contact-item">
                      <span className="contact-icon"><FiPhone /></span>
                      <span className="contact-text">{patient.phone}</span>
                    </div>
                    <div className="contact-secondary">
                      <div className="secondary-item">
                        <span className="secondary-label">DOB:</span>
                        <span className="secondary-value">{patient.dateOfBirth || "N/A"}</span>
                      </div>
                      <div className="secondary-item">
                        <span className="secondary-label">History:</span>
                        <span className="secondary-value">{patient.medicalHistory ? "Available" : "None"}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="card-actions">
                  <button
                    className="action-btn primary"
                    onClick={() => openModal("viewPatient", patient)}
                    title="View Patient Details"
                  >
                    <span className="btn-icon"><FiEye /></span>
                    View
                  </button>
                  <button
                    className="action-btn secondary"
                    onClick={() => openModal("addRecord", patient)}
                    title="Add Medical Record"
                  >
                    <span className="btn-icon"><FiFileText /></span>
                    Record
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state">
            <span className="empty-icon"><FiUsers /></span>
            <p>No patients assigned yet</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderAppointments = () => (
    <div className="doctor-section">
      <div className="section-header">
        <div className="section-title">
          <h1 className="appointments-title">
            Appointment Schedule
            <span className="section-count appointments-count">{appointments.length} Total Appointments</span>
          </h1>
          <div className="section-stats section-stats-inline"></div>
        </div>
      </div>
      <div className="doctor-table-container">
        <table className="doctor-table">
          <thead>
            <tr>
              <th>Patient</th>
              <th>Date & Time</th>
              <th>Details</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {appointments.length > 0 ? (
              appointments.map((appointment) => (
                <tr key={appointment.id}>
                  <td>
                    <div className="patient-info">
                      <div className="patient-details">
                        <div className="patient-name">
                          {appointment.Patient
                            ? `${appointment.Patient.firstName} ${appointment.Patient.lastName}`
                            : "N/A"}
                        </div>
                        <div className="patient-id">
                          {appointment.Patient
                            ? `ID: ${appointment.Patient.id}`
                            : "Unknown Patient"}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="appointment-datetime">
                      <div className="appointment-date">
                        <span className="date-icon"><FiCalendar /></span>
                        <span className="date-text">
                          {new Date(
                            appointment.appointmentDate
                          ).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="appointment-time">
                        <span className="time-icon"><FiClock /></span>
                        <span className="time-text">
                          {new Date(
                            appointment.appointmentDate
                          ).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="appointment-details">
                      <div className="detail-item">
                        <span className="detail-label">Reason:</span>
                        <span className="detail-value">
                          {appointment.reason || "General consultation"}
                        </span>
                      </div>
                      {appointment.notes && (
                        <div className="detail-item">
                          <span className="detail-label">Notes:</span>
                          <span className="detail-value">{appointment.notes}</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    <span
                      className={`status-badge status-${(appointment.status || "").toLowerCase().replace(" ", "-")}`}
                    >
                      {appointment.status === "scheduled" && <FiClock />}
                      {appointment.status === "in-progress" && <FiRefreshCcw />}
                      {appointment.status === "completed" && <FiCheckCircle />}
                      {appointment.status === "cancelled" && <FiXCircle />}
                      <span className="status-text">{appointment.status}</span>
                    </span>
                  </td>
                  <td>
                    <div className="table-actions">
                      <select
                        value={appointment.status}
                        onChange={(e) =>
                          handleUpdateAppointmentStatus(
                            appointment.id,
                            e.target.value
                          )
                        }
                        className="status-select"
                        disabled={loading}
                      >
                        <option value="scheduled">Scheduled</option>
                        <option value="in-progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                      {appointment.status === "completed" && (
                        <button
                          className="action-btn primary"
                          onClick={() => openModal("addRecord", appointment.Patient)}
                          title="Add Medical Record"
                        >
                          <span className="btn-icon">
                            <svg
                              stroke="currentColor"
                              fill="none"
                              strokeWidth="2"
                              viewBox="0 0 24 24"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              height="1em"
                              width="1em"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                              <polyline points="14 2 14 8 20 8"></polyline>
                              <line x1="16" y1="13" x2="8" y2="13"></line>
                              <line x1="16" y1="17" x2="8" y2="17"></line>
                              <polyline points="10 9 9 9 8 9"></polyline>
                            </svg>
                          </span>
                          Add Record
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5">
                  <div className="empty-state">
                    <span className="empty-icon">📅</span>
                    <p>No appointments scheduled</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderProfile = () => {
    const name = doctorProfile ? `${doctorProfile.firstName || ""} ${doctorProfile.lastName || ""}`.trim() : "";
    const wh = parseWorkingHours(doctorProfile?.workingHours || "");
    return (
      <div className="doctor-section">
        <div className="section-header">
          <div className="section-title">
            <h1 className="appointments-title">
              Doctor Profile
            </h1>
          </div>
          <div>
            <button className="action-btn primary" onClick={() => openModal("editProfile")}> 
              <span className="btn-icon"><FiEdit /></span>
              Edit Profile
            </button>
          </div>
        </div>

        <div className="profile-details">
          <div className="detail-section">
            <h5 className="section-title">Basic Information</h5>
            <div className="detail-stack">
              <div className="detail-item">
                <span className="detail-icon"><FiUser /></span>
                <div className="detail-content">
                  <span className="detail-label">Name</span>
                  <span className="detail-value">{name || "N/A"}</span>
                </div>
              </div>
              <div className="detail-item">
                <span className="detail-icon"><FaStethoscope /></span>
                <div className="detail-content">
                  <span className="detail-label">Specialization</span>
                  <span className="detail-value">{doctorProfile?.specialization || "N/A"}</span>
                </div>
              </div>
              <div className="detail-item">
                <span className="detail-icon"><FiBarChart2 /></span>
                <div className="detail-content">
                  <span className="detail-label">Experience</span>
                  <span className="detail-value">{doctorProfile?.experience ? `${doctorProfile.experience} years` : "N/A"}</span>
                </div>
              </div>
              <div className="detail-item">
                <span className="detail-icon"><FiClipboard /></span>
                <div className="detail-content">
                  <span className="detail-label">Qualification</span>
                  <span className="detail-value">{doctorProfile?.qualification || "N/A"}</span>
                </div>
              </div>
              <div className="detail-item">
                <span className="detail-icon"><FiFileText /></span>
                <div className="detail-content">
                  <span className="detail-label">License Number</span>
                  <span className="detail-value">{doctorProfile?.licenseNumber || "N/A"}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="detail-section">
            <h5 className="section-title">Contact & Availability</h5>
            <div className="detail-stack">
              <div className="detail-item">
                <span className="detail-icon"><FiMail /></span>
                <div className="detail-content">
                  <span className="detail-label">Email</span>
                  <span className="detail-value">{doctorProfile?.email || "N/A"}</span>
                </div>
              </div>
              <div className="detail-item">
                <span className="detail-icon"><FiPhone /></span>
                <div className="detail-content">
                  <span className="detail-label">Phone</span>
                  <span className="detail-value">{doctorProfile?.phone || "N/A"}</span>
                </div>
              </div>
              <div className="detail-item">
                <span className="detail-icon"><FiSettings /></span>
                <div className="detail-content">
                  <span className="detail-label">Availability</span>
                  <span className="detail-value">{doctorProfile?.availability ? "Available" : "Unavailable"}</span>
                </div>
              </div>
              <div className="detail-item">
                <span className="detail-icon"><FiClock /></span>
                <div className="detail-content">
                  <span className="detail-label">Working Hours</span>
                  <span className="detail-value">{doctorProfile?.workingHours || "Not set"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderModal = () => {
    if (!showModal) return null;

    return (
      <div className="doctor-modal-overlay" onClick={closeModal}>
        <div className="doctor-modal" onClick={(e) => e.stopPropagation()}>
          <div className="doctor-modal-header">
            <div className="modal-title-section">
              <div className="modal-icon">
                {modalType === "viewPatient" && <FiUser />}
                {modalType === "addRecord" && <FiFileText />}
                {modalType === "updateAvailability" && <FiSettings />}
                {modalType === "editProfile" && <FiEdit />}
              </div>
              <h3 className="modal-title">
                {modalType === "viewPatient" && "Patient Profile"}
                {modalType === "addRecord" && "Add Medical Record"}
                {modalType === "updateAvailability" && "Update Availability"}
                {modalType === "editProfile" && "Edit Doctor Profile"}
              </h3>
            </div>
            <button className="doctor-modal-close" onClick={closeModal}>
              <span><FiX /></span>
            </button>
          </div>

          <div className="doctor-modal-content">
            {error && (
              <div className="doctor-alert error">
                <span className="alert-icon"><FiAlertTriangle /></span>
                <span className="alert-message">{error}</span>
              </div>
            )}
            {success && (
              <div className="doctor-alert success">
                <span className="alert-icon"><FiCheckCircle /></span>
                <span className="alert-message">{success}</span>
              </div>
            )}

            {modalType === "viewPatient" && selectedItem && (
              <div className="patient-profile">
                <div className="profile-details">
                  <div className="detail-section">
                    <h5 className="section-title">Contact Information</h5>
                    <div className="detail-stack">
                      <div className="detail-item">
                        <span className="detail-icon"><FiMail /></span>
                        <div className="detail-content">
                          <span className="detail-label">Email</span>
                          <span className="detail-value">{selectedItem.email}</span>
                        </div>
                      </div>
                      <div className="detail-item">
                        <span className="detail-icon"><FiPhone /></span>
                        <div className="detail-content">
                          <span className="detail-label">Phone</span>
                          <span className="detail-value">{selectedItem.phone}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="detail-section">
                    <h5 className="section-title">Medical Information</h5>
                    <div className="detail-stack">
                      <div className="detail-item">
                        <span className="detail-icon"><FaBirthdayCake /></span>
                        <div className="detail-content">
                          <span className="detail-label">Date of Birth</span>
                          <span className="detail-value">{selectedItem.dateOfBirth || "Not provided"}</span>
                        </div>
                      </div>
                      <div className="detail-item full-width">
                        <span className="detail-icon"><FiClipboard /></span>
                        <div className="detail-content">
                          <span className="detail-label">Medical History</span>
                          <span className="detail-value">{selectedItem.medicalHistory || "No medical history available"}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="modal-actions">
                  <button
                    className="btn btn-primary"
                    onClick={() => {
                      closeModal();
                      openModal("addRecord", selectedItem);
                    }}
                  >
                    <FiFileText />
                    Add Medical Record
                  </button>
                  <button className="btn btn-secondary" onClick={closeModal}>
                    Close
                  </button>
                </div>
              </div>
            )}

            {modalType === "addRecord" && (
              <div className="medical-record-form">
                <div className="form-header">
                  <div className="patient-summary">
                    <span className="patient-avatar"><FiUser /></span>
                    <div className="patient-info">
                      <span className="patient-name">
                        {selectedItem
                          ? `${selectedItem.firstName} ${selectedItem.lastName}`
                          : "Unknown Patient"}
                      </span>
                      <span className="patient-id">
                        {selectedItem ? `ID: ${selectedItem.id}` : "No ID"}
                      </span>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleAddMedicalRecord} className="doctor-form">
                  <div className="form-section">
                    <h5 className="section-title">Diagnosis</h5>
                    <div className="form-group">
                      <label className="form-label">
                        <span className="label-icon"><FaStethoscope /></span>
                        Primary Diagnosis
                      </label>
                      <textarea
                        value={medicalRecordForm.diagnosis}
                        onChange={(e) =>
                          setMedicalRecordForm({
                            ...medicalRecordForm,
                            diagnosis: e.target.value,
                          })
                        }
                        className="form-control"
                        rows="2"
                        placeholder="Enter primary diagnosis and condition..."
                        required
                      />
                    </div>
                  </div>

                  <div className="form-section">
                    <h5 className="section-title">Medical Notes</h5>
                    <div className="form-group">
                      <label className="form-label">
                        <span className="label-icon"><FiFileText /></span>
                        Clinical Notes
                      </label>
                      <textarea
                        value={medicalRecordForm.notes}
                        onChange={(e) =>
                          setMedicalRecordForm({
                            ...medicalRecordForm,
                            notes: e.target.value,
                          })
                        }
                        className="form-control"
                        rows="4"
                        placeholder="Enter clinical observations, symptoms, examination findings..."
                        required
                      />
                    </div>
                  </div>

                  <div className="form-section">
                    <h5 className="section-title">Medications</h5>
                    <div className="form-group">
                      <label className="form-label">
                        <span className="label-icon"><FaPills /></span>
                        Prescribed Medications
                      </label>
                      <textarea
                        value={medicalRecordForm.medications}
                        onChange={(e) =>
                          setMedicalRecordForm({
                            ...medicalRecordForm,
                            medications: e.target.value,
                          })
                        }
                        className="form-control"
                        rows="3"
                        placeholder="List medications with dosages, frequency, and duration..."
                      />
                    </div>
                  </div>

                  <div className="form-section">
                    <h5 className="section-title">
                      Prescriptions & Instructions
                    </h5>
                    <div className="form-group">
                      <label className="form-label">
                        <span className="label-icon"><FiClipboard /></span>
                        Additional Prescriptions
                      </label>
                      <textarea
                        value={medicalRecordForm.prescriptions}
                        onChange={(e) =>
                          setMedicalRecordForm({
                            ...medicalRecordForm,
                            prescriptions: e.target.value,
                          })
                        }
                        className="form-control"
                        rows="3"
                        placeholder="Additional treatments, therapies, or medical devices..."
                      />
                    </div>
                  </div>

                  <div className="form-section">
                    <h5 className="section-title">Test Results</h5>
                    <div className="form-group">
                      <label className="form-label">
                        <span className="label-icon"><TbMicroscope /></span>
                        Laboratory & Diagnostic Results
                      </label>
                      <textarea
                        value={medicalRecordForm.testResults}
                        onChange={(e) =>
                          setMedicalRecordForm({
                            ...medicalRecordForm,
                            testResults: e.target.value,
                          })
                        }
                        className="form-control"
                        rows="3"
                        placeholder="Enter test results, imaging findings, lab values..."
                      />
                    </div>
                  </div>

                  <div className="modal-actions">
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <span className="btn-spinner"><FiLoader /></span>
                          Adding Record...
                        </>
                      ) : (
                        <>Save Medical Record</>
                      )}
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={closeModal}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {modalType === "updateAvailability" && (
              <div className="availability-form">
                <form onSubmit={handleUpdateAvailability} className="doctor-form">
                  <div className="form-section">
                    <h5 className="section-title">Availability Settings</h5>
                    <div className="form-group">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={availabilityForm.availability}
                          onChange={(e) =>
                            setAvailabilityForm({
                              ...availabilityForm,
                              availability: e.target.checked,
                            })
                          }
                          className="checkbox-input"
                        />
                        <span className="checkbox-custom"></span>
                        <div className="checkbox-content">
                          <span className="checkbox-title">Available for appointments</span>
                          <span className="checkbox-desc">Allow patients to book appointments with you</span>
                        </div>
                      </label>
                    </div>
                  </div>

                  <div className="form-section">
                    <h5 className="section-title">Working Schedule</h5>
                    <div className="form-hint current-schedule">
                      <span className="label-icon"><FiClock /></span>
                      Current: {doctorProfile?.workingHours || "Not set"}
                    </div>
                    <div className="form-hint current-schedule">
                      <span className="label-icon"><FiClock /></span>
                      Preview: {(() => {
                        const days = availabilityForm.workingDays || [];
                        const sNorm = parseTimeTo24(availabilityForm.startTime?.trim());
                        const eNorm = parseTimeTo24(availabilityForm.endTime?.trim());
                        const s = sNorm ? formatTime12(sNorm) : "";
                        const e = eNorm ? formatTime12(eNorm) : "";
                        const ds = days.join(", ");
                        const tr = s && e ? `${s} - ${e}` : "";
                        const preview = ds ? `${ds}${tr ? ` ${tr}` : ""}` : tr || "Not set";
                        return preview || "Not set";
                      })()}
                    </div>
                    <div className="form-group">
                      <label className="form-label">Days of Week</label>
                      <div className="days-selector">
                        {DAYS_OF_WEEK.map((day) => {
                          const selected = availabilityForm.workingDays.includes(day);
                          return (
                            <label key={day} className={`day-chip ${selected ? "selected" : ""}`}>
                              <input
                                type="checkbox"
                                checked={selected}
                                onChange={(e) => {
                                  const isChecked = e.target.checked;
                                  setAvailabilityForm((prev) => {
                                    const nextWorkingDays = isChecked
                                      ? [...prev.workingDays, day]
                                      : prev.workingDays.filter((d) => d !== day);
                                    const autoEnableAvailability =
                                      prev.availability || nextWorkingDays.length > 0 || (prev.startTime && prev.endTime);
                                    return {
                                      ...prev,
                                      workingDays: nextWorkingDays,
                                      availability: autoEnableAvailability,
                                    };
                                  });
                                }}
                              />
                              <span className="day-label">{day}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                    <div className="form-group time-inputs">
                      <div className="time-field">
                        <label className="form-label">Start Time</label>
                        <input
                          type="text"
                          placeholder="e.g., 10:15 PM or 22:15"
                          value={availabilityForm.startTime}
                          onChange={(e) =>
                            setAvailabilityForm({
                              ...availabilityForm,
                              startTime: e.target.value,
                            })
                          }
                          className="form-control"
                        />
                      </div>
                      <div className="time-separator">to</div>
                      <div className="time-field">
                        <label className="form-label">End Time</label>
                        <input
                          type="text"
                          placeholder="e.g., 10:15 PM or 22:15"
                          value={availabilityForm.endTime}
                          onChange={(e) =>
                            setAvailabilityForm({
                              ...availabilityForm,
                              endTime: e.target.value,
                            })
                          }
                          className="form-control"
                        />
                      </div>
                      <span className="form-hint">
                        Select days and a time range for availability. Click "Update Availability" to save.
                      </span>
                    </div>
                  </div>

                  <div className="modal-actions">
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                      {loading ? (
                        <>
                          <span className="btn-spinner"><FiLoader /></span>
                          Updating...
                        </>
                      ) : (
                        <>Update Availability</>
                      )}
                    </button>
                    <button type="button" className="btn btn-secondary" onClick={closeModal}>
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {modalType === "editProfile" && (
              <div className="doctor-form">
                <form onSubmit={handleUpdateProfile}>
                  <div className="form-section">
                    <h5 className="section-title">Professional Details</h5>
                    <div className="form-group">
                      <label className="form-label">Specialization</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editProfileForm.specialization}
                        onChange={(e) => setEditProfileForm({ ...editProfileForm, specialization: e.target.value })}
                        placeholder="e.g., Cardiology"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Experience (years)</label>
                      <input
                        type="number"
                        min="0"
                        className="form-control"
                        value={editProfileForm.experience}
                        onChange={(e) => setEditProfileForm({ ...editProfileForm, experience: e.target.value })}
                        placeholder="e.g., 10"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Qualification</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editProfileForm.qualification}
                        onChange={(e) => setEditProfileForm({ ...editProfileForm, qualification: e.target.value })}
                        placeholder="e.g., MD, PhD"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">License Number</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editProfileForm.licenseNumber}
                        onChange={(e) => setEditProfileForm({ ...editProfileForm, licenseNumber: e.target.value })}
                        placeholder="e.g., LIC-123456"
                      />
                    </div>
                  </div>

                  <div className="form-section">
                    <h5 className="section-title">Contact Information</h5>
                    <div className="form-group">
                      <label className="form-label">Email</label>
                      <input
                        type="email"
                        className="form-control"
                        value={editProfileForm.email}
                        onChange={(e) => setEditProfileForm({ ...editProfileForm, email: e.target.value })}
                        placeholder="doctor@example.com"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Phone</label>
                      <input
                        type="tel"
                        className="form-control"
                        value={editProfileForm.phone}
                        onChange={(e) => setEditProfileForm({ ...editProfileForm, phone: e.target.value })}
                        placeholder="+1234567890"
                      />
                    </div>
                  </div>

                  <div className="modal-actions">
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                      {loading ? (
                        <>
                          <span className="btn-spinner"><FiLoader /></span>
                          Saving...
                        </>
                      ) : (
                        <>Save Changes</>
                      )}
                    </button>
                    <button type="button" className="btn btn-secondary" onClick={closeModal}>
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="doctor-panel">
      <div className="doctor-header">
        <div className="doctor-header-content">
          <div
            className="doctor-header-left"
            onClick={() => navigate("/")}
            style={{ cursor: "pointer" }}
            title="Go to Homepage"
          >
            <FaUserMd className="doctor-icon" />
            <div className="doctor-brand-text">
              <h1 className="doctor-header-title">SmartCare Doctor</h1>
              <p className="doctor-user-name">Welcome, Dr. {user?.username}</p>
            </div>
          </div>
          <div className="doctor-header-right">
            <div className="doctor-user-info"></div>
            <button onClick={logout} className="doctor-logout-btn" type="button">
              <span className="btn-icon"><IoIosLogOut /></span>
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="doctor-container">
        <nav className="doctor-nav">
          <button
            className={`doctor-nav-btn ${activeSection === "dashboard" ? "active" : ""}`}
            onClick={() => setActiveSection("dashboard")}
          >
            <span className="nav-icon"><FiBarChart2 /></span>
            Dashboard
          </button>
          <button
            className={`doctor-nav-btn ${activeSection === "patients" ? "active" : ""}`}
            onClick={() => setActiveSection("patients")}
          >
            <span className="nav-icon"><FiUsers /></span>
            My Patients
          </button>
          <button
            className={`doctor-nav-btn ${activeSection === "appointments" ? "active" : ""}`}
            onClick={() => setActiveSection("appointments")}
          >
            <span className="nav-icon"><FiCalendar /></span>
            Appointments
          </button>
          <button
            className={`doctor-nav-btn ${activeSection === "profile" ? "active" : ""}`}
            onClick={() => setActiveSection("profile")}
          >
            <span className="nav-icon"><FiUser /></span>
            Profile
          </button>
        </nav>

        <div className="doctor-content">
          {loading && (
            <div className="loading-overlay">
              <div className="loading-spinner">
                <div className="spinner"></div>
                <p>Loading...</p>
              </div>
            </div>
          )}

          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          {activeSection === "dashboard" && renderDashboard()}
          {activeSection === "patients" && renderPatients()}
          {activeSection === "appointments" && renderAppointments()}
          {activeSection === "profile" && renderProfile()}
        </div>
      </div>

      {renderModal()}
    </div>
  );
};

export default DoctorPanel;