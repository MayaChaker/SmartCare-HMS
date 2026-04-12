// Receptionist panel shell
import React from "react";
// Router helper for brand click navigation to Home
import { useNavigate } from "react-router-dom";
import "./ReceptionistPanel.css";
import {
  ReceptionistProvider,
  useReceptionist,
} from "../../context/ReceptionistContext";

import ReceptionistDashboard from "../../components/ReceptionistDashboard/ReceptionistDashboard";
import "../../components/ReceptionistDashboard/ReceptionistDashboard.css";
import ReceptionistPatient from "../../components/ReceptionistPatient/ReceptionistPatient";
import ReceptionistAppointments from "../../components/ReceptionistAppointments/ReceptionistAppointments";
import ReceptionistNotifications from "../../components/ReceptionistNotifications/ReceptionistNotifications";
// Icons used in header and sidebar navigation
import { FaUserTie } from "react-icons/fa6";
import LogoutButton from "../../components/ui/LogoutButton/LogoutButton";
import { GrBarChart } from "react-icons/gr";
import { FaUserInjured } from "react-icons/fa6";
import { GoChecklist } from "react-icons/go";
import { MdNotifications } from "react-icons/md";

// Inner panel: consumes receptionist context and renders the layout
const ReceptionistPanelInner = () => {
  const navigate = useNavigate();

  // Context values: current user, active section, section setter, loading gate, modal renderer
  const { user, activeSection, setActiveSection, loading, renderModal } =
    useReceptionist();

  return (
    <div className="receptionist-panel">
      {/* Header: brand navigation and user actions */}
      <div className="receptionist-header">
        {/* Brand area: navigates to Home; keyboard accessible */}
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
          {/* Logout triggers auth flow handled elsewhere */}
          <LogoutButton>Logout</LogoutButton>
        </div>
      </div>

      <div className="receptionist-content">
        {/* Sidebar navigation: switches activeSection for main content routing */}
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
          {/* Section routing: render content based on activeSection; loading gates content */}
          {loading ? null : (
            <>
              {/* Dashboard overview for receptionist tasks */}
              {activeSection === "dashboard" && <ReceptionistDashboard />}
              {/* Patient management section */}
              {activeSection === "patients" && <ReceptionistPatient />}
              {/* Appointment management section */}
              {activeSection === "appointments" && <ReceptionistAppointments />}
              {/* Notifications and alerts */}
              {activeSection === "notifications" && (
                <ReceptionistNotifications />
              )}
            </>
          )}
        </div>
      </div>

      {/* Modal rendering managed by context (create/edit/view flows) */}
      {renderModal()}
    </div>
  );
};

// Provider wrapper: supplies receptionist context to the inner panel
const ReceptionistPanel = () => (
  <ReceptionistProvider>
    <ReceptionistPanelInner />
  </ReceptionistProvider>
);

export default ReceptionistPanel;
