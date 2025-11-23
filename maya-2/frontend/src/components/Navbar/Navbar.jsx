import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./Navbar.css";
import LogoutButton from "../ui/LogoutButton/LogoutButton";

const Navbar = () => {
  const { user, logout } = useAuth();
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
        <h2 className="brand-logo">SmartCare HMS</h2>
      </div>
      <button className="nav-toggle" onClick={() => setMenuOpen(!menuOpen)}>
        ☰
      </button>
      <div className={`nav-links ${menuOpen ? "open" : ""}`}>
        {user ? (
          <>
            <span className="welcome-text">Welcome, {user.name}</span>
            <Link to={getDashboardRoute()} className="nav-link">
              Dashboard
            </Link>
            <LogoutButton variant="outline">Logout</LogoutButton>
          </>
        ) : (
          <>
            <Link to="/login" className="nav-link">
              Login
            </Link>
            <Link to="/register" className="btn btn-primary">
              Get Started
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
