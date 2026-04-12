import React from "react";
import { useNavigate } from "react-router-dom";
import { FaUserInjured } from "react-icons/fa6";
import LogoutButton from "../../components/ui/LogoutButton/LogoutButton";
import DashboardAppointment from "../../components/DashboardAppointment/DashboardAppointment";
import DashboardDoctor from "../../components/dashboarddoctor/DashboardDoctor";
import DashboardMedicalRecords from "../../components/DashboardMedicalRecords/DashboardMedicalRecords";
import DashboardProfile from "../../components/DashboardProfile/DashboardProfile";
import { EditProfileLayer } from "../../components/DashboardProfile/DashboardProfile";
import {
  BookAppointmentLayer,
  AppointmentActionsLayer,
} from "../../components/DashboardAppointment/DashboardAppointment";

import "./Dashboard.css";

import { useAuth } from "../../context/useAuth";
import {
  PatientDashboardProvider,
  usePatientDashboard,
} from "../../context/PatientContext";

/* 
   Helpers 
    */

const getFirstNameDisplay = (profile, user) => {
  const pickFirstWord = (text) =>
    (text || "").toString().trim().split(" ")[0] || "";

  return (
    (profile?.firstName && profile.firstName.trim()) ||
    pickFirstWord(profile?.name) ||
    pickFirstWord(user?.name) ||
    pickFirstWord(user?.username) ||
    ""
  );
};

// Decide which profile fields are missing
const getMissingProfileFields = (profile) => {
  const requiredFields = ["bloodType", "allergies", "gender"];

  return requiredFields.filter((field) => {
    const value = (profile?.[field] ?? "").toString().trim();
    return !value;
  });
};

// Convert field key into a user-friendly label (same wording as before)
const formatFieldLabel = (field) => {
  if (field === "bloodType") return "Blood Type";
  if (field === "allergies") return "Allergies";
  if (field === "gender") return "Gender";
  return field;
};

/* ======================================================
   Header
   ====================================================== */
const DashboardHeader = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile } = usePatientDashboard();

  const firstNameDisplay = getFirstNameDisplay(profile, user);

  // Click + keyboard support for navigating back home (same behavior)
  const goHome = () => navigate("/");
  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") goHome();
  };

  return (
    <header className="dashboard-header">
      <div className="container">
        <nav className="dashboard-nav">
          {/* Title + icon block (clickable) */}
          <div
            className="dashboard-title-group"
            role="button"
            tabIndex={0}
            onClick={goHome}
            onKeyDown={handleKeyDown}
            style={{ cursor: "pointer" }}
          >
            <div className="title-icon" aria-hidden="true">
              <FaUserInjured />
            </div>

            <h1 className="dashboard-title">
              My Dashboard
              <span className="user-name">
                {`Welcome${firstNameDisplay ? ", " + firstNameDisplay : ""}`}
              </span>
            </h1>
          </div>

          {/* Right side actions */}
          <div className="user-info">
            <LogoutButton>Logout</LogoutButton>
          </div>
        </nav>
      </div>
    </header>
  );
};

/* ======================================================
   Main content (warning + tabs + tab content)
   ====================================================== */
const DashboardMain = () => {
  const { activeTab, setActiveTab, loading, profile } = usePatientDashboard();

  // Profile completeness warning (same fields and same UI)
  const missingFields = getMissingProfileFields(profile);

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
              {`Please complete your profile. Add: ${missingFields
                .map(formatFieldLabel)
                .join(", ")}.`}
            </span>
          </div>
        )}

        {/* Tabs (buttons) */}
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

        {/* Tab content (only render after loading) */}
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

/* ======================================================
   Inner wrapper (layout + layers)
   ====================================================== */
const DashboardInner = () => {
  return (
    <div className="dashboard patient-dashboard">
      <DashboardHeader />
      <DashboardMain />

      {/* Global layers (stay mounted for modals/overlays) */}
      <EditProfileLayer />
      <BookAppointmentLayer />
      <AppointmentActionsLayer />
    </div>
  );
};

/* ======================================================
    (Provider)
   ====================================================== */
const Dashboard = () => {
  return (
    <PatientDashboardProvider>
      <DashboardInner />
    </PatientDashboardProvider>
  );
};

export default Dashboard;
