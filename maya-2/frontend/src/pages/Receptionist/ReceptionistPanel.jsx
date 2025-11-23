import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./ReceptionistPanel.css";
import { FaUserTie } from "react-icons/fa6";
import LogoutButton from "../../components/ui/LogoutButton/LogoutButton";
import { GrBarChart } from "react-icons/gr";
import { FaUserInjured, FaUserDoctor } from "react-icons/fa6";
import { GoChecklist } from "react-icons/go";
import { MdQueue } from "react-icons/md";
import { FaCalendarDay, FaPlus } from "react-icons/fa";
import { FaUsers } from "react-icons/fa";
import { FaClipboardList } from "react-icons/fa";
import { FaPen } from "react-icons/fa";
import { MdVisibility } from "react-icons/md";
import { parseWorkingHours, generateTimeSlots } from "../../utils/schedule";

const ReceptionistPanel = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("dashboard");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // State for data
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);

  // Debug: Log doctors state whenever it changes
  useEffect(() => {
    console.log("Doctors state updated:", doctors);
  }, [doctors]);
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
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
    phone: "",
    dateOfBirth: "",
    medicalHistory: "",
    bloodType: "",
  });

  const [appointmentForm, setAppointmentForm] = useState({
    patientId: "",
    doctorId: "",
    appointmentDate: "",
    appointmentTime: "",
    reason: "",
  });
  const [availableTimesForSchedule, setAvailableTimesForSchedule] = useState(
    []
  );

  useEffect(() => {
    loadReceptionistData();
  }, []);

  useEffect(() => {
    if (activeSection === "appointments") {
      loadReceptionistData();
    }
  }, [activeSection]);

  useEffect(() => {
    const fetchByDate = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(
          `http://localhost:5000/api/receptionist/appointments/day?date=${encodeURIComponent(
            selectedDate
          )}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const data = res.ok ? await res.json() : [];
        setTodayAppointments(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error(e);
        setTodayAppointments([]);
      }
    };
    fetchByDate();
  }, [selectedDate]);

  const loadReceptionistData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");

      // Load all data in parallel
      const [
        patientsRes,
        doctorsRes,
        dayAppointmentsRes,
        allAppointmentsRes,
        queueRes,
      ] = await Promise.all([
        fetch("http://localhost:5000/api/receptionist/patients", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("http://localhost:5000/api/receptionist/doctors", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(
          `http://localhost:5000/api/receptionist/appointments/day?date=${encodeURIComponent(
            selectedDate
          )}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        ),
        fetch("http://localhost:5000/api/receptionist/appointments", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("http://localhost:5000/api/receptionist/queue", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      console.log("Doctors response status:", doctorsRes.status);
      console.log("Doctors response ok:", doctorsRes.ok);
      if (!doctorsRes.ok) {
        console.log("Doctors response not ok, trying fallback endpoints");
      }

      if (patientsRes.ok) {
        const patientsData = await patientsRes.json();
        setPatients(patientsData);
      }

      if (doctorsRes.ok) {
        const doctorsData = await doctorsRes.json();
        console.log("Doctors data received:", doctorsData);
        if (Array.isArray(doctorsData) && doctorsData.length > 0) {
          setDoctors(doctorsData);
        } else {
          const schedRes = await fetch("/api/receptionist/schedules", {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (schedRes.ok) {
            const schedules = await schedRes.json();
            const uniq = new Map();
            (Array.isArray(schedules) ? schedules : []).forEach((s) => {
              if (s && s.doctor && s.doctor.id && !uniq.has(s.doctor.id)) {
                uniq.set(s.doctor.id, s.doctor);
              }
            });
            let derived = Array.from(uniq.values());
            if (
              (!derived || derived.length === 0) &&
              todayAppointments &&
              todayAppointments.length > 0
            ) {
              const fromToday = new Map();
              todayAppointments.forEach((a) => {
                if (
                  a &&
                  a.Doctor &&
                  a.Doctor.id &&
                  !fromToday.has(a.Doctor.id)
                ) {
                  fromToday.set(a.Doctor.id, {
                    id: a.Doctor.id,
                    firstName: a.Doctor.firstName,
                    lastName: a.Doctor.lastName,
                    specialization: a.Doctor.specialization,
                  });
                }
              });
              derived = Array.from(fromToday.values());
            }
            setDoctors(derived);
          } else {
            setDoctors([]);
          }
        }
      } else {
        console.log("Primary doctors endpoint failed, trying admin endpoint");
        const adminRes = await fetch(
          "http://localhost:5000/api/admin/doctors",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        console.log("Admin doctors response status:", adminRes.status);
        if (adminRes.ok) {
          const adminDoctors = await adminRes.json();
          console.log("Admin doctors data:", adminDoctors);
          setDoctors(Array.isArray(adminDoctors) ? adminDoctors : []);
        } else {
          console.log("Admin endpoint failed, trying public endpoint");
          const publicRes = await fetch("http://localhost:5000/api/doctors");
          console.log("Public doctors response status:", publicRes.status);
          if (publicRes.ok) {
            const publicDoctors = await publicRes.json();
            console.log("Public doctors data:", publicDoctors);
            setDoctors(Array.isArray(publicDoctors) ? publicDoctors : []);
          } else {
            console.log("All endpoints failed, setting empty doctors array");
            setDoctors([]);
          }
        }
      }

      if (dayAppointmentsRes.ok) {
        const todayData = await dayAppointmentsRes.json();
        setTodayAppointments(todayData);
      }

      console.log(
        "All appointments response status:",
        allAppointmentsRes.status,
        "ok:",
        allAppointmentsRes.ok
      );
      if (allAppointmentsRes.ok) {
        const allData = await allAppointmentsRes.json();
        console.log(
          "Loaded appointments:",
          Array.isArray(allData) ? allData.length : 0
        );
        setAppointments(allData);
      } else {
        console.warn("Failed to load all appointments, setting empty list");
        setAppointments([]);
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
      const response = await fetch(
        "http://localhost:5000/api/receptionist/patients",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(patientForm),
        }
      );

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
      const payload = {
        ...appointmentForm,
        appointmentTime: appointmentForm.appointmentTime
          ? `${String(appointmentForm.appointmentTime).slice(0, 5)}:00`
          : undefined,
      };
      const response = await fetch(
        "http://localhost:5000/api/receptionist/appointments",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      if (response.ok) {
        setSuccess("Appointment scheduled successfully!");
        const scheduledDate =
          payload.appointmentDate || new Date().toISOString().split("T")[0];
        setSelectedDate(scheduledDate);
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
        `http://localhost:5000/api/receptionist/checkin/${appointmentId}`,
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

  const handleUpdateAppointmentStatus = async (appointmentId, status) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:5000/api/receptionist/appointments/${appointmentId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status }),
        }
      );
      if (response.ok) {
        setSuccess("Appointment status updated successfully!");
        await loadReceptionistData();
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

  const openModal = (type, item = null) => {
    console.log("openModal called with type:", type, "item:", item);
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
        phone: "",
        dateOfBirth: "",
        medicalHistory: "",
      });
    } else if (type === "scheduleAppointment") {
      setAppointmentForm({
        patientId: "",
        doctorId: "",
        appointmentDate: "",
        appointmentTime: "",
        reason: "",
      });
      setAvailableTimesForSchedule([]);
      // Ensure doctors are loaded when opening the modal
      console.log(
        "Checking if doctors need to be loaded. Current doctors:",
        doctors,
        "Length:",
        doctors?.length
      );
      if (!doctors || doctors.length === 0) {
        (async () => {
          try {
            setLoading(true);
            const token = localStorage.getItem("token");
            console.log("Attempting to load doctors with token:", !!token);
            const res = await fetch("/api/receptionist/doctors", {
              headers: { Authorization: `Bearer ${token}` },
            });
            console.log(
              "Modal fallback - receptionist doctors response:",
              res.status
            );
            if (res.ok) {
              const data = await res.json();
              console.log("Modal fallback - receptionist doctors data:", data);
              setDoctors(Array.isArray(data) ? data : []);
            } else {
              console.log("Modal fallback - trying admin endpoint");
              const adminRes = await fetch(
                "http://localhost:5000/api/admin/doctors",
                {
                  headers: { Authorization: `Bearer ${token}` },
                }
              );
              console.log(
                "Modal fallback - admin doctors response:",
                adminRes.status
              );
              if (adminRes.ok) {
                const adminData = await adminRes.json();
                console.log("Modal fallback - admin doctors data:", adminData);
                setDoctors(Array.isArray(adminData) ? adminData : []);
              } else {
                console.log("Modal fallback - all endpoints failed");
              }
            }
          } catch (err) {
            console.error("Modal fallback - error loading doctors:", err);
            // leave error banner to modal
          } finally {
            setLoading(false);
          }
        })();
      }
    }
  };

  const parseWorkingDays = (wh) => {
    const defaultDays = ["Mon", "Tue", "Wed", "Thu", "Fri"];
    if (!wh || typeof wh !== "string") return defaultDays;
    const daysPart = wh.split(/\d{2}:\d{2}/)[0]?.trim() || "";
    if (!daysPart) return defaultDays;
    const map = {
      Sunday: "Sun",
      Monday: "Mon",
      Tuesday: "Tue",
      Wednesday: "Wed",
      Thursday: "Thu",
      Friday: "Fri",
      Saturday: "Sat",
      Sun: "Sun",
      Mon: "Mon",
      Tue: "Tue",
      Wed: "Wed",
      Thu: "Thu",
      Fri: "Fri",
      Sat: "Sat",
    };
    if (/^Mon\s*-\s*Fri$/i.test(daysPart)) return defaultDays;
    const parts = daysPart
      .split(/,\s*/)
      .map((p) => p.trim())
      .filter(Boolean);
    const days = parts
      .map((p) => map[p] || p)
      .filter((d) =>
        ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].includes(d)
      );
    return days.length ? days : defaultDays;
  };
  const isDateAllowedForDoctor = (dateStr, doctor) => {
    if (!dateStr || !doctor) return false;
    const days = parseWorkingDays(doctor?.workingHours);
    const idx = new Date(dateStr).getDay();
    const idxMap = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return days.includes(idxMap[idx]);
  };

  const getAvailableDatesForDoctor = (doctor, daysAhead = 30) => {
    if (!doctor) return [];
    const availableDays = parseWorkingDays(doctor.workingHours);
    const availableDates = [];
    const today = new Date();

    for (let i = 0; i < daysAhead; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() + i);
      const dayName = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][
        checkDate.getDay()
      ];

      if (availableDays.includes(dayName)) {
        availableDates.push(checkDate.toISOString().split("T")[0]);
      }
    }
    return availableDates;
  };
  const formatWorkingDaysLabel = (days) => days.join(", ");

  useEffect(() => {
    const fetchTimes = async () => {
      try {
        setAvailableTimesForSchedule([]);
        const { doctorId, appointmentDate } = appointmentForm;
        if (!doctorId || !appointmentDate) return;
        const doc = doctors.find((d) => String(d.id) === String(doctorId));
        const { start, end } = parseWorkingHours(doc?.workingHours);
        const token = localStorage.getItem("token");
        const res = await fetch(
          `http://localhost:5000/api/receptionist/doctors/${doctorId}/booked-times?date=${encodeURIComponent(
            appointmentDate
          )}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const data = res.ok ? await res.json() : { bookedTimes: [] };
        const windowTimes = generateTimeSlots(start, end);
        const available = windowTimes.filter(
          (t) => !(data.bookedTimes || []).includes(t)
        );
        setAvailableTimesForSchedule(available);
      } catch (e) {
        console.error(e);
        setAvailableTimesForSchedule([]);
      }
    };
    fetchTimes();
  }, [appointmentForm.doctorId, appointmentForm.appointmentDate, doctors]);

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
            <p>Today's Appointments</p>
            <h3>{todayAppointments.length}</h3>
            <span className="stat-trend">+2 from yesterday</span>
          </div>
        </div>

        <div className="stat-card success">
          <div className="stat-icon">
            <MdQueue color="green" />
          </div>
          <div className="stat-content">
            <p>Patients in Queue</p>
            <h3>{queueStatus.totalInQueue}</h3>
            <span className="stat-trend">Active now</span>
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
          <div
            className="table-filters"
            style={{ display: "flex", gap: 8, alignItems: "center" }}
          >
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="filter-select"
            />
            <select className="filter-select">
              <option>All Status</option>
              <option>Scheduled</option>
              <option>Checked-in</option>
              <option>In-progress</option>
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
              {(todayAppointments || []).length > 0 ? (
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
                        {appointment.appointmentTime
                          ? String(appointment.appointmentTime).slice(0, 5)
                          : new Date(
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
                            onClick={() =>
                              handleUpdateAppointmentStatus(
                                appointment.id,
                                "in-progress"
                              )
                            }
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
              <th>Phone</th>
              <th>Registered At</th>
              <th>Date of Birth</th>
              <th>Blood Type</th>
            </tr>
          </thead>
          <tbody>
            {patients.map((patient) => (
              <tr key={patient.id}>
                <td>
                  {patient.firstName} {patient.lastName}
                </td>
                <td>{patient.phone}</td>
                <td>
                  {patient.createdAt
                    ? new Date(patient.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : ""}
                </td>
                <td>{patient.dateOfBirth}</td>
                <td>{patient.bloodType || ""}</td>
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
            {(appointments && appointments.length > 0
              ? appointments
              : todayAppointments
            ).length > 0 ? (
              (appointments && appointments.length > 0
                ? appointments
                : todayAppointments
              ).map((appointment) => (
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
                        {appointment.appointmentTime
                          ? String(appointment.appointmentTime).slice(0, 5)
                          : new Date(
                              appointment.appointmentDate
                            ).toLocaleTimeString()}
                      </div>
                    </div>
                  </td>
                  <td>{appointment.reason || "General consultation"}</td>
                  <td>
                    <span
                      className={`status-badge status-${String(
                        appointment.status || ""
                      ).toLowerCase()}`}
                    >
                      {appointment.status}
                    </span>
                  </td>
                  <td>
                    <div
                      style={{
                        display: "flex",
                        gap: "8px",
                        alignItems: "center",
                      }}
                    >
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
                        <option value="checked-in">Checked-in</option>
                        <option value="in-progress">In-progress</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                      {appointment.status === "scheduled" && (
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => handleCheckIn(appointment.id)}
                          title="Quick Check In"
                        >
                          Check In
                        </button>
                      )}
                      {appointment.status === "checked-in" && (
                        <button
                          className="btn btn-sm btn-secondary"
                          onClick={() =>
                            handleUpdateAppointmentStatus(
                              appointment.id,
                              "in-progress"
                            )
                          }
                          title="Take Appointment"
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
                <td
                  colSpan="6"
                  style={{ textAlign: "center", padding: "16px" }}
                >
                  No appointments found.{" "}
                  <button
                    className="btn btn-sm btn-secondary"
                    onClick={loadReceptionistData}
                    style={{ marginLeft: 8 }}
                  >
                    Refresh
                  </button>
                </td>
              </tr>
            )}
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
    console.log(
      "renderModal called. showModal:",
      showModal,
      "modalType:",
      modalType
    );
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
                    placeholder="Enter username"
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
                    placeholder="Enter password"
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
                    placeholder="Enter first name"
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
                    placeholder="Enter last name"
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
                  <label>Blood Type</label>
                  <select
                    value={patientForm.bloodType}
                    onChange={(e) =>
                      setPatientForm({
                        ...patientForm,
                        bloodType: e.target.value,
                      })
                    }
                    className="form-control"
                    required
                  >
                    <option value="">Select blood type</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input
                    type="tel"
                    value={patientForm.phone}
                    placeholder="Enter phone number"
                    onChange={(e) =>
                      setPatientForm({ ...patientForm, phone: e.target.value })
                    }
                    className="form-control"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Date of Birth</label>
                  <input
                    type="date"
                    value={patientForm.dateOfBirth}
                    placeholder="YYYY-MM-DD"
                    onChange={(e) =>
                      setPatientForm({
                        ...patientForm,
                        dateOfBirth: e.target.value,
                      })
                    }
                    className="form-control"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Medical History</label>
                  <textarea
                    value={patientForm.medicalHistory}
                    placeholder="Medical history (optional)"
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
                {console.log(
                  "Rendering scheduleAppointment form. Doctors:",
                  doctors,
                  "Length:",
                  doctors.length,
                  "Token exists:",
                  !!localStorage.getItem("token"),
                  "Selected date:",
                  appointmentForm.appointmentDate
                )}
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
                  <div className="profile-field">
                    <span className="profile-label">Email</span>
                    <span className="profile-value">{selectedItem.email}</span>
                  </div>
                  {console.log(
                    "Rendering doctor select. Doctors array:",
                    doctors,
                    "Length:",
                    doctors.length,
                    "Selected date:",
                    appointmentForm.appointmentDate
                  )}
                  <select
                    value={appointmentForm.doctorId}
                    onChange={(e) =>
                      setAppointmentForm({
                        ...appointmentForm,
                        doctorId: e.target.value,
                        appointmentDate: "", // Reset date when doctor changes
                        appointmentTime: "",
                      })
                    }
                    className="form-control"
                    required
                  >
                    <option value="">Select Doctor</option>
                    {doctors.length === 0 && (
                      <option value="" disabled>
                        No doctors available or insufficient permission
                      </option>
                    )}
                    {doctors.map((doctor) => (
                      <option key={doctor.id} value={doctor.id}>
                        Dr. {doctor.firstName} {doctor.lastName} (
                        {doctor.specialization || "General"})
                      </option>
                    ))}
                  </select>
                  {appointmentForm.doctorId && (
                    <small className="availability-hint">
                      {(() => {
                        const doc = doctors.find(
                          (d) =>
                            String(d.id) === String(appointmentForm.doctorId)
                        );
                        const { start, end } = parseWorkingHours(
                          doc?.workingHours
                        );
                        const daysLabel = formatWorkingDaysLabel(
                          parseWorkingDays(doc?.workingHours)
                        );
                        return (
                          <small>
                            {`Days: ${daysLabel} • Hours: ${start} - ${end}`}
                          </small>
                        );
                      })()}
                    </small>
                  )}
                </div>
                <div className="form-group">
                  <label>Date</label>
                  <select
                    value={appointmentForm.appointmentDate}
                    onChange={(e) => {
                      const selectedDate = e.target.value;
                      setAppointmentForm({
                        ...appointmentForm,
                        appointmentDate: selectedDate,
                        appointmentTime: "",
                      });
                    }}
                    className="form-control"
                    disabled={!appointmentForm.doctorId}
                    required
                  >
                    <option value="">Select Date</option>
                    {!appointmentForm.doctorId && (
                      <option value="" disabled>
                        Please select a doctor first
                      </option>
                    )}
                    {appointmentForm.doctorId &&
                      (() => {
                        const doc = doctors.find(
                          (d) =>
                            String(d.id) === String(appointmentForm.doctorId)
                        );
                        const availableDates = getAvailableDatesForDoctor(
                          doc,
                          30
                        ); // Next 30 days
                        return availableDates.map((date) => {
                          const dateObj = new Date(date);
                          const dayName = dateObj.toLocaleDateString(
                            undefined,
                            { weekday: "short" }
                          );
                          const formattedDate = dateObj.toLocaleDateString(
                            undefined,
                            { month: "short", day: "numeric" }
                          );
                          return (
                            <option key={date} value={date}>
                              {dayName}, {formattedDate}
                            </option>
                          );
                        });
                      })()}
                  </select>
                  {appointmentForm.doctorId && (
                    <div className="availability-hint">
                      {console.log(
                        "Rendering availability hint for doctor:",
                        appointmentForm.doctorId,
                        "on date:",
                        appointmentForm.appointmentDate
                      )}
                      {(() => {
                        const doc = doctors.find(
                          (d) =>
                            String(d.id) === String(appointmentForm.doctorId)
                        );
                        const { start, end } = parseWorkingHours(
                          doc?.workingHours
                        );
                        const daysLabel = formatWorkingDaysLabel(
                          parseWorkingDays(doc?.workingHours)
                        );
                        const availableDates = getAvailableDatesForDoctor(
                          doc,
                          30
                        ); // Next 30 days

                        return (
                          <small>
                            {`Working days: ${daysLabel} • Hours: ${start} - ${end}`}
                            {` • ${availableDates.length} available dates in next 30 days`}
                          </small>
                        );
                      })()}
                    </div>
                  )}
                </div>
                <div className="form-group">
                  <label>Time</label>
                  <select
                    value={appointmentForm.appointmentTime}
                    onChange={(e) =>
                      setAppointmentForm({
                        ...appointmentForm,
                        appointmentTime: e.target.value,
                      })
                    }
                    className="form-control"
                    required
                    disabled={
                      !appointmentForm.doctorId ||
                      !appointmentForm.appointmentDate ||
                      !isDateAllowedForDoctor(
                        appointmentForm.appointmentDate,
                        doctors.find(
                          (d) =>
                            String(d.id) === String(appointmentForm.doctorId)
                        )
                      )
                    }
                  >
                    <option value="">Select Time</option>
                    {availableTimesForSchedule.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
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
          <LogoutButton variant="outline">Logout</LogoutButton>
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
