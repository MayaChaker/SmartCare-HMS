import React from "react";
import "./DashboardProfile.css";

const DashboardProfile = ({
  variant = "content",
  active = false,
  onClick = () => {},
  profile = {},
  openModal,
}) => {
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
        <button
          className="btn btn-outline"
          onClick={() => openModal && openModal("editProfile")}
        >
          Edit Profile
        </button>
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
  profile,
  loading,
  onSubmit,
  closeModal,
}) => {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const firstName = (formData.get("firstName") || "").trim();
        const lastName = (formData.get("lastName") || "").trim();
        const combinedName = [firstName, lastName]
          .filter(Boolean)
          .join(" ")
          .trim();
        const updatedProfile = {
          name: combinedName,
          email: profile.email,
          phone: formData.get("phone"),
          dateOfBirth: formData.get("dateOfBirth"),
          gender: formData.get("gender"),
          address: formData.get("address"),
          emergencyContact: formData.get("emergencyContact"),
          bloodType: formData.get("bloodType"),
          allergies: formData.get("allergies"),
          insurance: formData.get("insurance"),
          medicalHistory: formData.get("medicalHistory"),
          permanentMedicine: formData.get("permanentMedicine"),
        };
        onSubmit(updatedProfile);
      }}
    >
      <div
        className="form-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "20px",
        }}
      >
        <div className="form-group">
          <label>First Name *</label>
          <input
            type="text"
            name="firstName"
            className="form-control"
            defaultValue={(() => {
              const parts = (profile.name || "").trim().split(/\s+/);
              return parts[0] || "";
            })()}
            required
          />
        </div>
        <div className="form-group">
          <label>Last Name *</label>
          <input
            type="text"
            name="lastName"
            className="form-control"
            defaultValue={(() => {
              const parts = (profile.name || "").trim().split(/\s+/);
              parts.shift();
              return parts.join(" ");
            })()}
            required
          />
        </div>
        <div className="form-group">
          <label>Phone *</label>
          <input
            type="tel"
            name="phone"
            className="form-control"
            required
            defaultValue={profile.phone}
          />
        </div>
        <div className="form-group">
          <label>Date of Birth *</label>
          <input
            type="date"
            name="dateOfBirth"
            className="form-control"
            required
            defaultValue={profile.dateOfBirth}
          />
        </div>
        <div className="form-group">
          <label>Gender *</label>
          <select
            name="gender"
            className="form-control"
            required
            defaultValue={profile.gender}
          >
            <option value="">Select Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div className="form-group">
          <label>Blood Type *</label>
          <select
            name="bloodType"
            className="form-control"
            required
            defaultValue={profile.bloodType}
          >
            <option value="">Select Blood Type</option>
            <option value="A+">A+</option>
            <option value="A-">A-</option>
            <option value="B+">B+</option>
            <option value="B-">B-</option>
            <option value="AB+">AB+</option>
            <option value="AB-">AB-</option>
            <option value="O+">O+</option>
            <option value="O-">O-</option>
          </select>
        </div>
      </div>
      <div className="form-group">
        <label>Address</label>
        <input
          type="text"
          name="address"
          className="form-control"
          placeholder="House No., Street, City"
          defaultValue={profile.address}
        />
      </div>
      <div className="form-group">
        <label>Emergency Contact</label>
        <input
          type="text"
          name="emergencyContact"
          className="form-control"
          defaultValue={profile.emergencyContact}
          placeholder="Name - Phone Number"
        />
      </div>
      <div className="form-group">
        <label>Allergies *</label>
        <select
          name="allergies"
          className="form-control"
          required
          defaultValue={profile.allergies}
        >
          <option value="">Select Allergy</option>
          <option value="None">None</option>
          <option value="Penicillin">Penicillin</option>
          <option value="Aspirin">Aspirin</option>
          <option value="Latex">Latex</option>
          <option value="Peanuts">Peanuts</option>
          <option value="Shellfish">Shellfish</option>
          <option value="Eggs">Eggs</option>
          <option value="Milk">Milk</option>
          <option value="Soy">Soy</option>
          <option value="Wheat">Wheat</option>
          <option value="Tree Nuts">Tree Nuts</option>
          <option value="Dust">Dust</option>
          <option value="Pollen">Pollen</option>
          <option value="Cats">Cats</option>
          <option value="Dogs">Dogs</option>
          <option value="Bee Stings">Bee Stings</option>
          <option value="Other">Other</option>
        </select>
      </div>
      <div className="form-group">
        <label>Insurance</label>
        <input
          type="text"
          name="insurance"
          className="form-control"
          defaultValue={profile.insurance}
          placeholder="Insurance provider"
        />
      </div>
      <div className="form-group">
        <label>Permanent Medicine</label>
        <input
          type="text"
          name="permanentMedicine"
          className="form-control"
          defaultValue={profile.permanentMedicine}
          placeholder="List long-term medications"
        />
      </div>
      <div className="form-group">
        <label>Medical History</label>
        <textarea
          name="medicalHistory"
          className="form-control"
          rows="4"
          defaultValue={profile.medicalHistory}
          placeholder="Please describe your medical history, past surgeries, chronic conditions, medications, etc."
        />
      </div>
      <div
        className="form-actions"
        style={{
          display: "flex",
          gap: "10px",
          justifyContent: "flex-end",
          marginTop: "20px",
        }}
      >
        <button
          type="button"
          className="btn btn-secondary"
          onClick={closeModal}
        >
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? "Updating..." : "Update Profile"}
        </button>
      </div>
    </form>
  );
};
