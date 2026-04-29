import React from "react";
import "./Spinner.css";

const Spinner = ({ size = 40, label = "Loading" }) => {
  const s = Number(size) || 40;
  return (
    <div
      className="ui-spinner"
      style={{ width: s, height: s }}
      role="status"
      aria-label={label}
    />
  );
};

export default Spinner;

