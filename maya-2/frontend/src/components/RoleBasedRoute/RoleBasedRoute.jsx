import React from "react";
import { Navigate } from "react-router-dom";
import "./RoleBasedRoute.css";
import { useAuth } from "../../context/AuthContext";

const RoleBasedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // Redirect based on user role
    switch (user.role) {
      case "admin":
        return <Navigate to="/admin" replace />;
      case "doctor":
        return <Navigate to="/doctor" replace />;
      case "receptionist":
        return <Navigate to="/receptionist" replace />;
      case "patient":
        return <Navigate to="/dashboard" replace />;
      default:
        return <Navigate to="/" replace />;
    }
  }

  return children;
};

export default RoleBasedRoute;