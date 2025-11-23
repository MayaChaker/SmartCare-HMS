import React from "react";
import "./DashboardAppointment.css";
import ReshcduleButton from "../ui/ReshcduleButton/ReshcduleButton";
import CancelButton from "../ui/CancelButton/CancelButton";
import DeleteButton from "../ui/DeleteButton/DeleteButton";
import { patientAPI } from "../../utils/api";
import { parseWorkingHours, generateTimeSlots } from "../../utils/schedule";

const DashboardAppointment = ({
  variant = "content",
  active = false,
  onClick = () => {},
  appointments = [],
  loading = false,
  error = "",
  success = "",
  openModal,
  doctors = [],
  setProfile = () => {},
  setAppointments = () => {},
  setMedicalRecords = () => {},
  setAvailableSlots = () => {},
  setDoctors = () => {},
  setError = () => {},
  setLoading = () => {},
  onExposeLoadPatientData,
  showModal,
  modalType,
  selectedAppointment,
  availableSlots = [],
  setAvailableTimesForReschedule = () => {},
}) => {
  const spinnerRef = React.useRef(null);
  const resolveDoctorImage = (doctorObj, fallbackName) => {
    const idSeed =
      doctorObj?.id != null ? String(doctorObj.id) : fallbackName || "Doctor";
    const candidate = (
      doctorObj?.profileImage ||
      doctorObj?.photoUrl ||
      ""
    ).trim();
    if (candidate && candidate.startsWith("/uploads/")) {
      return `http://localhost:5000${candidate}`;
    }
    if (candidate) return candidate;
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
      idSeed
    )}&background=%23ffffff&radius=50`;
  };

  React.useEffect(() => {
    const run = async () => {
      await loadPatientData();
    };
    if (typeof onExposeLoadPatientData === "function") {
      onExposeLoadPatientData(loadPatientData);
    }
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadPatientData = async () => {
    setLoading(true);
    try {
      const profileResponse = await patientAPI.getProfile();
      if (profileResponse.success) {
        setProfile(profileResponse.data);
      }

      const appointmentsResponse = await patientAPI.getAppointments();
      if (appointmentsResponse.success) {
        setAppointments(appointmentsResponse.data);
      }

      const recordsResponse = await patientAPI.getMedicalRecords();
      if (recordsResponse.success) {
        setMedicalRecords(recordsResponse.data);
      }

      const slotsResponse = await patientAPI.getAvailableSlots();
      if (slotsResponse.success) {
        setAvailableSlots(
          Array.isArray(slotsResponse.data) ? slotsResponse.data : []
        );
      }

      const doctorsResponse = await patientAPI.getAllDoctors();
      if (doctorsResponse.success) {
        setDoctors(
          Array.isArray(doctorsResponse.data) ? doctorsResponse.data : []
        );
      }
    } catch (e) {
      console.error("Error loading patient data:", e);
      setError("Failed to load data. Please refresh the page.");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    let raf;
    let angle = 0;
    const node = spinnerRef.current;
    const step = () => {
      angle = (angle + 6) % 360;
      if (node) node.style.transform = `rotate(${angle}deg)`;
      raf = requestAnimationFrame(step);
    };
    if (loading) {
      raf = requestAnimationFrame(step);
    } else {
      if (node) node.style.transform = "";
    }
    return () => {
      if (raf) cancelAnimationFrame(raf);
    };
  }, [loading]);

  React.useEffect(() => {
    const computeRescheduleTimes = async () => {
      try {
        setAvailableTimesForReschedule([]);
        if (!(showModal && modalType === "reschedule" && selectedAppointment)) {
          return;
        }
        const doctorId = String(selectedAppointment.doctorId);
        const date = selectedAppointment.appointmentDate;
        if (doctors.length === 0) {
          const result = await patientAPI.getDoctors();
          if (result.success) {
            setDoctors(Array.isArray(result.data) ? result.data : []);
          }
        }
        const doc = (doctors.length ? doctors : availableSlots).find(
          (d) => d.id === parseInt(doctorId)
        );
        const { start, end } = parseWorkingHours(doc?.workingHours || "");
        const windowTimes = generateTimeSlots(start, end);
        let bookedTimes = [];
        if (doctorId && date) {
          try {
            const token = localStorage.getItem("token") || "";
            const resp = await fetch(
              `/api/patient/doctors/${doctorId}/booked-times?date=${encodeURIComponent(
                date
              )}`,
              {
                headers: {
                  "Content-Type": "application/json",
                  Authorization: token ? `Bearer ${token}` : "",
                },
                credentials: "include",
              }
            );
            if (resp.ok) {
              const data = await resp.json();
              bookedTimes = Array.isArray(data.bookedTimes)
                ? data.bookedTimes
                : [];
            }
          } catch (e) {
            console.warn(e);
            bookedTimes = [];
          }
        }
        const available = windowTimes.filter((t) => !bookedTimes.includes(t));
        setAvailableTimesForReschedule(available);
      } catch (e) {
        console.warn("Failed to compute reschedule times", e);
        setAvailableTimesForReschedule([]);
      }
    };
    computeRescheduleTimes();
  }, [
    showModal,
    modalType,
    selectedAppointment,
    doctors,
    availableSlots,
    setAvailableTimesForReschedule,
    setDoctors,
  ]);

  if (variant === "tabButton") {
    return (
      <button
        className={`tab-button ${active ? "active" : ""}`}
        onClick={onClick}
      >
        Appointments
      </button>
    );
  }

  if (!active) {
    return null;
  }

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">My Appointments</h3>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {success && <div className="alert alert-success">{success}</div>}

      {loading ? (
        <div className="loading">
          <div className="spinner" ref={spinnerRef}></div>
        </div>
      ) : appointments.filter(
          (a) => String(a.status).toLowerCase() !== "cancelled"
        ).length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📅</div>
          <div className="empty-state-text">No appointments scheduled</div>
          <div className="empty-state-subtext">
            Book your first appointment to get started
          </div>
        </div>
      ) : (
        <div className="appointments-list">
          {appointments
            .filter((a) => String(a.status).toLowerCase() !== "cancelled")
            .map((appointment) => (
              <div key={appointment.id} className="appointment-item">
                <div className="appointment-header">
                  <div
                    className="appointment-doctor"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    {(() => {
                      const doctorObj = doctors.find(
                        (d) => d.id === parseInt(appointment.doctorId)
                      );
                      const displayName =
                        appointment.doctorName ||
                        appointment.doctor ||
                        "Doctor";
                      const imgSrc = resolveDoctorImage(doctorObj, displayName);
                      return (
                        <>
                          <img
                            src={imgSrc}
                            alt={displayName}
                            style={{
                              width: "28px",
                              height: "28px",
                              borderRadius: "50%",
                              objectFit: "cover",
                              border: "1px solid #e5e5ea",
                              background: "#fff",
                            }}
                          />
                          <span>{displayName}</span>
                        </>
                      );
                    })()}
                  </div>
                  <span
                    className={`appointment-status status-${appointment.status
                      .toLowerCase()
                      .replace(" ", "-")}`}
                  >
                    {appointment.status}
                  </span>
                </div>
                <div className="appointment-details">
                  <div>
                    <strong>Specialty:</strong> {appointment.specialty}
                  </div>
                  <div>
                    <strong>Date & Time:</strong>{" "}
                    {appointment.appointmentDate
                      ? new Date(
                          appointment.appointmentDate
                        ).toLocaleDateString()
                      : "TBD"}{" "}
                    {appointment.appointmentTime
                      ? `at ${String(appointment.appointmentTime).slice(0, 5)}`
                      : ""}
                  </div>
                  <div>
                    <strong>Type:</strong> {appointment.type}
                  </div>
                  <div>
                    <strong>Location:</strong>{" "}
                    {appointment.location || "SmartCare Hospital"}
                  </div>
                  {appointment.notes && (
                    <div>
                      <strong>Notes:</strong> {appointment.notes}
                    </div>
                  )}
                </div>
                {String(appointment.status).toLowerCase() === "scheduled" && (
                  <div
                    className="appointment-actions"
                    style={{ marginTop: "15px", display: "flex", gap: "10px" }}
                  >
                    <ReshcduleButton
                      openModal={openModal}
                      appointment={appointment}
                    />
                    <CancelButton
                      openModal={openModal}
                      appointment={appointment}
                      disabled={loading}
                    />
                  </div>
                )}
                {String(appointment.status).toLowerCase() === "completed" && (
                  <div
                    className="appointment-actions"
                    style={{ marginTop: "15px", display: "flex", gap: "10px" }}
                  >
                    <DeleteButton
                      openModal={openModal}
                      appointment={appointment}
                    />
                  </div>
                )}
              </div>
            ))}
        </div>
      )}
    </div>
  );
};

export default DashboardAppointment;

export const ReshcduleModal = ({
  selectedAppointment,
  availableTimesForReschedule,
  closeModal,
  onReschedule,
}) => {
  if (!selectedAppointment) return null;
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        onReschedule(selectedAppointment.id, String(formData.get("newSlotId")));
      }}
    >
      <p>
        Current appointment:{" "}
        {selectedAppointment.doctor || selectedAppointment.doctorName} on{" "}
        {selectedAppointment.appointmentDate
          ? new Date(selectedAppointment.appointmentDate).toLocaleDateString()
          : "TBD"}{" "}
        at{" "}
        {selectedAppointment.appointmentTime
          ? String(selectedAppointment.appointmentTime).slice(0, 5)
          : ""}
      </p>
      <div className="form-group">
        <label>New Appointment Time</label>
        <select name="newSlotId" className="form-control" required>
          <option value="">Select a new time</option>
          {availableTimesForReschedule &&
          availableTimesForReschedule.length > 0 ? (
            availableTimesForReschedule.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))
          ) : (
            <option value="" disabled>
              No available times
            </option>
          )}
        </select>
      </div>
      <div className="modal-actions">
        <button type="button" className="btn btn-outline" onClick={closeModal}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary">
          Reschedule
        </button>
      </div>
    </form>
  );
};

export const DeleteModal = ({ selectedAppointment, closeModal, onDelete }) => {
  if (!selectedAppointment) return null;
  return (
    <div>
      <p>
        Delete this completed appointment with{" "}
        {selectedAppointment.doctor || selectedAppointment.doctorName} on{" "}
        {selectedAppointment.appointmentDate
          ? new Date(selectedAppointment.appointmentDate).toLocaleDateString()
          : "TBD"}{" "}
        {selectedAppointment.appointmentTime
          ? `at ${String(selectedAppointment.appointmentTime).slice(0, 5)}`
          : ""}
        ?
      </p>
      <div className="modal-actions">
        <button className="btn btn-outline" onClick={closeModal}>
          Keep Appointment
        </button>
        <button
          className="btn btn-danger"
          onClick={() => onDelete(selectedAppointment.id)}
        >
          Delete Appointment
        </button>
      </div>
    </div>
  );
};
