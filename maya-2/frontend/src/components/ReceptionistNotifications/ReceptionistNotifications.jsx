import React from "react";
import { MdNotifications } from "react-icons/md";
import "./ReceptionistNotifications.css";

const ReceptionistNotifications = ({
  patients = [],
  appointments = [],
  selectedDate,
  onChangeDate,
}) => {
  const toYmd = (d) => {
    if (!d) return "";
    const dt = new Date(d);
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, "0");
    const dd = String(dt.getDate()).padStart(2, "0");
    return `${y}-${m}-${dd}`;
  };

  const notifications = [];
  const date = selectedDate;

  (patients || []).forEach((p) => {
    if (toYmd(p.createdAt) === date) {
      notifications.push({
        id: `patient-${p.id}-${p.createdAt}`,
        type: "Patient",
        text: `${p.firstName} ${p.lastName} registered`,
        time: p.createdAt,
      });
    }
  });

  (appointments || []).forEach((a) => {
    if (toYmd(a.createdAt) === date) {
      const patientName =
        a.Patient && a.Patient.firstName
          ? `${a.Patient.firstName} ${a.Patient.lastName || ""}`
          : "";
      const doctorName =
        a.Doctor && a.Doctor.firstName
          ? `Dr. ${a.Doctor.firstName} ${a.Doctor.lastName || ""}`
          : "";
      notifications.push({
        id: `appointment-${a.id}-${a.createdAt}`,
        type: "Appointment",
        text: `Appointment added for ${patientName} with ${doctorName}`,
        time: a.createdAt,
      });
    }
  });

  const sorted = notifications.sort(
    (a, b) => new Date(a.time) - new Date(b.time)
  );

  return (
    <div className="receptionist-notifications table-card">
      <div className="table-header">
        <h1 className="table-title">Notifications</h1>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => onChangeDate(e.target.value)}
            className="filter-select"
          />
        </div>
      </div>
      <div className="table-container notifications-table">
        <table className="notifications-table">
          <colgroup>
            <col style={{ width: "160px" }} />
            <col />
            <col style={{ width: "140px" }} />
          </colgroup>
          <thead>
            <tr>
              <th>Type</th>
              <th>Event</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            {sorted.length > 0 ? (
              sorted.map((n) => (
                <tr key={n.id}>
                  <td>{n.type}</td>
                  <td>{n.text}</td>
                  <td>
                    {new Date(n.time).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="3" className="no-data">
                  <div className="no-data-content">
                    <span className="no-data-icon">
                      <MdNotifications />
                    </span>
                    <p>No notifications for selected day</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ReceptionistNotifications;
