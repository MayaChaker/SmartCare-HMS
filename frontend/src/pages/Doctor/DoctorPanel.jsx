import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

// Icons
import { FaUserMd } from "react-icons/fa";
import { FiCalendar, FiUser, FiBarChart2, FiUsers } from "react-icons/fi";

// Local doctor images used in the photo gallery
import img1 from "../../assets/Dr-Walid-Haddad.jpg";
import img2 from "../../assets/Andrew-el-alam.jpeg";
import img3 from "../../assets/Elie-assaf.jpeg";
import img4 from "../../assets/Mahmoud-choucair.jpg";
import img5 from "../../assets/Michel-Nawfal.jpeg";
import img6 from "../../assets/riad-azar.jpg";

// UI & context
import LogoutButton from "../../components/ui/LogoutButton/LogoutButton";
import { useAuth } from "../../context/useAuth";
import {
  useDoctor,
  DoctorProvider,
  renderDoctorModal, // Renders the correct modal based on modalType
} from "../../context/DoctorContext";

// Utilities & styles
import { parseWorkingHours } from "../../utils/schedule";
import "./DoctorPanel.css";

// Page sections
import DoctorDashboard from "../../components/DoctorDashboard/DoctorDashboard";
import DoctorPatient from "../../components/DoctorPatient/DoctorPatient";
import {
  handleAddMedicalRecordFactory,
  usePatientModalInitEffect,
} from "../../components/DoctorPatient/DoctorPatient";
import "../../components/DoctorPatient/DoctorPatient.css";

import DoctorAppointments from "../../components/DoctorAppointments/DoctorAppointments";
import "../../components/DoctorAppointments/DoctorAppointments.css";

import DoctorProfile, {
  handleUpdateAvailabilityFactory,
  handleProfileChangeFactory,
  saveProfileFactory,
  savePhotoFromGalleryFactory,
  useFocusPhotoUrlInputEffect,
} from "../../components/DoctorProfile/DoctorProfile";
import "../../components/DoctorProfile/DoctorProfile.css";

// Days list used in availability UI
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

  // Doctor context values (state + actions)
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
    clearMessages,
    loadDoctorData,
    showModal,
    modalType,
    selectedItem,
    setSelectedItem,
    openModal,
    closeModal,
    fileInputRef,
  } = useDoctor();

  // Tracks which section is currently active
  const [activeSection, setActiveSection] = useState("dashboard");

  // Doctor profile form state
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

  // Medical record form state
  const [medicalRecordForm, setMedicalRecordForm] = useState({
    patientId: "",
    notes: "",
    prescriptions: "",
    testResults: "",
    diagnosis: "",
    medications: "",
  });

  // Holds patient records when viewing/adding records
  const [patientRecords, setPatientRecords] = useState([]);

  // Availability modal form state
  const [availabilityForm, setAvailabilityForm] = useState({
    availability: true,
    workingHours: "",
    workingDays: [],
    startTime: "",
    endTime: "",
  });

  // Ref for photo URL input focus
  const photoUrlInputRef = useRef(null);

  // Images used in the photo gallery modal
  const galleryImages = [img1, img2, img3, img4, img5, img6];

  // Load doctor data once when the panel mounts
  useEffect(() => {
    loadDoctorData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle availability update (factory pattern)
  const getAvailabilityForm = () => availabilityForm;
  const handleUpdateAvailability = handleUpdateAvailabilityFactory({
    getAvailabilityForm,
    setLoading,
    clearMessages,
    setSuccess,
    setError,
    setDoctorProfile,
    loadDoctorData,
    closeModal,
  });

  // Handle adding a medical record
  const getMedicalRecordForm = () => medicalRecordForm;
  const handleAddMedicalRecord = handleAddMedicalRecordFactory({
    getMedicalRecordForm,
    setLoading,
    clearMessages,
    setSuccess,
    loadDoctorData,
    closeModal,
    setError,
  });

  // Fill forms when modals open
  useEffect(() => {
    if (!showModal) return;

    // Availability modal
    if (modalType === "updateAvailability" && doctorProfile) {
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

      // Profile edit or photo gallery modal
    } else if (
      (modalType === "editProfile" || modalType === "photoGallery") &&
      doctorProfile
    ) {
      const { days, start, end } = parseWorkingHours(
        doctorProfile.workingHours || ""
      );

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
  }, [
    showModal,
    modalType,
    selectedItem,
    doctorProfile,
    setPatients,
    setSelectedItem,
  ]);

  // Initialize patient-related modal data
  usePatientModalInitEffect(
    showModal,
    modalType,
    selectedItem,
    setMedicalRecordForm,
    setSelectedItem,
    setPatientRecords,
    setPatients
  );

  // Auto-focus photo URL input when needed
  useFocusPhotoUrlInputEffect(showModal, modalType, photoUrlInputRef);

  // Handle profile input changes
  const handleProfileChange = handleProfileChangeFactory(setProfileForm);

  // Save doctor profile
  const getProfileForm = () => profileForm;
  const saveProfile = saveProfileFactory({
    getProfileForm,
    setLoading,
    clearMessages,
    user,
    setDoctorProfile,
    setSuccess,
    closeModal,
    setError,
  });

  // Save selected photo from gallery
  const savePhotoFromGallery = savePhotoFromGalleryFactory({
    getProfileForm,
    setLoading,
    clearMessages,
    setDoctorProfile,
    setProfileForm,
    setSuccess,
    closeModal,
    setError,
  });

  // Render modal based on DoctorContext modalType
  const renderModal = () =>
    renderDoctorModal({
      showModal,
      closeModal,
      modalType,
      error,
      success,
      loading,
      profileForm,
      handleProfileChange,
      saveProfile,
      photoUrlInputRef,
      galleryImages,
      savePhotoFromGallery,
      fileInputRef,
      selectedItem,
      patientRecords,
      openModal,
      medicalRecordForm,
      setMedicalRecordForm,
      handleAddMedicalRecord,
      doctorProfile,
      availabilityForm,
      setAvailabilityForm,
      handleUpdateAvailability,
      daysOfWeek: DAYS_OF_WEEK,
    });

  // Main UI
  return (
    <div className="doctor-panel">
      {/* Header */}
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
            <LogoutButton>Logout</LogoutButton>
          </div>
        </div>
      </div>

      {/* Navigation & Content */}
      <div className="doctor-container">
        <nav className="doctor-nav">
          <button
            className={`doctor-nav-btn ${
              activeSection === "dashboard" ? "active" : ""
            }`}
            onClick={() => setActiveSection("dashboard")}
          >
            <FiBarChart2 /> Dashboard
          </button>

          <button
            className={`doctor-nav-btn ${
              activeSection === "patients" ? "active" : ""
            }`}
            onClick={() => setActiveSection("patients")}
          >
            <FiUsers /> My Patients
          </button>

          <button
            className={`doctor-nav-btn ${
              activeSection === "appointments" ? "active" : ""
            }`}
            onClick={() => setActiveSection("appointments")}
          >
            <FiCalendar /> Appointments
          </button>

          <button
            className={`doctor-nav-btn ${
              activeSection === "profile" ? "active" : ""
            }`}
            onClick={() => setActiveSection("profile")}
          >
            <FiUser /> Profile
          </button>
        </nav>

        <div className="doctor-content">
          {loading && <div className="loading-overlay"></div>}
          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          {activeSection === "dashboard" && (
            <DoctorDashboard setActiveSection={setActiveSection} />
          )}
          {activeSection === "patients" && <DoctorPatient />}
          {activeSection === "appointments" && <DoctorAppointments />}
          {activeSection === "profile" && <DoctorProfile user={user} />}
        </div>
      </div>

      {/* Modal renderer */}
      {renderModal()}
    </div>
  );
};

// Wrap panel with DoctorProvider
const DoctorPanelWithProvider = () => (
  <DoctorProvider>
    <DoctorPanel />
  </DoctorProvider>
);

export default DoctorPanelWithProvider;
