import React from "react";
import { FaUserDoctor } from "react-icons/fa6";
import "./DashboardAppointment.css";
import CancelButton from "../ui/CancelButton/CancelButton";
import RescheduleButton from "../ui/RescheduleButton/RescheduleButton";
import { CancelModal } from "../ui/CancelButton/CancelButton";
import { DeleteModal } from "../ui/DeleteButton/DeleteButton";
import { RescheduleModal } from "../ui/RescheduleButton/RescheduleButton";
import { patientAPI } from "../../utils/api";
import {
  parseWorkingHours,
  generateTimeSlots,
  formatTimeWithMeridiem,
  toHHMM,
  resolveDoctorImage,
} from "../../utils/schedule";
import { usePatientDashboard } from "../../context/PatientContext";

const DashboardAppointment = ({
  variant = "content",
  active = false,
  onClick = () => {},
}) => {
  /* Context state & actions */
  const {
    // Global UI state
    loading,
    setLoading,
    error,
    setError,
    success,
    setSuccess,

    // Patient data
    setProfile,
    appointments,
    setAppointments,
    setMedicalRecords,
    doctors,
    setDoctors,
    availableSlots,
    setAvailableSlots,

    // Reschedule data

    setAvailableTimesForReschedule,

    setAvailableDatesForReschedule,
    selectedDateForReschedule,

    // Modal control
    showModal,
    modalType,
    openModal,
    closeModal,
    selectedAppointment,
  } = usePatientDashboard();

  const [brokenDoctorImageIds, setBrokenDoctorImageIds] = React.useState(
    new Set(),
  );

  const didInitRef = React.useRef(false);

  /* Load all patient data */

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

      // Update context state if successful
      if (profileResponse.success) setProfile(profileResponse.data);
      if (appointmentsResponse.success)
        setAppointments(appointmentsResponse.data);
      if (recordsResponse.success) setMedicalRecords(recordsResponse.data);

      if (slotsResponse.success) {
        setAvailableSlots(
          Array.isArray(slotsResponse.data) ? slotsResponse.data : [],
        );
      }

      if (doctorsResponse.success) {
        setDoctors(
          Array.isArray(doctorsResponse.data) ? doctorsResponse.data : [],
        );
      }
    } catch (e) {
      console.error("Error loading patient data:", e);
      setError("Couldn't load the page. Please refresh and try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  /* Load data once on first render */
  React.useEffect(() => {
    if (didInitRef.current) return;
    didInitRef.current = true;
    loadPatientData();
  }, [loadPatientData]);

  /* Compute reschedule times */

  React.useEffect(() => {
    const computeRescheduleTimes = async () => {
      setAvailableTimesForReschedule([]);

      // Only run if reschedule modal is open
      if (!(showModal && modalType === "reschedule" && selectedAppointment)) {
        return;
      }

      try {
        const doctorId = String(selectedAppointment.doctorId);
        const date =
          selectedDateForReschedule || selectedAppointment.appointmentDate;

        // Fallback: load doctors if not yet loaded
        if (!doctors.length) {
          const result = await patientAPI.getDoctors();
          if (result.success) {
            setDoctors(Array.isArray(result.data) ? result.data : []);
          }
        }

        // Find doctor from doctors or availableSlots
        const sourceList = doctors.length ? doctors : availableSlots;
        const doc = sourceList.find((d) => d.id === parseInt(doctorId, 10));

        // Get doctor working hours
        const {
          start,
          end,
          days = [],
        } = parseWorkingHours(doc?.workingHours || "");

        // Generate all time slots
        const windowTimes = generateTimeSlots(start, end);

        // Generate next 14 valid working dates
        const dayMap = [
          "sunday",
          "monday",
          "tuesday",
          "wednesday",
          "thursday",
          "friday",
          "saturday",
        ];

        const allowedDays = days.map((d) => d.toLowerCase());
        const dates = [];
        const today = new Date();

        for (let i = 0; i < 14; i++) {
          const d = new Date(today);
          d.setDate(today.getDate() + i);

          if (!allowedDays.length || allowedDays.includes(dayMap[d.getDay()])) {
            dates.push(d.toISOString().split("T")[0]);
          }
        }

        setAvailableDatesForReschedule(dates);

        // Remove booked times
        let bookedTimes = [];
        if (doctorId && date) {
          try {
            const resp = await patientAPI.getDoctorBookedTimes(doctorId, date);
            bookedTimes = resp.success ? resp.data?.bookedTimes || [] : [];
          } catch {
            bookedTimes = [];
          }
        }

        setAvailableTimesForReschedule(
          windowTimes.filter((t) => !bookedTimes.includes(t)),
        );
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
    selectedDateForReschedule,
    doctors,
    availableSlots,
  ]);

  /* Action handlers */

  // Cancel appointment
  const handleCancelAppointment = async (id) => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await patientAPI.cancelAppointment(id);
      if (res.success) {
        setSuccess("Visit cancelled.");
        await loadPatientData();
        closeModal();
      } else {
        setError(res.message || "Couldn't cancel the visit");
      }
    } catch {
      setError("Couldn't cancel the visit. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Delete appointment
  const handleDeleteAppointment = async (id) => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await patientAPI.deleteAppointment(id);
      if (res.success) {
        setSuccess("Visit removed.");
        await loadPatientData();
        closeModal();
      } else {
        setError(res.message || "Couldn't remove the visit");
      }
    } catch {
      setError("Couldn't remove the visit. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Reschedule appointment
  const handleRescheduleAppointment = async (id, data) => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const payload = {};
      if (typeof data === "string") {
        payload.appointmentTime = `${data.slice(0, 5)}:00`;
      } else {
        if (data?.appointmentTime)
          payload.appointmentTime = `${data.appointmentTime.slice(0, 5)}:00`;
        if (data?.appointmentDate)
          payload.appointmentDate = data.appointmentDate;
      }

      const res = await patientAPI.rescheduleAppointment(id, payload);
      if (res.success) {
        setSuccess("Appointment updated successfully!");
        await loadPatientData();
        closeModal();
      } else {
        setError(res.message || "Couldn't update the appointment");
      }
    } catch {
      setError("Couldn't update the appointment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /* Tab button */
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

  /* UI rendering */

  const visibleAppointments = appointments.filter(
    (a) => String(a.status).toLowerCase() !== "cancelled",
  );

  return (
    <div className="card appointments-card">
      <h3 className="card-title">My Appointments</h3>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Appointments list */}
      {visibleAppointments.length === 0 ? (
        <div className="empty-state">No appointments yet</div>
      ) : (
        <div className="appointments-list">
          {visibleAppointments.map((appointment) => {
            const doc = Array.isArray(doctors)
              ? doctors.find(
                  (d) =>
                    parseInt(d.id, 10) === parseInt(appointment.doctorId, 10),
                )
              : null;
            const doctorDisplayName =
              appointment.doctorName ||
              (doc
                ? `${doc.firstName || ""} ${doc.lastName || ""}`.trim()
                : "Doctor");
            const doctorPhoto = resolveDoctorImage(doc);
            const doctorSpec =
              doc && doc.specialization
                ? doc.specialization
                : appointment.specialty || "";
            const doctorHours = doc && doc.workingHours ? doc.workingHours : "";
            const doctorPhone = doc && doc.phone ? doc.phone : "";
            const isBroken = brokenDoctorImageIds.has(
              parseInt(appointment.doctorId, 10),
            );

            return (
              <div key={appointment.id} className="appointment-item">
                {/* Doctor info */}
                <div className="appointment-doctor">
                  {doctorPhoto && !isBroken ? (
                    <img
                      className="appointment-doctor-avatar"
                      src={doctorPhoto}
                      alt={doctorDisplayName}
                      onError={(e) => {
                        setBrokenDoctorImageIds((prev) => {
                          const next = new Set(prev);
                          next.add(parseInt(appointment.doctorId, 10));
                          return next;
                        });
                      }}
                    />
                  ) : (
                    <span className="appointment-doctor-avatar-fallback">
                      <FaUserDoctor />
                    </span>
                  )}
                  <span>{doctorDisplayName}</span>
                </div>

                {/* Doctor profile summary */}
                <div className="appointment-details">
                  <div>
                    <strong>Specialty:</strong> {doctorSpec || "Not added yet"}
                  </div>
                  <div>
                    <strong>Working hours:</strong>{" "}
                    {doctorHours || "Not added yet"}
                  </div>
                  {doctorPhone ? (
                    <div>
                      <strong>Phone:</strong> {doctorPhone}
                    </div>
                  ) : (
                    <div>
                      <strong>Phone:</strong> Not added yet
                    </div>
                  )}
                </div>

                {/* Appointment details */}
                <div className="appointment-details">
                  <div>
                    <strong>Date:</strong>{" "}
                    {appointment.appointmentDate &&
                      new Date(
                        appointment.appointmentDate,
                      ).toLocaleDateString()}
                  </div>
                  <div>
                    <strong>Time:</strong>{" "}
                    {appointment.appointmentTime &&
                      formatTimeWithMeridiem(
                        toHHMM(appointment.appointmentTime),
                      )}
                  </div>
                </div>

                {/* Actions */}
                <div className="appointment-actions">
                  <CancelButton
                    openModal={openModal}
                    appointment={appointment}
                  />
                  <RescheduleButton
                    openModal={openModal}
                    appointment={appointment}
                  />
                  {/* Delete action removed per request */}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

/* Booking modal layer */
export const BookAppointmentLayer = () => {
  const {
    showModal,
    modalType,
    closeModal,
    loading,
    error,
    success,
    doctors,
    selectedDoctorId,
    setSelectedDoctorId,
    availableDates,
    setAvailableDates,
    selectedDateForBooking,
    setSelectedDateForBooking,
    availableTimes,
    selectedTimeForBooking,
    setSelectedTimeForBooking,
    bookAppointment,
  } = usePatientDashboard();

  React.useEffect(() => {
    const computeAvailable = async () => {
      try {
        if (!selectedDoctorId) {
          setAvailableDates && setAvailableDates([]);
          return;
        }
        const doctor = doctors.find(
          (d) => d.id === parseInt(selectedDoctorId, 10),
        );
        const { days: workingDays } = parseWorkingHours(
          doctor?.workingHours || "",
        );
        const days = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        for (let i = 0; i < 30; i++) {
          const d = new Date(today);
          d.setDate(today.getDate() + i);
          const dateStr = new Date(
            Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()),
          )
            .toISOString()
            .split("T")[0];
          if (Array.isArray(workingDays) && workingDays.length > 0) {
            const weekday = d.toLocaleDateString(undefined, {
              weekday: "long",
            });
            if (workingDays.includes(weekday)) days.push(dateStr);
          } else {
            days.push(dateStr);
          }
        }
        setAvailableDates && setAvailableDates(days);
      } catch {
        setAvailableDates && setAvailableDates([]);
      }
    };

    if (typeof setAvailableDates === "function") {
      computeAvailable();
    }
  }, [selectedDoctorId, doctors, setAvailableDates]);

  const [localError, setLocalError] = React.useState("");
  const [reason, setReason] = React.useState("");
  const [customReason, setCustomReason] = React.useState("");

  // Compute availability summary for selected doctor
  const selectedDoctor = Array.isArray(doctors)
    ? doctors.find((d) => d.id === parseInt(selectedDoctorId || 0, 10))
    : null;
  const {
    days: availDays,
    start: availStart,
    end: availEnd,
  } = parseWorkingHours(selectedDoctor?.workingHours || "");
  const daysDisplay =
    Array.isArray(availDays) && availDays.length
      ? availDays.join(", ")
      : "Not specified";
  const timeDisplay =
    availStart && availEnd
      ? `${formatTimeWithMeridiem(availStart)} - ${formatTimeWithMeridiem(
          availEnd,
        )}`
      : "Not specified";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError("");

    if (!selectedDoctorId) {
      setLocalError("Please choose a doctor.");
      return;
    }
    if (!selectedDateForBooking) {
      setLocalError("Please choose a date.");
      return;
    }
    if (!selectedTimeForBooking) {
      setLocalError("Please choose a time.");
      return;
    }

    let reasonInput = String(reason || "").trim();
    if (!reasonInput) {
      setLocalError("Please choose a reason for your visit.");
      return;
    }
    if (reasonInput === "Others" || reasonInput === "Other") {
      const details = String(customReason || "").trim();
      if (!details) {
        setLocalError("Please add a short note.");
        return;
      }
      reasonInput = details;
    }

    await bookAppointment({
      doctorId: String(selectedDoctorId),
      appointmentDate: String(selectedDateForBooking),
      appointmentTime: `${String(selectedTimeForBooking).slice(0, 5)}:00`,
      reason: reasonInput,
    });
  };

  if (!showModal || modalType !== "book") return null;

  return (
    <div className="modal-overlay" onClick={closeModal}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Book a visit</h3>
          <button type="button" className="modal-close" onClick={closeModal}>
            ×
          </button>
        </div>
        <div className="modal-content">
          {(localError || error) && (
            <div className="alert alert-error">{localError || error}</div>
          )}
          {success && <div className="alert alert-success">{success}</div>}

          {/* Availability moved under Doctor input */}

          <form onSubmit={handleSubmit} className="form-grid">
            <div className="form-group">
              <label htmlFor="doctor">Doctor</label>
              <select
                id="doctor"
                className="form-control"
                value={selectedDoctorId || ""}
                onChange={(e) => setSelectedDoctorId(e.target.value)}
                disabled={loading}
              >
                <option value="">Choose a doctor</option>
                {Array.isArray(doctors) &&
                  doctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {(d.firstName || "") + " " + (d.lastName || "")}
                    </option>
                  ))}
              </select>
            </div>

            {(reason === "Others" || reason === "Other") && (
              <div className="form-group">
                <label htmlFor="otherReason">Tell us more</label>
                <textarea
                  id="otherReason"
                  className="form-control"
                  rows={3}
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Write a short note"
                  disabled={loading}
                />
              </div>
            )}

            {/* Doctor Availability */}
            <div className="form-group">
              <label>Doctor hours</label>
              <div className="info-row" style={{ display: "flex", gap: 8 }}>
                <span className="label">Days:</span>
                <span className="value">{daysDisplay}</span>
              </div>
              <div className="info-row" style={{ display: "flex", gap: 8 }}>
                <span className="label">Time:</span>
                <span className="value">{timeDisplay}</span>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="date">Date</label>
              <select
                id="date"
                className="form-control"
                value={selectedDateForBooking || ""}
                onChange={(e) => setSelectedDateForBooking(e.target.value)}
                disabled={loading || !selectedDoctorId}
              >
                <option value="">Choose a date</option>
                {Array.isArray(availableDates) &&
                  availableDates.map((d) => (
                    <option key={d} value={d}>
                      {new Date(d).toLocaleDateString()}
                    </option>
                  ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="time">Time</label>
              <select
                id="time"
                className="form-control"
                value={selectedTimeForBooking || ""}
                onChange={(e) => setSelectedTimeForBooking(e.target.value)}
                disabled={
                  loading || !selectedDoctorId || !selectedDateForBooking
                }
              >
                <option value="">Choose a time</option>
                {Array.isArray(availableTimes) && availableTimes.length > 0 ? (
                  availableTimes.map((t) => (
                    <option key={t} value={t}>
                      {formatTimeWithMeridiem(t)}
                    </option>
                  ))
                ) : (
                  <option value="" disabled>
                    No times available
                  </option>
                )}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="reason">Reason for visit</label>
              <select
                id="reason"
                className="form-control"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                disabled={loading}
              >
                <option value="">Choose a reason</option>
                <option value="General Consultation">General check-up</option>
                <option value="Follow-up">Follow-up visit</option>
                <option value="Routine Checkup">Routine check-up</option>
                <option value="Prescription Renewal">
                  Prescription refill
                </option>
                <option value="Lab Results Review">Review test results</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="modal-actions">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? "Booking..." : "Book"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Combined appointment actions modal layer
export const AppointmentActionsLayer = () => {
  const {
    showModal,
    modalType,
    selectedAppointment,
    closeModal,
    error,
    success,
    setLoading,
    setError,
    setSuccess,
    setAppointments,
    availableTimesForReschedule,
    availableDatesForReschedule,
    selectedDateForReschedule,
    setSelectedDateForReschedule,
  } = usePatientDashboard();

  const isAction =
    showModal && ["cancel", "delete", "reschedule"].includes(modalType);
  if (!isAction || !selectedAppointment) return null;

  const refreshAppointments = async () => {
    try {
      const apptResp = await patientAPI.getAppointments();
      if (apptResp.success) {
        setAppointments(apptResp.data);
      }
    } catch (err) {}
  };

  const handleCancel = async (id) => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await patientAPI.cancelAppointment(id);
      if (res.success) {
        setSuccess("Visit cancelled.");
        await refreshAppointments();
        closeModal();
      } else {
        setError(res.message || "Couldn't cancel the visit");
      }
    } catch (e) {
      setError("Couldn't cancel the visit. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await patientAPI.deleteAppointment(id);
      if (res.success) {
        setSuccess("Visit removed.");
        await refreshAppointments();
        closeModal();
      } else {
        setError(res.message || "Couldn't remove the visit");
      }
    } catch (e) {
      setError("Couldn't remove the visit. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleReschedule = async (id, data) => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const payload = {};
      if (typeof data === "string") {
        payload.appointmentTime = `${data.slice(0, 5)}:00`;
      } else {
        if (data?.appointmentTime)
          payload.appointmentTime = `${String(data.appointmentTime).slice(
            0,
            5,
          )}:00`;
        if (data?.appointmentDate)
          payload.appointmentDate = data.appointmentDate;
      }
      const res = await patientAPI.rescheduleAppointment(id, payload);
      if (res.success) {
        setSuccess("Appointment updated successfully!");
        await refreshAppointments();
        closeModal();
      } else {
        setError(res.message || "Couldn't update the appointment");
      }
    } catch (e) {
      setError("Couldn't update the appointment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={closeModal}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">
            {modalType === "cancel" && "Cancel visit"}
            {modalType === "delete" && "Remove visit"}
            {modalType === "reschedule" && "Change time"}
          </h3>
          <button className="modal-close" onClick={closeModal}>
            ×
          </button>
        </div>
        <div className="modal-content">
          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          {modalType === "cancel" && (
            <CancelModal
              selectedAppointment={selectedAppointment}
              onCancel={handleCancel}
            />
          )}

          {modalType === "delete" && (
            <DeleteModal
              selectedAppointment={selectedAppointment}
              closeModal={closeModal}
              onDelete={handleDelete}
            />
          )}

          {modalType === "reschedule" && (
            <RescheduleModal
              selectedAppointment={selectedAppointment}
              availableTimesForReschedule={availableTimesForReschedule}
              availableDatesForReschedule={availableDatesForReschedule}
              selectedDateForReschedule={selectedDateForReschedule}
              setSelectedDateForReschedule={setSelectedDateForReschedule}
              onReschedule={handleReschedule}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardAppointment;
