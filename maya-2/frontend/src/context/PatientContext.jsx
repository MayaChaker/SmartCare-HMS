// src/context/PatientDashboardContext.jsx
import React, { createContext, useContext, useState } from "react";
import { patientAPI } from "../utils/api";

const PatientContext = createContext(null);

export const usePatientDashboard = () => {
  const ctx = useContext(PatientContext);
  if (!ctx) {
    throw new Error(
      "usePatientDashboard must be used inside PatientDashboardProvider"
    );
  }
  return ctx;
};

export const PatientDashboardProvider = ({ children }) => {
  // Tabs
  const [activeTab, setActiveTab] = useState("appointments");

  // UI
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Data
  const [profile, setProfile] = useState({
    name: "",
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
  const [doctors, setDoctors] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);

  // Booking / reschedule
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [selectedAppointment, setSelectedAppointment] = useState(null);

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

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("");

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

  // Update profile (used by EditProfileModal)
  const updateProfile = async (updatedProfile) => {
    setLoading(true);
    setError("");
    setSuccess("");

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
    } catch (err) {
      console.error(err);
      setError("Failed to update profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const value = {
    // Tabs
    activeTab,
    setActiveTab,

    // UI
    loading,
    setLoading,
    error,
    setError,
    success,
    setSuccess,

    // Data
    profile,
    setProfile,
    appointments,
    setAppointments,
    medicalRecords,
    setMedicalRecords,
    doctors,
    setDoctors,
    availableSlots,
    setAvailableSlots,

    // Booking
    selectedDoctorId,
    setSelectedDoctorId,
    availableDates,
    setAvailableDates,
    selectedDateForBooking,
    setSelectedDateForBooking,
    availableTimes,
    setAvailableTimes,
    selectedTimeForBooking,
    setSelectedTimeForBooking,

    // Reschedule
    availableTimesForReschedule,
    setAvailableTimesForReschedule,
    availableDatesForReschedule,
    setAvailableDatesForReschedule,
    selectedDateForReschedule,
    setSelectedDateForReschedule,

    // Selected appointment
    selectedAppointment,
    setSelectedAppointment,

    // Modals
    showModal,
    modalType,
    openModal,
    closeModal,

    // Actions
    updateProfile,
  };

  return (
    <PatientContext.Provider value={value}>{children}</PatientContext.Provider>
  );
};
