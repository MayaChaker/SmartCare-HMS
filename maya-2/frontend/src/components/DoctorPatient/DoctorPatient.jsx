import React from "react";
import { FiUser, FiPhone, FiEye, FiFileText, FiUsers } from "react-icons/fi";

const DoctorPatient = ({ patients = [], openModal = () => {} }) => {
  return (
    <div className="doctor-patient doctor-section">
      <div className="section-header">
        <div className="section-title">
          <h1 className="patients-title">
            My Patients
            <span className="section-count patients-count">
              {patients.length} Total Patients
            </span>
          </h1>
        </div>
      </div>

      <div className="patients-grid">
        {patients.length > 0 ? (
          patients.map((patient) => (
            <div key={patient.id} className="patient-card">
              <div className="patient-header">
                <div className="patient-avatar">
                  <FiUser />
                </div>
                <div className="patient-details">
                  <div className="patient-name">
                    {patient.firstName} {patient.lastName}
                  </div>
                  <div className="patient-id">ID: {patient.id}</div>
                </div>
              </div>

              <div className="patient-row">
                <div className="patient-content">
                  <div className="patient-contact">
                    <div className="contact-item">
                      <span className="contact-icon">
                        <FiPhone />
                      </span>
                      <span className="contact-text">{patient.phone}</span>
                    </div>
                    <div className="contact-secondary">
                      <div className="secondary-item">
                        <span className="secondary-label">DOB:</span>
                        <span className="secondary-value">
                          {patient.dateOfBirth || "N/A"}
                        </span>
                      </div>
                      <div className="secondary-item">
                        <span className="secondary-label">History:</span>
                        <span className="secondary-value">
                          {patient.hasMedicalRecords || patient.medicalHistory
                            ? "Available"
                            : "None"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="card-actions">
                  <button
                    className="action-btn primary"
                    onClick={() => openModal("viewPatient", patient)}
                    title="View Patient Details"
                  >
                    <FiEye />
                    View
                  </button>
                  <button
                    className="action-btn secondary"
                    onClick={() => openModal("addRecord", patient)}
                    title="Add Medical Record"
                  >
                    <FiFileText />
                    <span className="btn-label">Record</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state">
            <span className="empty-icon">
              <FiUsers />
            </span>
            <p>No patients assigned yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorPatient;
