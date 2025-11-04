import React from "react";
import { CiSettings } from "react-icons/ci";
import "./AdminSettingsButton.css";

const AdminSettingsButton = ({ activeSection, setActiveSection }) => {
  const isActive = activeSection === "settings";
  return (
    <button
      className={`admin-nav-item ${isActive ? "active" : ""}`}
      onClick={() => setActiveSection("settings")}
    >
      <span className="admin-nav-icon">
        <CiSettings />
      </span>
      <span className="admin-nav-label">Settings</span>
    </button>
  );
};

export default AdminSettingsButton;