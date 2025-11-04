import React from "react";
import "./AdminSideBar.css";
import AdminDashboardButton from "../AdminDashboardButton/AdminDashboardButton";
import AdminUsersButton from "../AdminUsersButton/AdminUsersButton";
import AdminDoctorsButton from "../AdminDoctorsButton/AdminDoctorsButton";
import AdminPatientsButton from "../AdminPatientsButton/AdminPatientsButton";
import AdminAppointmentsButton from "../AdminAppointmentsButton/AdminAppointmentsButton";
import AdminSettingsButton from "../AdminSettingsButton/AdminSettingsButton";

const AdminSidebar = ({ activeSection, setActiveSection }) => {
  return (
    <nav className="admin-sidebar">
      <div className="sidebar-content">
        <div className="admin-nav-section">
          <AdminDashboardButton activeSection={activeSection} setActiveSection={setActiveSection} />
          <AdminUsersButton activeSection={activeSection} setActiveSection={setActiveSection} />
          <AdminDoctorsButton activeSection={activeSection} setActiveSection={setActiveSection} />
          <AdminPatientsButton activeSection={activeSection} setActiveSection={setActiveSection} />
          <AdminAppointmentsButton activeSection={activeSection} setActiveSection={setActiveSection} />
          <AdminSettingsButton activeSection={activeSection} setActiveSection={setActiveSection} />
        </div>
      </div>
    </nav>
  );
};

export default AdminSidebar;