import React from "react";
import { Navigate } from "react-router-dom";
import "./ProtectedRoute.css";
import { useAuth } from "../../context/useAuth";

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const {
    isAuthenticated,
    loading,
    isRoleAllowed,
    user,
    getDefaultRouteForRole,
  } = useAuth();

  if (loading) {
    return null;
  }

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !isRoleAllowed(allowedRoles)) {
    const dest = getDefaultRouteForRole(user?.role);
    return <Navigate to={dest} replace />;
  }

  return children;
};

export default ProtectedRoute;
