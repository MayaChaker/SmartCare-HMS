import React from "react";
import "./ScheduleButton.css";

const ScheduleButton = ({ onClick, disabled = false, style }) => {
  return (
    <button
      type="button"
      className="schedule-btn"
      onClick={onClick}
      disabled={disabled}
      style={style}
    >
      Schedule
    </button>
  );
};

export default ScheduleButton;

