import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import "./Navbar.css";
import LogoutButton from "../ui/LogoutButton/LogoutButton";

const Navbar = () => {
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const getDashboardRoute = () => {
    if (!user) return "/dashboard";
    switch (user.role) {
      case "admin":
        return "/admin";
      case "doctor":
        return "/doctor";
      case "receptionist":
        return "/receptionist";
      case "patient":
        return "/dashboard";
      default:
        return "/dashboard";
    }
  };

  return (
    <nav className="navbar">
      <div className="nav-brand">
        <h2 className="brand-logo">SmartCare</h2>
      </div>

      {/* Mobile menu  */}
      <button className="nav-toggle" onClick={() => setMenuOpen(!menuOpen)}>
        ☰
      </button>

      {/* Navigation links */}
      <div className={`nav-links ${menuOpen ? "open" : ""}`}>
        {user ? (
          <>
            {/* Personal welcome message */}
            <span className="welcome-text">Welcome, {user.username}</span>

            {/* Role-based dashboard link */}
            <Link to={getDashboardRoute()} className="nav-link">
              Dashboard
            </Link>

            {/* Logout button */}
            <LogoutButton>Logout</LogoutButton>
          </>
        ) : (
          <>
            <Link to="/login" className="nav-link">
              Sign in
            </Link>
            <Link to="/register" className="nav-cta">
              Create account
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
