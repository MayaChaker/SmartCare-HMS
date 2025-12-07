import React from "react";
import { FaUserDoctor } from "react-icons/fa6";
import "./DashboardAppointment.css";
import CancelButton from "../ui/CancelButton/CancelButton";
import DeleteButton from "../ui/DeleteButton/DeleteButton";
import ReshcduleButton from "../ui/ReshcduleButton/ReshcduleButton";
import { CancelModal } from "../ui/CancelButton/CancelButton";
import { DeleteModal } from "../ui/DeleteButton/DeleteButton";
import { ReshcduleModal } from "../ui/ReshcduleButton/ReshcduleButton";
import { patientAPI } from "../../utils/api";
import { parseWorkingHours, generateTimeSlots } from "../../utils/schedule";
import { BookAppointmentModal } from "../DashboardDoctor/DashboardDoctor";
import {
  cancelAppointment,
  deleteAppointment,
  rescheduleAppointment,
  bookAppointment,
} from "../../actions/appointments";

const DashboardAppointment = ({
  variant = "content",
  active = false,
  onClick = () => {},
  appointments = [],
  loading = false,
  error = "",
  success = "",
  openModal,
  closeModal,
  doctors = [],
  setProfile = () => {},
  setAppointments = () => {},
  setMedicalRecords = () => {},
  setAvailableSlots = () => {},
  setDoctors = () => {},
  setError = () => {},
  setSuccess = () => {},
  setLoading = () => {},
  onExposeLoadPatientData,
  showModal,
  modalType,
  selectedAppointment,
  availableSlots = [],
  availableTimesForReschedule = [],
  setAvailableTimesForReschedule = () => {},
  availableDatesForReschedule = [],
  setAvailableDatesForReschedule = () => {},
  selectedDateForReschedule,
  setSelectedDateForReschedule,
  selectedDoctorId,
  setSelectedDoctorId,
  availableDates = [],
  selectedDateForBooking,
  setSelectedDateForBooking,
  availableTimes = [],
  setAvailableTimes,
  selectedTimeForBooking,
  setSelectedTimeForBooking,
}) => {
  const [brokenDoctorImageIds, setBrokenDoctorImageIds] = React.useState(
    new Set()
  );
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

  const didInitRef = React.useRef(false);

  const loadPatientData = React.useCallback(async () => {
    setLoading(true);
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
      if (slotsResponse.success)
        setAvailableSlots(
          Array.isArray(slotsResponse.data) ? slotsResponse.data : []
        );
      if (doctorsResponse.success)
        setDoctors(
          Array.isArray(doctorsResponse.data) ? doctorsResponse.data : []
        );
    } catch (e) {
      console.error("Error loading patient data:", e);
      setError("Failed to load data. Please refresh the page.");
    } finally {
      setLoading(false);
    }
  }, [
    setProfile,
    setAppointments,
    setMedicalRecords,
    setAvailableSlots,
    setDoctors,
    setError,
    setLoading,
  ]);

  React.useEffect(() => {
    if (didInitRef.current) return;
    didInitRef.current = true;
    if (typeof onExposeLoadPatientData === "function") {
      onExposeLoadPatientData(loadPatientData);
    }
    loadPatientData();
  }, [loadPatientData, onExposeLoadPatientData]);

  React.useEffect(() => {
    const computeRescheduleTimes = async () => {
      try {
        setAvailableTimesForReschedule([]);
        if (!(showModal && modalType === "reschedule" && selectedAppointment)) {
          return;
        }
        const doctorId = String(selectedAppointment.doctorId);
        const date =
          selectedDateForReschedule || selectedAppointment.appointmentDate;
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
        const days = parseWorkingHours(doc?.workingHours || "").days || [];
        const dayNames = days.length ? days.map((d) => d.toLowerCase()) : [];
        const mapIdx = [
          "sunday",
          "monday",
          "tuesday",
          "wednesday",
          "thursday",
          "friday",
          "saturday",
        ];
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
        if (windowTimes.length > 0) {
          setAvailableTimesForReschedule(windowTimes);
        }
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
    selectedDateForReschedule,
    setAvailableDatesForReschedule,
  ]);

  const handleCancelAppointment = async (appointmentId) => {
    await cancelAppointment(appointmentId, {
      setLoading,
      setError,
      setSuccess,
      loadPatientData,
      closeModal,
    });
  };

  const handleDeleteAppointment = async (appointmentId) => {
    await deleteAppointment(appointmentId, {
      setLoading,
      setError,
      setSuccess,
      loadPatientData,
      closeModal,
    });
  };

  const handleRescheduleAppointment = async (appointmentId, newSlotData) => {
    await rescheduleAppointment(appointmentId, newSlotData, {
      setLoading,
      setError,
      setSuccess,
      loadPatientData,
      closeModal,
    });
  };

  const handleBookAppointment = async (appointmentData) => {
    await bookAppointment(appointmentData, {
      availableSlots,
      appointments,
      setLoading,
      setError,
      setSuccess,
      loadPatientData,
      closeModal,
    });
  };

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
    <div className="card appointments-card">
      <div className="card-header">
        <h3 className="card-title">My Appointments</h3>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {success && <div className="alert alert-success">{success}</div>}

      {showModal &&
        (modalType === "cancel" ||
          modalType === "reschedule" ||
          modalType === "delete" ||
          modalType === "book") && (
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
                    closeModal={closeModal}
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
                    closeModal={closeModal}
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
                {modalType === "book" && (
                  <BookAppointmentModal
                    selectedDoctorId={selectedDoctorId}
                    setSelectedDoctorId={setSelectedDoctorId}
                    availableSlots={availableSlots}
                    doctors={doctors}
                    availableDates={availableDates}
                    selectedDateForBooking={selectedDateForBooking}
                    setSelectedDateForBooking={setSelectedDateForBooking}
                    selectedTimeForBooking={selectedTimeForBooking}
                    setSelectedTimeForBooking={setSelectedTimeForBooking}
                    availableTimes={availableTimes}
                    setAvailableTimes={setAvailableTimes}
                    handleBookAppointment={handleBookAppointment}
                    closeModal={closeModal}
                  />
                )}
              </div>
            </div>
          </div>
        )}

      {loading ? null : appointments.filter(
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
                      const broken = brokenDoctorImageIds.has(
                        parseInt(appointment.doctorId)
                      );
                      return (
                        <>
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
                                  next.add(parseInt(appointment.doctorId));
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
                        </>
                      );
                    })()}
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
                {(() => {
                  const status = String(appointment.status).toLowerCase();
                  if (status === "completed") {
                    return (
                      <div
                        className="appointment-actions"
                        style={{
                          marginTop: "15px",
                          display: "flex",
                          gap: "10px",
                        }}
                      >
                        <DeleteButton
                          openModal={openModal}
                          appointment={appointment}
                        />
                      </div>
                    );
                  }
                  if (status === "scheduled") {
                    return (
                      <div
                        className="appointment-actions"
                        style={{
                          marginTop: "15px",
                          display: "flex",
                          gap: "10px",
                        }}
                      >
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
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
            ))}
        </div>
      )}
    </div>
  );
};

export default DashboardAppointment;
