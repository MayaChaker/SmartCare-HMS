import React, { useRef, useState, useEffect } from "react";
import { FaUserDoctor } from "react-icons/fa6";
import { FiClock } from "react-icons/fi";
import { useDoctor } from "../../context/DoctorContext";
import {
  parseWorkingHours,
  normalizeTimeTo24,
  formatTimeHHMM,
} from "../../utils/schedule";
export const resolvePhotoUrl = (url) => {
  const candidate = String(url || "").trim();
  if (!candidate) return "";
  if (
    candidate.toLowerCase() === "null" ||
    candidate.toLowerCase() === "undefined"
  )
    return "";
  if (candidate.startsWith("/uploads/") || candidate.startsWith("uploads/")) {
    const normalized = candidate.startsWith("uploads/")
      ? `/${candidate}`
      : candidate;
    return `http://localhost:5000${normalized}`;
  }
  return candidate;
};
export const handleProfileChangeFactory = (setProfileForm) => (e) => {
  const { name, value, type, checked } = e.target;
  setProfileForm((prev) => ({
    ...prev,
    [name]: type === "checkbox" ? checked : value,
  }));
};
export const saveProfileFactory =
  ({
    getProfileForm,
    setLoading,
    clearMessages,
    user,
    setDoctorProfile,
    setSuccess,
    closeModal,
    setError,
  }) =>
  async (e) => {
    e.preventDefault();
    setLoading(true);
    clearMessages();

    try {
      const token = localStorage.getItem("token");
      const pf = getProfileForm();
      const days = (pf.availableDay || "").trim();
      const start = (pf.startTime || "").trim();
      const end = (pf.endTime || "").trim();

      const normalizePhotoUrl = (u) => {
        const v = (u || "").trim();
        if (!v) return v;
        if (v.startsWith("uploads/")) return `/${v}`;
        return v;
      };

      const expRaw = pf.experience;
      const expNum =
        expRaw === "" || expRaw === null || expRaw === undefined
          ? undefined
          : parseInt(expRaw, 10);

      const timeRange = start && end ? `${start} - ${end}` : "";
      const workingHoursString =
        days && timeRange ? `${days} ${timeRange}` : pf.workingHours || "";

      const payload = {
        firstName: pf.firstName,
        lastName: pf.lastName,
        phone: pf.phone,
        specialization: pf.specialization,
        photoUrl: normalizePhotoUrl(pf.photoUrl),
        availability: pf.availability,
        workingHours: workingHoursString,
        availableDay: days,
        availableStartTime: start,
        availableEndTime: end,
        licenseNumber: pf.licenseNumber,
        experience: expNum,
        qualification: pf.qualification,
      };

      const resp = await fetch("http://localhost:5000/api/doctor/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!resp.ok) {
        let msg = "Failed to update profile";
        const ct = resp.headers.get("Content-Type") || "";
        try {
          if (ct.includes("application/json")) {
            const j = await resp.json();
            msg = j?.message || msg;
          } else {
            const t = await resp.text();
            msg = t || msg;
          }
        } catch (e) {
          void e;
        }
        if (resp.status === 403) {
          const role = user && user.role ? user.role : "unknown";
          msg = `${msg}. You are logged in as '${role}'. Only doctors can update doctor profiles.`;
        }
        throw new Error(msg);
      }

      const data = await resp.json();
      const updated = data.doctor || data;
      setDoctorProfile(updated);
      setSuccess("Profile updated successfully.");
      closeModal();
    } catch (err) {
      setError(err?.message || "Could not update profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

// Updates only the photoUrl field
export const savePhotoFromGalleryFactory =
  ({
    getProfileForm,
    setLoading,
    clearMessages,
    setDoctorProfile,
    setProfileForm,
    setSuccess,
    closeModal,
    setError,
  }) =>
  async (url) => {
    setLoading(true);
    clearMessages();

    try {
      const token = localStorage.getItem("token");
      const pf = getProfileForm();
      const days = (pf.availableDay || "").trim();
      const start = (pf.startTime || "").trim();
      const end = (pf.endTime || "").trim();
      const timeRange = start && end ? `${start} - ${end}` : "";
      const workingHoursString =
        days && timeRange ? `${days} ${timeRange}` : pf.workingHours || "";

      const payload = {
        firstName: pf.firstName,
        lastName: pf.lastName,
        phone: pf.phone,
        specialization: pf.specialization,
        photoUrl: url,
        availability: pf.availability,
        workingHours: workingHoursString,
        availableDay: days,
        availableStartTime: start,
        availableEndTime: end,
        licenseNumber: pf.licenseNumber,
        experience: pf.experience,
        qualification: pf.qualification,
      };

      const resp = await fetch("http://localhost:5000/api/doctor/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!resp.ok) {
        const t = await resp.text();
        throw new Error(t || "Failed to update profile photo");
      }

      const data = await resp.json();
      const updated = data.doctor || data;
      setDoctorProfile(updated);
      setProfileForm((prev) => ({ ...prev, photoUrl: url }));
      setSuccess("Profile photo updated successfully.");
      closeModal();
    } catch {
      setError("Could not update photo. Please try again.");
    } finally {
      setLoading(false);
    }
  };

// Saves availability and working hours
export const handleUpdateAvailabilityFactory =
  ({
    getAvailabilityForm,
    setLoading,
    clearMessages,
    setSuccess,
    setError,
    setDoctorProfile,
    loadDoctorData,
    closeModal,
  }) =>
  async (e) => {
    e.preventDefault();
    setLoading(true);
    clearMessages();

    try {
      const af = getAvailabilityForm();
      const days = af.workingDays || [];
      const startNorm = normalizeTimeTo24(af.startTime?.trim());
      const endNorm = normalizeTimeTo24(af.endTime?.trim());
      const startDisp = startNorm ? formatTimeHHMM(startNorm) : "";
      const endDisp = endNorm ? formatTimeHHMM(endNorm) : "";
      const daysString = days.join(", ");
      const timeRange = startDisp && endDisp ? `${startDisp} - ${endDisp}` : "";
      const composed = daysString
        ? `${daysString}${timeRange ? ` ${timeRange}` : ""}`
        : timeRange || "";
      const workingHoursString = composed || af.workingHours || "";
      const newAvailability =
        af.availability || Boolean(workingHoursString.trim());

      const token = localStorage.getItem("token");
      const response = await fetch(
        "http://localhost:5000/api/doctor/availability",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            availability: newAvailability,
            workingHours: workingHoursString,
            availableDay: daysString,
            availableStartTime: startNorm || af.startTime || "",
            availableEndTime: endNorm || af.endTime || "",
          }),
        }
      );

      if (response.ok) {
        const respData = await response.json();
        const updatedDoctor = respData?.doctor;
        setSuccess("Availability updated successfully!");
        if (updatedDoctor) {
          setDoctorProfile(updatedDoctor);
        }
        await loadDoctorData();
        closeModal();
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Failed to update availability");
      }
    } catch {
      setError("Failed to update availability. Please try again.");
    } finally {
      setLoading(false);
    }
  };

// Autofocuses the photo URL
export const useFocusPhotoUrlInputEffect = (
  showModal,
  modalType,
  photoUrlInputRef
) => {
  useEffect(() => {
    if (showModal && modalType === "editProfile") {
      setTimeout(() => {
        if (photoUrlInputRef && photoUrlInputRef.current) {
          photoUrlInputRef.current.focus();
        }
      }, 100);
    }
  }, [showModal, modalType, photoUrlInputRef]);
};

// Profile edit form
export const EditProfileForm = ({
  profileForm,
  handleProfileChange,
  saveProfile,
  closeModal,
  loading,
  photoUrlInputRef,
}) => {
  return (
    <form
      id="profile-edit-form"
      className="profile-edit-form"
      onSubmit={saveProfile}
    >
      <div className="detail-section">
        <div className="detail-grid">
          <div className="form-field">
            <span className="form-label">Phone</span>
            <input
              className="form-control"
              type="text"
              name="phone"
              value={profileForm.phone}
              onChange={handleProfileChange}
              placeholder="000-000-0000"
            />
          </div>
          <div className="form-field">
            <span className="form-label">Profile Image URL</span>
            <input
              className="form-control"
              type="text"
              name="photoUrl"
              ref={photoUrlInputRef}
              value={profileForm.photoUrl}
              onChange={handleProfileChange}
              placeholder="https://example.com/image.jpg or /uploads/doctor.jpg"
            />
          </div>
          <div className="form-field">
            <span className="form-label">Available Day</span>
            <input
              className="form-control"
              type="text"
              name="availableDay"
              value={profileForm.availableDay}
              onChange={handleProfileChange}
              placeholder="e.g. Monday, Tuesday"
            />
          </div>
          <div className="form-field">
            <span className="form-label">Start Time</span>
            <input
              className="form-control"
              type="time"
              name="startTime"
              value={profileForm.startTime}
              onChange={handleProfileChange}
            />
          </div>
          <div className="form-field">
            <span className="form-label">End Time</span>
            <input
              className="form-control"
              type="time"
              name="endTime"
              value={profileForm.endTime}
              onChange={handleProfileChange}
            />
          </div>
          <div className="form-field">
            <span className="form-label">Qualification</span>
            <input
              className="form-control"
              type="text"
              name="qualification"
              value={profileForm.qualification}
              onChange={handleProfileChange}
              placeholder="MD"
            />
          </div>
          <div className="form-field">
            <span className="form-label">License Number</span>
            <input
              className="form-control"
              type="text"
              name="licenseNumber"
              value={profileForm.licenseNumber}
              onChange={handleProfileChange}
              placeholder="ABC-12345"
            />
          </div>
          <div className="form-field">
            <span className="form-label">Experience (years)</span>
            <input
              className="form-control"
              type="number"
              name="experience"
              value={profileForm.experience}
              onChange={handleProfileChange}
              min="0"
            />
          </div>
        </div>
      </div>
      <div className="modal-actions">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={closeModal}
        >
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          Update Profile
        </button>
      </div>
    </form>
  );
};

// Availability form UI for selecting days and time
export const AvailabilityForm = ({
  doctorProfile,
  availabilityForm,
  setAvailabilityForm,
  handleUpdateAvailability,
  loading,
  closeModal,
  daysOfWeek,
}) => {
  return (
    <div className="availability-form">
      <form onSubmit={handleUpdateAvailability} className="doctor-form">
        <div className="form-section">
          <h5 className="section-title">Availability Settings</h5>
          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={availabilityForm.availability}
                onChange={(e) =>
                  setAvailabilityForm({
                    ...availabilityForm,
                    availability: e.target.checked,
                  })
                }
                className="checkbox-input"
              />
              <span className="checkbox-custom"></span>
              <div className="checkbox-content">
                <span className="checkbox-title">
                  Available for appointments
                </span>
                <span className="checkbox-desc">
                  Allow patients to book appointments with you
                </span>
              </div>
            </label>
          </div>
        </div>

        <div className="form-section">
          <h5 className="section-title">Working Schedule</h5>
          <div className="form-hint current-schedule">
            <span className="label-icon">
              <FiClock />
            </span>
            <>Current: {doctorProfile?.workingHours || "Not set"}</>
          </div>
          <div className="form-hint current-schedule">
            <span className="label-icon">
              <FiClock />
            </span>
            <>
              Preview:{" "}
              {(() => {
                const days = availabilityForm.workingDays || [];
                const sNorm = normalizeTimeTo24(
                  availabilityForm.startTime?.trim()
                );
                const eNorm = normalizeTimeTo24(
                  availabilityForm.endTime?.trim()
                );
                const s = sNorm ? formatTimeHHMM(sNorm) : "";
                const e = eNorm ? formatTimeHHMM(eNorm) : "";
                const ds = days.join(", ");
                const tr = s && e ? `${s} - ${e}` : "";
                const preview = ds
                  ? `${ds}${tr ? ` ${tr}` : ""}`
                  : tr || "Not set";
                return preview || "Not set";
              })()}
            </>
          </div>
          <div className="form-group">
            <label className="form-label">Days of Week</label>
            <div className="days-selector">
              {daysOfWeek.map((day) => {
                const selected = availabilityForm.workingDays.includes(day);
                return (
                  <label
                    key={day}
                    className={`day-chip ${selected ? "selected" : ""}`}
                  >
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={(e) => {
                        const isChecked = e.target.checked;
                        setAvailabilityForm((prev) => {
                          const nextWorkingDays = isChecked
                            ? [...prev.workingDays, day]
                            : prev.workingDays.filter((d) => d !== day);
                          const autoEnableAvailability =
                            prev.availability ||
                            nextWorkingDays.length > 0 ||
                            (prev.startTime && prev.endTime);
                          return {
                            ...prev,
                            workingDays: nextWorkingDays,
                            availability: autoEnableAvailability,
                          };
                        });
                      }}
                    />
                    <span className="day-label">{day}</span>
                  </label>
                );
              })}
            </div>
          </div>
          <div className="form-group time-inputs">
            <div className="time-field">
              <label className="form-label">Start Time</label>
              <input
                type="text"
                placeholder="e.g., 10:15 PM or 22:15"
                value={availabilityForm.startTime}
                onChange={(e) =>
                  setAvailabilityForm({
                    ...availabilityForm,
                    startTime: e.target.value,
                  })
                }
                className="form-control"
              />
            </div>
            <div className="time-separator">to</div>
            <div className="time-field">
              <label className="form-label">End Time</label>
              <input
                type="text"
                placeholder="e.g., 10:15 PM or 22:15"
                value={availabilityForm.endTime}
                onChange={(e) =>
                  setAvailabilityForm({
                    ...availabilityForm,
                    endTime: e.target.value,
                  })
                }
                className="form-control"
              />
            </div>
            <span className="form-hint">
              Select days and a time range for availability. Click "Update
              Availability" to save.
            </span>
          </div>
        </div>

        <div className="modal-actions">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            <>Update Availability</>
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={closeModal}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

// Main profile component
const DoctorProfile = ({ user = {} }) => {
  const { doctorProfile, openModal, uploadPhotoFile, fileInputRef } =
    useDoctor();
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
