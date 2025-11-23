import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaUserMd,
  FaStethoscope,
  FaBirthdayCake,
  FaPills,
} from "react-icons/fa";
import LogoutButton from "../../components/ui/LogoutButton/LogoutButton";
import {
  FiCalendar,
  FiCircle,
  FiSettings,
  FiClock,
  FiCheckCircle,
  FiClipboard,
  FiEye,
  FiUser,
  FiArrowRight,
  FiBarChart2,
  FiTrendingUp,
  FiHeart,
  FiMail,
  FiPhone,
  FiFileText,
  FiSave,
  FiAlertTriangle,
  FiX,
  FiRefreshCcw,
  FiPieChart,
  FiUsers,
  FiLoader,
  FiXCircle,
} from "react-icons/fi";
import { FiEdit, FiImage } from "react-icons/fi";
import img1 from "../../assets/Dr-Walid-Haddad.jpg";
import img2 from "../../assets/Andrew-el-alam.jpeg";
import img3 from "../../assets/Elie-assaf.jpeg";
import img4 from "../../assets/Mahmoud-choucair.jpg";
import img5 from "../../assets/Michel-Nawfal.jpeg";
import img6 from "../../assets/riad-azar.jpg";
import { TbMicroscope } from "react-icons/tb";
import { useAuth } from "../../context/AuthContext";
import "../../utils/api";
import "./DoctorPanel.css";
import { parseWorkingHours } from "../../utils/schedule";

const DoctorPanel = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("dashboard");
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const photoUrlInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const galleryImages = [img1, img2, img3, img4, img5, img6];

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
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    specialization: "",
    availability: false,
    workingHours: "",
    availableDay: "",
    startTime: "",
    endTime: "",
    licenseNumber: "",
    experience: 0,
    qualification: "",
  });

  // Form states
  const [medicalRecordForm, setMedicalRecordForm] = useState({
    patientId: "",
    notes: "",
    prescriptions: "",
    testResults: "",
    diagnosis: "",
    medications: "",
  });
  const [patientRecords, setPatientRecords] = useState([]);

  const [availabilityForm, setAvailabilityForm] = useState({
    availability: true,
    workingHours: "",
    workingDays: [],
    startTime: "",
    endTime: "",
  });

  // Convert time like "9:00 AM" or "09:00" to 24h "09:00"
  const to24Hour = (t) => {
    if (!t || typeof t !== "string") return "";
    const m = t.trim().match(/^(\d{1,2}):(\d{2})(?:\s*([AP]M))?$/i);
    if (!m) return "";
    let h = parseInt(m[1], 10);
    const minutes = m[2];
    const mer = (m[3] || "").toUpperCase();
    if (mer === "PM" && h < 12) h += 12;
    if (mer === "AM" && h === 12) h = 0;
    return `${String(h).padStart(2, "0")}:${minutes}`;
  };

  // Split a range like "09:00 - 17:00" or "9:00 AM - 5:00 PM" to 24h times
  const splitTimeRange = (timeRange) => {
    if (!timeRange || typeof timeRange !== "string")
      return { start: "", end: "" };
    const parts = timeRange.split("-");
    if (parts.length < 2) return { start: "", end: "" };
    const start = to24Hour(parts[0]);
    const end = to24Hour(parts[1]);
    return { start, end };
  };

  useEffect(() => {
    loadDoctorData();
  }, []);

  const loadDoctorData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");

      // Load doctor profile
      const profileResponse = await fetch(
        "http://localhost:5000/api/doctor/profile",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        setDoctorProfile(profileData);
      }

      // Load patients
      const patientsResponse = await fetch(
        "http://localhost:5000/api/doctor/patients",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (patientsResponse.ok) {
        const patientsData = await patientsResponse.json();
        setPatients(patientsData);
      }

      // Load appointments
      const appointmentsResponse = await fetch(
        "http://localhost:5000/api/doctor/appointments",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
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
    // Match 12h: e.g., 10:15 PM or 10:15PM
    const m12 = s.match(/^([0-1]?\d):([0-5]\d)\s*([AP]M)$/);
    if (m12) {
      let hh = parseInt(m12[1], 10);
      const mm = m12[2];
      const ap = m12[3];
      if (ap === "PM" && hh !== 12) hh += 12;
      if (ap === "AM" && hh === 12) hh = 0;
      return `${String(hh).padStart(2, "0")}:${mm}`;
    }
    // Match 24h: e.g., 22:15
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
      // Compose working hours string from separate inputs
      const days = availabilityForm.workingDays || [];
      const startNorm = parseTimeTo24(availabilityForm.startTime?.trim());
      const endNorm = parseTimeTo24(availabilityForm.endTime?.trim());
      const startDisp = startNorm ? formatTime12(startNorm) : "";
      const endDisp = endNorm ? formatTime12(endNorm) : "";
      const daysString = days.join(", ");
      const timeRange = startDisp && endDisp ? `${startDisp} - ${endDisp}` : "";
      // Persist days even if time is not set; append time only when both provided
      const composed = daysString
        ? `${daysString}${timeRange ? ` ${timeRange}` : ""}`
        : timeRange
        ? timeRange
        : "";
      const workingHoursString =
        composed || availabilityForm.workingHours || "";
      // If a schedule is set but availability checkbox isn't checked, auto-enable availability
      const newAvailability =
        availabilityForm.availability || Boolean(workingHoursString.trim());

      console.log("Submitting availability payload", {
        availability: newAvailability,
        workingHours: workingHoursString,
      });

      const token = localStorage.getItem("token");
      const response = await fetch(
        "http://localhost:5000/api/doctor/availability",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            availability: newAvailability,
            workingHours: workingHoursString,
            availableDay: daysString,
            availableStartTime: startNorm || availabilityForm.startTime || "",
            availableEndTime: endNorm || availabilityForm.endTime || "",
          }),
        }
      );

      if (response.ok) {
        const respData = await response.json();
        const updatedDoctor = respData?.doctor;
        setSuccess("Availability updated successfully!");
        // Prefer server-returned doctor profile for immediate accuracy
        if (updatedDoctor) {
          setDoctorProfile(updatedDoctor);
        } else if (doctorProfile) {
          // Fallback optimistic update if response doesn't include doctor
          setDoctorProfile({
            ...doctorProfile,
            availability: newAvailability,
            workingHours:
              workingHoursString || doctorProfile.workingHours || "",
          });
        } else {
          // If we don't have a local profile, refetch to ensure UI updates
          await loadDoctorData();
        }
        // Always refetch to sync with backend state and avoid stale UI
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
    } else if (type === "viewPatient" && item) {
      const token = localStorage.getItem("token");
      fetch(`http://localhost:5000/api/doctor/patients/${item.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => (r.ok ? r.json() : Promise.reject()))
        .then((data) => {
          setSelectedItem(data.patient || item);
          setPatientRecords(
            Array.isArray(data.medicalRecords) ? data.medicalRecords : []
          );
          const hasRecs =
            Array.isArray(data.medicalRecords) &&
            data.medicalRecords.length > 0;
          setPatients((prev) =>
            prev.map((p) =>
              p.id === item.id
                ? {
                    ...p,
                    hasMedicalRecords: hasRecs || p.hasMedicalRecords,
                    medicalHistory: hasRecs
                      ? p.medicalHistory || "Available"
                      : p.medicalHistory,
                  }
                : p
            )
          );
        })
        .catch(() => {
          setPatientRecords([]);
        });
    } else if (type === "updateAvailability" && doctorProfile) {
      setAvailabilityForm({
        availability:
          typeof doctorProfile.availability === "boolean"
            ? doctorProfile.availability
            : true,
        workingHours: doctorProfile.workingHours || "",
        workingDays: [],
        startTime: "",
        endTime: "",
      });
    } else if (
      (type === "editProfile" || type === "photoGallery") &&
      doctorProfile
    ) {
      const { days, time } = parseWorkingHours(
        doctorProfile.workingHours || ""
      );
      const { start, end } = splitTimeRange(time);
      setProfileForm({
        firstName: doctorProfile.firstName || "",
        lastName: doctorProfile.lastName || "",
        email: doctorProfile.email || "",
        phone: doctorProfile.phone || "",
        photoUrl: doctorProfile.photoUrl || "",
        specialization: doctorProfile.specialization || "",
        availability:
          typeof doctorProfile.availability === "boolean"
            ? doctorProfile.availability
            : false,
        workingHours: doctorProfile.workingHours || "",
        availableDay: days.join(", ") || "",
        startTime: start || "",
        endTime: end || "",
        licenseNumber: doctorProfile.licenseNumber || "",
        experience: doctorProfile.experience || 0,
        qualification: doctorProfile.qualification || "",
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

  useEffect(() => {
    if (showModal && modalType === "editProfile") {
      // Delay slightly to ensure the input is rendered
      setTimeout(() => {
        if (photoUrlInputRef.current) {
          photoUrlInputRef.current.focus();
        }
      }, 100);
    }
  }, [showModal, modalType]);

  const startEditProfile = () => {
    if (doctorProfile) {
      const { days, time } = parseWorkingHours(
        doctorProfile.workingHours || ""
      );
      const { start, end } = splitTimeRange(time);
      setProfileForm({
        firstName: doctorProfile.firstName || "",
        lastName: doctorProfile.lastName || "",
        email: doctorProfile.email || "",
        phone: doctorProfile.phone || "",
        photoUrl: doctorProfile.photoUrl || "",
        specialization: doctorProfile.specialization || "",
        availability:
          typeof doctorProfile.availability === "boolean"
            ? doctorProfile.availability
            : false,
        workingHours: doctorProfile.workingHours || "",
        availableDay: days.join(", ") || "",
        startTime: start || "",
        endTime: end || "",
        licenseNumber: doctorProfile.licenseNumber || "",
        experience: doctorProfile.experience || 0,
        qualification: doctorProfile.qualification || "",
      });
    }
    setEditingProfile(true);
  };

  const cancelEditProfile = () => {
    setEditingProfile(false);
  };

  const handleProfileChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProfileForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const token = localStorage.getItem("token");
      const days = (profileForm.availableDay || "").trim();
      const start = (profileForm.startTime || "").trim();
      const end = (profileForm.endTime || "").trim();
      const timeRange = start && end ? `${start} - ${end}` : "";
      const workingHoursString =
        days && timeRange
          ? `${days} ${timeRange}`
          : profileForm.workingHours || "";
      const normalizePhotoUrl = (u) => {
        const v = (u || "").trim();
        if (!v) return v;
        if (v.startsWith("uploads/")) return `/${v}`;
        return v;
      };

      const expRaw = profileForm.experience;
      const expNum =
        expRaw === "" || expRaw === null || expRaw === undefined
          ? undefined
          : parseInt(expRaw, 10);

      const payload = {
        firstName: profileForm.firstName,
        lastName: profileForm.lastName,
        phone: profileForm.phone,
        specialization: profileForm.specialization,
        photoUrl: normalizePhotoUrl(profileForm.photoUrl),
        availability: profileForm.availability,
        workingHours: workingHoursString,
        availableDay: days,
        availableStartTime: start,
        availableEndTime: end,
        licenseNumber: profileForm.licenseNumber,
        experience: expNum,
        qualification: profileForm.qualification,
      };
      const resp = await fetch("http://localhost:5000/api/doctor/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (!resp.ok) {
        let msg = "Failed to update profile";
        const ct = resp.headers.get("Content-Type") || "";
        try {
          if (ct.includes("application/json")) {
            const j = await resp.json();
            msg = j?.message || msg;
          } else {
            const t = await resp.text();
            msg = t || msg;
          }
        } catch {
          // ignore parse errors
        }
        if (resp.status === 403) {
          const role = user && user.role ? user.role : "unknown";
          msg = `${msg}. You are logged in as '${role}'. Only doctors can update doctor profiles.`;
        }
        throw new Error(msg);
      }
      const data = await resp.json();
      const updated = data.doctor || data;
      setDoctorProfile(updated);
      setSuccess("Profile updated successfully.");
      setEditingProfile(false);
    } catch (err) {
      console.error("Error updating profile:", err);
      setError(err?.message || "Could not update profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Upload a new profile photo from device (inside component for access to state setters)
  const uploadPhotoFile = async (file) => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("photo", file);
      const resp = await fetch("http://localhost:5000/api/doctor/photo", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      if (!resp.ok) {
        const t = await resp.text();
        throw new Error(t || "Failed to upload photo");
      }
      const data = await resp.json();
      const updated = data.doctor || data;
      setDoctorProfile(updated);
      setProfileForm((prev) => ({
        ...prev,
        photoUrl: updated.photoUrl || prev.photoUrl,
      }));
      setSuccess("Profile photo uploaded successfully.");
      closeModal();
    } catch (err) {
      console.error("Error uploading photo:", err);
      setError("Could not upload photo. Please try another image.");
    } finally {
      setLoading(false);
    }
  };

  // Resolve stored photoUrl to an absolute URL when it's a backend-served path
  const resolvePhotoUrl = (url, fallbackName) => {
    if (!url) {
      return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
        fallbackName || "Doctor"
      )}`;
    }
    // If backend stored a relative uploads path, prefix with backend origin
    if (url.startsWith("/uploads/") || url.startsWith("uploads/")) {
      const normalized = url.startsWith("uploads/") ? `/${url}` : url;
      return `http://localhost:5000${normalized}`;
    }
    return url;
  };

  // Save selected photo from preset gallery (inside component for access to state setters)
  const savePhotoFromGallery = async (url) => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const token = localStorage.getItem("token");
      const days = (profileForm.availableDay || "").trim();
      const start = (profileForm.startTime || "").trim();
      const end = (profileForm.endTime || "").trim();
      const timeRange = start && end ? `${start} - ${end}` : "";
      const workingHoursString =
        days && timeRange
          ? `${days} ${timeRange}`
          : profileForm.workingHours || "";
      const payload = {
        firstName: profileForm.firstName,
        lastName: profileForm.lastName,
        phone: profileForm.phone,
        specialization: profileForm.specialization,
        photoUrl: url,
        availability: profileForm.availability,
        workingHours: workingHoursString,
        availableDay: days,
        availableStartTime: start,
        availableEndTime: end,
        licenseNumber: profileForm.licenseNumber,
        experience: profileForm.experience,
        qualification: profileForm.qualification,
      };
      const resp = await fetch("http://localhost:5000/api/doctor/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (!resp.ok) {
        const t = await resp.text();
        throw new Error(t || "Failed to update profile photo");
      }
      const data = await resp.json();
      const updated = data.doctor || data;
      setDoctorProfile(updated);
      setProfileForm((prev) => ({ ...prev, photoUrl: url }));
      setSuccess("Profile photo updated successfully.");
      closeModal();
    } catch (err) {
      console.error("Error updating profile photo:", err);
      setError("Could not update photo. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const renderDashboard = () => {
    const today = new Date();

    return (
      <div className="dashboard-content">
        <div className="dashboard-header">
          <div className="dashboard-welcome">
            <div className="welcome-text">
              <h1 className="doctor-dashboard-title">Doctor Dashboard</h1>
              {/* Removed subtitle per request */}
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
              </div>
              {/* Removed working-hours block per request */}
              {/* Removed status and debug display blocks per request */}
            </div>
          </div>
        </div>

        <div className="stats-dashboard">
          <div className="stats-grid">
            <div className="stat-card appointments-card">
              <div className="stat-header">
                <div className="stat-icon-wrapper">
                  <span className="stat-icon">
                    <FiCalendar />
                  </span>
                </div>
                <div className="stat-info">
                  <div className="trend-text">This month</div>
                  <div className="stat-number">{appointments.length}</div>
                  <div className="stat-label">Total Appointments</div>
                </div>
              </div>
              {/* Footer removed for appointments-card to show 'This month' above number/label */}
            </div>

            <div className="stat-card completed-card">
              <div className="stat-header">
                <div className="stat-icon-wrapper">
                  <span className="stat-icon">
                    <FiCheckCircle />
                  </span>
                </div>
                <div className="stat-info">
                  <div className="trend-text">Successfully treated</div>
                  <div className="stat-number">
                    {
                      appointments.filter((a) => a.status === "completed")
                        .length
                    }
                  </div>
                  <div className="stat-label">Completed</div>
                </div>
              </div>
            </div>

            <div className="stat-card scheduled-card">
              <div className="stat-header">
                <div className="stat-icon-wrapper">
                  <span className="stat-icon">
                    <FiClock />
                  </span>
                </div>
                <div className="stat-info">
                  <div className="trend-text">Upcoming appointments</div>
                  <div className="stat-number">
                    {
                      appointments.filter((a) => a.status === "scheduled")
                        .length
                    }
                  </div>
                  <div className="stat-label">Scheduled</div>
                </div>
              </div>
            </div>

            <div className="stat-card patients-card">
              <div className="stat-header">
                <div className="stat-icon-wrapper">
                  <span className="stat-icon">
                    <FiUsers />
                  </span>
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
                      {
                        appointments
                          .filter(
                            (a) =>
                              a.status && a.status.toLowerCase() === "completed"
                          )
                          .slice(0, 5).length
                      }{" "}
                      of{" "}
                      {
                        appointments.filter(
                          (a) =>
                            a.status && a.status.toLowerCase() === "completed"
                        ).length
                      }
                    </span>
                  </h1>
                </div>
              </div>
              <div className="appointments-preview">
                {appointments
                  .filter(
                    (a) => a.status && a.status.toLowerCase() === "completed"
                  )
                  .slice(0, 5).length > 0 ? (
                  <div className="appointments-list">
                    {appointments
                      .filter(
                        (a) =>
                          a.status && a.status.toLowerCase() === "completed"
                      )
                      .slice(0, 5)
                      .map((appointment) => (
                        <div key={appointment.id} className="appointment-item">
                          <div className="appointment-avatar">
                            <span className="avatar-icon">
                              <FiUser />
                            </span>
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
                              className={`status-badge status-${appointment.status.toLowerCase()}`}
                            >
                              {appointment.status}
                            </span>
                          </div>
                          {appointment.status === "completed" && (
                            <div
                              className="appointment-actions"
                              style={{ marginLeft: "auto" }}
                            >
                              <button
                                className="action-btn primary"
                                type="button"
                                onClick={() =>
                                  openModal("addRecord", appointment.Patient)
                                }
                                title="Add Medical Record"
                              >
                                <FiFileText />
                                Add Record
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    <div className="empty-icon">
                      <FiCalendar />
                    </div>
                    <div className="empty-content">
                      <h4>No completed appointments</h4>
                      <p>Completed appointments will appear here</p>
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
                  <div className="action-icon">
                    <FiUsers />
                  </div>
                  <div className="action-content">
                    <span className="action-title">View Patients</span>
                    <span className="action-desc">Manage patient records</span>
                  </div>
                  <div className="action-arrow">
                    <FiArrowRight />
                  </div>
                </button>

                <button
                  className="action-card appointments-action"
                  onClick={() => setActiveSection("appointments")}
                >
                  <div className="action-icon">
                    <FiCalendar />
                  </div>
                  <div className="action-content">
                    <span className="action-title">Appointments</span>
                    <span className="action-desc">View schedule</span>
                  </div>
                  <div className="action-arrow">
                    <FiArrowRight />
                  </div>
                </button>

                <button
                  className="action-card profile-action"
                  onClick={() => setActiveSection("profile")}
                >
                  <div className="action-icon">
                    <FiUser />
                  </div>
                  <div className="action-content">
                    <span className="action-title">Profile</span>
                    <span className="action-desc">View & edit profile</span>
                  </div>
                  <div className="action-arrow">
                    <FiArrowRight />
                  </div>
                </button>
              </div>
            </div>

            <div className="section-card today-summary">
              <div className="section-header">
                <h1>Today's Summary</h1>
              </div>
              <div className="summary-content">
                <div className="summary-item">
                  <div className="summary-icon">
                    <FiBarChart2 />
                  </div>
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
                  <div className="summary-icon">
                    <FiClock />
                  </div>
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
                  <div className="summary-icon">
                    <FiPieChart />
                  </div>
                  <div className="summary-info">
                    <span className="summary-label">Completion Rate</span>
                    <span className="summary-value">
                      {appointments.length > 0
                        ? Math.round(
                            (appointments.filter(
                              (a) => a.status === "completed"
                            ).length /
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
            <span className="section-count patients-count">
              {patients.length} Total Patients
            </span>
          </h1>
        </div>
      </div>
      <div className="patients-grid">
        {patients.length > 0 ? (
          patients.map((patient) => (
            <div key={patient.id} className="patient-card">
              <div className="patient-header">
                <div className="patient-avatar">
                  <FiUser />
                </div>
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
                      <span className="contact-icon">
                        <FiPhone />
                      </span>
                      <span className="contact-text">{patient.phone}</span>
                    </div>
                    <div className="contact-secondary">
                      <div className="secondary-item">
                        <span className="secondary-label">DOB:</span>
                        <span className="secondary-value">
                          {patient.dateOfBirth || "N/A"}
                        </span>
                      </div>
                      <div className="secondary-item">
                        <span className="secondary-label">History:</span>
                        <span className="secondary-value">
                          {patient.hasMedicalRecords || patient.medicalHistory
                            ? "Available"
                            : "None"}
                        </span>
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
                    <FiEye />
                    View
                  </button>
                  <button
                    className="action-btn secondary"
                    onClick={() => openModal("addRecord", patient)}
                    title="Add Medical Record"
                  >
                    <FiFileText />
                    Record
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state">
            <span className="empty-icon">
              <FiUsers />
            </span>
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
            <span className="section-count appointments-count">
              {
                appointments.filter(
                  (a) => a.status && a.status.toLowerCase() === "completed"
                ).length
              }{" "}
              Completed Appointments
            </span>
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
            {appointments.filter(
              (a) => a.status && a.status.toLowerCase() === "completed"
            ).length > 0 ? (
              appointments
                .filter(
                  (a) => a.status && a.status.toLowerCase() === "completed"
                )
                .map((appointment) => (
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
                          <span className="date-icon">
                            <FiCalendar />
                          </span>
                          <span className="date-text">
                            {new Date(
                              appointment.appointmentDate
                            ).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="appointment-time">
                          <span className="time-icon">
                            <FiClock />
                          </span>
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
                            <span className="detail-value">
                              {appointment.notes}
                            </span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <span
                        className={`status-badge status-${appointment.status
                          .toLowerCase()
                          .replace(" ", "-")}`}
                      >
                        {appointment.status === "scheduled" && <FiClock />}
                        {appointment.status === "in-progress" && (
                          <FiRefreshCcw />
                        )}
                        {appointment.status === "completed" && (
                          <FiCheckCircle />
                        )}
                        {appointment.status === "cancelled" && <FiXCircle />}
                        <span className="status-text">
                          {appointment.status}
                        </span>
                      </span>
                    </td>
                    <td>
                      <div className="table-actions">
                        {appointment.status === "completed" && (
                          <button
                            className="action-btn primary"
                            onClick={() =>
                              openModal("addRecord", appointment.Patient)
                            }
                            title="Add Medical Record"
                          >
                            <FiFileText />
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
                    <p>No completed appointments</p>
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
    const name =
      doctorProfile?.name ||
      (user?.username ? `Dr. ${user.username}` : "Doctor");
    const specialization = doctorProfile?.specialization || "General Practice";
    const phone = doctorProfile?.phone || "Not provided";
    const { days, time } = parseWorkingHours(doctorProfile?.workingHours || "");
    const [startStr, endStr] = time
      ? time.split("-").map((s) => s.trim())
      : ["", ""];

    return (
      <div className="doctor-section">
        <div className="card">
          <div className="card-header">
            <div className="card-title-row">
              <img
                src={resolvePhotoUrl(doctorProfile?.photoUrl, name)}
                alt="Doctor Avatar"
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: "1px solid #e5e5ea",
                  background: "#fff",
                  cursor: "pointer",
                }}
                title="Click to update photo"
                onClick={() => {
                  if (!doctorProfile?.photoUrl && fileInputRef.current) {
                    fileInputRef.current.click();
                  } else {
                    openModal("photoGallery");
                  }
                }}
              />
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                style={{ display: "none" }}
                onChange={(e) => {
                  const file = e.target.files && e.target.files[0];
                  if (file) {
                    uploadPhotoFile(file);
                  }
                  e.target.value = null;
                }}
              />
              <h3 className="card-title">My Profile</h3>
            </div>
            {!editingProfile ? (
              <button
                className="btn btn-outline"
                type="button"
                onClick={() => openModal("editProfile")}
                title="Edit Profile"
              >
                Edit Profile
              </button>
            ) : (
              <div className="header-actions">
                <button
                  className="btn btn-secondary"
                  type="button"
                  onClick={cancelEditProfile}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  form="profile-edit-form"
                  type="submit"
                >
                  Save
                </button>
              </div>
            )}
          </div>

          {!editingProfile ? (
            <div className="profile-info">
              <div className="profile-field">
                <span className="profile-label">Full Name</span>
                <span className="profile-value">{name}</span>
              </div>
              <div className="profile-field">
                <span className="profile-label">Phone</span>
                <span className="profile-value">{phone}</span>
              </div>
              <div className="profile-field">
                <span className="profile-label">Specialization</span>
                <span className="profile-value">{specialization}</span>
              </div>
              <div className="profile-field">
                <span className="profile-label">Start Time</span>
                <span className="profile-value">{startStr || "Not set"}</span>
              </div>
              <div className="profile-field">
                <span className="profile-label">End Time</span>
                <span className="profile-value">{endStr || "Not set"}</span>
              </div>
              <div className="profile-field">
                <span className="profile-label">Available Day</span>
                <span className="profile-value">
                  {days && days.length ? days.join(", ") : "Not set"}
                </span>
              </div>
              <div className="profile-field">
                <span className="profile-label">Qualification</span>
                <span className="profile-value">
                  {doctorProfile?.qualification || "Not set"}
                </span>
              </div>
              <div className="profile-field">
                <span className="profile-label">Experience</span>
                <span className="profile-value">
                  {doctorProfile?.experience != null &&
                  doctorProfile.experience !== ""
                    ? `${Number(doctorProfile.experience)} years`
                    : "Not set"}
                </span>
              </div>
              <div className="profile-field">
                <span className="profile-label">License Number</span>
                <span className="profile-value">
                  {doctorProfile?.licenseNumber || "Not set"}
                </span>
              </div>
            </div>
          ) : (
            <form
              id="profile-edit-form"
              className="profile-edit-form"
              onSubmit={saveProfile}
            >
              <div className="profile-details-grid">
                <div className="details-group">
                  <div className="details-group-title">Contact</div>
                  <label className="form-field">
                    <span className="form-label">Phone</span>
                    <input
                      className="profile-input"
                      type="text"
                      name="phone"
                      value={profileForm.phone}
                      onChange={handleProfileChange}
                      placeholder="000-000-0000"
                    />
                  </label>
                  <label className="form-field">
                    <span className="form-label">Profile Image URL</span>
                    <input
                      className="profile-input"
                      type="text"
                      name="photoUrl"
                      ref={photoUrlInputRef}
                      value={profileForm.photoUrl}
                      onChange={handleProfileChange}
                      placeholder="https://example.com/image.jpg or /uploads/doctor.jpg"
                    />
                  </label>
                  {profileForm.photoUrl ? (
                    <div className="form-field">
                      <span className="form-label">Preview</span>
                      <img
                        src={profileForm.photoUrl}
                        alt="Profile Preview"
                        style={{
                          width: "96px",
                          height: "96px",
                          borderRadius: "50%",
                          objectFit: "cover",
                          border: "1px solid #e5e5ea",
                          background: "#fff",
                        }}
                      />
                    </div>
                  ) : null}
                </div>

                <div className="details-group">
                  <div className="details-group-title">Work</div>

                  <label className="form-field">
                    <span className="form-label">Qualification</span>
                    <input
                      className="profile-input"
                      type="text"
                      name="qualification"
                      value={profileForm.qualification}
                      onChange={handleProfileChange}
                      placeholder="MD"
                    />
                  </label>
                  <label className="form-field">
                    <span className="form-label">License Number</span>
                    <input
                      className="profile-input"
                      type="text"
                      name="licenseNumber"
                      value={profileForm.licenseNumber}
                      onChange={handleProfileChange}
                      placeholder="ABC-12345"
                    />
                  </label>
                  <label className="form-field">
                    <span className="form-label">Experience (years)</span>
                    <input
                      className="profile-input"
                      type="number"
                      name="experience"
                      value={profileForm.experience}
                      onChange={handleProfileChange}
                      min="0"
                    />
                  </label>
                </div>
              </div>
            </form>
          )}
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
                {modalType === "photoGallery" && <FiImage />}
              </div>
              <h3 className="modal-title">
                {modalType === "viewPatient" && "Patient Profile"}
                {modalType === "addRecord" && "Add Medical Record"}
                {modalType === "updateAvailability" && "Update Availability"}
                {modalType === "editProfile" && "Edit Doctor Profile"}
                {modalType === "photoGallery" && "Choose Profile Photo"}
              </h3>
            </div>
            <button className="doctor-modal-close" onClick={closeModal}>
              <span>
                <FiX />
              </span>
            </button>
          </div>

          <div className="doctor-modal-content">
            {error && (
              <div className="doctor-alert error">
                <span className="alert-icon">
                  <FiAlertTriangle />
                </span>
                <span className="alert-message">{error}</span>
              </div>
            )}
            {success && (
              <div className="doctor-alert success">
                <span className="alert-icon">
                  <FiCheckCircle />
                </span>
                <span className="alert-message">{success}</span>
              </div>
            )}

            {modalType === "editProfile" && (
              <form
                id="profile-edit-form"
                className="profile-edit-form"
                onSubmit={saveProfile}
              >
                <div className="detail-section">
                  <div className="detail-grid">
                    <div className="form-field">
                      <span className="form-label">Phone</span>
                      <input
                        className="form-control"
                        type="text"
                        name="phone"
                        value={profileForm.phone}
                        onChange={handleProfileChange}
                        placeholder="000-000-0000"
                      />
                    </div>
                    <div className="form-field">
                      <span className="form-label">Profile Image URL</span>
                      <input
                        className="form-control"
                        type="text"
                        name="photoUrl"
                        ref={photoUrlInputRef}
                        value={profileForm.photoUrl}
                        onChange={handleProfileChange}
                        placeholder="https://example.com/image.jpg or /uploads/doctor.jpg"
                      />
                    </div>
                    {/* Availability input and label removed per request */}
                    <div className="form-field">
                      <span className="form-label">Available Day</span>
                      <input
                        className="form-control"
                        type="text"
                        name="availableDay"
                        value={profileForm.availableDay}
                        onChange={handleProfileChange}
                        placeholder="e.g. Monday, Tuesday"
                      />
                    </div>
                    <div className="form-field">
                      <span className="form-label">Start Time</span>
                      <input
                        className="form-control"
                        type="time"
                        name="startTime"
                        value={profileForm.startTime}
                        onChange={handleProfileChange}
                      />
                    </div>
                    <div className="form-field">
                      <span className="form-label">End Time</span>
                      <input
                        className="form-control"
                        type="time"
                        name="endTime"
                        value={profileForm.endTime}
                        onChange={handleProfileChange}
                      />
                    </div>
                    <div className="form-field">
                      <span className="form-label">Qualification</span>
                      <input
                        className="form-control"
                        type="text"
                        name="qualification"
                        value={profileForm.qualification}
                        onChange={handleProfileChange}
                        placeholder="MD"
                      />
                    </div>
                    <div className="form-field">
                      <span className="form-label">License Number</span>
                      <input
                        className="form-control"
                        type="text"
                        name="licenseNumber"
                        value={profileForm.licenseNumber}
                        onChange={handleProfileChange}
                        placeholder="ABC-12345"
                      />
                    </div>
                    <div className="form-field">
                      <span className="form-label">Experience (years)</span>
                      <input
                        className="form-control"
                        type="number"
                        name="experience"
                        value={profileForm.experience}
                        onChange={handleProfileChange}
                        min="0"
                      />
                    </div>
                  </div>
                </div>
                <div className="modal-actions">
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
                    {loading ? "Updating..." : "Update Profile"}
                  </button>
                </div>
              </form>
            )}

            {modalType === "photoGallery" && (
              <div className="photo-gallery">
                <div className="photo-gallery-grid">
                  {galleryImages.map((url, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className="photo-item"
                      onClick={() => savePhotoFromGallery(url)}
                      title="Select this photo"
                    >
                      <img
                        src={url}
                        alt={`Gallery ${idx + 1}`}
                        className="photo-thumb"
                      />
                    </button>
                  ))}
                </div>
                <div className="photo-gallery-actions">
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() =>
                      fileInputRef.current && fileInputRef.current.click()
                    }
                  >
                    Upload from device
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={closeModal}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {modalType === "viewPatient" && selectedItem && (
              <div className="patient-profile">
                {/* Medical Records at the very top */}
                {patientRecords && patientRecords.length > 0 && (
                  <div className="medical-records-section-top">
                    <h5 className="section-title">Medical Records</h5>
                    <div className="medical-records-cards">
                      {patientRecords.map((rec) => (
                        <div key={rec.id} className="medical-record-card">
                          <div className="record-header">
                            <div className="record-doctor-info">
                              <div className="record-doctor">
                                {rec.Doctor
                                  ? `${rec.Doctor.firstName} ${rec.Doctor.lastName}`
                                  : "Doctor"}
                              </div>
                              <div className="record-specialization">
                                {rec.Doctor?.specialization ||
                                  "General Practice"}
                              </div>
                            </div>
                            <div className="record-date">
                              {new Date(rec.visitDate).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="record-content">
                            {rec.diagnosis && (
                              <div className="record-field">
                                <span className="record-label">Diagnosis:</span>
                                <span className="record-value">
                                  {rec.diagnosis}
                                </span>
                              </div>
                            )}
                            {rec.notes && (
                              <div className="record-field">
                                <span className="record-label">Notes:</span>
                                <span className="record-value">
                                  {rec.notes}
                                </span>
                              </div>
                            )}
                            {rec.medications && (
                              <div className="record-field">
                                <span className="record-label">
                                  Medications:
                                </span>
                                <span className="record-value">
                                  {rec.medications}
                                </span>
                              </div>
                            )}
                            {rec.prescriptions && (
                              <div className="record-field">
                                <span className="record-label">
                                  Prescriptions:
                                </span>
                                <span className="record-value">
                                  {rec.prescriptions}
                                </span>
                              </div>
                            )}
                            {rec.testResults && (
                              <div className="record-field">
                                <span className="record-label">
                                  Test Results:
                                </span>
                                <span className="record-value">
                                  {rec.testResults}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Patient details under medical records */}
                <div className="patient-details-top">
                  <div className="detail-item">
                    <span className="detail-icon">
                      <FiPhone />
                    </span>
                    <span className="detail-label">Phone</span>
                    <span className="detail-value">{selectedItem.phone}</span>
                  </div>
                  {selectedItem.allergies ? (
                    <div className="detail-item">
                      <span className="detail-icon">
                        <FiAlertTriangle />
                      </span>
                      <span className="detail-label">Allergies</span>
                      <span className="detail-value">
                        {Array.isArray(selectedItem.allergies)
                          ? selectedItem.allergies.join(", ")
                          : selectedItem.allergies}
                      </span>
                    </div>
                  ) : null}
                  <div className="detail-item full-width">
                    <span className="detail-icon">
                      <FiClipboard />
                    </span>
                    <span className="detail-label">Medical History</span>
                    <span className="detail-value">
                      {patientRecords && patientRecords.length
                        ? "Available"
                        : selectedItem.medicalHistory ||
                          "No medical history available"}
                    </span>
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
                    <span className="patient-avatar">
                      <FiUser />
                    </span>
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
                        <span className="label-icon">
                          <FaStethoscope />
                        </span>
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
                        <span className="label-icon">
                          <FiFileText />
                        </span>
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
                        <span className="label-icon">
                          <FaPills />
                        </span>
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
                        <span className="label-icon">
                          <FiClipboard />
                        </span>
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
                        <span className="label-icon">
                          <TbMicroscope />
                        </span>
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
                          <span className="btn-spinner">
                            <FiLoader />
                          </span>
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
                {/* Removed empty form-header div */}

                <form
                  onSubmit={handleUpdateAvailability}
                  className="doctor-form"
                >
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
                          <span className="checkbox-title">
                            Available for appointments
                          </span>
                          <span className="checkbox-desc">
                            Allow patients to book appointments with you
                          </span>
                        </div>
                      </label>
                    </div>
                  </div>

                  <div className="form-section">
                    <h5 className="section-title">Working Schedule</h5>
                    <div className="form-hint current-schedule">
                      <span className="label-icon">
                        <FiClock />
                      </span>
                      Current: {doctorProfile?.workingHours || "Not set"}
                    </div>
                    <div className="form-hint current-schedule">
                      <span className="label-icon">
                        <FiClock />
                      </span>
                      Preview:{" "}
                      {(() => {
                        const days = availabilityForm.workingDays || [];
                        const sNorm = parseTimeTo24(
                          availabilityForm.startTime?.trim()
                        );
                        const eNorm = parseTimeTo24(
                          availabilityForm.endTime?.trim()
                        );
                        const s = sNorm ? formatTime12(sNorm) : "";
                        const e = eNorm ? formatTime12(eNorm) : "";
                        const ds = days.join(", ");
                        const tr = s && e ? `${s} - ${e}` : "";
                        const preview = ds
                          ? `${ds}${tr ? ` ${tr}` : ""}`
                          : tr || "Not set";
                        return preview || "Not set";
                      })()}
                    </div>
                    <div className="form-group">
                      <label className="form-label">Days of Week</label>
                      <div className="days-selector">
                        {DAYS_OF_WEEK.map((day) => {
                          const selected =
                            availabilityForm.workingDays.includes(day);
                          return (
                            <label
                              key={day}
                              className={`day-chip ${
                                selected ? "selected" : ""
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={selected}
                                onChange={(e) => {
                                  const isChecked = e.target.checked;
                                  setAvailabilityForm((prev) => {
                                    const nextWorkingDays = isChecked
                                      ? [...prev.workingDays, day]
                                      : prev.workingDays.filter(
                                          (d) => d !== day
                                        );
                                    const autoEnableAvailability =
                                      prev.availability ||
                                      nextWorkingDays.length > 0 ||
                                      (prev.startTime && prev.endTime);
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
                        Select days and a time range for availability. Click
                        "Update Availability" to save.
                      </span>
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
                          <span className="btn-spinner">
                            <FiLoader />
                          </span>
                          Updating...
                        </>
                      ) : (
                        <>Update Availability</>
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
            <LogoutButton variant="doctor">Logout</LogoutButton>
          </div>
        </div>
      </div>

      <div className="doctor-container">
        <nav className="doctor-nav">
          <button
            className={`doctor-nav-btn ${
              activeSection === "dashboard" ? "active" : ""
            }`}
            onClick={() => setActiveSection("dashboard")}
          >
            <span className="nav-icon">
              <FiBarChart2 />
            </span>
            Dashboard
          </button>
          <button
            className={`doctor-nav-btn ${
              activeSection === "patients" ? "active" : ""
            }`}
            onClick={() => setActiveSection("patients")}
          >
            <span className="nav-icon">
              <FiUsers />
            </span>
            My Patients
          </button>
          <button
            className={`doctor-nav-btn ${
              activeSection === "appointments" ? "active" : ""
            }`}
            onClick={() => setActiveSection("appointments")}
          >
            <span className="nav-icon">
              <FiCalendar />
            </span>
            Appointments
          </button>
          <button
            className={`doctor-nav-btn ${
              activeSection === "profile" ? "active" : ""
            }`}
            onClick={() => setActiveSection("profile")}
          >
            <span className="nav-icon">
              <FiUser />
            </span>
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
