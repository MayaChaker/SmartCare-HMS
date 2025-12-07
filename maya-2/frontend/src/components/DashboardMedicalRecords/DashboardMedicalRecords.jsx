import React from "react";
import "./DashboardMedicalRecords.css";
import { usePatientDashboard } from "../../context/PatientContext";

const DashboardMedicalRecords = ({
  variant = "content",
  active = false,
  onClick = () => {},
}) => {
  const { medicalRecords: records } = usePatientDashboard();

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

  if (!active) return null;

  return (
    <div className="medical-records">
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Medical Records</h3>
        </div>
        {records.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <div className="empty-state-text">No medical records available</div>
            <div className="empty-state-subtext">
              Your medical history will appear here
            </div>
          </div>
        ) : (
          <div className="records-list">
            {records.map((record) => (
              <div key={record.id} className="record-item">
                <div className="record-header">
                  <div className="record-doctor">
                    Dr.{" "}
                    {record.Doctor &&
                    record.Doctor.firstName &&
                    record.Doctor.lastName
                      ? `${record.Doctor.firstName} ${record.Doctor.lastName}`
                      : record.doctor || "Doctor"}
                  </div>
                  <div className="record-specialty">
                    {record.Doctor && record.Doctor.specialization
                      ? record.Doctor.specialization
                      : record.specialization || "General"}
                  </div>
                  <div className="record-date">
                    {new Date(
                      record.createdAt || record.date
                    ).toLocaleDateString()}
                  </div>
                </div>

                {record.diagnosis && (
                  <div className="record-section">
                    <strong>Diagnosis:</strong> {record.diagnosis}
                  </div>
                )}

                {record.notes && (
                  <div className="record-section">
                    <strong>Clinical Notes:</strong> {record.notes}
                  </div>
                )}

                {record.medications && (
                  <div className="record-section">
                    <strong>Medications:</strong> {record.medications}
                  </div>
                )}

                {record.prescriptions && (
                  <div className="record-section">
                    <strong>Prescriptions:</strong> {record.prescriptions}
                  </div>
                )}

                {record.testResults && (
                  <div className="record-section">
                    <strong>Test Results:</strong> {record.testResults}
                  </div>
                )}

                {record.treatment && (
                  <div className="record-section">
                    <strong>Treatment:</strong> {record.treatment}
                  </div>
                )}

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
