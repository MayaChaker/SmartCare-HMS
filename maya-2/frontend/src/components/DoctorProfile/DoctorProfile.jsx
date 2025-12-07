import React, { useRef, useState } from "react";
import EditButton from "../ui/EditButton/EditButton";
import { parseWorkingHours } from "../../utils/schedule";
import { FaUserDoctor } from "react-icons/fa6";

const DoctorProfile = ({
  user = {},
  doctorProfile = {},
  editingProfile = false,
  profileForm = {},
  openModal = () => {},
  cancelEditProfile = () => {},
  saveProfile = () => {},
  handleProfileChange = () => {},
  uploadPhotoFile = () => {},
  resolvePhotoUrl = (url, fallbackName) => url || fallbackName || "",
  fileInputRef,
  photoUrlInputRef,
}) => {
  const internalFileInputRef = useRef(null);
  const localFileInputRef = fileInputRef || internalFileInputRef;
  const [photoError, setPhotoError] = useState(false);

  const name =
    doctorProfile?.name || (user?.username ? `Dr. ${user.username}` : "Doctor");
  const specialization = doctorProfile?.specialization || "General Practice";
  const phone = doctorProfile?.phone || "Not provided";
  const { days, time } = parseWorkingHours(doctorProfile?.workingHours || "");
  const [startStr, endStr] = time
    ? time.split("-").map((s) => s.trim())
    : ["", ""];

  return (
    <div className="doctor-profile">
      <div className="card">
        <div className="card-header">
          <div className="card-title-row">
            {(() => {
              const displayName = name;
              const photoSrc = resolvePhotoUrl(doctorProfile?.photoUrl, displayName);
              if (photoSrc && !photoError) {
                return (
                  <img
                    src={photoSrc}
                    alt="Doctor Avatar"
                    style={{
                      width: "56px",
                      height: "56px",
                      borderRadius: "50%",
                      objectFit: "cover",
                      border: "1px solid #e5e5ea",
                      background: "#fff",
                      cursor: "pointer",
                    }}
                    title="Click to update photo"
                    onError={() => setPhotoError(true)}
                    onClick={() => {
                      if (!doctorProfile?.photoUrl && localFileInputRef.current) {
                        localFileInputRef.current.click();
                      } else {
                        openModal("photoGallery");
                      }
                    }}
                  />
                );
              }
              return (
                <span
                  style={{
                    width: "56px",
                    height: "56px",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "50%",
                    border: "1px solid #e5e5ea",
                    background: "#fff",
                    color: "#0284c7",
                    fontSize: "32px",
                    cursor: "pointer",
                  }}
                  title="Click to update photo"
                  onClick={() => {
                    if (!doctorProfile?.photoUrl && localFileInputRef.current) {
                      localFileInputRef.current.click();
                    } else {
                      openModal("photoGallery");
                    }
                  }}
                >
                  <FaUserDoctor />
                </span>
              );
            })()}
            <input
              type="file"
              accept="image/*"
              ref={localFileInputRef}
              style={{ display: "none" }}
              onChange={(e) => {
                const file = e.target.files && e.target.files[0];
                if (file) {
                  uploadPhotoFile(file);
                }
                e.target.value = null;
              }}
            />
            <h3 className="card-title">My Profile</h3>
          </div>

          {!editingProfile ? (
            <EditButton
              className="btn btn-outline"
              type="button"
              onClick={() => openModal("editProfile")}
              title="Edit Profile"
            >
              Edit Profile
            </EditButton>
          ) : (
            <div className="header-actions">
              <button
                className="btn btn-secondary"
                type="button"
                onClick={cancelEditProfile}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                form="profile-edit-form"
                type="submit"
              >
                Save
              </button>
            </div>
          )}
        </div>

        {!editingProfile ? (
          <div className="profile-info">
            <div className="profile-field">
              <span className="profile-label">Full Name</span>
              <span className="profile-value">{name}</span>
            </div>
            <div className="profile-field">
              <span className="profile-label">Phone</span>
              <span className="profile-value">{phone}</span>
            </div>
            <div className="profile-field">
              <span className="profile-label">Specialization</span>
              <span className="profile-value">{specialization}</span>
            </div>
            <div className="profile-field">
              <span className="profile-label">Start Time</span>
              <span className="profile-value">{startStr || "Not set"}</span>
            </div>
            <div className="profile-field">
              <span className="profile-label">End Time</span>
              <span className="profile-value">{endStr || "Not set"}</span>
            </div>
            <div className="profile-field">
              <span className="profile-label">Available Day</span>
              <span className="profile-value">
                {days && days.length ? days.join(", ") : "Not set"}
              </span>
            </div>
            <div className="profile-field">
              <span className="profile-label">Qualification</span>
              <span className="profile-value">
                {doctorProfile?.qualification || "Not set"}
              </span>
            </div>
            <div className="profile-field">
              <span className="profile-label">Experience</span>
              <span className="profile-value">
                {doctorProfile?.experience != null &&
                doctorProfile.experience !== ""
                  ? `${Number(doctorProfile.experience)} years`
                  : "Not set"}
              </span>
            </div>
            <div className="profile-field">
              <span className="profile-label">License Number</span>
              <span className="profile-value">
                {doctorProfile?.licenseNumber || "Not set"}
              </span>
            </div>
          </div>
        ) : (
          <form
            id="profile-edit-form"
            className="profile-edit-form"
            onSubmit={saveProfile}
          >
            <div className="profile-details-grid">
              <div className="details-group">
                <div className="details-group-title">Contact</div>
                <label className="form-field">
                  <span className="form-label">Phone</span>
                  <input
                    className="profile-input"
                    type="text"
                    name="phone"
                    value={profileForm.phone}
                    onChange={handleProfileChange}
                    placeholder="000-000-0000"
                  />
                </label>
                <label className="form-field">
                  <span className="form-label">Profile Image URL</span>
                  <input
                    className="profile-input"
                    type="text"
                    name="photoUrl"
                    ref={photoUrlInputRef}
                    value={profileForm.photoUrl}
                    onChange={handleProfileChange}
                    placeholder="https://example.com/image.jpg or /uploads/doctor.jpg"
                  />
                </label>
                {profileForm.photoUrl ? (
                  <div className="form-field">
                    <span className="form-label">Preview</span>
                    <img
                      src={profileForm.photoUrl}
                      alt="Profile Preview"
                      style={{
                        width: "96px",
                        height: "96px",
                        borderRadius: "50%",
                        objectFit: "cover",
                        border: "1px solid #e5e5ea",
                        background: "#fff",
                      }}
                    />
                  </div>
                ) : null}
              </div>

              <div className="details-group">
                <div className="details-group-title">Work</div>
                <label className="form-field">
                  <span className="form-label">Qualification</span>
                  <input
                    className="profile-input"
                    type="text"
                    name="qualification"
                    value={profileForm.qualification}
                    onChange={handleProfileChange}
                    placeholder="MD"
                  />
                </label>
                <label className="form-field">
                  <span className="form-label">License Number</span>
                  <input
                    className="profile-input"
                    type="text"
                    name="licenseNumber"
                    value={profileForm.licenseNumber}
                    onChange={handleProfileChange}
                    placeholder="ABC-12345"
                  />
                </label>
                <label className="form-field">
                  <span className="form-label">Experience (years)</span>
                  <input
                    className="profile-input"
                    type="number"
                    name="experience"
                    value={profileForm.experience}
                    onChange={handleProfileChange}
                    min="0"
                  />
                </label>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default DoctorProfile;
