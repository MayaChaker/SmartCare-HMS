import React, { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { IoIosLogOut } from "react-icons/io";
import { FaUserInjured } from "react-icons/fa6";
import { AuthContext } from "../../context/AuthContext";
import AppointmentBooking from "../../components/AppointmentBooking/AppointmentBooking";
import AdminDoctorsButton from "../../components/AdminDoctorsButton/AdminDoctorsButton";
import { patientAPI } from "../../utils/api";
import "./Dashboard.css";

const Dashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("appointments");
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("book");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // State for real data from backend
  const [profile, setProfile] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: "",
    dateOfBirth: "",
    gender: "",
    address: "",
    emergencyContact: "",
    bloodType: "",
    allergies: "",
    insurance: "",
    medicalHistory: "",
  });

  const [appointments, setAppointments] = useState([]);
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [doctors, setDoctors] = useState([]);
  const [doctorBookedDates, setDoctorBookedDates] = useState([]);
  const [availableDates, setAvailableDates] = useState([]);
  const [selectedDateForBooking, setSelectedDateForBooking] = useState("");
  const [availableTimes, setAvailableTimes] = useState([]);
  const [selectedTimeForBooking, setSelectedTimeForBooking] = useState("");

  // Resolve first name from profile or auth user
  const firstNameDisplay =
    (profile?.firstName && profile.firstName.trim()) ||
    (profile?.name && profile.name.trim().split(" ")[0]) ||
    (user?.name && user.name.trim().split(" ")[0]) ||
    (user?.username && user.username.trim().split(" ")[0]) ||
    "";

  // Fetch doctors when Doctors tab is first opened
  useEffect(() => {
    const loadDoctors = async () => {
      try {
        setLoading(true);
        const result = await patientAPI.getDoctors();
        if (result.success) {
          setDoctors(Array.isArray(result.data) ? result.data : []);
        }
      } catch (err) {
        console.warn("Failed to load doctors", err);
      } finally {
        setLoading(false);
      }
    };

    if (activeTab === "doctors" && doctors.length === 0) {
      loadDoctors();
    }
  }, [activeTab]);

  const renderDoctors = () => (
    <AdminDoctorsButton
      activeSection={"doctors"}
      setActiveSection={() => {}}
      renderContent={true}
      doctors={doctors}
      openModal={openModal}
      showBookButton={true}
      onSelectDoctor={(id) => setSelectedDoctorId(String(id))}
    />
  );

  // Load data on component mount
  useEffect(() => {
    loadPatientData();
  }, []);

  const loadPatientData = async () => {
    setLoading(true);
    try {
      // Load profile
      const profileResponse = await patientAPI.getProfile();
      if (profileResponse.success) {
        setProfile(profileResponse.data);
      }

      // Load appointments
      const appointmentsResponse = await patientAPI.getAppointments();
      if (appointmentsResponse.success) {
        setAppointments(appointmentsResponse.data);
      }

      // Load medical records
      const recordsResponse = await patientAPI.getMedicalRecords();
      if (recordsResponse.success) {
        setMedicalRecords(recordsResponse.data);
      }

      // Load available doctors (not slots)
      const doctorsResponse = await patientAPI.getDoctors();
      if (doctorsResponse.success) {
        setAvailableSlots(doctorsResponse.data); // Using availableSlots state for doctors
      }
    } catch (error) {
      console.error("Error loading patient data:", error);
      setError("Failed to load data. Please refresh the page.");
    } finally {
      setLoading(false);
    }
  };

  const openModal = (type, appointment = null) => {
    setModalType(type);
    setSelectedAppointment(appointment);
    setShowModal(true);
    setError("");
    setSuccess("");
  };

  // Compute available dates when doctor changes
  useEffect(() => {
    const computeAvailable = async () => {
      try {
        setError("");
        setSuccess("");
        // Reset if no doctor selected
        if (!selectedDoctorId) {
          setDoctorBookedDates([]);
          setAvailableDates([]);
          return;
        }

        // Fetch booked dates for selected doctor
        const resp = await patientAPI.getDoctorBookedDates(selectedDoctorId);
        const booked = resp.success && resp.data?.bookedDates ? resp.data.bookedDates : [];
        setDoctorBookedDates(booked);

        // If doctor is unavailable, no dates should be available
        const doctor = availableSlots.find((d) => d.id === parseInt(selectedDoctorId));
        if (doctor && doctor.availability === false) {
          setAvailableDates([]);
          return;
        }

        // Generate next 30 days and filter out booked ones
        const days = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        for (let i = 0; i < 30; i++) {
          const d = new Date(today);
          d.setDate(today.getDate() + i);
          const dateStr = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
            .toISOString()
            .split("T")[0];
          days.push(dateStr);
        }

        const filtered = days.filter((d) => !booked.includes(d));
        setAvailableDates(filtered);
      } catch (e) {
        console.warn("Failed to compute available dates", e);
        setAvailableDates([]);
      }
    };

    computeAvailable();
  }, [selectedDoctorId, availableSlots]);

  const closeModal = () => {
    setShowModal(false);
    setModalType("");
    setSelectedAppointment(null);
    setError("");
    setSuccess("");
    setSelectedDoctorId("");
    setSelectedDateForBooking("");
    setAvailableTimes([]);
    setSelectedTimeForBooking("");
  };

  const handleBookAppointment = async (appointmentData) => {
    setLoading(true);
    try {
      // Front-end guard: prevent booking when doctor unavailable
      const doctorForBooking = availableSlots.find(
        (d) => d.id === parseInt(appointmentData.doctorId)
      );
      if (doctorForBooking && doctorForBooking.availability === false) {
        setError("Selected doctor is currently unavailable. Please choose another date or doctor.");
        setLoading(false);
        return;
      }

      // Front-end guard: prevent double booking same doctor & date (& time if provided)
      const conflict = appointments.some(
        (a) =>
          parseInt(a.doctorId) === parseInt(appointmentData.doctorId) &&
          String(a.appointmentDate) === String(appointmentData.appointmentDate) &&
          (!appointmentData.appointmentTime || !a.appointmentTime || String(a.appointmentTime).slice(0,5) === String(appointmentData.appointmentTime).slice(0,5)) &&
          String(a.status).toLowerCase() !== "cancelled"
      );
      if (conflict) {
        setError("Selected date/time is already booked for this doctor.");
        setLoading(false);
        return;
      }

      const response = await patientAPI.bookAppointment(appointmentData);
      if (response.success) {
        setSuccess("Appointment booked successfully!");
        await loadPatientData(); // Refresh data
        closeModal();
      } else {
        setError(response.message || "Failed to book appointment");
      }
    } catch (error) {
      console.error("Error booking appointment:", error);
      setError("Failed to book appointment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAppointment = async (appointmentId) => {
    setLoading(true);
    try {
      const response = await patientAPI.cancelAppointment(appointmentId);
      if (response.success) {
        setSuccess("Appointment cancelled successfully!");
        await loadPatientData(); // Refresh data
        closeModal();
      } else {
        setError(response.message || "Failed to cancel appointment");
      }
    } catch (error) {
      console.error("Error cancelling appointment:", error);
      setError("Failed to cancel appointment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRescheduleAppointment = async (appointmentId, newSlotData) => {
    setLoading(true);
    try {
      const response = await patientAPI.rescheduleAppointment(
        appointmentId,
        newSlotData
      );
      if (response.success) {
        setSuccess("Appointment rescheduled successfully!");
        await loadPatientData(); // Refresh data
        closeModal();
      } else {
        setError(response.message || "Failed to reschedule appointment");
      }
    } catch (error) {
      console.error("Error rescheduling appointment:", error);
      setError("Failed to reschedule appointment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (updatedProfile) => {
    setLoading(true);
    try {
      const response = await patientAPI.updateProfile(updatedProfile);
      if (response.success) {
        // Reload the profile from server to get complete data structure
        const profileResponse = await patientAPI.getProfile();
        if (profileResponse.success) {
          setProfile(profileResponse.data);
        }
        setSuccess("Profile updated successfully!");
        closeModal();
      } else {
        setError(response.message || "Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      setError("Failed to update profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const renderAppointments = () => (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">My Appointments</h3>
        <button
          className="btn btn-primary"
          onClick={() => openModal("book")}
          disabled={loading}
        >
          Book New Appointment
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {success && <div className="alert alert-success">{success}</div>}

      {loading ? (
        <div className="loading">
          <div className="spinner"></div>
        </div>
      ) : appointments.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📅</div>
          <div className="empty-state-text">No appointments scheduled</div>
          <div className="empty-state-subtext">
            Book your first appointment to get started
          </div>
        </div>
      ) : (
        <div className="appointments-list">
          {appointments.map((appointment) => (
            <div key={appointment.id} className="appointment-item">
              <div className="appointment-header">
                <div className="appointment-doctor">
                  {appointment.doctorName || appointment.doctor}
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
                    ? new Date(appointment.appointmentDate).toLocaleDateString()
                    : "TBD"}{" "}
                  {appointment.appointmentTime
                    ? `at ${String(appointment.appointmentTime).slice(0, 5)}`
                    : ""}
                </div>
                <div>
                  <strong>Type:</strong> {appointment.type}
                </div>
                <div>
                  <strong>Location:</strong> {appointment.location || "TBD"}
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
                  <button
                    className="btn btn-outline"
                    onClick={() => openModal("reschedule", appointment)}
                    disabled={loading}
                  >
                    Reschedule
                  </button>
                  <button
                    className="btn btn-outline"
                    style={{ color: "#dc3545", borderColor: "#dc3545" }}
                    onClick={() => openModal("cancel", appointment)}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderMedicalRecords = () => (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">Medical Records</h3>
      </div>
      {medicalRecords.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <div className="empty-state-text">No medical records available</div>
          <div className="empty-state-subtext">
            Your medical history will appear here
          </div>
        </div>
      ) : (
        <div className="records-list">
          {medicalRecords.map((record) => (
            <div key={record.id} className="record-item">
              <div className="record-header">
                <div className="record-date">
                  {new Date(
                    record.createdAt || record.date
                  ).toLocaleDateString()}
                </div>
                <div className="record-doctor">
                  Dr.{" "}
                  {record.Doctor
                    ? `${record.Doctor.firstName} ${record.Doctor.lastName}`
                    : record.doctor}
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
  );

  const renderProfile = () => (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">My Profile</h3>
        <button
          className="btn btn-outline"
          onClick={() => openModal("editProfile")}
        >
          Edit Profile
        </button>
      </div>
      <div className="profile-info">
        <div className="profile-field">
          <span className="profile-label">Full Name</span>
          <span className="profile-value">{profile.name}</span>
        </div>
        <div className="profile-field">
          <span className="profile-label">Email</span>
          <span className="profile-value">{profile.email}</span>
        </div>
        <div className="profile-field">
          <span className="profile-label">Phone</span>
          <span className="profile-value">{profile.phone}</span>
        </div>
        <div className="profile-field">
          <span className="profile-label">Date of Birth</span>
          <span className="profile-value">{profile.dateOfBirth}</span>
        </div>
        <div className="profile-field">
          <span className="profile-label">Gender</span>
          <span className="profile-value">{profile.gender}</span>
        </div>
        <div className="profile-field">
          <span className="profile-label">Address</span>
          <span className="profile-value">{profile.address}</span>
        </div>
        <div className="profile-field">
          <span className="profile-label">Emergency Contact</span>
          <span className="profile-value">{profile.emergencyContact}</span>
        </div>
        <div className="profile-field">
          <span className="profile-label">Blood Type</span>
          <span className="profile-value">{profile.bloodType}</span>
        </div>
        <div className="profile-field">
          <span className="profile-label">Allergies</span>
          <span className="profile-value">{profile.allergies}</span>
        </div>
        <div className="profile-field">
          <span className="profile-label">Insurance</span>
          <span className="profile-value">{profile.insurance}</span>
        </div>
        <div className="profile-field">
          <span className="profile-label">Medical History</span>
          <span className="profile-value">{profile.medicalHistory}</span>
        </div>
      </div>
    </div>
  );

  const renderModal = () => {
    if (!showModal) return null;

    const selectedDoctor = availableSlots.find(
      (d) => d.id === parseInt(selectedDoctorId)
    );

    return (
      <div className="modal-overlay" onClick={closeModal}>
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h3>
              {modalType === "book" && "Book New Appointment"}
              {modalType === "cancel" && "Cancel Appointment"}
              {modalType === "reschedule" && "Reschedule Appointment"}
              {modalType === "editProfile" && "Edit Profile"}
            </h3>
            <button className="modal-close" onClick={closeModal}>
              ×
            </button>
          </div>
          <div className="modal-content">
            {error && <div className="alert alert-error">{error}</div>}

            {success && <div className="alert alert-success">{success}</div>}

            {modalType === "editProfile" && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.target);
                  const updatedProfile = {
                    name: formData.get("name"),
                    email: formData.get("email"),
                    phone: formData.get("phone"),
                    dateOfBirth: formData.get("dateOfBirth"),
                    gender: formData.get("gender"),
                    address: formData.get("address"),
                    emergencyContact: formData.get("emergencyContact"),
                    bloodType: formData.get("bloodType"),
                    allergies: formData.get("allergies"),
                    insurance: formData.get("insurance"),
                    medicalHistory: formData.get("medicalHistory"),
                  };
                  handleUpdateProfile(updatedProfile);
                }}
              >
                <div
                  className="form-grid"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "20px",
                  }}
                >
                  <div className="form-group">
                    <label>Full Name *</label>
                    <input
                      type="text"
                      name="name"
                      className="form-control"
                      defaultValue={profile.name}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Email *</label>
                    <input
                      type="email"
                      name="email"
                      className="form-control"
                      defaultValue={profile.email}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Phone</label>
                    <input
                      type="tel"
                      name="phone"
                      className="form-control"
                      defaultValue={profile.phone}
                    />
                  </div>
                  <div className="form-group">
                    <label>Date of Birth</label>
                    <input
                      type="date"
                      name="dateOfBirth"
                      className="form-control"
                      defaultValue={profile.dateOfBirth}
                    />
                  </div>
                  <div className="form-group">
                    <label>Gender</label>
                    <select
                      name="gender"
                      className="form-control"
                      defaultValue={profile.gender}
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Blood Type</label>
                    <select
                      name="bloodType"
                      className="form-control"
                      defaultValue={profile.bloodType}
                    >
                      <option value="">Select Blood Type</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>Address</label>
                  <textarea
                    name="address"
                    className="form-control"
                    rows="3"
                    defaultValue={profile.address}
                  />
                </div>
                <div className="form-group">
                  <label>Emergency Contact</label>
                  <input
                    type="text"
                    name="emergencyContact"
                    className="form-control"
                    defaultValue={profile.emergencyContact}
                    placeholder="Name - Phone Number"
                  />
                </div>
                <div className="form-group">
                  <label>Allergies</label>
                  <input
                    type="text"
                    name="allergies"
                    className="form-control"
                    defaultValue={profile.allergies}
                    placeholder="List any known allergies"
                  />
                </div>
                <div className="form-group">
                  <label>Insurance</label>
                  <input
                    type="text"
                    name="insurance"
                    className="form-control"
                    defaultValue={profile.insurance}
                    placeholder="Insurance provider"
                  />
                </div>
                <div className="form-group">
                  <label>Medical History</label>
                  <textarea
                    name="medicalHistory"
                    className="form-control"
                    rows="4"
                    defaultValue={profile.medicalHistory}
                    placeholder="Please describe your medical history, past surgeries, chronic conditions, medications, etc."
                  />
                </div>
                <div
                  className="form-actions"
                  style={{
                    display: "flex",
                    gap: "10px",
                    justifyContent: "flex-end",
                    marginTop: "20px",
                  }}
                >
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={closeModal}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    {loading ? "Updating..." : "Update Profile"}
                  </button>
                </div>
              </form>
            )}

            {modalType === "book" && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.target);
                  const appointmentData = {
                    doctorId: parseInt(formData.get("doctorId")),
                    appointmentDate: formData.get("appointmentDate"),
                    appointmentTime: formData.get("appointmentTime") ? `${formData.get("appointmentTime")}:00` : null,
                    reason: formData.get("reason"),
                  };
                  handleBookAppointment(appointmentData);
                }}
              >
                <div className="form-group">
                  <label>Doctor</label>
                  {selectedDoctorId ? (
                    <>
                      <div
                        className="selected-doctor"
                        style={{
                          padding: "10px",
                          background: "#f7f7f9",
                          borderRadius: "6px",
                          border: "1px solid #e5e5ea",
                        }}
                      >
                        <div style={{ fontWeight: 600 }}>
                          Dr. {selectedDoctor?.firstName} {selectedDoctor?.lastName}
                        </div>
                        <div style={{ color: "#555" }}>
                          {selectedDoctor?.specialization || "General"}
                        </div>
                      </div>
                      {/* submit selected doctor via hidden input */}
                      <input type="hidden" name="doctorId" value={selectedDoctorId} />
                    </>
                  ) : (
                    <select
                      name="doctorId"
                      className="form-control"
                      value={selectedDoctorId || ""}
                      onChange={(e) => setSelectedDoctorId(e.target.value)}
                      required
                    >
                      <option value="">Choose a doctor</option>
                      {availableSlots.map((doctor) => (
                        <option key={doctor.id} value={doctor.id}>
                          Dr. {doctor.firstName} {doctor.lastName} - {doctor.specialization}
                        </option>
                      ))}
                    </select>
                  )}

                  {selectedDoctorId && (
                    <div
                      className="doctor-availability"
                      style={{
                        marginTop: "8px",
                        padding: "10px",
                        background: "#f7f7f9",
                        borderRadius: "6px",
                        border: "1px solid #e5e5ea",
                      }}
                    >
                      <div style={{ fontWeight: 600 }}>Availability</div>
                      <div style={{ marginTop: "4px" }}>
                        Status: {selectedDoctor?.availability ? "Available" : "Unavailable"}
                      </div>
                      {selectedDoctor?.workingHours && (
                        <div style={{ marginTop: "2px" }}>
                          Days & Time: {selectedDoctor.workingHours}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="form-group">
                  <label>Appointment Date</label>
                  {selectedDoctorId ? (
                    availableDates.length > 0 ? (
                      <select
                        name="appointmentDate"
                        className="form-control"
                        value={selectedDateForBooking}
                        onChange={async (e) => {
                          const d = e.target.value;
                          setSelectedDateForBooking(d);
                          setSelectedTimeForBooking("");
                          // Fetch booked times for selected doctor/date and compute available
                          if (d) {
                            try {
                              const resp = await patientAPI.getDoctorBookedTimes(selectedDoctorId, d);
                              const bookedTimes = resp.success ? (resp.data?.bookedTimes || []) : [];
                              // Generate time slots (09:00-17:00 every 30 minutes)
                              const slots = [];
                              for (let h = 9; h <= 17; h++) {
                                for (let m of [0, 30]) {
                                  const hh = String(h).padStart(2, "0");
                                  const mm = String(m).padStart(2, "0");
                                  const t = `${hh}:${mm}`;
                                  slots.push(t);
                                }
                              }
                              const available = slots.filter((t) => !bookedTimes.includes(t));
                              setAvailableTimes(available);
                            } catch (err) {
                              console.warn("Failed to load booked times", err);
                              setAvailableTimes([]);
                            }
                          } else {
                            setAvailableTimes([]);
                          }
                        }}
                        required
                      >
                        <option value="">Choose a date</option>
                        {availableDates.map((d) => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    ) : (
                      <div className="alert alert-warning" style={{ marginTop: 6 }}>
                        No available dates for this doctor in the next 30 days.
                      </div>
                    )
                  ) : (
                    <div className="alert alert-info" style={{ marginTop: 6 }}>
                      Please select a doctor to see available dates.
                    </div>
                  )}
                </div>
                <div className="form-group">
                  <label>Appointment Time</label>
                  {selectedDoctorId && selectedDateForBooking ? (
                    availableTimes.length > 0 ? (
                      <select
                        name="appointmentTime"
                        className="form-control"
                        value={selectedTimeForBooking}
                        onChange={(e) => setSelectedTimeForBooking(e.target.value)}
                        required
                      >
                        <option value="">Choose a time</option>
                        {availableTimes.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    ) : (
                      <div className="alert alert-warning" style={{ marginTop: 6 }}>
                        {selectedDateForBooking ? "No available times for selected date." : "Please choose a date to see times."}
                      </div>
                    )
                  ) : (
                    <div className="alert alert-info" style={{ marginTop: 6 }}>
                      Please select a date to see available times.
                    </div>
                  )}
                </div>
                <div className="form-group">
                  <label>Reason for Visit</label>
                  <select
                    name="reason"
                    className="form-control"
                    required
                  >
                    <option value="">Select reason</option>
                    <option value="Consultation">Consultation</option>
                    <option value="Follow-up">Follow-up</option>
                    <option value="Routine Checkup">Routine Checkup</option>
                    <option value="Chronic Condition Management">Chronic Condition Management</option>
                    <option value="Prescription Renewal">Prescription Renewal</option>
                    <option value="Test Results Discussion">Test Results Discussion</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="modal-actions">
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={closeModal}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Book Appointment
                  </button>
                </div>
              </form>
            )}
            {modalType === "cancel" && selectedAppointment && (
              <div>
                <p>
                  Are you sure you want to cancel your appointment with{" "}
                  {selectedAppointment.doctor || selectedAppointment.doctorName} on {selectedAppointment.appointmentDate ? new Date(selectedAppointment.appointmentDate).toLocaleDateString() : "TBD"}{" "}
                  {selectedAppointment.appointmentTime ? `at ${String(selectedAppointment.appointmentTime).slice(0,5)}` : ""}?
                </p>
                <div className="modal-actions">
                  <button className="btn btn-outline" onClick={closeModal}>
                    Keep Appointment
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={() =>
                      handleCancelAppointment(selectedAppointment.id)
                    }
                  >
                    Cancel Appointment
                  </button>
                </div>
              </div>
            )}
            {modalType === "reschedule" && selectedAppointment && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.target);
                  handleRescheduleAppointment(
                    selectedAppointment.id,
                    parseInt(formData.get("newSlotId"))
                  );
                }}
              >
                <p>
                  Current appointment: {selectedAppointment.doctor || selectedAppointment.doctorName} on{" "}
                  {selectedAppointment.appointmentDate ? new Date(selectedAppointment.appointmentDate).toLocaleDateString() : "TBD"} at {selectedAppointment.appointmentTime ? String(selectedAppointment.appointmentTime).slice(0,5) : ""}
                </p>
                <div className="form-group">
                  <label>New Appointment Time</label>
                  <select name="newSlotId" className="form-control" required>
                    <option value="">Select a new time slot</option>
                    {availableSlots.map((slot) => (
                      <option key={slot.id} value={slot.id}>
                        {slot.doctor} ({slot.specialty}) - {slot.date} at{" "}
                        {slot.time}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="modal-actions">
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={closeModal}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Reschedule
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="dashboard patient-dashboard">
      <header className="dashboard-header">
        <div className="container">
          <nav className="dashboard-nav">
            <div
              className="dashboard-title-group"
              role="button"
              tabIndex={0}
              onClick={() => navigate("/")}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") navigate("/");
              }}
              style={{ cursor: "pointer" }}
            >
              <div className="title-icon" aria-hidden="true"><FaUserInjured /></div>
              <h1 className="dashboard-title">
                Patient Dashboard
                <span className="user-name">{`Welcome${
                  firstNameDisplay ? ", " + firstNameDisplay : ""
                }`}</span>
              </h1>
            </div>
            <div className="user-info">
              <button
                className="btn btn-outline"
                onClick={logout}
                type="button"
              >
                <span className="btn-icon">
                  <IoIosLogOut />
                </span>
                Logout
              </button>
            </div>
          </nav>
        </div>
      </header>

      <main className="dashboard-content">
        <div className="container">
          <div className="dashboard-tabs">
            <button
              className={`tab-button ${
                activeTab === "appointments" ? "active" : ""
              }`}
              onClick={() => setActiveTab("appointments")}
            >
              Appointments
            </button>
            <button
              className={`tab-button ${
                activeTab === "doctors" ? "active" : ""
              }`}
              onClick={() => setActiveTab("doctors")}
            >
              Doctors
            </button>
            <button
              className={`tab-button ${
                activeTab === "records" ? "active" : ""
              }`}
              onClick={() => setActiveTab("records")}
            >
              Medical Records
            </button>
            <button
              className={`tab-button ${
                activeTab === "profile" ? "active" : ""
              }`}
              onClick={() => setActiveTab("profile")}
            >
              Profile
            </button>
          </div>

          {loading ? (
            <div className="loading">
              <div className="spinner"></div>
            </div>
          ) : (
            <>
              {activeTab === "appointments" && renderAppointments()}
              {activeTab === "records" && renderMedicalRecords()}
              {activeTab === "doctors" && renderDoctors()}
              {activeTab === "profile" && renderProfile()}
            </>
          )}
        </div>
      </main>

      {renderModal()}
    </div>
  );
};

export default Dashboard;
