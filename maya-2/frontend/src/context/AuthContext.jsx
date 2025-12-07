import React, { createContext, useState } from "react";
import { authAPI } from "../utils/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    if (token && userData) {
      try {
        return JSON.parse(userData);
      } catch {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    }
    return null;
  });
  const loading = false;

  const login = async (credentials) => {
    try {
      const response = await authAPI.login(credentials);
      const { token, user: userData } = response.data;

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(userData));
      setUser(userData);

      return { success: true, data: response.data };
    } catch (error) {
      console.error("Login error:", error);
      return {
        success: false,
        error: error.response?.data?.message || "Login failed",
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await authAPI.registerPatient(userData);
      const username = userData?.username || "";
      const password = userData?.password || "";
      if (username && password) {
        const loginResp = await authAPI.login({ username, password });
        const { token, user: loggedInUser } = loginResp.data;
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(loggedInUser));
        setUser(loggedInUser);
        return { success: true, data: loginResp.data };
      }
      return { success: true, data: response.data };
    } catch (error) {
      console.error("Registration error:", error);
      return {
        success: false,
        error: error.response?.data?.message || "Registration failed",
      };
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  const isAuthenticated = () => {
    return !!user && !!localStorage.getItem("token");
  };

  // Helper function to check user role
  const hasRole = (role) => {
    return user?.role === role;
  };

  // Helper function to get user's role
  const getUserRole = () => {
    return user?.role || null;
  };

  const getDefaultRouteForRole = (role) => {
    switch (role) {
      case "admin":
        return "/admin";
      case "doctor":
        return "/doctor";
      case "receptionist":
        return "/receptionist";
      case "patient":
        return "/dashboard";
      default:
        return "/";
    }
  };

  const isRoleAllowed = (roles = []) => {
    if (!Array.isArray(roles) || roles.length === 0) return true;
    return roles.includes(user?.role);
  };

  const value = {
    user,
    login,
    register,
    logout,
    isAuthenticated,
    loading,
    hasRole,
    getUserRole,
    getDefaultRouteForRole,
    isRoleAllowed,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
