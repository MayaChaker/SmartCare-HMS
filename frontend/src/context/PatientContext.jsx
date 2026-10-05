import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";

import { parseWorkingHours, generateTimeSlots } from "../utils/schedule";
import { patientAPI } from "../utils/api";
const PatientDashboardContext = createContext(null);

export const PatientDashboardProvider = ({ children }) => {
  /* 
     Tabs + global UI states */

  const [activeTab, setActiveTab] = useState("appointments");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  /*  Main data states */
  const [profile, setProfile] = useState({});
  const [appointments, setAppointments] = useState([]);
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [doctors, setDoctors] = useState([]);

  /*   Booking states */
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [availableDates, setAvailableDates] = useState([]);
  const [selectedDateForBooking, setSelectedDateForBooking] = useState("");
  const [availableTimes, setAvailableTimes] = useState([]);
  const [selectedTimeForBooking, setSelectedTimeForBooking] = useState("");

  /*
     Reschedule states */
  const [availableTimesForReschedule, setAvailableTimesForReschedule] =
    useState([]);
  const [availableDatesForReschedule, setAvailableDatesForReschedule] =
    useState([]);
  const [selectedDateForReschedule, setSelectedDateForReschedule] =
    useState("");

  /*
     Modal states */

  // Controls the modal UI
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("");
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  // Close modal + reset messages
  const closeModal = useCallback(() => {
    setShowModal(false);
    setModalType("");
    setSelectedAppointment(null);
    setError("");
    setSuccess("");
  }, []);

  // Open modal
  const openModal = useCallback((type, appointment = null) => {
    setModalType(type);
    setSelectedAppointment(appointment);
    setShowModal(true);
    setError("");
    setSuccess("");
  }, []);

  /* Actions */

  // Update patient profile through the API, then refresh state
  const updateProfile = useCallback(
    async (updated) => {
      setLoading(true);
      setError("");
      setSuccess("");

      try {
        const response = await patientAPI.updateProfile(updated);
        if (response.success) {
          setSuccess("Profile updated successfully!");
          setProfile((prev) => ({ ...prev, ...response.data.patient }));
        } else {
          setError(response.message || "Failed to update profile");
        }
      } catch (e) {
        console.error(e);
        setError("Failed to update profile. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setError, setSuccess]
  );

  // Book a new appointment
  const bookAppointment = useCallback(
    async (appointmentData) => {
      setLoading(true);
      setError("");
      setSuccess("");

      try {
        const doc = doctors.find(
          (d) => d.id === parseInt(appointmentData.doctorId, 10)
        );

        if (doc && doc.availability === false) {
          setError(
            "Selected doctor is currently unavailable. Please choose another date or doctor."
          );
          return;
        }

        const response = await patientAPI.bookAppointment(appointmentData);
        if (response.success) {
          setSuccess("Appointment booked successfully!");

          // Reload appointments list after booking
          try {
            const apptResp = await patientAPI.getAppointments();
            if (apptResp.success) {
              setAppointments(apptResp.data);
            }
          } catch (err) {
            console.warn("Failed to reload appointments", err);
          }

          closeModal();
        } else {
          setError(response.message || "Failed to book appointment");
        }
      } catch (err) {
        console.error(err);
        setError("Failed to book appointment. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [doctors, setAppointments, closeModal]
  );

  /*  Compute available times */
  useEffect(() => {
    const computeAvailableTimes = async () => {
      setAvailableTimes([]);
      if (!selectedDoctorId || !selectedDateForBooking) return;

      try {
        const doctorIdNum = parseInt(selectedDoctorId, 10);
        const doctor = doctors.find((d) => d.id === doctorIdNum);
        const { start, end } = parseWorkingHours(doctor?.workingHours || "");
        const windowTimes = generateTimeSlots(start || "09:00", end || "17:00");

        // Load booked times from backend
        let bookedTimes = [];
        try {
          const resp = await patientAPI.getDoctorBookedTimes(
            String(selectedDoctorId),
            String(selectedDateForBooking)
          );

          bookedTimes = resp.success
            ? Array.isArray(resp.data?.bookedTimes)
              ? resp.data.bookedTimes
              : []
            : [];
        } catch {
          bookedTimes = [];
        }

        // Keep only free times (not booked)
        const available = windowTimes.filter((t) => !bookedTimes.includes(t));
        setAvailableTimes(available);
      } catch {
        setAvailableTimes([]);
      }
    };

    computeAvailableTimes();
  }, [selectedDoctorId, selectedDateForBooking, doctors]);

  /* 
     Context value  */

  const value = {
    // tab
    activeTab,
    setActiveTab,

    // ui flags/messages
    loading,
    setLoading,
    error,
    setError,
    success,
    setSuccess,

    // data
    profile,
    setProfile,
    appointments,
    setAppointments,
    medicalRecords,
    setMedicalRecords,

    doctors,
    setDoctors,

    // booking
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

    // reschedule
    availableTimesForReschedule,
    setAvailableTimesForReschedule,
    availableDatesForReschedule,
    setAvailableDatesForReschedule,
    selectedDateForReschedule,
    setSelectedDateForReschedule,

    // modal
    showModal,
    modalType,
    selectedAppointment,
    openModal,
    closeModal,

    // actions
    updateProfile,
    bookAppointment,
  };

  return (
    <PatientDashboardContext.Provider value={value}>
      {children}
    </PatientDashboardContext.Provider>
  );
};

export const usePatientDashboard = () => {
  // Hook to access the context safely
  const ctx = useContext(PatientDashboardContext);

  // Helps catch mistakes if someone uses the hook outside the provider
  if (!ctx) {
    throw new Error(
      "usePatientDashboard must be used inside <PatientDashboardProvider />"
    );
  }

  return ctx;
};
