import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import "./Sidebar.css";
import { useAuth } from "../../context/useAuth";
import LogoutButton from "../ui/LogoutButton/LogoutButton";
import NotificationSystem from "../NotificationSystem/NotificationSystem";

const Sidebar = ({ menuItems }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuth();

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const toggleMobileSidebar = () => {
    setIsMobileOpen(!isMobileOpen);
  };

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isMobileOpen &&
        !event.target.closest(".sidebar") &&
        !event.target.closest(".mobile-menu-btn")
      ) {
        setIsMobileOpen(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [isMobileOpen]);

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        className="mobile-menu-btn"
        onClick={toggleMobileSidebar}
        aria-label="Toggle mobile menu"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      {/* Sidebar */}
      <div
        className={`sidebar ${isCollapsed ? "collapsed" : ""} ${
          isMobileOpen ? "mobile-open" : ""
        }`}
      >
        {/* Header */}
        <div className="sidebar-header">
          <div className="sidebar-logo">
            {!isCollapsed && <h2>MayaCare</h2>}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {!isCollapsed && <NotificationSystem />}
            <button
              className="sidebar-toggle"
              onClick={toggleSidebar}
              aria-label="Toggle sidebar"
            >
              <i
                className={`fas ${
                  isCollapsed ? "fa-chevron-right" : "fa-chevron-left"
                }`}
              ></i>
            </button>
          </div>
        </div>

        {/* User Info */}
        <div className="sidebar-user">
          <div className="user-avatar">
            <i className="fas fa-user"></i>
          </div>
          {!isCollapsed && (
            <div className="user-info">
              <h4>{user?.name || "User"}</h4>
              <p>{user?.role || "Role"}</p>
            </div>
          )}
        </div>

        {/* Navigation Menu */}
        <nav className="sidebar-nav">
          <ul>
            {menuItems.map((item, index) => (
              <li key={index}>
                <Link
                  to={item.path}
                  className={location.pathname === item.path ? "active" : ""}
                  title={isCollapsed ? item.label : ""}
                >
                  <i className={item.icon}></i>
                  {!isCollapsed && <span>{item.label}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Logout Button */}
        <div className="sidebar-footer">
          <LogoutButton>
            {!isCollapsed && <span>Logout</span>}
          </LogoutButton>
        </div>
      </div>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setIsMobileOpen(false)}
        ></div>
      )}
    </>
  );
};

export default Sidebar;
