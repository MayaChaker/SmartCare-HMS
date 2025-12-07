import React, { useState, useEffect } from "react";
import { FaUserInjured } from "react-icons/fa6";
import { FaSearch } from "react-icons/fa";
import "./AdminPatientsButton.css";

const AdminPatientsButton = ({
  activeSection,
  setActiveSection,
  renderContent = false,
}) => {
  const [patients, setPatients] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const isActive = activeSection === "patients";

  useEffect(() => {
    if (renderContent && isActive) {
      fetchPatients();
    }
  }, [renderContent, isActive]);

  const fetchPatients = async () => {
    try {
      const token = localStorage.getItem("token");
      const patientsResponse = await fetch("/api/admin/patients", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (patientsResponse.ok) {
        const patientsData = await patientsResponse.json();
        setPatients(patientsData);
      } else if (patientsResponse.status === 401) {
        console.error("Unauthorized access");
      }
    } catch (error) {
      console.error("Error fetching patients:", error);
    }
  };

  const renderPatients = () => (
    <div className="admin-patients admin-patients-content">
      <div className="admin-patients-header">
        <div className="admin-patients-header-left">
          <h2>Patients Overview</h2>
          <span className="patients-count">
            {patients.length} patients in SmartCare
          </span>
        </div>
        <div className="admin-patients-header-right">
          <div className="search-container">
            <FaSearch className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Search patients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="admin-patients-table-container">
        <table className="admin-patients-data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Phone</th>
              <th>Date of Birth</th>
              <th>Registered</th>
            </tr>
          </thead>
          <tbody>
            {patients
              .filter((p) => {
                const q = searchQuery.trim().toLowerCase();
                if (!q) return true;
                return (
                  `${p.firstName || ""} ${p.lastName || ""}`
                    .toLowerCase()
                    .includes(q) || (p.phone || "").toLowerCase().includes(q)
                );
              })
              .map((patient) => (
                <tr key={patient.id}>
                  <td>
                    {patient.firstName} {patient.lastName}
                  </td>
                  <td>{patient.phone}</td>
                  <td>{patient.dateOfBirth}</td>
                  <td>{new Date(patient.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  if (renderContent && isActive) {
    return renderPatients();
  }

  return (
    <button
      className={`admin-nav-item ${isActive ? "active" : ""}`}
      onClick={() => setActiveSection("patients")}
    >
      <span className="admin-nav-icon">
        <FaUserInjured />
      </span>
      <span className="admin-nav-label">Patients</span>
    </button>
  );
};

export default AdminPatientsButton;
