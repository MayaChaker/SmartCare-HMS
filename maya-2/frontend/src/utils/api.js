import axios from "axios";

const API_BASE_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE_URL) ||
  "/api";

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Add token to requests if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// Auth API calls
export const authAPI = {
  login: (credentials) => api.post("/auth/login", credentials),
  registerPatient: (userData) => api.post("/auth/register-patient", userData),
};

// Patient API calls
export const patientAPI = {
  // lightweight in-memory cache to dedupe concurrent GET requests and reduce flicker
  _cache: new Map(),
  _cachePut(key, promise) {
    this._cache.set(key, promise);
    setTimeout(() => {
      this._cache.delete(key);
    }, 1500);
    return promise;
  },
  async _getCached(url, params) {
    const key = params ? `${url}?${JSON.stringify(params)}` : url;
    const hit = this._cache.get(key);
    if (hit) return hit;
    const p = api.get(url, params ? { params } : undefined);
    return this._cachePut(key, p);
  },
  getProfile: async () => {
    try {
      const response = await patientAPI._getCached("/patient/profile");
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Failed to fetch profile",
      };
    }
  },

  updateProfile: async (profileData) => {
    try {
      const response = await api.put("/patient/profile", profileData);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Failed to update profile",
      };
    }
  },

  getAppointments: async () => {
    try {
      const response = await patientAPI._getCached("/patient/appointments");
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message:
          error.response?.data?.message || "Failed to fetch appointments",
      };
    }
  },

  bookAppointment: async (appointmentData) => {
    try {
      const response = await api.post("/patient/appointments", appointmentData);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Failed to book appointment",
      };
    }
  },

  cancelAppointment: async (appointmentId) => {
    try {
      const response = await api.delete(
        `/patient/appointments/${appointmentId}`
      );
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message:
          error.response?.data?.message || "Failed to cancel appointment",
      };
    }
  },
  deleteAppointment: async (appointmentId) => {
    try {
      const response = await api.delete(
        `/patient/appointments/${appointmentId}`,
        { params: { hard: true } }
      );
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message:
          error.response?.data?.message || "Failed to delete appointment",
      };
    }
  },

  rescheduleAppointment: async (appointmentId, newSlotData) => {
    try {
      const response = await api.put(
        `/patient/appointments/${appointmentId}`,
        newSlotData
      );
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message:
          error.response?.data?.message || "Failed to reschedule appointment",
      };
    }
  },

  getMedicalRecords: async () => {
    try {
      const response = await patientAPI._getCached("/patient/records");
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message:
          error.response?.data?.message || "Failed to fetch medical records",
      };
    }
  },

  getAvailableSlots: async () => {
    try {
      const response = await patientAPI._getCached("/patient/available-slots");
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message:
          error.response?.data?.message || "Failed to fetch available slots",
      };
    }
  },

  getDoctorBookedDates: async (doctorId) => {
    try {
      const response = await patientAPI._getCached(
        `/patient/doctors/${doctorId}/booked-dates`
      );
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message:
          error.response?.data?.message || "Failed to fetch booked dates",
      };
    }
  },

  getDoctorBookedTimes: async (doctorId, date) => {
    try {
      const response = await patientAPI._getCached(
        `/patient/doctors/${doctorId}/booked-times`,
        { date }
      );
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message:
          error.response?.data?.message || "Failed to fetch booked times",
      };
    }
  },

  getDoctors: async () => {
    try {
      const response = await patientAPI._getCached("/doctors");
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Failed to fetch doctors",
      };
    }
  },

  getAllDoctors: async () => {
    try {
      const response = await patientAPI._getCached("/patient/doctors");
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Failed to fetch doctors",
      };
    }
  },
};

// Receptionist API calls
export const receptionistAPI = {
  getDashboardStats: async () => {
    try {
      const response = await api.get("/receptionist/dashboard-stats");
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message:
          error.response?.data?.message || "Failed to fetch dashboard stats",
      };
    }
  },

  getAllPatients: async () => {
    try {
      const response = await api.get("/receptionist/patients");
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Failed to fetch patients",
      };
    }
  },

  registerPatient: async (patientData) => {
    try {
      const response = await api.post("/receptionist/patients", patientData);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Failed to register patient",
      };
    }
  },

  updatePatient: async (patientId, patientData) => {
    try {
      const response = await api.put(
        `/receptionist/patients/${patientId}`,
        patientData
      );
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Failed to update patient",
      };
    }
  },

  getAllAppointments: async () => {
    try {
      const response = await api.get("/receptionist/appointments");
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message:
          error.response?.data?.message || "Failed to fetch appointments",
      };
    }
  },

  scheduleAppointment: async (appointmentData) => {
    try {
      const response = await api.post(
        "/receptionist/appointments",
        appointmentData
      );
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message:
          error.response?.data?.message || "Failed to schedule appointment",
      };
    }
  },

  getTodayAppointments: async () => {
    try {
      const response = await api.get("/receptionist/appointments/today");
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message:
          error.response?.data?.message ||
          "Failed to fetch today's appointments",
      };
    }
  },

  checkInPatient: async (appointmentId) => {
    try {
      const response = await api.put(
        `/receptionist/appointments/${appointmentId}/checkin`
      );
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Failed to check in patient",
      };
    }
  },

  getAllDoctors: async () => {
    try {
      const response = await api.get("/receptionist/doctors");
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Failed to fetch doctors",
      };
    }
  },
};

// Doctor API calls
export const doctorAPI = {
  getDashboardStats: async () => {
    try {
      const response = await api.get("/doctor/dashboard-stats");
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message:
          error.response?.data?.message || "Failed to fetch dashboard stats",
      };
    }
  },

  getPatients: async () => {
    try {
      const response = await api.get("/doctor/patients");
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Failed to fetch patients",
      };
    }
  },

  getAppointments: async () => {
    try {
      const response = await api.get("/doctor/appointments");
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message:
          error.response?.data?.message || "Failed to fetch appointments",
      };
    }
  },

  updateAppointmentStatus: async (appointmentId, status) => {
    try {
      const response = await api.put(`/doctor/appointments/${appointmentId}`, {
        status,
      });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message:
          error.response?.data?.message ||
          "Failed to update appointment status",
      };
    }
  },

  addMedicalRecord: async (recordData) => {
    try {
      const response = await api.post("/doctor/records", recordData);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message:
          error.response?.data?.message || "Failed to add medical record",
      };
    }
  },

  getMedicalRecords: async (patientId) => {
    try {
      // Backend does not expose /doctor/medical-records/:id; use patient details endpoint
      const response = await api.get(`/doctor/patients/${patientId}`);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message:
          error.response?.data?.message || "Failed to fetch medical records",
      };
    }
  },
};

// Admin API calls
export const adminAPI = {
  getDashboardStats: async () => {
    try {
      const response = await api.get("/admin/dashboard-stats");
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message:
          error.response?.data?.message || "Failed to fetch dashboard stats",
      };
    }
  },

  getAllUsers: async () => {
    try {
      const response = await api.get("/admin/users");
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Failed to fetch users",
      };
    }
  },

  createUser: async (userData) => {
    try {
      const response = await api.post("/admin/users", userData);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Failed to create user",
      };
    }
  },

  updateUser: async (userId, userData) => {
    try {
      const response = await api.put(`/admin/users/${userId}`, userData);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Failed to update user",
      };
    }
  },

  deleteUser: async (userId) => {
    try {
      const response = await api.delete(`/admin/users/${userId}`);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Failed to delete user",
      };
    }
  },

  getAllAppointments: async () => {
    try {
      const response = await api.get("/admin/appointments");
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message:
          error.response?.data?.message || "Failed to fetch appointments",
      };
    }
  },

  getSystemAnalytics: async () => {
    try {
      const response = await api.get("/admin/analytics");
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Failed to fetch analytics",
      };
    }
  },
};

// Generic API functions for backward compatibility
export const login = (credentials) => authAPI.login(credentials);
export const registerPatient = (userData) => authAPI.registerPatient(userData);
export const getPatientProfile = () => patientAPI.getProfile();
export const getPatientAppointments = () => patientAPI.getAppointments();
export const createPatientAppointment = (appointmentData) =>
  patientAPI.bookAppointment(appointmentData);
export const updatePatientAppointment = (id, appointmentData) =>
  patientAPI.rescheduleAppointment(id, appointmentData);
export const getPatientMedicalRecords = () => patientAPI.getMedicalRecords();
export const getAllDoctors = () => patientAPI.getAllDoctors();

export default api;
