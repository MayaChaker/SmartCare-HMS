import React from "react";
import { IoIosLogOut } from "react-icons/io";
import { useAuth } from "../../../context/useAuth";
import { useNavigate } from "react-router-dom";
import "./logoutButton.css";

const LogoutButton = ({ children = "Logout" }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  return (
    <button
      type="button"
      className="logout-button"
      onClick={() => {
        logout();
        navigate("/");
      }}
    >
      <IoIosLogOut className="logout-icon" size={24} />
      {children}
    </button>
  );
};

export default LogoutButton;
