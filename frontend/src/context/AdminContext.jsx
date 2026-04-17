import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { useAuth } from "./useAuth";
import { API_BASE_URL } from "../utils/api";

/**
 * Create Admin context
 */
const AdminContext = createContext(null);

/**
 * AdminProvider
 */
export const AdminProvider = ({ children }) => {
  const { logout } = useAuth();

  // Sidebar navigation state

  const [activeSection, setActiveSection] = useState("dashboard");

  // Global UI states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Analytics & system data
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

  // Modal state (create / edit / delete user)
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);

  // User form state (used inside modal)
  const [userForm, setUserForm] = useState({
    username: "",
    password: "",
    role: "doctor",
    firstName: "",
    lastName: "",
    specialization: "",
    phone: "",
    email: "",
    fee: "",
  });

  /**
   * Load all admin-related data from backend APIs
   */
  const loadAdminData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      // Get auth token
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Please sign in again.");
        return;
      }

      const authHeaders = {
        Authorization: `Bearer ${token}`,
      };

      //  Analytics
      try {
        const res = await fetch(`${API_BASE_URL}/admin/analytics`, {
          headers: authHeaders,
        });

        if (res.ok) {
          setAnalytics(await res.json());
        } else if (res.status === 401) {
          setError("Please sign in again.");
          logout();
          return;
        }
      } catch (e) {
        console.warn("Analytics API error:", e);
      }

      //  Users
      try {
        const res = await fetch(`${API_BASE_URL}/admin/users`, {
          headers: authHeaders,
        });

        if (res.ok) {
          setUsers(await res.json());
        } else if (res.status === 401) {
          setError("Please sign in again.");
          logout();
          return;
        }
      } catch (e) {
        console.warn("Users API error:", e);
      }

      //  Doctors
      try {
        const res = await fetch(`${API_BASE_URL}/admin/doctors`, {
          headers: authHeaders,
        });

        if (res.ok) {
          setDoctors(await res.json());
        } else if (res.status === 401) {
          setError("Please sign in again.");
          logout();
          return;
        }
      } catch (e) {
        console.warn("Doctors API error:", e);
      }

      //  Appointments
      try {
        const res = await fetch(`${API_BASE_URL}/admin/appointments`, {
          headers: authHeaders,
        });

        if (res.ok) {
          setAppointments(await res.json());
        } else if (res.status === 401) {
          setError("Please sign in again.");
          logout();
          return;
        }
      } catch (e) {
        console.warn("Appointments API error:", e);
      }

      // System Settings
      try {
        const res = await fetch(`${API_BASE_URL}/admin/settings`, {
          headers: authHeaders,
        });

        if (res.ok) {
          setSystemSettings(await res.json());
        } else if (res.status === 401) {
          setError("Please sign in again.");
          logout();
          return;
        }
      } catch (e) {
        console.warn("Settings API error:", e);
      }
    } catch (e) {
      console.error("Error loading admin data:", e);
      setError("Couldn't load the data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [logout]);

  /**
   * Load admin data once when AdminProvider mounts
   */
  useEffect(() => {
    loadAdminData();
  }, [loadAdminData]);

  // Modal helpers

  const openModal = (type, item = null) => {
    setModalType(type);
    setSelectedItem(item);
    setShowModal(true);
    setError("");
    setSuccess("");

    // Reset form when creating a user
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
        fee: "",
      });
    }

    // Fill form when editing user
    if (type === "editUser" && item) {
      setUserForm({
        username: item.username || "",
        password: "",
        role: item.role || "doctor",
        firstName: item.firstName || "",
        lastName: item.lastName || "",
        specialization: item.specialization || "",
        phone: item.phone || "",
        email: item.email || "",
        fee: item.fee ?? "",
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

  /**
   * Trigger delete confirmation modal
   */
  const handleDeleteUser = (userId) => {
    const user = users.find((u) => u.id === userId);
    openModal("confirmDeleteUser", user || null);
  };

  /**
   * Create or edit user submit handler
   */
  const handleSubmitUser = async (e) => {
    e.preventDefault();
    setLoading(true);

    const isEdit = modalType === "editUser" && selectedItem?.id;

    try {
      const token = localStorage.getItem("token");

      const url = isEdit
        ? `${API_BASE_URL}/admin/users/${selectedItem.id}`
        : `${API_BASE_URL}/admin/users`;

      const method = isEdit ? "PUT" : "POST";

      const payload = { ...userForm };

      // Do not send empty password on edit
      if (isEdit && !payload.password) {
        delete payload.password;
      }
      // For edit: if role is not one of allowed admin-assignable roles, omit it
      if (isEdit) {
        const allowedRoles = ["doctor", "receptionist", "admin"];
        if (!allowedRoles.includes(payload.role)) {
          delete payload.role;
        }
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
          isEdit ? "User updated successfully!" : "User created successfully!",
        );
        await loadAdminData();
        closeModal();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.message || "Operation failed");
      }
    } catch (e) {
      setError("Operation failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Confirm user deletion
   */
  const confirmDeleteUser = async () => {
    if (!selectedItem?.id) {
      closeModal();
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("token");

      const res = await fetch(`${API_BASE_URL}/admin/users/${selectedItem.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setSuccess("User deleted successfully!");
        await loadAdminData();
        closeModal();
      } else {
        setError("Failed to delete user");
      }
    } catch (e) {
      setError("Failed to delete user. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Context value exposed to admin components
   */
  const value = {
    activeSection,
    setActiveSection,

    loading,
    error,
    success,
    setError,
    setSuccess,

    analytics,
    users,
    doctors,
    appointments,
    systemSettings,

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

/**
 * Custom hook to use AdminContext safely
 */
export const useAdmin = () => {
  const ctx = useContext(AdminContext);
  if (!ctx) {
    throw new Error("useAdmin must be used inside <AdminProvider>");
  }
  return ctx;
};

export const AdminModal = () => {
  const {
    showModal,
    modalType,
    selectedItem,
    userForm,
    setUserForm,
    closeModal,
    handleSubmitUser,
    confirmDeleteUser,
    loading,
    error,
    success,
  } = useAdmin();

  if (!showModal) return null;

  const getTitle = () => {
    switch (modalType) {
      case "createUser":
        return "Create User";
      case "editUser":
        return "Edit User";
      case "confirmDeleteUser":
        return "Delete User";
      default:
        return "";
    }
  };

  const onChange = (e) => {
    const { name, value } = e.target;
    setUserForm((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container modal">
        <div className="modal-header">
          <h3>{getTitle()}</h3>
          <button
            className="modal-close"
            onClick={closeModal}
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        <div className="modal-content">
          {modalType === "confirmDeleteUser" ? (
            <div>
              <p>
                Are you sure you want to delete{" "}
                <strong>{selectedItem?.username || "this user"}</strong>?
              </p>
              <div className="form-actions">
                <button
                  className="btn btn-secondary"
                  onClick={closeModal}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-danger"
                  onClick={confirmDeleteUser}
                  disabled={loading}
                >
                  Delete
                </button>
              </div>
            </div>
          ) : (
            <form className="user-form" onSubmit={handleSubmitUser}>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="firstName">First Name</label>
                  <input
                    id="firstName"
                    name="firstName"
                    className="form-control"
                    type="text"
                    value={userForm.firstName}
                    onChange={onChange}
                    placeholder={
                      modalType === "createUser" ? "Enter first name" : ""
                    }
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="lastName">Last Name</label>
                  <input
                    id="lastName"
                    name="lastName"
                    className="form-control"
                    type="text"
                    value={userForm.lastName}
                    onChange={onChange}
                    placeholder={
                      modalType === "createUser" ? "Enter last name" : ""
                    }
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="role">Role</label>
                  <select
                    id="role"
                    name="role"
                    className="form-control"
                    value={userForm.role}
                    onChange={onChange}
                  >
                    <option value="doctor">Doctor</option>
                    <option value="receptionist">Receptionist</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="specialization">Specialization</label>
                  <input
                    id="specialization"
                    name="specialization"
                    className="form-control"
                    type="text"
                    value={userForm.specialization}
                    onChange={onChange}
                    placeholder={
                      modalType === "createUser" ? "e.g. Cardiology" : ""
                    }
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="username">Username</label>
                  <input
                    id="username"
                    name="username"
                    className="form-control"
                    type="text"
                    value={userForm.username}
                    onChange={onChange}
                    required
                    placeholder={
                      modalType === "createUser" ? "Enter username" : ""
                    }
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="password">Password</label>
                  <input
                    id="password"
                    name="password"
                    className="form-control"
                    type="password"
                    value={userForm.password}
                    onChange={onChange}
                    placeholder={
                      modalType === "editUser"
                        ? "Leave blank to keep current"
                        : "Enter password"
                    }
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="phone">Phone</label>
                  <input
                    id="phone"
                    name="phone"
                    className="form-control"
                    type="text"
                    value={userForm.phone}
                    onChange={onChange}
                    placeholder={
                      modalType === "createUser" ? "e.g. +961 70 123 456" : ""
                    }
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="fee">Fee</label>
                  <input
                    id="fee"
                    name="fee"
                    className="form-control"
                    type="number"
                    step="0.01"
                    value={userForm.fee}
                    onChange={onChange}
                    placeholder={modalType === "createUser" ? "e.g. 50.00" : ""}
                  />
                </div>
              </div>

              {error && (
                <div className="alert alert-error">
                  <span className="alert-icon">⚠️</span>
                  {error}
                </div>
              )}
              {success && (
                <div className="alert alert-success">
                  <span className="alert-icon">✅</span>
                  {success}
                </div>
              )}

              <div className="form-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={closeModal}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {modalType === "editUser" ? "Save" : "Create"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
