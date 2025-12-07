import React from "react";
import "./ReceptionistPatient.css";
import { useReceptionist } from "../../context/ReceptionistContext";

const ReceptionistPatient = () => {
  const { patients = [], openModal } = useReceptionist();

  return (
    <div className="receptionist-patient table-card">
      <div className="table-header">
        <h1 className="table-title">Patients</h1>
        <button
          className="btn btn-primary"
          onClick={() => openModal("registerPatient")}
        >
          Register New Patient
        </button>
      </div>

      <div className="table-container users-table">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Phone</th>
              <th>Registered At</th>
              <th>Date of Birth</th>
              <th>Blood Type</th>
            </tr>
          </thead>

          <tbody>
            {(patients || []).map((patient) => (
              <tr key={patient.id}>
                <td>
                  {patient.firstName} {patient.lastName}
                </td>
                <td>{patient.phone}</td>
                <td>
                  {patient.createdAt
                    ? new Date(patient.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                      })
                    : ""}
                </td>
                <td>{patient.dateOfBirth}</td>
                <td>{patient.bloodType || ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ReceptionistPatient;
