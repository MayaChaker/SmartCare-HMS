import React from "react";
import { useNavigate } from "react-router-dom";
import { RiAdminLine } from "react-icons/ri";
import { IoIosLogOut } from "react-icons/io";
import "./AdminHeader.css";

const AdminHeader = ({ user, logout }) => {
  const navigate = useNavigate();
  return (
    <div className="admin-header">
      <div className="admin-header-content">
        <div className="admin-header-left">
          <div
            className="admin-title-group"
            onClick={() => navigate("/")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") navigate("/");
            }}
            title="Go to Home"
          >
            <RiAdminLine className="admin-icon" />
            <div className="admin-title-text">
              <h1 className="admin-title">SmartCare Admin</h1>
              <span className="user-name admin-user-name">
                Welcome, {user?.username}
              </span>
            </div>
          </div>
        </div>
        <div className="admin-header-right">
          <div className="admin-user-info">
            <span className="user-role">Administrator</span>
          </div>
          <button onClick={logout} className="btn btn-outline">
            <span className="btn-icon">
              <IoIosLogOut />
            </span>
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminHeader;
