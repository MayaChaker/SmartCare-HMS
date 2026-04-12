import React, { useEffect } from "react";
import {
  FiUser,
  FiPhone,
  FiEye,
  FiFileText,
  FiUsers,
  FiClipboard,
  FiAlertTriangle,
} from "react-icons/fi";
import { FaStethoscope, FaPills } from "react-icons/fa";
import { TbMicroscope } from "react-icons/tb";
import { useDoctor } from "../../context/DoctorContext";
const DoctorPatient = () => {
  const { patients = [], openModal } = useDoctor();
  return (
    <div className="doctor-patient doctor-section">
      {/* Section header*/}
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

      {/*patient cards */}
      <div className="patients-grid">
        {patients.length > 0 ? (
          patients.map((patient) => (
            <div key={patient.id} className="patient-card">
              {/* Card header*/}
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

              {/* Card body */}
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
                  {/* View patient profile*/}
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
            {/* Empty state*/}
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

export const AddMedicalRecordForm = ({
  selectedItem,
  medicalRecordForm,
  setMedicalRecordForm,
  handleAddMedicalRecord,
  loading,
  closeModal,
}) => {
  return (
    <div className="medical-record-form">
      {/* Patient summary header */}
      <div className="form-header">
        <div className="patient-summary">
          <span className="patient-avatar">
            <FiUser />
          </span>
          <div className="patient-info">
            <span className="patient-name">
              {selectedItem
                ? `${selectedItem.firstName} ${selectedItem.lastName}`
                : "Unknown Patient"}
            </span>
            <span className="patient-id">
              {selectedItem ? `ID: ${selectedItem.id}` : "No ID"}
            </span>
          </div>
        </div>
      </div>

      {/* Doctor-facing form */}
      <form onSubmit={handleAddMedicalRecord} className="doctor-form">
        {/* Diagnosis section */}
        <div className="form-section">
          <h5 className="section-title">Diagnosis</h5>
          <div className="form-group">
            <label className="form-label">
              <span className="label-icon">
                <FaStethoscope />
              </span>
              Primary Diagnosis
            </label>
            <textarea
              value={medicalRecordForm.diagnosis}
              onChange={(e) =>
                setMedicalRecordForm({
                  ...medicalRecordForm,
                  diagnosis: e.target.value,
                })
              }
              className="form-control"
              rows="2"
              placeholder="Enter primary diagnosis and condition..."
              required
            />
          </div>
        </div>

        <div className="form-section">
          <h5 className="section-title">Medical Notes</h5>
          <div className="form-group">
            <label className="form-label">
              <span className="label-icon">
                <FiFileText />
              </span>
              Clinical Notes
            </label>
            <textarea
              value={medicalRecordForm.notes}
              onChange={(e) =>
                setMedicalRecordForm({
                  ...medicalRecordForm,
                  notes: e.target.value,
                })
              }
              className="form-control"
              rows="4"
              placeholder="Enter clinical observations, symptoms, examination findings..."
              required
            />
          </div>
        </div>

        <div className="form-section">
          <h5 className="section-title">Medications</h5>
          <div className="form-group">
            <label className="form-label">
              <span className="label-icon">
                <FaPills />
              </span>
              Prescribed Medications
            </label>
            <textarea
              value={medicalRecordForm.medications}
              onChange={(e) =>
                setMedicalRecordForm({
                  ...medicalRecordForm,
                  medications: e.target.value,
                })
              }
              className="form-control"
              rows="3"
              placeholder="List medications with dosages, frequency, and duration..."
            />
          </div>
        </div>

        <div className="form-section">
          <h5 className="section-title">Prescriptions & Instructions</h5>
          <div className="form-group">
            <label className="form-label">
              <span className="label-icon">
                <FiClipboard />
              </span>
              Additional Prescriptions
            </label>
            <textarea
              value={medicalRecordForm.prescriptions}
              onChange={(e) =>
                setMedicalRecordForm({
                  ...medicalRecordForm,
                  prescriptions: e.target.value,
                })
              }
              className="form-control"
              rows="3"
              placeholder="Additional treatments, therapies, or medical devices..."
            />
          </div>
        </div>

        <div className="form-section">
          <h5 className="section-title">Test Results</h5>
          <div className="form-group">
            <label className="form-label">
              <span className="label-icon">
                <TbMicroscope />
              </span>
              Laboratory & Diagnostic Results
            </label>
            <textarea
              value={medicalRecordForm.testResults}
              onChange={(e) =>
                setMedicalRecordForm({
                  ...medicalRecordForm,
                  testResults: e.target.value,
                })
              }
              className="form-control"
              rows="3"
              placeholder="Enter test results, imaging findings, lab values..."
            />
          </div>
        </div>

        <div className="modal-actions">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            <>Save Medical Record</>
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={closeModal}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export const ViewPatientModal = ({
  selectedItem,
  patientRecords,
  closeModal,
  openModal,
}) => {
  return (
    <div className="patient-profile">
      {patientRecords && patientRecords.length > 0 && (
        <div className="medical-records-section-top">
          <h5 className="section-title">Medical Records</h5>
          <div className="medical-records-cards">
            {patientRecords.map((rec) => (
              <div key={rec.id} className="medical-record-card">
                <div className="record-header">
                  <div className="record-doctor-info">
                    <div className="record-doctor">
                      {rec.Doctor
                        ? `${rec.Doctor.firstName} ${rec.Doctor.lastName}`
                        : "Doctor"}
                    </div>
                    <div className="record-specialization">
                      {rec.Doctor?.specialization || "General Practice"}
                    </div>
                  </div>
                  <div className="record-date">
                    {new Date(rec.visitDate).toLocaleDateString()}
                  </div>
                </div>
                <div className="record-content">
                  {rec.diagnosis && (
                    <div className="record-field">
                      <span className="record-label">Diagnosis:</span>
                      <span className="record-value">{rec.diagnosis}</span>
                    </div>
                  )}
                  {rec.notes && (
                    <div className="record-field">
                      <span className="record-label">Notes:</span>
                      <span className="record-value">{rec.notes}</span>
                    </div>
                  )}
                  {rec.medications && (
                    <div className="record-field">
                      <span className="record-label">Medications:</span>
                      <span className="record-value">{rec.medications}</span>
                    </div>
                  )}
                  {rec.prescriptions && (
                    <div className="record-field">
                      <span className="record-label">Prescriptions:</span>
                      <span className="record-value">{rec.prescriptions}</span>
                    </div>
                  )}
                  {rec.testResults && (
                    <div className="record-field">
                      <span className="record-label">Test Results:</span>
                      <span className="record-value">{rec.testResults}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="patient-details-top">
        <div className="detail-item">
          <span className="detail-icon">
            <FiPhone />
          </span>
          <span className="detail-label">Phone</span>
          <span className="detail-value">{selectedItem.phone}</span>
        </div>
        {selectedItem.allergies ? (
          <div className="detail-item">
            <span className="detail-icon">
              <FiAlertTriangle />
            </span>
            <span className="detail-label">Allergies</span>
            <span className="detail-value">
              {Array.isArray(selectedItem.allergies)
                ? selectedItem.allergies.join(", ")
                : selectedItem.allergies}
            </span>
          </div>
        ) : null}
        <div className="detail-item full-width">
          <span className="detail-icon">
            <FiClipboard />
          </span>
          <span className="detail-label">Medical History</span>
          <span className="detail-value">
            {patientRecords && patientRecords.length
              ? "Available"
              : selectedItem.medicalHistory || "No medical history available"}
          </span>
        </div>
      </div>

      <div className="modal-actions">
        <button
          className="btn btn-primary"
          onClick={() => {
            closeModal();
            openModal("addRecord", selectedItem);
          }}
        >
          <FiFileText />
          Add Medical Record
        </button>
        <button className="btn btn-secondary" onClick={closeModal}>
          Close
        </button>
      </div>
    </div>
  );
};

export const handleAddMedicalRecordFactory =
  ({
    getMedicalRecordForm,
    setLoading,
    clearMessages,
    setSuccess,
    loadDoctorData,
    closeModal,
    setError,
  }) =>
  async (e) => {
    // Prevent default
    e.preventDefault();
    setLoading(true);
    clearMessages();

    try {
      // Auth token
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5000/api/doctor/records", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(getMedicalRecordForm()),
      });

      if (response.ok) {
        setSuccess("Medical record added successfully!");
        await loadDoctorData();
        closeModal();
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Failed to add medical record");
      }
    } catch {
      setError("Failed to add medical record. Please try again.");
    } finally {
      setLoading(false);
    }
  };

export const usePatientModalInitEffect = (
  showModal,
  modalType,
  selectedItem,
  setMedicalRecordForm,
  setSelectedItem,
  setPatientRecords,
  setPatients
) => {
  useEffect(() => {
    if (!showModal) return;
    if (modalType === "addRecord" && selectedItem) {
      setMedicalRecordForm({
        patientId: selectedItem.id,
        notes: "",
        prescriptions: "",
        testResults: "",
        diagnosis: "",
        medications: "",
      });
    } else if (modalType === "viewPatient" && selectedItem) {
      // Fetch patient details and medical
      (async () => {
        try {
          const token = localStorage.getItem("token");
          const r = await fetch(
            `http://localhost:5000/api/doctor/patients/${selectedItem.id}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          if (!r.ok) throw new Error();
          const data = await r.json();
          setSelectedItem(data.patient || selectedItem);
          setPatientRecords(
            Array.isArray(data.medicalRecords) ? data.medicalRecords : []
          );
          const hasRecs =
            Array.isArray(data.medicalRecords) &&
            data.medicalRecords.length > 0;
          setPatients((prev) =>
            prev.map((p) =>
              p.id === selectedItem.id
                ? {
                    ...p,
                    hasMedicalRecords: hasRecs || p.hasMedicalRecords,
                    medicalHistory: hasRecs
                      ? p.medicalHistory || "Available"
                      : p.medicalHistory,
                  }
                : p
            )
          );
        } catch {
          setPatientRecords([]);
        }
      })();
    }
  }, [
    showModal,
    modalType,
    selectedItem,
    setMedicalRecordForm,
    setSelectedItem,
    setPatientRecords,
    setPatients,
  ]);
};
