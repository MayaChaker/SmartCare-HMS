import React, { useState, useContext, useRef } from "react";
import { useNavigate } from "react-router-dom";
import LogoutButton from "../../components/ui/LogoutButton/LogoutButton";
import { FaUserInjured } from "react-icons/fa6";
import { AuthContext } from "../../context/AuthContext";
import DashboardAppointment from "../../components/DashboardAppointment/DashboardAppointment";
import { CancelModal } from "../../components/ui/CancelButton/CancelButton";
import { ReshcduleModal } from "../../components/ui/ReshcduleButton/ReshcduleButton";
import { DeleteModal } from "../../components/ui/DeleteButton/DeleteButton";
import { EditProfileModal } from "../../components/ui/EditButton/EditButton";
import DashboardDoctor, {
  BookAppointmentModal,
} from "../../components/DashboardDoctor/DashboardDoctor";

import DashboardMedicalRecords from "../../components/DashboardMedicalRecords/DashboardMedicalRecords";
import {
  bookAppointment,
  cancelAppointment,
  rescheduleAppointment,
  deleteAppointment,
} from "../../actions/appointments";

import "./Dashboard.css";
import DashboardProfile from "../../components/DashboardProfile/DashboardProfile";
import DashboardPatient from "../../components/DashboardPatient/DashboardPatient";

const Dashboard = () => {
  const { user } = useContext(AuthContext);
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

  const loadPatientDataRef = useRef(null);
  const loadPatientData = async () => {
    if (typeof loadPatientDataRef.current === "function") {
      await loadPatientDataRef.current();
    }
  };

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

  const handleBookAppointment = async (appointmentData) => {
    await bookAppointment(appointmentData, {
      availableSlots,
      appointments,
      setLoading,
      setError,
      setSuccess,
      loadPatientData,
      closeModal,
    });
  };

  const handleCancelAppointment = async (appointmentId) => {
    await cancelAppointment(appointmentId, {
      setLoading,
      setError,
      setSuccess,
      loadPatientData,
      closeModal,
    });
  };

  const handleDeleteAppointment = async (appointmentId) => {
    await deleteAppointment(appointmentId, {
      setLoading,
      setError,
      setSuccess,
      loadPatientData,
      closeModal,
    });
  };

  const handleRescheduleAppointment = async (appointmentId, newSlotData) => {
    await rescheduleAppointment(appointmentId, newSlotData, {
      setLoading,
      setError,
      setSuccess,
      loadPatientData,
      closeModal,
    });
  };

  const updateProfileRef = useRef(null);
  const handleUpdateProfile = async (updatedProfile) => {
    if (typeof updateProfileRef.current === "function") {
      await updateProfileRef.current(updatedProfile);
    }
  };

  const renderModal = () => {
    if (!showModal) return null;

    return (
      <div className="modal-overlay" onClick={closeModal}>
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h3>
              {modalType === "book" && "Book New Appointment"}
              {modalType === "cancel" && "Cancel Appointment"}
              {modalType === "reschedule" && "Reschedule Appointment"}
              {modalType === "editProfile" && "Edit Profile"}
            </h3>
            <button className="modal-close" onClick={closeModal}>
              ×
            </button>
          </div>
          <div className="modal-content">
            {error && <div className="alert alert-error">{error}</div>}

            {success && <div className="alert alert-success">{success}</div>}

            {modalType === "editProfile" && (
              <EditProfileModal
                profile={profile}
                loading={loading}
                onSubmit={handleUpdateProfile}
                closeModal={closeModal}
              />
            )}

            {modalType === "book" && (
              <BookAppointmentModal
                selectedDoctorId={selectedDoctorId}
                setSelectedDoctorId={setSelectedDoctorId}
                availableSlots={availableSlots}
                availableDates={availableDates}
                selectedDateForBooking={selectedDateForBooking}
                setSelectedDateForBooking={setSelectedDateForBooking}
                selectedTimeForBooking={selectedTimeForBooking}
                setSelectedTimeForBooking={setSelectedTimeForBooking}
                availableTimes={availableTimes}
                setAvailableTimes={setAvailableTimes}
                handleBookAppointment={handleBookAppointment}
                closeModal={closeModal}
              />
            )}
            {modalType === "cancel" && selectedAppointment && (
              <CancelModal
                selectedAppointment={selectedAppointment}
                closeModal={closeModal}
                onCancel={handleCancelAppointment}
              />
            )}
            {modalType === "reschedule" && selectedAppointment && (
              <ReshcduleModal
                selectedAppointment={selectedAppointment}
                availableTimesForReschedule={availableTimesForReschedule}
                closeModal={closeModal}
                onReschedule={handleRescheduleAppointment}
              />
            )}
            {modalType === "delete" && selectedAppointment && (
              <DeleteModal
                selectedAppointment={selectedAppointment}
                closeModal={closeModal}
                onDelete={handleDeleteAppointment}
              />
            )}
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
              <LogoutButton variant="outline">Logout</LogoutButton>
            </div>
          </nav>
        </div>
      </header>

      <main className="dashboard-content">
        <div className="container">
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

          {loading ? (
            <div className="loading">
              <div className="spinner"></div>
            </div>
          ) : (
            <>
              <DashboardAppointment
                variant="content"
                active={activeTab === "appointments"}
                appointments={appointments}
                loading={loading}
                error={error}
                success={success}
                openModal={openModal}
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
                setAvailableTimesForReschedule={setAvailableTimesForReschedule}
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
              <DashboardPatient
                onExposeUpdateProfile={(fn) => {
                  updateProfileRef.current = fn;
                }}
                setLoading={setLoading}
                setError={setError}
                setSuccess={setSuccess}
                setProfile={setProfile}
                closeModal={closeModal}
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
