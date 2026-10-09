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
    // A temporary password must be replaced first (the server refuses everything else)
    if (error.response?.data?.code === "PASSWORD_CHANGE_REQUIRED" && window.location.pathname !== "/change-password") {
      window.location.href = "/change-password";
    }
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
  // POST `/auth/activate` with `{ code, username, password }` for a file opened at the front desk
  activate: (details) => api.post("/auth/activate", details),
  // POST `/auth/change-password` with `{ currentPassword, newPassword }`
  changePassword: (details) => api.post("/auth/change-password", details),
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

// Wraps a request so callers get { success, data } or { success: false, message }
const call = async (request, fallback) => {
  try {
    const response = await request;
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, message: error.response?.data?.message || fallback };
  }
};

// Doctor API calls
export const doctorAPI = {
  getProfile: () => call(api.get("/doctor/profile"), "Couldn't load your profile"),
  getAppointments: () => call(api.get("/doctor/appointments"), "Couldn't load your visits"),
  getPatients: () => call(api.get("/doctor/patients"), "Couldn't load your patients"),
  // { patient, medicalRecords }
  getPatient: (id) => call(api.get(`/doctor/patients/${id}`), "Couldn't load this patient"),
  setStatus: (appointmentId, status) => call(api.put(`/doctor/appointments/${appointmentId}`, { status }), "Couldn't update the visit"),
  createRecord: (note) => call(api.post("/doctor/records", note), "Couldn't save the note"),
  updateRecord: (id, note) => call(api.put(`/doctor/records/${id}`, note), "Couldn't save the note"),
  // { availability, workingHours }
  updateAvailability: (values) => call(api.put("/doctor/availability", values), "Couldn't save your hours"),
};

// Front desk (reception) API calls
export const receptionAPI = {
  getDoctors: () => call(api.get("/receptionist/doctors"), "Couldn't load the doctors"),
  getPatients: () => call(api.get("/receptionist/patients"), "Couldn't load the patients"),
  // Visits on one day, "YYYY-MM-DD"
  getDay: (date) => call(api.get("/receptionist/appointments/day", { params: { date } }), "Couldn't load the visits"),
  getAvailability: (days = 14) => call(api.get("/receptionist/availability", { params: { days } }), "Couldn't load free times"),
  checkIn: (id) => call(api.put(`/receptionist/checkin/${id}`), "Couldn't check the patient in"),
  setStatus: (id, status) => call(api.put(`/receptionist/appointments/${id}`, { status }), "Couldn't update the visit"),
  move: (id, slot) => call(api.put(`/receptionist/appointments/${id}`, slot), "Couldn't move the visit"),
  book: (visit) => call(api.post("/receptionist/appointments", visit), "Couldn't book the visit"),
  // Returns { patient, activationCode, activationExpiresAt }
  openFile: (details) => call(api.post("/receptionist/patients", details), "Couldn't open the file"),
  updatePatient: (id, details) => call(api.put(`/receptionist/patients/${id}`, details), "Couldn't save the details"),
  newActivationCode: (id) => call(api.post(`/receptionist/patients/${id}/activation-code`), "Couldn't create a new code"),
};

// Administration API calls
export const adminAPI = {
  // { days, from, to, current, previous, waitingToActivate, perDay, byDepartment, doctors }
  getAnalytics: (days = 30) => call(api.get("/admin/analytics", { params: { days } }), "Couldn't load the figures"),
  // Newest first; role: receptionist | doctor | patient | admin; before: id of the oldest row already shown
  getActivity: ({ role, before } = {}) => call(api.get("/admin/activity", { params: { role, before } }), "Couldn't load the activity"),
  getUsers: () => call(api.get("/admin/users"), "Couldn't load the accounts"),
  // Returns { user, doctor, tempPassword }
  createUser: (details) => call(api.post("/admin/users", details), "Couldn't create the account"),
  resetPassword: (id) => call(api.post(`/admin/users/${id}/reset-password`), "Couldn't reset the password"),
  getDoctors: () => call(api.get("/admin/doctors"), "Couldn't load the doctors"),
  updateDoctor: (id, details) => call(api.put(`/admin/doctors/${id}`, details), "Couldn't save the doctor"),
  uploadDoctorPhoto: (id, file) => {
    const form = new FormData();
    form.append("photo", file);
    return call(api.post(`/admin/doctors/${id}/photo`, form, { headers: { "Content-Type": "multipart/form-data" } }), "Couldn't save the photo");
  },
};
