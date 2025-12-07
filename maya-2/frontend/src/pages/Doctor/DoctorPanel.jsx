// src/pages/DoctorPanel/DoctorPanel.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

import { FaUserMd, FaStethoscope, FaPills } from "react-icons/fa";
import {
  FiCalendar,
  FiSettings,
  FiClock,
  FiCheckCircle,
  FiClipboard,
  FiUser,
  FiFileText,
  FiAlertTriangle,
  FiX,
  FiBarChart2,
  FiUsers,
  FiEdit,
  FiImage,
  FiPhone,
} from "react-icons/fi";
import { TbMicroscope } from "react-icons/tb";

import img1 from "../../assets/Dr-Walid-Haddad.jpg";
import img2 from "../../assets/Andrew-el-alam.jpeg";
import img3 from "../../assets/Elie-assaf.jpeg";
import img4 from "../../assets/Mahmoud-choucair.jpg";
import img5 from "../../assets/Michel-Nawfal.jpeg";
import img6 from "../../assets/riad-azar.jpg";

import LogoutButton from "../../components/ui/LogoutButton/LogoutButton";
import { useAuth } from "../../context/useAuth";
import { useDoctor, DoctorProvider } from "../../context/DoctorContext";
import { parseWorkingHours } from "../../utils/schedule";

import "./DoctorPanel.css";
import DoctorDashboard from "../../components/DoctorDashboard/DoctorDashboard";
import DoctorPatient from "../../components/DoctorPatient/DoctorPatient";
import "../../components/DoctorPatient/DoctorPatient.css";
import DoctorAppointments from "../../components/DoctorAppointment/DoctorAppointments";
import "../../components/DoctorAppointment/DoctorAppointments.css";
import DoctorProfile from "../../components/DoctorProfile/DoctorProfile";
import "../../components/DoctorProfile/DoctorProfile.css";

const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const DoctorPanel = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // global doctor data from context
  const {
    doctorProfile,
    setDoctorProfile,
    setPatients,
    loading,
    setLoading,
    error,
    setError,
    success,
    setSuccess,
    loadDoctorData,
  } = useDoctor();

  const [activeSection, setActiveSection] = useState("dashboard");

  // modal state
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);

  // local form states
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
    photoUrl: "",
  });

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

  const photoUrlInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const galleryImages = [img1, img2, img3, img4, img5, img6];

  // --------- initial load ----------
  useEffect(() => {
    loadDoctorData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --------- time helpers ----------
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

  const splitTimeRange = (timeRange) => {
    if (!timeRange || typeof timeRange !== "string")
      return { start: "", end: "" };
    const parts = timeRange.split("-");
    if (parts.length < 2) return { start: "", end: "" };
    const start = to24Hour(parts[0]);
    const end = to24Hour(parts[1]);
    return { start, end };
  };

  const formatTime12 = (t) => {
    if (!t || typeof t !== "string") return "";
    const [hhStr, mm] = t.split(":");
    const hh = parseInt(hhStr, 10);
    if (isNaN(hh) || !mm) return t;
    const ampm = hh >= 12 ? "PM" : "AM";
    const hour12 = hh % 12 === 0 ? 12 : hh % 12;
    return `${hour12}:${mm} ${ampm}`;
  };

  const parseTimeTo24 = (input) => {
    if (!input || typeof input !== "string") return "";
    const s = input.trim().toUpperCase();

    // 12h: 10:15 PM
    const m12 = s.match(/^([0-1]?\d):([0-5]\d)\s*([AP]M)$/);
    if (m12) {
      let hh = parseInt(m12[1], 10);
      const mm = m12[2];
      const ap = m12[3];
      if (ap === "PM" && hh !== 12) hh += 12;
      if (ap === "AM" && hh === 12) hh = 0;
      return `${String(hh).padStart(2, "0")}:${mm}`;
    }

    // 24h: 22:15
    const m24 = s.match(/^([0-2]?\d):([0-5]\d)$/);
    if (m24) {
      let hh = parseInt(m24[1], 10);
      const mm = m24[2];
      if (hh > 23) return "";
      return `${String(hh).padStart(2, "0")}:${mm}`;
    }
    return "";
  };

  // ---------- availability ----------
  const handleUpdateAvailability = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const days = availabilityForm.workingDays || [];
      const startNorm = parseTimeTo24(availabilityForm.startTime?.trim());
      const endNorm = parseTimeTo24(availabilityForm.endTime?.trim());
      const startDisp = startNorm ? formatTime12(startNorm) : "";
      const endDisp = endNorm ? formatTime12(endNorm) : "";
      const daysString = days.join(", ");
      const timeRange = startDisp && endDisp ? `${startDisp} - ${endDisp}` : "";

      const composed = daysString
        ? `${daysString}${timeRange ? ` ${timeRange}` : ""}`
        : timeRange || "";

      const workingHoursString =
        composed || availabilityForm.workingHours || "";

      const newAvailability =
        availabilityForm.availability || Boolean(workingHoursString.trim());

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

        if (updatedDoctor) {
          setDoctorProfile(updatedDoctor);
        }
        await loadDoctorData();
        closeModal();
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Failed to update availability");
      }
    } catch (err) {
      console.error("Error updating availability:", err);
      setError("Failed to update availability. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ---------- add medical record ----------
  const handleAddMedicalRecord = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

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
    } catch (err) {
      console.error("Error adding medical record:", err);
      setError("Failed to add medical record. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ---------- modal open/close ----------
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

  // focus image URL input when edit profile modal opens
  useEffect(() => {
    if (showModal && modalType === "editProfile") {
      setTimeout(() => {
        if (photoUrlInputRef.current) {
          photoUrlInputRef.current.focus();
        }
      }, 100);
    }
  }, [showModal, modalType]);

  // ---------- profile form ----------
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
      closeModal();
    } catch (err) {
      console.error("Error updating profile:", err);
      setError(err?.message || "Could not update profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ---------- photo helpers ----------
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

  const resolvePhotoUrl = (url) => {
    const candidate = String(url || "").trim();
    if (!candidate) return "";
    if (
      candidate.toLowerCase() === "null" ||
      candidate.toLowerCase() === "undefined"
    )
      return "";
    if (candidate.startsWith("/uploads/") || candidate.startsWith("uploads/")) {
      const normalized = candidate.startsWith("uploads/")
        ? `/${candidate}`
        : candidate;
      return `http://localhost:5000${normalized}`;
    }
    return candidate;
  };

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

  // ---------- modal UI ----------
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

            {/* EDIT PROFILE */}
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
                    Update Profile
                  </button>
                </div>
              </form>
            )}

            {/* PHOTO GALLERY */}
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

            {/* VIEW PATIENT */}
            {modalType === "viewPatient" && selectedItem && (
              <div className="patient-profile">
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

            {/* ADD RECORD */}
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
                      <>Save Medical Record</>
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

            {/* UPDATE AVAILABILITY */}
            {modalType === "updateAvailability" && (
              <div className="availability-form">
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
                      <>Update Availability</>
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

  // ---------- main render ----------
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
            <LogoutButton>Logout</LogoutButton>
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
          {loading && <div className="loading-overlay"></div>}

          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          {activeSection === "dashboard" && (
            <DoctorDashboard
              openModal={openModal}
              setActiveSection={setActiveSection}
            />
          )}

          {activeSection === "patients" && (
            <DoctorPatient openModal={openModal} />
          )}

          {activeSection === "appointments" && (
            <DoctorAppointments openModal={openModal} />
          )}

          {activeSection === "profile" && (
            <DoctorProfile
              user={user}
              openModal={openModal}
              uploadPhotoFile={uploadPhotoFile}
              resolvePhotoUrl={resolvePhotoUrl}
              fileInputRef={fileInputRef}
            />
          )}
        </div>
      </div>

      {renderModal()}
    </div>
  );
};

const DoctorPanelWithProvider = () => (
  <DoctorProvider>
    <DoctorPanel />
  </DoctorProvider>
);

export default DoctorPanelWithProvider;
