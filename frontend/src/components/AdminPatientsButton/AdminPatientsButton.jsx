import React, { useState, useEffect } from "react";
import { FaUserInjured } from "react-icons/fa6";
import { FaSearch } from "react-icons/fa";
import "./AdminPatientsButton.css";
import { useAdmin } from "../../context/AdminContext";
import { AdminNavItem } from "../../pages/Admin/AdminPanel";

const AdminPatientsButton = ({ renderContent = false }) => {
  const { activeSection, setActiveSection } = useAdmin();
  const isActive = activeSection === "patients";

  // Local state: patients list + search text
  const [patients, setPatients] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch patients only when:
  useEffect(() => {
    if (renderContent && isActive) {
      fetchPatients();
    }
  }, [renderContent, isActive]);

  // Fetch patients from backend API
  const fetchPatients = async () => {
    try {
      const token = localStorage.getItem("token");

      const patientsResponse = await fetch("/api/admin/patients", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // If request is successful, store patients
      if (patientsResponse.ok) {
        const patientsData = await patientsResponse.json();
        setPatients(patientsData);
      }
      // Unauthorized case
      else if (patientsResponse.status === 401) {
        console.error("Unauthorized access");
      }
    } catch (error) {
      console.error("Error fetching patients:", error);
    }
  };

  // Filter patients based on search input
  const filteredPatients = patients.filter((p) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;

    const fullName = `${p.firstName || ""} ${p.lastName || ""}`
      .toLowerCase()
      .trim();

    const phone = (p.phone || "").toLowerCase();

    return fullName.includes(q) || phone.includes(q);
  });

  //  Main Content
  // Render patients table only when section is active
  if (renderContent && isActive) {
    return (
      <div className="admin-patients admin-patients-content">
        {/* Header */}
        <div className="admin-patients-header">
          <div className="admin-patients-header-left">
            <h2>Patients</h2>
            <span className="patients-count">
              {patients.length} patients
            </span>
          </div>

          {/* Search box */}
          <div className="admin-patients-header-right">
            <div className="search-container">
              <FaSearch className="search-icon" />
              <input
                type="text"
                className="search-input"
                placeholder="Search by name or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Patients table */}
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
              {filteredPatients.map((patient) => (
                <tr key={patient.id}>
                  <td>
                    {patient.firstName} {patient.lastName}
                  </td>
                  <td>{patient.phone}</td>
                  <td>{patient.dateOfBirth}</td>
                  <td>
                    {patient.createdAt
                      ? new Date(patient.createdAt).toLocaleDateString()
                      : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // Sidebar Button
  return (
    <AdminNavItem
      active={isActive}
      onClick={() => setActiveSection("patients")}
      icon={<FaUserInjured />}
      label="Patients"
    />
  );
};

export default AdminPatientsButton;
