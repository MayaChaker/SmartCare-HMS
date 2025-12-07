import React from "react";
import { Navigate } from "react-router-dom";
import "./ProtectedRoute.css";
import { useAuth } from "../../context/useAuth";

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return null;
  }

  return isAuthenticated() ? children : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
