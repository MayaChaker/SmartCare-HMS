// src/pages/Dashboard/Dashboard.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { FaUserInjured } from "react-icons/fa6";
import LogoutButton from "../../components/ui/LogoutButton/LogoutButton";
import { EditProfileModal } from "../../components/ui/EditButton/EditButton";
import DashboardAppointment from "../../components/DashboardAppointment/DashboardAppointment";
import DashboardDoctor from "../../components/DashboardDoctor/DashboardDoctor";
import DashboardMedicalRecords from "../../components/DashboardMedicalRecords/DashboardMedicalRecords";
import DashboardProfile from "../../components/DashboardProfile/DashboardProfile";
import { BookAppointmentModal } from "../../components/DashboardDoctor/DashboardDoctor";
import { patientAPI } from "../../utils/api";
import "./Dashboard.css";

import { useAuth } from "../../context/useAuth";
import {
  PatientDashboardProvider,
  usePatientDashboard,
} from "../../context/PatientContext";

// --------- Header ----------
const DashboardHeader = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile } = usePatientDashboard();

  const firstNameDisplay =
    (profile?.firstName && profile.firstName.trim()) ||
    (profile?.name && profile.name.trim().split(" ")[0]) ||
    (user?.name && user.name.trim().split(" ")[0]) ||
    (user?.username && user.username.trim().split(" ")[0]) ||
    "";

  return (
    <header className="dashboard-header">
      <div className="container">
        <nav className="dashboard-nav">
          <div
            className="dashboard-title-group"
            role="button"
            tabIndex={0}
            onClick={() => navigate("/")}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") navigate("/");
            }}
            style={{ cursor: "pointer" }}
          >
            <div className="title-icon" aria-hidden="true">
              <FaUserInjured />
            </div>
            <h1 className="dashboard-title">
              Patient Dashboard
              <span className="user-name">
                {`Welcome${firstNameDisplay ? ", " + firstNameDisplay : ""}`}
              </span>
            </h1>
          </div>
          <div className="user-info">
            <LogoutButton>Logout</LogoutButton>
          </div>
        </nav>
      </div>
    </header>
  );
};

// --------- Main (tabs + content) ----------
const DashboardMain = () => {
  const { activeTab, setActiveTab, loading, profile } = usePatientDashboard();

  const requiredFields = ["bloodType", "allergies", "gender"];
  const missingFields = requiredFields.filter((f) => {
    const v = (profile?.[f] ?? "").toString().trim();
    return !v;
  });

  return (
    <main className="dashboard-content">
      <div className="container">
        {/* Warning if profile incomplete */}
        {!loading && missingFields.length > 0 && (
          <div
            className="alert alert-warning"
            style={{
              marginBottom: 16,
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <span className="alert-icon">⚠️</span>
            <span className="alert-message">
              {`Your profile is incomplete. Missing: ${missingFields
                .map((f) =>
                  f === "bloodType"
                    ? "Blood Type"
                    : f === "allergies"
                    ? "Allergies"
                    : f === "gender"
                    ? "Gender"
                    : f
                )
                .join(", ")}.`}
            </span>
          </div>
        )}

        {/* Tabs */}
        <div className="dashboard-tabs">
          <DashboardAppointment
            variant="tabButton"
            active={activeTab === "appointments"}
            onClick={() => setActiveTab("appointments")}
          />
          <DashboardDoctor
            variant="tabButton"
            active={activeTab === "doctors"}
            onClick={() => setActiveTab("doctors")}
          />
          <DashboardMedicalRecords
            variant="tabButton"
            active={activeTab === "records"}
            onClick={() => setActiveTab("records")}
          />
          <DashboardProfile
            variant="tabButton"
            active={activeTab === "profile"}
            onClick={() => setActiveTab("profile")}
          />
        </div>

        {/* Tab content */}
        {!loading && (
          <>
            <DashboardAppointment
              variant="content"
              active={activeTab === "appointments"}
            />
            <DashboardMedicalRecords
              variant="content"
              active={activeTab === "records"}
            />
            <DashboardDoctor
              variant="content"
              active={activeTab === "doctors"}
            />
            <DashboardProfile
              variant="content"
              active={activeTab === "profile"}
            />
          </>
        )}
      </div>
    </main>
  );
};

// --------- Edit Profile Modal layer ----------
const EditProfileLayer = () => {
  const {
    showModal,
    modalType,
    error,
    success,
    profile,
    loading,
    closeModal,
    updateProfile,
  } = usePatientDashboard();

  if (!showModal || modalType !== "editProfile") return null;

  return (
    <div className="modal-overlay" onClick={closeModal}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Edit Profile</h3>
          <button className="modal-close" onClick={closeModal}>
            ×
          </button>
        </div>
        <div className="modal-content">
          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}
          <EditProfileModal
            profile={profile}
            loading={loading}
            onSubmit={updateProfile}
            closeModal={closeModal}
          />
        </div>
      </div>
    </div>
  );
};

const BookAppointmentLayer = () => {
  const {
    showModal,
    modalType,
    error,
    success,
    setLoading,
    setError,
    setSuccess,
    closeModal,
    setAppointments,
    doctors,
    availableSlots,
    selectedDoctorId,
    setSelectedDoctorId,
    availableDates,
    selectedDateForBooking,
    setSelectedDateForBooking,
    selectedTimeForBooking,
    setSelectedTimeForBooking,
    availableTimes,
    setAvailableTimes,
  } = usePatientDashboard();

  if (!showModal || modalType !== "book") return null;

  const handleBookAppointment = async (appointmentData) => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const source =
        Array.isArray(availableSlots) && availableSlots.length
          ? availableSlots
          : Array.isArray(doctors)
          ? doctors
          : [];
      const doc = source.find(
        (d) => d.id === parseInt(appointmentData.doctorId, 10)
      );
      if (doc && doc.availability === false) {
        setError(
          "Selected doctor is currently unavailable. Please choose another date or doctor."
        );
        return;
      }

      const response = await patientAPI.bookAppointment(appointmentData);
      if (response.success) {
        setSuccess("Appointment booked successfully!");
        try {
          const apptResp = await patientAPI.getAppointments();
          if (apptResp.success) {
            setAppointments(apptResp.data);
          }
        } catch (err) {
          console.warn("Failed to reload appointments", err);
        }
        closeModal();
      } else {
        setError(response.message || "Failed to book appointment");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to book appointment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={closeModal}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Book New Appointment</h3>
          <button className="modal-close" onClick={closeModal}>
            ×
          </button>
        </div>
        <div className="modal-content">
          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}
          <BookAppointmentModal
            selectedDoctorId={selectedDoctorId}
            setSelectedDoctorId={setSelectedDoctorId}
            availableSlots={availableSlots}
            doctors={doctors}
            availableDates={availableDates}
            selectedDateForBooking={selectedDateForBooking}
            setSelectedDateForBooking={setSelectedDateForBooking}
            selectedTimeForBooking={selectedTimeForBooking}
            setSelectedTimeForBooking={setSelectedTimeForBooking}
            availableTimes={availableTimes}
            setAvailableTimes={setAvailableTimes}
            handleBookAppointment={handleBookAppointment}
          />
        </div>
      </div>
    </div>
  );
};

// --------- Inner + Provider ----------
const DashboardInner = () => {
  return (
    <div className="dashboard patient-dashboard">
      <DashboardHeader />
      <DashboardMain />
      <EditProfileLayer />
      <BookAppointmentLayer />
    </div>
  );
};

const Dashboard = () => {
  return (
    <PatientDashboardProvider>
      <DashboardInner />
    </PatientDashboardProvider>
  );
};

export default Dashboard;
