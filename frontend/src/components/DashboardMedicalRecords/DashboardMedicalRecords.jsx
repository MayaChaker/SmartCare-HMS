import React from "react";
import "./DashboardMedicalRecords.css";
import { usePatientDashboard } from "../../context/PatientContext";

const DashboardMedicalRecords = ({
  variant = "content",
  active = false,
  onClick = () => {},
}) => {
  const { medicalRecords: records } = usePatientDashboard();

  //  Tab Button
  if (variant === "tabButton") {
    return (
      <button
        className={`tab-button ${active ? "active" : ""}`}
        onClick={onClick}
      >
        Medical Records
      </button>
    );
  }

  // Do not render content if tab is not active
  if (!active) return null;

  //  Main Content
  return (
    <div className="medical-records">
      <div className="card">
        {/* Card header */}
        <div className="card-header">
          <h3 className="card-title">Medical Records</h3>
        </div>

        {/* If there are no records, show empty state */}
        {records.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <div className="empty-state-text">No medical records available</div>
            <div className="empty-state-subtext">
              Your medical history will appear here
            </div>
          </div>
        ) : (
          // Records List
          <div className="records-list">
            {/* Loop through medical records */}
            {records.map((record) => (
              <div key={record.id} className="record-item">
                {/* Record header (doctor + date) */}
                <div className="record-header">
                  {/* Doctor name */}
                  <div className="record-doctor">
                    Dr.{" "}
                    {record.Doctor &&
                    record.Doctor.firstName &&
                    record.Doctor.lastName
                      ? `${record.Doctor.firstName} ${record.Doctor.lastName}`
                      : record.doctor || "Doctor"}
                  </div>

                  {/* Doctor specialization */}
                  <div className="record-specialty">
                    {record.Doctor && record.Doctor.specialization
                      ? record.Doctor.specialization
                      : record.specialization || "General"}
                  </div>

                  {/* Record creation date */}
                  <div className="record-date">
                    {new Date(
                      record.createdAt || record.date
                    ).toLocaleDateString()}
                  </div>
                </div>

                {/* Diagnosis section */}
                {record.diagnosis && (
                  <div className="record-section">
                    <strong>Diagnosis:</strong> {record.diagnosis}
                  </div>
                )}

                {/* Clinical notes section */}
                {record.notes && (
                  <div className="record-section">
                    <strong>Clinical Notes:</strong> {record.notes}
                  </div>
                )}

                {/* Medications section */}
                {record.medications && (
                  <div className="record-section">
                    <strong>Medications:</strong> {record.medications}
                  </div>
                )}

                {/* Prescriptions section */}
                {record.prescriptions && (
                  <div className="record-section">
                    <strong>Prescriptions:</strong> {record.prescriptions}
                  </div>
                )}

                {/* Test results section */}
                {record.testResults && (
                  <div className="record-section">
                    <strong>Test Results:</strong> {record.testResults}
                  </div>
                )}

                {/* Treatment section */}
                {record.treatment && (
                  <div className="record-section">
                    <strong>Treatment:</strong> {record.treatment}
                  </div>
                )}

                {/* Follow-up section */}
                {record.followUp && (
                  <div className="record-section">
                    <strong>Follow-up:</strong> {record.followUp}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardMedicalRecords;
