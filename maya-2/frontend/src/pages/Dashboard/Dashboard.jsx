import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import LogoutButton from "../../components/ui/LogoutButton/LogoutButton";
import { FaUserInjured } from "react-icons/fa6";
import { useAuth } from "../../context/useAuth";
import DashboardAppointment from "../../components/DashboardAppointment/DashboardAppointment";
import { EditProfileModal } from "../../components/ui/EditButton/EditButton";
import DashboardDoctor from "../../components/DashboardDoctor/DashboardDoctor";
import DashboardMedicalRecords from "../../components/DashboardMedicalRecords/DashboardMedicalRecords";
import "./Dashboard.css";
import DashboardProfile from "../../components/DashboardProfile/DashboardProfile";
import { patientAPI } from "../../utils/api";

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("appointments");

  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("book");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // State for real data from backend
  const [profile, setProfile] = useState({
    name: user?.name || "",
    phone: "",
    dateOfBirth: "",
    gender: "",
    address: "",
    emergencyContact: "",
    bloodType: "",
    allergies: "",
    insurance: "",
    medicalHistory: "",
    permanentMedicine: "",
  });

  const [appointments, setAppointments] = useState([]);
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [doctors, setDoctors] = useState([]);

  const [availableDates, setAvailableDates] = useState([]);
  const [selectedDateForBooking, setSelectedDateForBooking] = useState("");
  const [availableTimes, setAvailableTimes] = useState([]);
  const [selectedTimeForBooking, setSelectedTimeForBooking] = useState("");
  const [availableTimesForReschedule, setAvailableTimesForReschedule] =
    useState([]);
  const [availableDatesForReschedule, setAvailableDatesForReschedule] =
    useState([]);
  const [selectedDateForReschedule, setSelectedDateForReschedule] =
    useState("");

  const loadPatientDataRef = useRef(null);

  // Resolve first name from profile or auth user
  const firstNameDisplay =
    (profile?.firstName && profile.firstName.trim()) ||
    (profile?.name && profile.name.trim().split(" ")[0]) ||
    (user?.name && user.name.trim().split(" ")[0]) ||
    (user?.username && user.username.trim().split(" ")[0]) ||
    "";

  const openModal = (type, appointment = null) => {
    setModalType(type);
    setSelectedAppointment(appointment);
    setShowModal(true);
    setError("");
    setSuccess("");
  };

  const closeModal = () => {
    setShowModal(false);
    setModalType("");
    setSelectedAppointment(null);
    setError("");
    setSuccess("");
    setSelectedDoctorId("");
    setSelectedDateForBooking("");
    setAvailableTimes([]);
    setSelectedTimeForBooking("");
  };

  const updateProfileRef = useRef(null);
  const updateProfile = async (updatedProfile) => {
    setLoading(true);
    try {
      const response = await patientAPI.updateProfile(updatedProfile);
      if (response.success) {
        const profileResponse = await patientAPI.getProfile();
        if (profileResponse.success) {
          setProfile(profileResponse.data);
        }
        setSuccess("Profile updated successfully!");
        closeModal();
      } else {
        setError(response.message || "Failed to update profile");
      }
    } catch {
      setError("Failed to update profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  updateProfileRef.current = updateProfile;
  const handleUpdateProfile = async (updatedProfile) => {
    if (typeof updateProfileRef.current === "function") {
      await updateProfileRef.current(updatedProfile);
    }
  };

  const renderModal = () => {
    if (!showModal) return null;
    if (modalType !== "editProfile") return null;

    return (
      <div className="modal-overlay" onClick={closeModal}>
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h3>Edit Profile</h3>
            <button className="modal-close" onClick={closeModal}>
              ×
            </button>
          </div>
          <div className="modal-content">
            {error && <div className="alert alert-error">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}
            <EditProfileModal
              profile={profile}
              loading={loading}
              onSubmit={handleUpdateProfile}
              closeModal={closeModal}
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="dashboard patient-dashboard">
      <header className="dashboard-header">
        <div className="container">
          <nav className="dashboard-nav">
            <div
              className="dashboard-title-group"
              role="button"
              tabIndex={0}
              onClick={() => navigate("/")}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") navigate("/");
              }}
              style={{ cursor: "pointer" }}
            >
              <div className="title-icon" aria-hidden="true">
                <FaUserInjured />
              </div>
              <h1 className="dashboard-title">
                Patient Dashboard
                <span className="user-name">{`Welcome${
                  firstNameDisplay ? ", " + firstNameDisplay : ""
                }`}</span>
              </h1>
            </div>
            <div className="user-info">
              <LogoutButton>Logout</LogoutButton>
            </div>
          </nav>
        </div>
      </header>

      <main className="dashboard-content">
        <div className="container">
          {(() => {
            const requiredFields = ["bloodType", "allergies", "gender"];
            const missingFields = requiredFields.filter((f) => {
              const v = (profile?.[f] ?? "").toString().trim();
              return !v;
            });
            if (!loading && missingFields.length > 0) {
              return (
                <div
                  className="alert alert-warning"
                  style={{
                    marginBottom: 16,
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <span className="alert-icon">⚠️</span>
                  <span className="alert-message">
                    {`Your profile is incomplete. Missing: ${missingFields
                      .map((f) =>
                        f === "bloodType"
                          ? "Blood Type"
                          : f === "allergies"
                          ? "Allergies"
                          : f === "gender"
                          ? "Gender"
                          : f
                      )
                      .join(", ")}.`}
                  </span>
                </div>
              );
            }
            return null;
          })()}
          <div className="dashboard-tabs">
            <DashboardAppointment
              variant="tabButton"
              active={activeTab === "appointments"}
              onClick={() => setActiveTab("appointments")}
            />
            <DashboardDoctor
              variant="tabButton"
              active={activeTab === "doctors"}
              onClick={() => setActiveTab("doctors")}
            />
            <DashboardMedicalRecords
              variant="tabButton"
              active={activeTab === "records"}
              onClick={() => setActiveTab("records")}
            />
            <DashboardProfile
              variant="tabButton"
              active={activeTab === "profile"}
              onClick={() => setActiveTab("profile")}
            />
          </div>

          {loading ? null : (
            <>
              <DashboardAppointment
                variant="content"
                active={activeTab === "appointments"}
                appointments={appointments}
                loading={loading}
                error={error}
                success={success}
                openModal={openModal}
                closeModal={closeModal}
                doctors={doctors}
                setProfile={setProfile}
                setAppointments={setAppointments}
                setMedicalRecords={setMedicalRecords}
                setAvailableSlots={setAvailableSlots}
                setDoctors={setDoctors}
                setError={setError}
                setLoading={setLoading}
                onExposeLoadPatientData={(fn) => {
                  loadPatientDataRef.current = fn;
                }}
                showModal={showModal}
                modalType={modalType}
                selectedAppointment={selectedAppointment}
                availableSlots={availableSlots}
                availableTimesForReschedule={availableTimesForReschedule}
                setAvailableTimesForReschedule={setAvailableTimesForReschedule}
                setAvailableDatesForReschedule={setAvailableDatesForReschedule}
                availableDatesForReschedule={availableDatesForReschedule}
                selectedDateForReschedule={selectedDateForReschedule}
                setSelectedDateForReschedule={setSelectedDateForReschedule}
                selectedDoctorId={selectedDoctorId}
                setSelectedDoctorId={setSelectedDoctorId}
                availableDates={availableDates}
                selectedDateForBooking={selectedDateForBooking}
                setSelectedDateForBooking={setSelectedDateForBooking}
                selectedTimeForBooking={selectedTimeForBooking}
                setSelectedTimeForBooking={setSelectedTimeForBooking}
                availableTimes={availableTimes}
                setAvailableTimes={setAvailableTimes}
              />
              <DashboardMedicalRecords
                variant="content"
                active={activeTab === "records"}
                records={medicalRecords}
              />
              <DashboardDoctor
                variant="content"
                active={activeTab === "doctors"}
                openModal={openModal}
                showBookButton={true}
                onSelectDoctor={(id) => setSelectedDoctorId(String(id))}
                onDoctorsLoaded={(list) => setDoctors(list)}
                selectedDoctorId={selectedDoctorId}
                setAvailableDates={setAvailableDates}
              />
              <DashboardProfile
                variant="content"
                active={activeTab === "profile"}
                profile={profile}
                openModal={openModal}
              />
            </>
          )}
        </div>
      </main>

      {renderModal()}
    </div>
  );
};

export default Dashboard;
