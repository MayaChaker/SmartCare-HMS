import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import "./ReceptionistPanel.css";
import ReceptionistDashboard from "../../components/ReceptionistDashboard/ReceptionistDashboard";
import "../../components/ReceptionistDashboard/ReceptionistDashboard.css";
import ReceptionistPatient from "../../components/ReceptionistPatient/ReceptionistPatient";
import ReceptionistAppointments from "../../components/ReceptionistAppointments/ReceptionistAppointments";
import ReceptionistNotifications from "../../components/ReceptionistNotifications/ReceptionistNotifications";
// contexts removed; pass props directly
import { FaUserTie } from "react-icons/fa6";
import LogoutButton from "../../components/ui/LogoutButton/LogoutButton";
import { GrBarChart } from "react-icons/gr";
import { FaUserInjured } from "react-icons/fa6";
import { GoChecklist } from "react-icons/go";
import { MdNotifications } from "react-icons/md";
import RegisterButton from "../../components/ui/RegisterButton/RegisterButton";
import ScheduleButton from "../../components/ui/ScheduleButton/ScheduleButton";
import {
  FaCalendarDay,
  FaPlus,
  FaUsers,
  FaClipboardList,
  FaPen,
} from "react-icons/fa";
import { MdVisibility } from "react-icons/md";
import { FaUserDoctor } from "react-icons/fa6";

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
  const todayAppointmentsRef = useRef([]);
  useEffect(() => {
    todayAppointmentsRef.current = todayAppointments;
  }, [todayAppointments]);
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${dd}`;
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
  const [editForm, setEditForm] = useState({
    appointmentDate: "",
    status: "",
  });
  const DEFAULT_APPOINTMENT_REASONS = [
    "General Consultation",
    "Follow-up",
    "Routine Checkup",
    "Acute Issue",
    "Prescription Refill",
    "Lab Results Review",
    "Vaccination",
    "New Patient Evaluation",
  ];
  const [availableTimesForSchedule, setAvailableTimesForSchedule] = useState(
    []
  );

  const loadReceptionistData = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");

      // Load all data in parallel
      const [patientsRes, doctorsRes, dayAppointmentsRes, allAppointmentsRes] =
        await Promise.all([
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
              todayAppointmentsRef.current &&
              todayAppointmentsRef.current.length > 0
            ) {
              const fromToday = new Map();
              todayAppointmentsRef.current.forEach((a) => {
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
    } catch (error) {
      console.error("Error loading receptionist data:", error);
      setError("Failed to load data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    loadReceptionistData();
  }, [loadReceptionistData]);

  useEffect(() => {
    if (activeSection === "appointments") {
      loadReceptionistData();
    }
  }, [activeSection, loadReceptionistData]);

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
          payload.appointmentDate ||
          (() => {
            const d = new Date();
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, "0");
            const dd = String(d.getDate()).padStart(2, "0");
            return `${y}-${m}-${dd}`;
          })();
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
    } else if (type === "editAppointment") {
      setEditForm({
        appointmentDate: item?.appointmentDate || "",
        status: item?.status || "scheduled",
      });
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

  const getAvailableDatesForDoctor = (doctor, daysAhead = 30) => {
    if (!doctor) return [];
    const availableDays = parseWorkingDays(doctor.workingHours);
    const availableDates = [];
    const today = new Date();

    for (let i = 0; i < daysAhead; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const dayName = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][
        d.getDay()
      ];
      if (availableDays.includes(dayName)) {
        const dateStr = new Date(
          Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())
        )
          .toISOString()
          .split("T")[0];
        availableDates.push(dateStr);
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
        const parsed = parseWorkingHours(
          typeof doc?.workingHours === "string" ? doc.workingHours : ""
        );
        const start = parsed.start || "09:00";
        const end = parsed.end || "17:00";
        const initialWindow = generateTimeSlots(start, end);
        if (initialWindow.length > 0) {
          setAvailableTimesForSchedule(initialWindow);
        }
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
        const available = initialWindow.filter(
          (t) => !(data.bookedTimes || []).includes(t)
        );
        setAvailableTimesForSchedule(available);
      } catch (e) {
        console.error(e);
        try {
          const { doctorId } = appointmentForm;
          const doc = doctors.find((d) => String(d.id) === String(doctorId));
          const parsed = parseWorkingHours(
            typeof doc?.workingHours === "string" ? doc.workingHours : ""
          );
          const start = parsed.start || "09:00";
          const end = parsed.end || "17:00";
          const fallback = generateTimeSlots(start, end);
          setAvailableTimesForSchedule(fallback);
        } catch {
          setAvailableTimesForSchedule([]);
        }
      }
    };
    fetchTimes();
  }, [appointmentForm, doctors]);

  const closeModal = () => {
    setShowModal(false);
    setModalType("");
    setSelectedItem(null);
    setError("");
    setSuccess("");
  };

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
            <h2>
              {modalType === "registerPatient" && "Register New Patient"}
              {modalType === "scheduleAppointment" && "Schedule Appointment"}
              {modalType === "viewPatient" && "Patient Details"}
              {modalType === "editAppointment" && "Edit Appointment"}
            </h2>
            <button className="modal-close" onClick={closeModal}>
              ×
            </button>
          </div>
          <div className="modal-content">
            {error && <div className="alert alert-error">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            {modalType === "registerPatient" && (
              <form onSubmit={handleRegisterPatient}>
                <div className="form-card">
                  <div className="form-grid two-col">
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
                  </div>

                  <div className="form-grid two-col">
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
                  </div>

                  <div className="form-grid two-col">
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
                          setPatientForm({
                            ...patientForm,
                            phone: e.target.value,
                          })
                        }
                        className="form-control"
                        required
                      />
                    </div>
                    <div className="form-group full-span">
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
                      Register Patient
                    </button>
                  </div>
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
                <div className="form-card">
                  <div className="form-grid two-col">
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
                      {console.log(
                        "Rendering doctor select. Doctors array:",
                        doctors,
                        "Length:",
                        doctors.length,
                        "Selected date:",
                        appointmentForm.appointmentDate
                      )}
                      <label>Doctor</label>
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
                                String(d.id) ===
                                String(appointmentForm.doctorId)
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
                  </div>
                </div>
                <div className="form-card">
                  <div className="form-grid two-col">
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
                                String(d.id) ===
                                String(appointmentForm.doctorId)
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
                                String(d.id) ===
                                String(appointmentForm.doctorId)
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
                          !appointmentForm.appointmentDate
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
                  </div>
                </div>
                <div className="form-card">
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Reason</label>
                      <select
                        value={appointmentForm.reason}
                        onChange={(e) =>
                          setAppointmentForm({
                            ...appointmentForm,
                            reason: e.target.value,
                          })
                        }
                        className="form-control"
                        required
                      >
                        <option value="">Select reason</option>
                        {DEFAULT_APPOINTMENT_REASONS.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
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
                    Schedule Appointment
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

            {modalType === "editAppointment" && (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setLoading(true);
                  try {
                    const token = localStorage.getItem("token");
                    const response = await fetch(
                      `http://localhost:5000/api/receptionist/appointments/${selectedItem.id}`,
                      {
                        method: "PUT",
                        headers: {
                          "Content-Type": "application/json",
                          Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify({
                          appointmentDate:
                            editForm.appointmentDate ||
                            selectedItem.appointmentDate,
                          status: editForm.status || selectedItem.status,
                        }),
                      }
                    );
                    if (response.ok) {
                      setSuccess("Appointment updated successfully!");
                      await loadReceptionistData();
                      closeModal();
                    } else {
                      const errorData = await response.json();
                      setError(
                        errorData.message || "Failed to update appointment"
                      );
                    }
                  } catch (err) {
                    console.error("Error updating appointment:", err);
                    setError("Failed to update appointment. Please try again.");
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                {selectedItem ? (
                  <div className="form-card">
                    <div className="form-card-title">Appointment Details</div>
                    <div className="form-grid two-col">
                      <div className="form-group">
                        <label>Patient</label>
                        <input
                          type="text"
                          value={`${selectedItem.Patient?.firstName || ""} ${
                            selectedItem.Patient?.lastName || ""
                          }`}
                          className="form-control"
                          disabled
                        />
                      </div>
                      <div className="form-group">
                        <label>Doctor</label>
                        <input
                          type="text"
                          value={`Dr. ${selectedItem.Doctor?.firstName || ""} ${
                            selectedItem.Doctor?.lastName || ""
                          }`}
                          className="form-control"
                          disabled
                        />
                      </div>
                      <div className="form-group">
                        <label>Current Date</label>
                        <input
                          type="text"
                          value={new Date(
                            selectedItem.appointmentDate
                          ).toLocaleDateString()}
                          className="form-control"
                          disabled
                        />
                      </div>
                      <div className="form-group">
                        <label>Current Time</label>
                        <input
                          type="text"
                          value={
                            selectedItem.appointmentTime
                              ? new Date(
                                  `${selectedItem.appointmentDate}T${selectedItem.appointmentTime}`
                                ).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  hour12: true,
                                })
                              : new Date(
                                  selectedItem.appointmentDate
                                ).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  hour12: true,
                                })
                          }
                          className="form-control"
                          disabled
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="form-card">
                    <div className="form-card-title">Appointment Details</div>
                    <div className="form-grid two-col">
                      <div className="form-group">
                        <label>Patient</label>
                        <input
                          type="text"
                          value=""
                          className="form-control"
                          disabled
                        />
                      </div>
                      <div className="form-group">
                        <label>Doctor</label>
                        <input
                          type="text"
                          value=""
                          className="form-control"
                          disabled
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="form-card">
                  <div className="form-card-title">Update Appointment</div>
                  <div className="form-grid two-col">
                    <div className="form-group">
                      <label>New Date</label>
                      <select
                        value={editForm.appointmentDate}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            appointmentDate: e.target.value,
                          })
                        }
                        className="form-control"
                      >
                        <option value="">Select Date</option>
                        {(() => {
                          const doc = selectedItem?.Doctor;
                          const availableDates = getAvailableDatesForDoctor(
                            doc,
                            30
                          );
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
                    </div>
                    <div className="form-group">
                      <label>Status</label>
                      <select
                        value={editForm.status}
                        onChange={(e) =>
                          setEditForm({ ...editForm, status: e.target.value })
                        }
                        className="form-control"
                        required
                      >
                        <option value="scheduled">Scheduled</option>
                        <option value="checked-in">Checked-in</option>
                        <option value="in-progress">In-progress</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>
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
                    Save Changes
                  </button>
                </div>
              </form>
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
          <LogoutButton>Logout</LogoutButton>
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
                activeSection === "notifications" ? "active" : ""
              }`}
              onClick={() => setActiveSection("notifications")}
            >
              <span className="nav-icon">
                <MdNotifications />
              </span>
              <span className="nav-text">Notifications</span>
            </button>
          </nav>
        </div>

        <div className="receptionist-main">
          {loading ? null : (
            <>
              {activeSection === "dashboard" && (
                <ReceptionistDashboard
                  todayAppointments={todayAppointments}
                  patients={patients}
                  doctors={doctors}
                  appointments={appointments}
                  openModal={openModal}
                  handleCheckIn={handleCheckIn}
                  handleUpdateAppointmentStatus={handleUpdateAppointmentStatus}
                />
              )}
              {activeSection === "patients" && (
                <ReceptionistPatient
                  patients={patients}
                  openModal={openModal}
                />
              )}
              {activeSection === "appointments" && (
                <ReceptionistAppointments
                  appointments={appointments}
                  todayAppointments={todayAppointments}
                  openModal={openModal}
                  handleUpdateAppointmentStatus={handleUpdateAppointmentStatus}
                  handleCheckIn={handleCheckIn}
                  loadReceptionistData={loadReceptionistData}
                  loading={loading}
                />
              )}
              {activeSection === "notifications" && (
                <ReceptionistNotifications
                  patients={patients}
                  appointments={appointments}
                  selectedDate={selectedDate}
                  onChangeDate={setSelectedDate}
                />
              )}
            </>
          )}
        </div>
      </div>

      {renderModal()}
    </div>
  );
};

export default ReceptionistPanel;
