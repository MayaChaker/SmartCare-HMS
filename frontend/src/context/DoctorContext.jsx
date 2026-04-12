import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
import {
  FiUser,
  FiFileText,
  FiSettings,
  FiEdit,
  FiImage,
  FiX,
  FiAlertTriangle,
  FiCheckCircle,
} from "react-icons/fi";
import {
  EditProfileForm,
  AvailabilityForm,
} from "../components/DoctorProfile/DoctorProfile";
import {
  ViewPatientModal,
  AddMedicalRecordForm,
} from "../components/DoctorPatient/DoctorPatient";

const DoctorContext = createContext(null);

export const DoctorProvider = ({ children }) => {
  const [doctorProfile, setDoctorProfile] = useState(null);
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);

  // Global UI flags/messages for feedback and loading
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Modal state: controls which modal is open and the selected item
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);

  // Shared ref for DoctorProfile file input and gallery modal
  const fileInputRef = useRef(null);

  // Helper: clear transient messages (error/success) before new actions
  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  // Open a modal by type and optional selected item
  const openModal = (type, item = null) => {
    setModalType(type);
    setSelectedItem(item);
    setShowModal(true);
    clearMessages();
  };

  // Close any modal and reset its type/item; also clear messages
  const closeModal = () => {
    setShowModal(false);
    setModalType("");
    setSelectedItem(null);
    clearMessages();
  };

  // Load doctor profile, patients, and appointments from backend APIs
  const loadDoctorData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Please sign in again.");
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };

      // Parallel fetch for profile/patients/appointments to speed up loading
      const [profileRes, patientsRes, appointmentsRes] = await Promise.all([
        fetch("http://localhost:5000/api/doctor/profile", { headers }),
        fetch("http://localhost:5000/api/doctor/patients", { headers }),
        fetch("http://localhost:5000/api/doctor/appointments", { headers }),
      ]);

      if (profileRes.ok) {
        const profileData = await profileRes.json();
        setDoctorProfile(profileData);
      }

      if (patientsRes.ok) {
        const patientsData = await patientsRes.json();
        setPatients(Array.isArray(patientsData) ? patientsData : []);
      }

      if (appointmentsRes.ok) {
        const appointmentsData = await appointmentsRes.json();
        setAppointments(
          Array.isArray(appointmentsData) ? appointmentsData : []
        );
      }
    } catch (err) {
      console.error("Error loading doctor data:", err);
      setError("Couldn't load the data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  // load initial doctor data once provider is mounted
  useEffect(() => {
    loadDoctorData();
  }, [loadDoctorData]);

  //  Upload and save a new profile photo
  const uploadPhotoFile = async (file) => {
    setLoading(true);
    clearMessages();
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("photo", file);

      const resp = await fetch("http://localhost:5000/api/doctor/photo", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!resp.ok) {
        const t = await resp.text();
        throw new Error(t || "Failed to upload photo");
      }

      const data = await resp.json();
      const updated = data.doctor || data;
      setDoctorProfile(updated);
      setSuccess("Profile photo uploaded successfully.");
      closeModal();
    } catch (e) {
      setError("Could not upload photo. Please try another image.");
    } finally {
      setLoading(false);
    }
  };

  // grouped state, flags, modal controls, and actions
  const value = {
    // data
    doctorProfile,
    setDoctorProfile,
    patients,
    setPatients,
    appointments,
    setAppointments,

    // status
    loading,
    setLoading,
    error,
    setError,
    success,
    setSuccess,
    clearMessages,

    // modal
    showModal,
    setShowModal,
    modalType,
    setModalType,
    selectedItem,
    setSelectedItem,
    openModal,
    closeModal,

    // shared
    fileInputRef,
    uploadPhotoFile,

    // reload
    loadDoctorData,
  };

  return (
    <DoctorContext.Provider value={value}>{children}</DoctorContext.Provider>
  );
};

// Safe accessor for DoctorContext, enforces usage within provider
export const useDoctor = () => {
  const ctx = useContext(DoctorContext);
  if (!ctx) {
    throw new Error("useDoctor must be used inside DoctorProvider");
  }
  return ctx;
};

//  Centralized modal renderer for doctor workflows.
export const renderDoctorModal = ({
  showModal,
  closeModal,
  modalType,
  error,
  success,
  loading,
  profileForm,
  handleProfileChange,
  saveProfile,
  photoUrlInputRef,
  galleryImages,
  savePhotoFromGallery,
  fileInputRef,
  selectedItem,
  patientRecords,
  openModal,
  medicalRecordForm,
  setMedicalRecordForm,
  handleAddMedicalRecord,
  doctorProfile,
  availabilityForm,
  setAvailabilityForm,
  handleUpdateAvailability,
  daysOfWeek,
}) => {
  if (!showModal) return null;

  return (
    <div className="doctor-modal-overlay" onClick={closeModal}>
      <div className="doctor-modal" onClick={(e) => e.stopPropagation()}>
        <div className="doctor-modal-header">
          <div className="modal-title-section">
            <div className="modal-icon">
              {modalType === "viewPatient" && <FiUser />}
              {modalType === "addRecord" && <FiFileText />}
              {modalType === "updateAvailability" && <FiSettings />}
              {modalType === "editProfile" && <FiEdit />}
              {modalType === "photoGallery" && <FiImage />}
            </div>
            <h3 className="modal-title">
              {modalType === "viewPatient" && "Patient Profile"}
              {modalType === "addRecord" && "Add Medical Record"}
              {modalType === "updateAvailability" && "Update Availability"}
              {modalType === "editProfile" && "Edit Doctor Profile"}
              {modalType === "photoGallery" && "Choose Profile Photo"}
            </h3>
          </div>
          <button className="doctor-modal-close" onClick={closeModal}>
            <span>
              <FiX />
            </span>
          </button>
        </div>

        <div className="doctor-modal-content">
          {/* show error or success feedback if present */}
          {error && (
            <div className="doctor-alert error">
              <span className="alert-icon">
                <FiAlertTriangle />
              </span>
              <span className="alert-message">{error}</span>
            </div>
          )}
          {success && (
            <div className="doctor-alert success">
              <span className="alert-icon">
                <FiCheckCircle />
              </span>
              <span className="alert-message">{success}</span>
            </div>
          )}

          {/* Edit doctor profile fields */}
          {modalType === "editProfile" && (
            <EditProfileForm
              profileForm={profileForm}
              handleProfileChange={handleProfileChange}
              saveProfile={saveProfile}
              closeModal={closeModal}
              loading={loading}
              photoUrlInputRef={photoUrlInputRef}
            />
          )}

          {/*  Choose a photo from gallery or upload */}
          {modalType === "photoGallery" && (
            <div className="photo-gallery">
              <div className="photo-gallery-grid">
                {galleryImages.map((url, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="photo-item"
                    onClick={() => savePhotoFromGallery(url)}
                    title="Select this photo"
                  >
                    <img
                      src={url}
                      alt={`Gallery ${idx + 1}`}
                      className="photo-thumb"
                    />
                  </button>
                ))}
              </div>
              <div className="photo-gallery-actions">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() =>
                    fileInputRef.current && fileInputRef.current.click()
                  }
                >
                  Upload from device
                </button>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={closeModal}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/*  View patient details and navigate to add record */}
          {modalType === "viewPatient" && selectedItem && (
            <ViewPatientModal
              selectedItem={selectedItem}
              patientRecords={patientRecords}
              closeModal={closeModal}
              openModal={openModal}
            />
          )}

          {/*Modal: Add a medical record for the selected patient */}
          {modalType === "addRecord" && (
            <AddMedicalRecordForm
              selectedItem={selectedItem}
              medicalRecordForm={medicalRecordForm}
              setMedicalRecordForm={setMedicalRecordForm}
              handleAddMedicalRecord={handleAddMedicalRecord}
              loading={loading}
              closeModal={closeModal}
            />
          )}

          {/* Update availability and working hours */}
          {modalType === "updateAvailability" && (
            <AvailabilityForm
              doctorProfile={doctorProfile}
              availabilityForm={availabilityForm}
              setAvailabilityForm={setAvailabilityForm}
              handleUpdateAvailability={handleUpdateAvailability}
              loading={loading}
              closeModal={closeModal}
              daysOfWeek={daysOfWeek}
            />
          )}
        </div>
      </div>
    </div>
  );
};
