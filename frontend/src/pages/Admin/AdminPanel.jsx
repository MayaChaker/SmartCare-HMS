import React from "react";
import { useNavigate } from "react-router-dom";
import { RiAdminLine } from "react-icons/ri";
//
import "./AdminPanel.css";
import { useAuth } from "../../context/useAuth";
import LogoutButton from "../../components/ui/LogoutButton/LogoutButton";
import AdminUsersButton from "../../components/AdminUsersButton/AdminUsersButton";
import AdminDashboardButton from "../../components/AdminDashboardButton/AdminDashboardButton";
import AdminDoctorsButton from "../../components/AdminDoctorsButton/AdminDoctorsButton";
import AdminPatientsButton from "../../components/AdminPatientsButton/AdminPatientsButton";
import AdminAppointmentsButton from "../../components/AdminAppointmentsButton/AdminAppointmentsButton";
import AdminReports from "../../components/AdminReports/AdminReports";
import Spinner from "../../components/ui/Spinner/Spinner";

import {
  AdminProvider,
  useAdmin,
  AdminModal,
} from "../../context/AdminContext";

// Inline AdminNavItem here for reuse across admin components
export const AdminNavItem = ({ active, onClick, icon, label }) => {
  return (
    <button
      className={`admin-nav-item ${active ? "active" : ""}`}
      onClick={onClick}
    >
      <span className="admin-nav-icon">{icon}</span>
      <span className="admin-nav-label">{label}</span>
    </button>
  );
};

// ---------- Header ----------
const AdminHeader = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="admin-header">
      <div className="admin-header-content">
        <div className="admin-header-left">
          <div
            className="admin-title-group"
            onClick={() => navigate("/")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") navigate("/");
            }}
            title="Go to Home"
          >
            <RiAdminLine className="admin-icon" />
            <div className="admin-title-text">
              <h1 className="admin-title">SmartCare Admin</h1>
              <span className="user-name admin-user-name">
                Welcome, {user?.username}
              </span>
            </div>
          </div>
        </div>
        <div className="admin-header-right">
          <LogoutButton>Logout</LogoutButton>
        </div>
      </div>
    </div>
  );
};

// ---------- Sidebar ----------
const AdminSidebar = () => {
  return (
    <nav className="admin-sidebar">
      <div className="sidebar-content">
        <div className="admin-nav-section">
          <AdminDashboardButton />
          <AdminUsersButton />
          <AdminDoctorsButton />
          <AdminPatientsButton />
          <AdminAppointmentsButton />
        </div>
      </div>
    </nav>
  );
};

// ---------- Users section wrapper ----------
const UsersSection = () => {
  const {
    activeSection,
    setActiveSection,
    users,
    openModal,
    handleDeleteUser,
  } = useAdmin();

  if (activeSection !== "users") return null;

  return (
    <AdminUsersButton
      activeSection={activeSection}
      setActiveSection={setActiveSection}
      renderContent={true}
      users={users}
      openModal={openModal}
      handleDeleteUser={handleDeleteUser}
    />
  );
};

// ---------- Main layout ----------
const AdminMain = () => {
  const { activeSection, loading, error, success } = useAdmin();

  return (
    <div className="admin-layout">
      <AdminSidebar />

      <main className="admin-main">
        {loading && (
          <div className="loading-overlay">
            <Spinner size={48} />
            <div className="loading-overlay-text">Loading...</div>
          </div>
        )}

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

        {activeSection === "dashboard" && (
          <AdminDashboardButton renderContent={true} />
        )}

        <UsersSection />

        {activeSection === "doctors" && (
          <AdminDoctorsButton renderContent={true} />
        )}

        {activeSection === "patients" && (
          <AdminPatientsButton renderContent={true} />
        )}

        {activeSection === "appointments" && (
          <AdminAppointmentsButton renderContent={true} />
        )}
        <AdminReports />
      </main>

      <AdminModal />
    </div>
  );
};

const AdminPanel = () => {
  return (
    <AdminProvider>
      <div className="admin-panel">
        <AdminHeader />
        <AdminMain />
      </div>
    </AdminProvider>
  );
};

export default AdminPanel;
