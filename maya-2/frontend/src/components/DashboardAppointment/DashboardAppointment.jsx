import React from "react";
import { FaUserDoctor } from "react-icons/fa6";
import "./DashboardAppointment.css";

import CancelButton, { CancelModal } from "../ui/CancelButton/CancelButton";
import DeleteButton, { DeleteModal } from "../ui/DeleteButton/DeleteButton";
import ReshcduleButton, {
  ReshcduleModal,
} from "../ui/ReshcduleButton/ReshcduleButton";

import { BookAppointmentModal } from "../DashboardDoctor/DashboardDoctor";
import { patientAPI } from "../../utils/api";
import { parseWorkingHours, generateTimeSlots } from "../../utils/schedule";

import { usePatientDashboard } from "../../context/PatientContext";

const resolveDoctorImage = (doctorObj) => {
  const candidate = (
    doctorObj?.profileImage ||
    doctorObj?.photoUrl ||
    ""
  ).trim();
  if (!candidate) return "";
  if (candidate.startsWith("/uploads/")) {
    return `http://localhost:5000${candidate}`;
  }
  return candidate;
};

const DashboardAppointment = ({
  variant = "content",
  active = false,
  onClick = () => {},
}) => {
  const {
    // UI
    loading,
    setLoading,
    error,
    setError,
    success,
    setSuccess,

    // Data
    setProfile,
    appointments,
    setAppointments,
    setMedicalRecords,
    doctors,
    setDoctors,
    availableSlots,
    setAvailableSlots,

    // Reschedule
    availableTimesForReschedule,
    setAvailableTimesForReschedule,
    availableDatesForReschedule,
    setAvailableDatesForReschedule,
    selectedDateForReschedule,
    setSelectedDateForReschedule,

    // Modal state
    showModal,
    modalType,
    openModal,
    closeModal,
    selectedAppointment,
  } = usePatientDashboard();

  const [brokenDoctorImageIds, setBrokenDoctorImageIds] = React.useState(
    new Set()
  );
  const didInitRef = React.useRef(false);

  // ---- Load all data once ----
  const loadPatientData = React.useCallback(async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const [
        profileResponse,
        appointmentsResponse,
        recordsResponse,
        slotsResponse,
        doctorsResponse,
      ] = await Promise.all([
        patientAPI.getProfile(),
        patientAPI.getAppointments(),
        patientAPI.getMedicalRecords(),
        patientAPI.getAvailableSlots(),
        patientAPI.getAllDoctors(),
      ]);

      if (profileResponse.success) setProfile(profileResponse.data);
      if (appointmentsResponse.success)
        setAppointments(appointmentsResponse.data);
      if (recordsResponse.success) setMedicalRecords(recordsResponse.data);
      if (slotsResponse.success) {
        const slots = Array.isArray(slotsResponse.data)
          ? slotsResponse.data
          : [];
        setAvailableSlots(slots);
      }
      if (doctorsResponse.success) {
        const docs = Array.isArray(doctorsResponse.data)
          ? doctorsResponse.data
          : [];
        setDoctors(docs);
      }
    } catch (e) {
      console.error("Error loading patient data:", e);
      setError("Failed to load data. Please refresh the page.");
    } finally {
      setLoading(false);
    }
  }, [
    setLoading,
    setError,
    setSuccess,
    setProfile,
    setAppointments,
    setMedicalRecords,
    setAvailableSlots,
    setDoctors,
  ]);

  React.useEffect(() => {
    if (didInitRef.current) return;
    didInitRef.current = true;
    loadPatientData();
  }, [loadPatientData]);

  // ---- Compute reschedule times ----
  React.useEffect(() => {
    const computeRescheduleTimes = async () => {
      setAvailableTimesForReschedule([]);

      if (!(showModal && modalType === "reschedule" && selectedAppointment)) {
        return;
      }

      try {
        const doctorId = String(selectedAppointment.doctorId);
        const date =
          selectedDateForReschedule || selectedAppointment.appointmentDate;

        if (!doctors.length) {
          const result = await patientAPI.getDoctors();
          if (result.success) {
            const list = Array.isArray(result.data) ? result.data : [];
            setDoctors(list);
          }
        }

        const sourceList = doctors.length ? doctors : availableSlots;
        const doc = sourceList.find((d) => d.id === parseInt(doctorId, 10));

        const {
          start,
          end,
          days = [],
        } = parseWorkingHours(doc?.workingHours || "");
        const windowTimes = generateTimeSlots(start, end);

        const mapIdx = [
          "sunday",
          "monday",
          "tuesday",
          "wednesday",
          "thursday",
          "friday",
          "saturday",
        ];
        const dayNames = days.map((d) => d.toLowerCase());
        const dates = [];
        const now = new Date();

        for (let i = 0; i < 14; i++) {
          const dt = new Date(now);
          dt.setDate(now.getDate() + i);
          const name = mapIdx[dt.getDay()];
          if (!dayNames.length || dayNames.includes(name)) {
            const y = dt.getFullYear();
            const m = String(dt.getMonth() + 1).padStart(2, "0");
            const d = String(dt.getDate()).padStart(2, "0");
            dates.push(`${y}-${m}-${d}`);
          }
        }
        setAvailableDatesForReschedule(dates);

        let bookedTimes = [];
        if (doctorId && date) {
          try {
            const resp = await patientAPI.getDoctorBookedTimes(doctorId, date);
            bookedTimes = resp.success
              ? Array.isArray(resp.data?.bookedTimes)
                ? resp.data.bookedTimes
                : []
              : [];
          } catch (e) {
            console.warn("Failed to load booked times", e);
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
    selectedDateForReschedule,
    setAvailableTimesForReschedule,
    setAvailableDatesForReschedule,
    setDoctors,
  ]);

  // ---- Handlers ----

  const handleCancelAppointment = async (appointmentId) => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await patientAPI.cancelAppointment(appointmentId);
      if (response.success) {
        setSuccess("Appointment cancelled successfully!");
        await loadPatientData();
        closeModal();
      } else {
        setError(response.message || "Failed to cancel appointment");
      }
    } catch (e) {
      console.error(e);
      setError("Failed to cancel appointment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAppointment = async (appointmentId) => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await patientAPI.deleteAppointment(appointmentId);
      if (response.success) {
        setSuccess("Appointment deleted successfully!");
        await loadPatientData();
        closeModal();
      } else {
        setError(response.message || "Failed to delete appointment");
      }
    } catch (e) {
      console.error(e);
      setError("Failed to delete appointment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRescheduleAppointment = async (appointmentId, newSlotData) => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      let payload = {};

      if (typeof newSlotData === "string") {
        const newTime = String(newSlotData || "").slice(0, 5);
        if (!newTime) {
          setError("Please select a time");
          return;
        }
        payload.appointmentTime = `${newTime}:00`;
      } else if (newSlotData && typeof newSlotData === "object") {
        const tRaw = newSlotData.appointmentTime || newSlotData.time || "";
        const dRaw = newSlotData.appointmentDate || newSlotData.date || "";
        const newTime = String(tRaw || "").slice(0, 5);

        if (newTime) payload.appointmentTime = `${newTime}:00`;
        if (dRaw) payload.appointmentDate = String(dRaw);

        if (!payload.appointmentTime && !payload.appointmentDate) {
          setError("Please select a time");
          return;
        }
      } else {
        setError("Please select a time");
        return;
      }

      const response = await patientAPI.rescheduleAppointment(
        appointmentId,
        payload
      );
      if (response.success) {
        setSuccess("Appointment rescheduled successfully!");
        await loadPatientData();
        closeModal();
      } else {
        setError(response.message || "Failed to reschedule appointment");
      }
    } catch (e) {
      console.error(e);
      setError("Failed to reschedule appointment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ---- Tab button variant ----
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

  if (!active) return null;

  const visibleAppointments = appointments.filter(
    (a) => String(a.status).toLowerCase() !== "cancelled"
  );

  const formatTimeWithMeridiem = (hhmm) => {
    const [hStr, mStr] = String(hhmm || "").split(":");
    const h = parseInt(hStr, 10);
    if (Number.isNaN(h)) return hhmm;
    const meridiem = h < 12 ? "AM" : "PM";
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${h12}:${mStr} ${meridiem}`;
  };

  return (
    <div className="card appointments-card">
      <div className="card-header">
        <h3 className="card-title">My Appointments</h3>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Modals */}
      {showModal &&
        (modalType === "cancel" ||
          modalType === "reschedule" ||
          modalType === "delete") && (
          <div className="modal-overlay" onClick={closeModal}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>
                  {modalType === "cancel" && "Cancel Appointment"}
                  {modalType === "reschedule" && "Reschedule Appointment"}
                  {modalType === "book" && "Book New Appointment"}
                </h3>
                <button className="modal-close" onClick={closeModal}>
                  ×
                </button>
              </div>
              <div className="modal-content">
                {error && <div className="alert alert-error">{error}</div>}
                {success && (
                  <div className="alert alert-success">{success}</div>
                )}

                {modalType === "cancel" && selectedAppointment && (
                  <CancelModal
                    selectedAppointment={selectedAppointment}
                    onCancel={handleCancelAppointment}
                  />
                )}

                {modalType === "reschedule" && selectedAppointment && (
                  <ReshcduleModal
                    selectedAppointment={selectedAppointment}
                    availableTimesForReschedule={availableTimesForReschedule}
                    availableDatesForReschedule={availableDatesForReschedule}
                    selectedDateForReschedule={selectedDateForReschedule}
                    setSelectedDateForReschedule={setSelectedDateForReschedule}
                    onReschedule={handleRescheduleAppointment}
                  />
                )}

                {modalType === "delete" && selectedAppointment && (
                  <DeleteModal
                    selectedAppointment={selectedAppointment}
                    closeModal={closeModal}
                    onDelete={handleDeleteAppointment}
                  />
                )}
              </div>
            </div>
          </div>
        )}

      {loading ? null : visibleAppointments.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📅</div>
          <div className="empty-state-text">No appointments scheduled</div>
          <div className="empty-state-subtext">
            Book your first appointment to get started
          </div>
        </div>
      ) : (
        <div className="appointments-list">
          {visibleAppointments.map((appointment) => {
            const doctorObj = doctors.find(
              (d) => d.id === parseInt(appointment.doctorId, 10)
            );
            const displayName =
              appointment.doctorName || appointment.doctor || "Doctor";
            const imgSrc = resolveDoctorImage(doctorObj);
            const broken = brokenDoctorImageIds.has(
              parseInt(appointment.doctorId, 10)
            );
            const status = String(appointment.status).toLowerCase();

            return (
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
                    {imgSrc && !broken ? (
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
                        onError={() =>
                          setBrokenDoctorImageIds((prev) => {
                            const next = new Set(prev);
                            next.add(parseInt(appointment.doctorId, 10));
                            return next;
                          })
                        }
                      />
                    ) : (
                      <span
                        style={{
                          width: "28px",
                          height: "28px",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          borderRadius: "50%",
                          border: "1px solid #e5e5ea",
                          background: "#fff",
                          color: "#0284c7",
                          fontSize: "20px",
                        }}
                        aria-hidden="true"
                      >
                        <FaUserDoctor />
                      </span>
                    )}
                    <span>{displayName}</span>
                  </div>
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
                      ? `at ${formatTimeWithMeridiem(
                          String(appointment.appointmentTime).slice(0, 5)
                        )}`
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

                <div
                  className="appointment-actions"
                  style={{
                    marginTop: "15px",
                    display: "flex",
                    gap: "10px",
                  }}
                >
                  {status === "completed" && (
                    <DeleteButton
                      openModal={openModal}
                      appointment={appointment}
                    />
                  )}
                  {status === "scheduled" && (
                    <>
                      <CancelButton
                        openModal={openModal}
                        appointment={appointment}
                        disabled={loading}
                      />
                      <ReshcduleButton
                        openModal={openModal}
                        appointment={appointment}
                        disabled={loading}
                      />
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DashboardAppointment;
