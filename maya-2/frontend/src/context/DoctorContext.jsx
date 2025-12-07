// src/context/DoctorContext.jsx
import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";

const DoctorContext = createContext(null);

export const DoctorProvider = ({ children }) => {
  const [doctorProfile, setDoctorProfile] = useState(null);
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  const loadDoctorData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("No authentication token found. Please login again.");
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };

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
        setAppointments(Array.isArray(appointmentsData) ? appointmentsData : []);
      }
    } catch (err) {
      console.error("Error loading doctor data:", err);
      setError("Failed to load data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDoctorData();
  }, [loadDoctorData]);

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

    // reload
    loadDoctorData,
  };

  return (
    <DoctorContext.Provider value={value}>{children}</DoctorContext.Provider>
  );
};

export const useDoctor = () => {
  const ctx = useContext(DoctorContext);
  if (!ctx) {
    throw new Error("useDoctor must be used inside DoctorProvider");
  }
  return ctx;
};
