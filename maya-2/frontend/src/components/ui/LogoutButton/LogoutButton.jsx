import React from "react";
import { IoIosLogOut } from "react-icons/io";
import { useAuth } from "../../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import "./logoutButton.css";

const LogoutButtonOutline = ({ children = "Logout" }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  return (
    <button
      type="button"
      className="logout-button logout-button--outline"
      onClick={() => {
        logout();
        navigate("/");
      }}
    >
      <IoIosLogOut className="btn-icon" />
      {children}
    </button>
  );
};

export default LogoutButtonOutline;
