import axios from "axios";

// Resolve API base URL from Vite env;
export const API_BASE_URL = String(
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE_URL) ||
    "/api",
).replace(/\/$/, "");

// Backend origin without the /api suffix; empty in development, where Vite proxies requests
export const API_ORIGIN = API_BASE_URL.replace(/\/api$/, "");

// Files under /uploads are served by the backend, next to /api
export const resolveUploadUrl = (uploadPath) => `${API_ORIGIN}${uploadPath}`;

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
    // A 401 from login means wrong credentials, not an expired session
    const isAuthRequest = String(error.config?.url || "").startsWith("/auth/");
    if (error.response?.status === 401 && !isAuthRequest) {
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

  // Free times for every doctor over the next `days` days: { from, days, doctors: [{ doctorId, days: [{ date, working, times }] }] }
  getAvailability: async (days = 14) => {
    try {
      const response = await patientAPI._getCached("/patient/availability", { days });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Couldn't load free times",
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

export default api;
