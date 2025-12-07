// src/context/ReceptionistContext.jsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";

import { useAuth } from "./useAuth"; // عدّلي المسار إذا لازم
import { parseWorkingHours, generateTimeSlots } from "../utils/schedule";

const ReceptionistContext = createContext(null);

export const ReceptionistProvider = ({ children }) => {
  const { user } = useAuth();

  // ---------- UI / sections ----------
  const [activeSection, setActiveSection] = useState("dashboard");

  // ---------- global state ----------
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ---------- data ----------
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
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

  // ---------- modal ----------
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);

  // ---------- forms ----------
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
  const [availableTimesForEdit, setAvailableTimesForEdit] = useState([]);
  const [availableDatesForSchedule, setAvailableDatesForSchedule] = useState(
    []
  );

  // ---------- helpers for schedule ----------
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

  const getAvailableDatesForDoctor = useCallback(
    (doctor, daysAhead = 30) => {
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
    },
    [parseWorkingDays]
  );

  const formatWorkingDaysLabel = (days) => days.join(", ");

  // ---------- load data ----------
  const loadReceptionistData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");

      const [patientsRes, doctorsRes, dayAppointmentsRes, allAppointmentsRes] =
        await Promise.all([
          fetch("/api/receptionist/patients", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("/api/receptionist/doctors", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(
            `/api/receptionist/appointments/day?date=${encodeURIComponent(
              selectedDate
            )}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          ),
          fetch("/api/receptionist/appointments", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

      if (patientsRes.ok) {
        const patientsData = await patientsRes.json();
        setPatients(patientsData);
      }

      // ---- doctors (مع fallback إذا endpoint الأساسي فشل) ----
      if (doctorsRes.ok) {
        const doctorsData = await doctorsRes.json();
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
        // fallback admin / public
        const token = localStorage.getItem("token");
        const adminRes = await fetch("/api/admin/doctors", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (adminRes.ok) {
          const adminDoctors = await adminRes.json();
          setDoctors(Array.isArray(adminDoctors) ? adminDoctors : []);
        } else {
          const publicRes = await fetch("/api/doctors");
          if (publicRes.ok) {
            const publicDoctors = await publicRes.json();
            setDoctors(Array.isArray(publicDoctors) ? publicDoctors : []);
          } else {
            setDoctors([]);
          }
        }
      }

      if (dayAppointmentsRes.ok) {
        const todayData = await dayAppointmentsRes.json();
        setTodayAppointments(todayData);
      }

      if (allAppointmentsRes.ok) {
        const allData = await allAppointmentsRes.json();
        setAppointments(Array.isArray(allData) ? allData : []);
      } else {
        setAppointments([]);
      }
    } catch (err) {
      console.error("Error loading receptionist data:", err);
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

  // ---------- handlers ----------
  const handleRegisterPatient = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/receptionist/patients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...patientForm,
          dob: patientForm.dateOfBirth || "",
          contact: patientForm.phone || "",
        }),
      });

      if (response.ok) {
        setSuccess("Patient registered successfully!");
        await loadReceptionistData();
        closeModal();
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Failed to register patient");
      }
    } catch (err) {
      console.error("Error registering patient:", err);
      setError("Failed to register patient. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleAppointment = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const token = localStorage.getItem("token");
      const payload = {
        ...appointmentForm,
        appointmentTime: appointmentForm.appointmentTime
          ? `${String(appointmentForm.appointmentTime).slice(0, 5)}:00`
          : undefined,
      };

      const response = await fetch("/api/receptionist/appointments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

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
    } catch (err) {
      console.error("Error scheduling appointment:", err);
      setError("Failed to schedule appointment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async (appointmentId) => {
    setLoading(true);
    setError("");
    setSuccess("");

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
    } catch (err) {
      console.error("Error checking in patient:", err);
      setError("Failed to check in patient. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAppointmentStatus = async (appointmentId, status) => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `/api/receptionist/appointments/${appointmentId}`,
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
    } catch (err) {
      console.error("Error updating appointment status:", err);
      setError("Failed to update appointment status. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ---------- modal open / close ----------
  const closeModal = () => {
    setShowModal(false);
    setModalType("");
    setSelectedItem(null);
    setError("");
    setSuccess("");
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
        phone: "",
        dateOfBirth: "",
        medicalHistory: "",
        bloodType: "",
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
      setAvailableDatesForSchedule([]);

      if (!doctors || doctors.length === 0) {
        (async () => {
          try {
            setLoading(true);
            const token = localStorage.getItem("token");
            const res = await fetch("/api/receptionist/doctors", {
              headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
              const data = await res.json();
              setDoctors(Array.isArray(data) ? data : []);
            } else {
              const adminRes = await fetch("/api/admin/doctors", {
                headers: { Authorization: `Bearer ${token}` },
              });
              if (adminRes.ok) {
                const adminData = await adminRes.json();
                setDoctors(Array.isArray(adminData) ? adminData : []);
              }
            }
          } catch (err) {
            console.error("Error loading doctors inside modal:", err);
          } finally {
            setLoading(false);
          }
        })();
      }
    } else if (type === "editAppointment") {
      setEditForm({
        appointmentDate: item?.appointmentDate || "",
        status: item?.status || "scheduled",
        appointmentTime: item?.appointmentTime || "",
      });
    }
  };

  useEffect(() => {
    try {
      const { doctorId } = appointmentForm;
      if (!doctorId) {
        setAvailableDatesForSchedule([]);
        return;
      }
      const doc = doctors.find((d) => String(d.id) === String(doctorId));
      const dates =
        doc && doc.availability ? getAvailableDatesForDoctor(doc) : [];
      setAvailableDatesForSchedule(dates);
      if (
        appointmentForm.appointmentDate &&
        !dates.includes(appointmentForm.appointmentDate)
      ) {
        setAppointmentForm((prev) => ({
          ...prev,
          appointmentDate: "",
          appointmentTime: "",
        }));
        setAvailableTimesForSchedule([]);
      }
    } catch {
      setAvailableDatesForSchedule([]);
    }
  }, [appointmentForm, doctors, getAvailableDatesForDoctor]);

  // ---------- available times effect ----------
  useEffect(() => {
    const fetchTimes = async () => {
      try {
        setAvailableTimesForSchedule([]);
        const { doctorId, appointmentDate } = appointmentForm;
        if (!doctorId || !appointmentDate) return;
        const datesAllowed = Array.isArray(availableDatesForSchedule)
          ? availableDatesForSchedule
          : [];
        if (!datesAllowed.includes(appointmentDate)) {
          setAvailableTimesForSchedule([]);
          return;
        }

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
          `/api/receptionist/doctors/${doctorId}/booked-times?date=${encodeURIComponent(
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
  }, [appointmentForm, doctors, availableDatesForSchedule]);

  useEffect(() => {
    const fetchEditTimes = async () => {
      let initialWindow = [];
      try {
        setAvailableTimesForEdit([]);
        if (!(modalType === "editAppointment" && selectedItem)) return;
        const doctorId = String(
          selectedItem?.Doctor?.id || selectedItem?.doctorId || ""
        );
        const appointmentDate =
          editForm.appointmentDate || selectedItem?.appointmentDate || "";
        if (!doctorId || !appointmentDate) return;

        const doc = doctors.find((d) => String(d.id) === String(doctorId));
        const parsed = parseWorkingHours(
          typeof doc?.workingHours === "string"
            ? doc.workingHours
            : typeof selectedItem?.Doctor?.workingHours === "string"
            ? selectedItem.Doctor.workingHours
            : ""
        );
        const start = parsed.start || "09:00";
        const end = parsed.end || "17:00";
        initialWindow = generateTimeSlots(start, end);

        const token = localStorage.getItem("token");
        const res = await fetch(
          `/api/receptionist/doctors/${doctorId}/booked-times?date=${encodeURIComponent(
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
        setAvailableTimesForEdit(available);
      } catch {
        setAvailableTimesForEdit(initialWindow);
      }
    };
    fetchEditTimes();
  }, [modalType, selectedItem, editForm.appointmentDate, doctors]);

  // ---------- render modal (نفس الكود تبعك تقريباً) ----------
  const renderModal = () => {
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

            {/* ===== register patient ===== */}
            {modalType === "registerPatient" && (
              <form onSubmit={handleRegisterPatient}>
                <div className="form-grid two-col">
                  <div className="form-group">
                    <label>First Name</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="First name"
                      value={patientForm.firstName}
                      onChange={(e) =>
                        setPatientForm({
                          ...patientForm,
                          firstName: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label>Last Name</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Last name"
                      value={patientForm.lastName}
                      onChange={(e) =>
                        setPatientForm({
                          ...patientForm,
                          lastName: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label>Username</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Enter username"
                      value={patientForm.username}
                      onChange={(e) =>
                        setPatientForm({
                          ...patientForm,
                          username: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Password</label>
                    <input
                      type="password"
                      className="form-control"
                      placeholder="Enter password"
                      value={patientForm.password}
                      onChange={(e) =>
                        setPatientForm({
                          ...patientForm,
                          password: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Phone</label>
                    <input
                      type="tel"
                      className="form-control"
                      placeholder="Phone number"
                      value={patientForm.phone}
                      onChange={(e) =>
                        setPatientForm({
                          ...patientForm,
                          phone: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label>Date of Birth</label>
                    <input
                      type="date"
                      className="form-control"
                      placeholder="YYYY-MM-DD"
                      value={patientForm.dateOfBirth}
                      onChange={(e) =>
                        setPatientForm({
                          ...patientForm,
                          dateOfBirth: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label>Blood Type</label>
                    <select
                      className="form-control"
                      value={patientForm.bloodType}
                      onChange={(e) =>
                        setPatientForm({
                          ...patientForm,
                          bloodType: e.target.value,
                        })
                      }
                    >
                      <option value="">Select Blood Type</option>
                      <option value="O-">O-</option>
                      <option value="O+">O+</option>
                      <option value="A-">A-</option>
                      <option value="A+">A+</option>
                      <option value="B-">B-</option>
                      <option value="B+">B+</option>
                      <option value="AB-">AB-</option>
                      <option value="AB+">AB+</option>
                    </select>
                  </div>
                  <div className="form-group full-span">
                    <label>Medical History</label>
                    <textarea
                      rows={3}
                      className="form-control"
                      placeholder="Add relevant medical history notes"
                      value={patientForm.medicalHistory}
                      onChange={(e) =>
                        setPatientForm({
                          ...patientForm,
                          medicalHistory: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <div className="modal-actions form-actions">
                  <button type="submit" className="btn btn-primary">
                    Submit
                  </button>
                </div>
              </form>
            )}

            {/* ===== schedule appointment ===== */}
            {modalType === "scheduleAppointment" && (
              <form onSubmit={handleScheduleAppointment}>
                <div className="form-grid two-col">
                  <div className="form-group">
                    <label>Patient</label>
                    <select
                      className="form-control"
                      value={appointmentForm.patientId}
                      onChange={(e) =>
                        setAppointmentForm({
                          ...appointmentForm,
                          patientId: e.target.value,
                        })
                      }
                      required
                    >
                      <option value="">Select Patient</option>
                      {(patients || []).map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.firstName} {p.lastName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Doctor</label>
                    <select
                      className="form-control"
                      value={appointmentForm.doctorId}
                      onChange={(e) =>
                        setAppointmentForm({
                          ...appointmentForm,
                          doctorId: e.target.value,
                        })
                      }
                      required
                    >
                      <option value="">Select Doctor</option>
                      {(doctors || []).map((d) => (
                        <option key={d.id} value={d.id}>
                          Dr. {d.firstName} {d.lastName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Date</label>
                    {availableDatesForSchedule.length > 0 ? (
                      <select
                        className="form-control"
                        value={appointmentForm.appointmentDate}
                        onChange={(e) =>
                          setAppointmentForm({
                            ...appointmentForm,
                            appointmentDate: e.target.value,
                            appointmentTime: "",
                          })
                        }
                        required
                      >
                        <option value="">Select Date</option>
                        {availableDatesForSchedule.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div
                        className="alert alert-warning"
                        style={{ marginTop: 6 }}
                      >
                        Doctor unavailable or no working days configured.
                      </div>
                    )}
                  </div>
                  <div className="form-group">
                    <label>Time</label>
                    <select
                      className="form-control"
                      value={appointmentForm.appointmentTime}
                      onChange={(e) =>
                        setAppointmentForm({
                          ...appointmentForm,
                          appointmentTime: e.target.value,
                        })
                      }
                    >
                      <option value="">Select Time</option>
                      {(availableTimesForSchedule || []).map((t) => (
                        <option key={t} value={t}>
                          {new Date(
                            `1970-01-01T${String(t).slice(0, 5)}:00`
                          ).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true,
                          })}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group full-span">
                    <label>Reason</label>
                    <select
                      className="form-control"
                      value={appointmentForm.reason}
                      onChange={(e) =>
                        setAppointmentForm({
                          ...appointmentForm,
                          reason: e.target.value,
                        })
                      }
                    >
                      <option value="">Select Reason</option>
                      {(DEFAULT_APPOINTMENT_REASONS || []).map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="modal-actions form-actions">
                  <button type="submit" className="btn btn-primary">
                    Submit
                  </button>
                </div>
              </form>
            )}

            {/* ===== view patient ===== */}
            {modalType === "viewPatient" && selectedItem && (
              <div className="patient-details">
                <div className="detail-row">
                  <strong>Name</strong>
                  <span>
                    {selectedItem.firstName} {selectedItem.lastName}
                  </span>
                </div>
                <div className="detail-row">
                  <strong>Phone</strong>
                  <span>{selectedItem.phone || ""}</span>
                </div>
                <div className="detail-row">
                  <strong>ID</strong>
                  <span>{selectedItem.id}</span>
                </div>
              </div>
            )}

            {/* ===== edit appointment ===== */}
            {modalType === "editAppointment" && (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setLoading(true);
                  setError("");
                  setSuccess("");
                  try {
                    const token = localStorage.getItem("token");
                    const response = await fetch(
                      `/api/receptionist/appointments/${selectedItem.id}`,
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
                          ...(editForm.appointmentTime
                            ? {
                                appointmentTime: `${String(
                                  editForm.appointmentTime
                                ).slice(0, 5)}:00`,
                              }
                            : {}),
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
                <div className="form-grid">
                  <div className="form-group">
                    <label>Date</label>
                    <input
                      type="date"
                      value={
                        editForm.appointmentDate ||
                        selectedItem?.appointmentDate ||
                        ""
                      }
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          appointmentDate: e.target.value,
                          appointmentTime: "",
                        })
                      }
                      className="form-control"
                      placeholder="YYYY-MM-DD"
                    />
                  </div>
                  <div className="form-group">
                    <label>Time</label>
                    <select
                      value={
                        editForm.appointmentTime ||
                        selectedItem?.appointmentTime ||
                        ""
                      }
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          appointmentTime: e.target.value,
                        })
                      }
                      className="form-control"
                    >
                      <option value="">Select Time</option>
                      {(availableTimesForEdit || []).map((t) => (
                        <option key={t} value={t}>
                          {new Date(
                            `1970-01-01T${String(t).slice(0, 5)}:00`
                          ).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true,
                          })}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Status</label>
                    <select
                      value={
                        editForm.status || selectedItem?.status || "scheduled"
                      }
                      onChange={(e) =>
                        setEditForm({ ...editForm, status: e.target.value })
                      }
                    >
                      <option value="scheduled">Scheduled</option>
                      <option value="checked-in">Checked-in</option>
                      <option value="in-progress">In-progress</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
                <div className="modal-actions">
                  <button type="submit" className="btn btn-primary">
                    Save
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={closeModal}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  };

  const value = {
    // user / ui
    user,
    activeSection,
    setActiveSection,

    // state
    loading,
    error,
    success,

    // data
    patients,
    appointments,
    doctors,
    todayAppointments,
    selectedDate,
    setSelectedDate,

    // handlers
    handleRegisterPatient,
    handleScheduleAppointment,
    handleCheckIn,
    handleUpdateAppointmentStatus,
    openModal,
    closeModal,

    // forms
    patientForm,
    setPatientForm,
    appointmentForm,
    setAppointmentForm,
    editForm,
    setEditForm,
    DEFAULT_APPOINTMENT_REASONS,
    availableTimesForSchedule,
    getAvailableDatesForDoctor,
    parseWorkingDays,
    formatWorkingDaysLabel,

    // ui helpers
    renderModal,
  };

  return (
    <ReceptionistContext.Provider value={value}>
      {children}
    </ReceptionistContext.Provider>
  );
};

export const useReceptionist = () => {
  const ctx = useContext(ReceptionistContext);
  if (!ctx) {
    throw new Error(
      "useReceptionist must be used inside <ReceptionistProvider />"
    );
  }
  return ctx;
};
