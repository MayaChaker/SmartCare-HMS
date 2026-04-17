import axios from "axios";

// Resolve API base URL from Vite env;
export const API_BASE_URL = String(
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE_URL) ||
    "/api",
).replace(/\/$/, "");

// Axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Request interceptor
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
  },
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

// Auth API calls: login and patient registration
export const authAPI = {
  // POST `/auth/login` with `{ email, password }`
  login: (credentials) => api.post("/auth/login", credentials),
  // POST `/auth/register-patient` with patient profile data
  registerPatient: (userData) => api.post("/auth/register-patient", userData),
};

// Patient API calls
export const patientAPI = {
  // Lightweight in-memory promise cache to dedupe concurrent GETs and reduce UI flicker
  _cache: new Map(),
  _cachePut(key, promise) {
    this._cache.set(key, promise);
    setTimeout(() => {
      this._cache.delete(key);
    }, 1500);
    return promise;
  },
  // Use cached GET if in-flight; otherwise start and cache it briefly
  async _getCached(url, params) {
    const key = params ? `${url}?${JSON.stringify(params)}` : url;
    const hit = this._cache.get(key);
    if (hit) return hit;
    const p = api.get(url, params ? { params } : undefined);
    return this._cachePut(key, p);
  },
  // Fetch current patient profile
  getProfile: async () => {
    try {
      const response = await patientAPI._getCached("/patient/profile");
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Couldn't load your profile",
      };
    }
  },

  // Update patient profile
  updateProfile: async (profileData) => {
    try {
      const response = await api.put("/patient/profile", profileData);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Couldn't save your profile",
      };
    }
  },

  // Fetch patient's appointments
  getAppointments: async () => {
    try {
      const response = await patientAPI._getCached("/patient/appointments");
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message:
          error.response?.data?.message || "Couldn't load your appointments",
      };
    }
  },

  // Create a new appointment
  bookAppointment: async (appointmentData) => {
    try {
      const response = await api.post("/patient/appointments", appointmentData);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Couldn't book the visit",
      };
    }
  },

  // Cancel an existing appointment
  cancelAppointment: async (appointmentId) => {
    try {
      const response = await api.delete(
        `/patient/appointments/${appointmentId}`,
      );
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Couldn't cancel the visit",
      };
    }
  },
  // Permanently delete an appointment (hard delete)
  deleteAppointment: async (appointmentId) => {
    try {
      const response = await api.delete(
        `/patient/appointments/${appointmentId}`,
        { params: { hard: true } },
      );
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Couldn't remove the visit",
      };
    }
  },

  // Reschedule appointment with new slot data
  rescheduleAppointment: async (appointmentId, newSlotData) => {
    try {
      const response = await api.put(
        `/patient/appointments/${appointmentId}`,
        newSlotData,
      );
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message:
          error.response?.data?.message || "Couldn't update the appointment",
      };
    }
  },

  // Fetch patient's medical records
  getMedicalRecords: async () => {
    try {
      const response = await patientAPI._getCached("/patient/records");
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message:
          error.response?.data?.message || "Couldn't load medical records",
      };
    }
  },

  // Fetch available booking slots
  getAvailableSlots: async () => {
    try {
      const response = await patientAPI._getCached("/patient/available-slots");
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message:
          error.response?.data?.message || "Couldn't load available times",
      };
    }
  },

  // Fetch a doctor's booked dates (calendar view)
  getDoctorBookedDates: async (doctorId) => {
    try {
      const response = await patientAPI._getCached(
        `/patient/doctors/${doctorId}/booked-dates`,
      );
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Couldn't load booked dates",
      };
    }
  },

  // Fetch a doctor's booked times for a specific date
  getDoctorBookedTimes: async (doctorId, date) => {
    try {
      const response = await patientAPI._getCached(
        `/patient/doctors/${doctorId}/booked-times`,
        { date },
      );
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Couldn't load booked times",
      };
    }
  },

  // Public doctor listing
  getDoctors: async () => {
    try {
      const response = await patientAPI._getCached("/doctors");
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Couldn't load doctors",
      };
    }
  },

  // Patient-scoped doctor listing
  getAllDoctors: async () => {
    try {
      const response = await patientAPI._getCached("/patient/doctors");
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Couldn't load doctors",
      };
    }
  },
};

// Receptionist API calls
export const receptionistAPI = {
  // Dashboard metrics for receptionist
  getDashboardStats: async () => {
    try {
      const response = await api.get("/receptionist/dashboard-stats");
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Couldn't load the dashboard",
      };
    }
  },

  // List patients managed by receptionist
  getAllPatients: async () => {
    try {
      const response = await api.get("/receptionist/patients");
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Couldn't load patients",
      };
    }
  },

  // Create a new patient record
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

  // Update patient details
  updatePatient: async (patientId, patientData) => {
    try {
      const response = await api.put(
        `/receptionist/patients/${patientId}`,
        patientData,
      );
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message:
          error.response?.data?.message || "Couldn't save patient details",
      };
    }
  },

  // List all appointments in the system
  getAllAppointments: async () => {
    try {
      const response = await api.get("/receptionist/appointments");
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Couldn't load appointments",
      };
    }
  },

  // Create/schedule an appointment
  scheduleAppointment: async (appointmentData) => {
    try {
      const response = await api.post(
        "/receptionist/appointments",
        appointmentData,
      );
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message:
          error.response?.data?.message || "Couldn't add the appointment",
      };
    }
  },

  // Fetch today's appointments
  getTodayAppointments: async () => {
    try {
      const response = await api.get("/receptionist/appointments/today");
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message:
          error.response?.data?.message || "Couldn't load today's appointments",
      };
    }
  },

  // Mark patient as checked-in for appointment
  checkInPatient: async (appointmentId) => {
    try {
      const response = await api.put(
        `/receptionist/appointments/${appointmentId}/checkin`,
      );
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Couldn't mark as arrived",
      };
    }
  },

  // List doctors visible to receptionist
  getAllDoctors: async () => {
    try {
      const response = await api.get("/receptionist/doctors");
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Couldn't load doctors",
      };
    }
  },
};

// Doctor API calls
export const doctorAPI = {
  // Dashboard metrics for doctor
  getDashboardStats: async () => {
    try {
      const response = await api.get("/doctor/dashboard-stats");
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Couldn't load the dashboard",
      };
    }
  },

  // List patients assigned to doctor
  getPatients: async () => {
    try {
      const response = await api.get("/doctor/patients");
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Couldn't load patients",
      };
    }
  },

  // List appointments for doctor
  getAppointments: async () => {
    try {
      const response = await api.get("/doctor/appointments");
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Couldn't load appointments",
      };
    }
  },

  // Update appointment status (e.g., completed, cancelled)
  updateAppointmentStatus: async (appointmentId, status) => {
    try {
      const response = await api.put(`/doctor/appointments/${appointmentId}`, {
        status,
      });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Couldn't update the status",
      };
    }
  },

  // Add a new medical record
  addMedicalRecord: async (recordData) => {
    try {
      const response = await api.post("/doctor/records", recordData);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Couldn't add the record",
      };
    }
  },

  // Fetch medical records via patient details endpoint
  getMedicalRecords: async (patientId) => {
    try {
      // Backend does not expose /doctor/medical-records/:id; use patient details endpoint
      const response = await api.get(`/doctor/patients/${patientId}`);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message:
          error.response?.data?.message || "Couldn't load medical records",
      };
    }
  },
};

// Admin API calls
export const adminAPI = {
  // Dashboard metrics for admin
  getDashboardStats: async () => {
    try {
      const response = await api.get("/admin/dashboard-stats");
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Couldn't load the dashboard",
      };
    }
  },

  // List all users
  getAllUsers: async () => {
    try {
      const response = await api.get("/admin/users");
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Couldn't load users",
      };
    }
  },

  // Create a new user
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

  // Update an existing user
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

  // Delete a user
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

  // List all appointments
  getAllAppointments: async () => {
    try {
      const response = await api.get("/admin/appointments");
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Couldn't load appointments",
      };
    }
  },

  // System-level analytics
  getSystemAnalytics: async () => {
    try {
      const response = await api.get("/admin/analytics");
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Couldn't load reports",
      };
    }
  },
};

// Generic API functions for backward compatibility with older imports
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
