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

export const DashboardProfileEditForm = ({
  profile = {},
  loading = false,
  onSubmit,
}) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    const form = new FormData(e.target);
    const updated = {
      name: form.get("name") || "",
      phone: form.get("phone") || "",
      dateOfBirth: form.get("dateOfBirth") || "",
      gender: form.get("gender") || "",
      address: form.get("address") || "",
      emergencyContact: form.get("emergencyContact") || "",
      bloodType: form.get("bloodType") || "",
      allergies: form.get("allergies") || "",
      insurance: form.get("insurance") || "",
      medicalHistory: form.get("medicalHistory") || "",
      permanentMedicine: form.get("permanentMedicine") || "",
    };
    onSubmit && onSubmit(updated);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label>Full Name</label>
        <input
          name="name"
          className="form-control"
          placeholder="Enter full name"
          defaultValue={profile.name || ""}
        />
      </div>
      <div className="form-group">
        <label>Phone</label>
        <input
          name="phone"
          className="form-control"
          placeholder="Enter phone number"
          defaultValue={profile.phone || ""}
        />
      </div>
      <div className="form-group">
        <label>Date of Birth</label>
        <input
          type="date"
          name="dateOfBirth"
          className="form-control"
          placeholder="YYYY-MM-DD"
          defaultValue={profile.dateOfBirth || ""}
        />
      </div>
      <div className="form-group">
        <label>Gender *</label>
        <select
          name="gender"
          className="form-control"
          defaultValue={profile.gender || ""}
          required
          aria-required="true"
        >
          <option value="">Select gender</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </select>
      </div>
      <div className="form-group">
        <label>Address</label>
        <input
          name="address"
          className="form-control"
          placeholder="Enter address"
          defaultValue={profile.address || ""}
        />
      </div>
      <div className="form-group">
        <label>Emergency Contact</label>
        <input
          name="emergencyContact"
          className="form-control"
          placeholder="Enter emergency contact"
          defaultValue={profile.emergencyContact || ""}
        />
      </div>
      <div className="form-group">
        <label>Blood Type *</label>
        <select
          name="bloodType"
          className="form-control"
          defaultValue={profile.bloodType || ""}
          required
          aria-required="true"
        >
          <option value="">Select blood type</option>
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
      <div className="form-group">
        <label>Allergies *</label>
        <select
          name="allergies"
          className="form-control"
          defaultValue={profile.allergies || ""}
          required
          aria-required="true"
        >
          <option value="">Select allergy</option>
          <option value="None">None</option>
          <option value="Penicillin">Penicillin</option>
          <option value="Peanuts">Peanuts</option>
          <option value="Shellfish">Shellfish</option>
          <option value="Latex">Latex</option>
          <option value="Pollen">Pollen</option>
          <option value="Dust">Dust</option>
          <option value="Gluten">Gluten</option>
          <option value="Dairy">Dairy</option>
          <option value="Eggs">Eggs</option>
          <option value="Other">Other</option>
        </select>
      </div>
      <div className="form-group">
        <label>Insurance</label>
        <input
          name="insurance"
          className="form-control"
          placeholder="Enter insurance provider"
          defaultValue={profile.insurance || ""}
        />
      </div>
      <div className="form-group">
        <label>Medical History</label>
        <textarea
          name="medicalHistory"
          className="form-control form-textarea"
          placeholder="Enter medical history"
          defaultValue={profile.medicalHistory || ""}
        />
      </div>
      <div className="form-group">
        <label>Permanent Medicine</label>
        <textarea
          name="permanentMedicine"
          className="form-control form-textarea"
          placeholder="Enter permanent medicine"
          defaultValue={profile.permanentMedicine || ""}
        />
      </div>
      <div className="modal-actions">
        <button type="submit" className="btn btn-primary" disabled={loading}>
          Save
        </button>
      </div>
    </form>
  );
};
