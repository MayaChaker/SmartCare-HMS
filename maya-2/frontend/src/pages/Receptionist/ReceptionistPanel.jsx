import React from "react";
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

import { FaUserTie } from "react-icons/fa6";
import LogoutButton from "../../components/ui/LogoutButton/LogoutButton";
import { GrBarChart } from "react-icons/gr";
import { FaUserInjured } from "react-icons/fa6";
import { GoChecklist } from "react-icons/go";
import { MdNotifications } from "react-icons/md";

const ReceptionistPanelInner = () => {
  const navigate = useNavigate();

  const { user, activeSection, setActiveSection, loading, renderModal } =
    useReceptionist();

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
              {activeSection === "dashboard" && <ReceptionistDashboard />}
              {activeSection === "patients" && <ReceptionistPatient />}
              {activeSection === "appointments" && <ReceptionistAppointments />}
              {activeSection === "notifications" && (
                <ReceptionistNotifications />
              )}
            </>
          )}
        </div>
      </div>

      {renderModal()}
    </div>
  );
};

const ReceptionistPanel = () => (
  <ReceptionistProvider>
    <ReceptionistPanelInner />
  </ReceptionistProvider>
);

export default ReceptionistPanel;
