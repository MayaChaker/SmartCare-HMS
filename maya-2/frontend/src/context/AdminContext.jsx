// src/context/AdminContext.jsx
import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { useAuth } from "./useAuth";

const AdminContext = createContext(null);

export const AdminProvider = ({ children }) => {
  const { logout } = useAuth();

  // Which section is active in sidebar
  const [activeSection, setActiveSection] = useState("dashboard");

  // Global UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Data states
  const [analytics, setAnalytics] = useState({
    totalUsers: 0,
    totalPatients: 0,
    totalDoctors: 0,
    totalAppointments: 0,
    todayAppointments: 0,
    recentRegistrations: 0,
    appointmentsByStatus: {},
  });

  const [users, setUsers] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [systemSettings, setSystemSettings] = useState({});

  // Modal + user form state (for create/edit/delete user)
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(""); // "createUser" | "editUser" | "confirmDeleteUser"
  const [selectedItem, setSelectedItem] = useState(null);

  const [userForm, setUserForm] = useState({
    username: "",
    password: "",
    role: "doctor",
    firstName: "",
    lastName: "",
    specialization: "",
    phone: "",
    email: "",
  });

  // -------- Load all admin data from backend --------
  const loadAdminData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("No authentication token found. Please login again.");
        return;
      }

      const authHeaders = {
        Authorization: `Bearer ${token}`,
      };

      // Analytics
      try {
        const res = await fetch("/api/admin/analytics", {
          headers: authHeaders,
        });
        if (res.ok) {
          const data = await res.json();
          setAnalytics(data);
        } else if (res.status === 401) {
          setError("Session expired. Please login again.");
          logout();
          return;
        }
      } catch (e) {
        console.warn("Analytics API error:", e);
      }

      // Users
      try {
        const res = await fetch("/api/admin/users", { headers: authHeaders });
        if (res.ok) {
          const data = await res.json();
          setUsers(data);
        } else if (res.status === 401) {
          setError("Session expired. Please login again.");
          logout();
          return;
        }
      } catch (e) {
        console.warn("Users API error:", e);
      }

      // Doctors
      try {
        const res = await fetch("/api/admin/doctors", { headers: authHeaders });
        if (res.ok) {
          const data = await res.json();
          setDoctors(data);
        } else if (res.status === 401) {
          setError("Session expired. Please login again.");
          logout();
          return;
        }
      } catch (e) {
        console.warn("Doctors API error:", e);
      }

      // Appointments
      try {
        const res = await fetch("/api/admin/appointments", {
          headers: authHeaders,
        });
        if (res.ok) {
          const data = await res.json();
          setAppointments(data);
        } else if (res.status === 401) {
          setError("Session expired. Please login again.");
          logout();
          return;
        }
      } catch (e) {
        console.warn("Appointments API error:", e);
      }

      // Settings
      try {
        const res = await fetch("/api/admin/settings", {
          headers: authHeaders,
        });
        if (res.ok) {
          const data = await res.json();
          setSystemSettings(data);
        } else if (res.status === 401) {
          setError("Session expired. Please login again.");
          logout();
          return;
        }
      } catch (e) {
        console.warn("Settings API error:", e);
      }
    } catch (e) {
      console.error("Error loading admin data:", e);
      setError(
        "Failed to load data. Please check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  }, [logout]);

  // Load on mount
  useEffect(() => {
    loadAdminData();
  }, [loadAdminData]);

  // -------- Modal helpers --------
  const openModal = (type, item = null) => {
    setModalType(type);
    setSelectedItem(item);
    setShowModal(true);
    setError("");
    setSuccess("");

    if (type === "createUser") {
      setUserForm({
        username: "",
        password: "",
        role: "doctor",
        firstName: "",
        lastName: "",
        specialization: "",
        phone: "",
        email: "",
      });
    } else if (type === "editUser" && item) {
      setUserForm({
        username: item.username || "",
        password: "",
        role: item.role || "doctor",
        firstName: item.firstName || "",
        lastName: item.lastName || "",
        specialization: item.specialization || "",
        phone: item.phone || "",
        email: item.email || "",
      });
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setModalType("");
    setSelectedItem(null);
    setError("");
    setSuccess("");
  };

  // called from Users table delete button
  const handleDeleteUser = (userId) => {
    const user = users.find((u) => u.id === userId);
    openModal("confirmDeleteUser", user || null);
  };

  // -------- Create/Edit user submit --------
  const handleSubmitUser = async (e) => {
    e.preventDefault();
    setLoading(true);
    const isEdit = modalType === "editUser" && selectedItem?.id;

    try {
      const token = localStorage.getItem("token");
      const url = isEdit
        ? `/api/admin/users/${selectedItem.id}`
        : "/api/admin/users";
      const method = isEdit ? "PUT" : "POST";

      const payload = { ...userForm };
      if (isEdit && !payload.password) {
        delete payload.password;
      }

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setSuccess(
          isEdit ? "User updated successfully!" : "User created successfully!"
        );
        await loadAdminData();
        closeModal();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(
          data.message ||
            (isEdit ? "Failed to update user" : "Failed to create user")
        );
      }
    } catch (e) {
      console.error("Error submitting user:", e);
      setError(
        isEdit
          ? "Failed to update user. Please try again."
          : "Failed to create user. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // -------- Confirm delete user --------
  const confirmDeleteUser = async () => {
    if (!selectedItem?.id) {
      closeModal();
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/admin/users/${selectedItem.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        setSuccess("User deleted successfully!");
        await loadAdminData();
        closeModal();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.message || "Failed to delete user");
      }
    } catch (e) {
      console.error("Error deleting user:", e);
      setError("Failed to delete user. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const value = {
    // section
    activeSection,
    setActiveSection,

    // ui state
    loading,
    error,
    success,
    setError,
    setSuccess,

    // data
    analytics,
    users,
    doctors,
    appointments,
    systemSettings,

    // modal + user form
    showModal,
    modalType,
    selectedItem,
    userForm,
    setUserForm,
    openModal,
    closeModal,
    handleSubmitUser,
    handleDeleteUser,
    confirmDeleteUser,
  };

  return (
    <AdminContext.Provider value={value}>{children}</AdminContext.Provider>
  );
};

export const useAdmin = () => {
  const ctx = useContext(AdminContext);
  if (!ctx) {
    throw new Error("useAdmin must be used inside <AdminProvider>");
  }
  return ctx;
};
