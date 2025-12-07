// src/components/DoctorProfile/DoctorProfile.jsx
import React, { useRef, useState } from "react";
import { FaUserDoctor } from "react-icons/fa6";
import { useDoctor } from "../../context/DoctorContext";
import { parseWorkingHours } from "../../utils/schedule";

const DoctorProfile = ({
  user = {},
  openModal = () => {},
  uploadPhotoFile = () => {},
  resolvePhotoUrl = (url) => url || "",
  fileInputRef,
}) => {
  const { doctorProfile } = useDoctor();
  const internalFileInputRef = useRef(null);
  const localFileInputRef = fileInputRef || internalFileInputRef;
  const [photoError, setPhotoError] = useState(false);

  const displayName =
    doctorProfile?.name || (user?.username ? `Dr. ${user.username}` : "Doctor");

  const specialization = doctorProfile?.specialization || "General Practice";
  const phone = doctorProfile?.phone || "Not provided";

  const { days, time } = parseWorkingHours(doctorProfile?.workingHours || "");
  const [startStr, endStr] = time
    ? time.split("-").map((s) => s.trim())
    : ["", ""];

  const handleAvatarClick = () => {
    if (!doctorProfile?.photoUrl && localFileInputRef.current) {
      localFileInputRef.current.click();
    } else {
      openModal("photoGallery");
    }
  };

  return (
    <div className="doctor-profile">
      <div className="card">
        <div className="card-header">
          <div className="card-title-row">
            {(() => {
              const photoSrc = resolvePhotoUrl(
                doctorProfile?.photoUrl,
                displayName
              );
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
                    onClick={handleAvatarClick}
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
                  onClick={handleAvatarClick}
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

          <button
            className="btn btn-primary edit-btn"
            type="button"
            onClick={() => openModal("editProfile")}
            title="Edit Profile"
          >
            Edit Profile
          </button>
        </div>

        <div className="profile-info">
          <div className="profile-field">
            <span className="profile-label">Full Name</span>
            <span className="profile-value">{displayName}</span>
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
      </div>
    </div>
  );
};

export default DoctorProfile;
