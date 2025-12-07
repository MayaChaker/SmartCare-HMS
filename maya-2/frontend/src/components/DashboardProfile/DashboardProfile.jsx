import React from "react";
import "./DashboardProfile.css";
import EditButton from "../ui/EditButton/EditButton";
import { usePatientDashboard } from "../../context/PatientContext";

const DashboardProfile = ({
  variant = "content",
  active = false,
  onClick = () => {},
}) => {
  const { profile, openModal } = usePatientDashboard();

  if (variant === "tabButton") {
    return (
      <button
        className={`tab-button ${active ? "active" : ""}`}
        onClick={onClick}
      >
        Profile
      </button>
    );
  }

  if (!active) return null;

  return (
    <div className="dashboard-profile card">
      <div className="card-header">
        <h3 className="card-title">My Profile</h3>
        <EditButton openModal={() => openModal("editProfile")} />
      </div>
      <div className="profile-info">
        <div className="profile-field">
          <span className="profile-label">Full Name</span>
          <span className="profile-value">{profile.name}</span>
        </div>
        <div className="profile-field">
          <span className="profile-label">Phone</span>
          <span className="profile-value">{profile.phone}</span>
        </div>
        <div className="profile-field">
          <span className="profile-label">Date of Birth</span>
          <span className="profile-value">{profile.dateOfBirth}</span>
        </div>
        <div className="profile-field">
          <span className="profile-label">Gender</span>
          <span className="profile-value">{profile.gender}</span>
        </div>
        <div className="profile-field">
          <span className="profile-label">Address</span>
          <span className="profile-value">{profile.address}</span>
        </div>
        <div className="profile-field">
          <span className="profile-label">Emergency Contact</span>
          <span className="profile-value">{profile.emergencyContact}</span>
        </div>
        <div className="profile-field">
          <span className="profile-label">Blood Type</span>
          <span className="profile-value">{profile.bloodType}</span>
        </div>
        <div className="profile-field">
          <span className="profile-label">Allergies</span>
          <span className="profile-value">{profile.allergies}</span>
        </div>
        <div className="profile-field">
          <span className="profile-label">Insurance</span>
          <span className="profile-value">{profile.insurance}</span>
        </div>
        <div className="profile-field">
          <span className="profile-label">Medical History</span>
          <span className="profile-value">{profile.medicalHistory}</span>
        </div>
      </div>
    </div>
  );
};

export default DashboardProfile;
