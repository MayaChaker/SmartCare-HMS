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
  const [activeTab, setActiveTab] = useState("appointments");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [profile, setProfile] = useState({});
  const [appointments, setAppointments] = useState([]);
  const [medicalRecords, setMedicalRecords] = useState([]);

  const [doctors, setDoctors] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);

  const [selectedDoctorId, setSelectedDoctorId] = useState("");
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

  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("");
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  const closeModal = useCallback(() => {
    setShowModal(false);
    setModalType("");
    setSelectedAppointment(null);
    setError("");
    setSuccess("");
  }, []);

  const openModal = useCallback((type, appointment = null) => {
    setModalType(type);
    setSelectedAppointment(appointment);
    setShowModal(true);
    setError("");
    setSuccess("");
  }, []);

  const updateProfile = useCallback(
    async (updated) => {
      setLoading(true);
      setError("");
      setSuccess("");
      try {
        const response = await patientAPI.updateProfile(updated);
        if (response.success) {
          setProfile(response.data);
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
    },
    [closeModal]
  );

  useEffect(() => {
    const computeAvailableTimes = async () => {
      setAvailableTimes([]);
      if (!selectedDoctorId || !selectedDateForBooking) {
        return;
      }
      try {
        const doctor =
          doctors.find((d) => d.id === parseInt(selectedDoctorId, 10)) ||
          availableSlots.find((d) => d.id === parseInt(selectedDoctorId, 10));
        const { start, end } = parseWorkingHours(doctor?.workingHours || "");
        const windowTimes = generateTimeSlots(start || "09:00", end || "17:00");

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

        const available = windowTimes.filter((t) => !bookedTimes.includes(t));
        setAvailableTimes(available);
      } catch {
        setAvailableTimes([]);
      }
    };
    computeAvailableTimes();
  }, [selectedDoctorId, selectedDateForBooking, doctors, availableSlots]);

  const value = {
    activeTab,
    setActiveTab,

    loading,
    setLoading,
    error,
    setError,
    success,
    setSuccess,

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

    availableTimesForReschedule,
    setAvailableTimesForReschedule,
    availableDatesForReschedule,
    setAvailableDatesForReschedule,
    selectedDateForReschedule,
    setSelectedDateForReschedule,

    showModal,
    modalType,
    selectedAppointment,
    openModal,
    closeModal,

    updateProfile,
  };

  return (
    <PatientDashboardContext.Provider value={value}>
      {children}
    </PatientDashboardContext.Provider>
  );
};

export const usePatientDashboard = () => {
  const ctx = useContext(PatientDashboardContext);
  if (!ctx) {
    throw new Error(
      "usePatientDashboard must be used inside <PatientDashboardProvider />"
    );
  }
  return ctx;
};
