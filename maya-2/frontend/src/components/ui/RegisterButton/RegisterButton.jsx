import React from "react";
import "./RegisterButton.css";

const RegisterButton = ({ onClick, disabled = false, style, children }) => {
  return (
    <button
      type="button"
      className="register-btn"
      onClick={onClick}
      disabled={disabled}
      style={style}
    >
      <span className="btn-icon">
      
      </span>
      <span className="btn-label">{children || "Register"}</span>
    </button>
  );
};

export default RegisterButton;
