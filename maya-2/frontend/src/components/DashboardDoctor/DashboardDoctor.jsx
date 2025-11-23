import React, { useState, useMemo, useEffect } from "react";
import { FaUserDoctor } from "react-icons/fa6";
import { FaSearch } from "react-icons/fa";
import { patientAPI } from "../../utils/api";
import { parseWorkingHours, generateTimeSlots } from "../../utils/schedule";
import "./DashboardDoctor.css";

const DashboardDoctor = ({
  variant = "content",
  active = false,
  onClick = () => {},
  openModal,
  showBookButton = true,
  onSelectDoctor = () => {},
  onDoctorsLoaded = () => {},
  selectedDoctorId,
  setAvailableDates,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [doctors, setDoctors] = useState([]);
  const excludedNames = new Set(["john doe"]);

  useEffect(() => {
    const loadDoctors = async () => {
      try {
        const result = await patientAPI.getDoctors();
        if (result.success) {
          const list = Array.isArray(result.data) ? result.data : [];
          setDoctors(list);
          onDoctorsLoaded(list);
        } else {
          setDoctors([]);
          onDoctorsLoaded([]);
        }
      } catch (e) {
        console.error(e);
        setDoctors([]);
        onDoctorsLoaded([]);
      }
    };
    if (variant === "content" && active && doctors.length === 0) {
      loadDoctors();
    }
  }, [variant, active, doctors.length, onDoctorsLoaded]);

  useEffect(() => {
    const loadDoctors = async () => {
      try {
        const result = await patientAPI.getDoctors();
        if (result.success) {
          const list = Array.isArray(result.data) ? result.data : [];
          setDoctors(list);
          onDoctorsLoaded(list);
        } else {
          setDoctors([]);
          onDoctorsLoaded([]);
        }
      } catch (e) {
        console.error(e);
        setDoctors([]);
        onDoctorsLoaded([]);
      }
    };
    if (active && doctors.length === 0) {
      loadDoctors();
    }
  }, [active, doctors.length, onDoctorsLoaded]);

  const resolveDoctorImage = (doctorObj, fallbackName) => {
    const candidate = (
      doctorObj?.profileImage ||
      doctorObj?.photoUrl ||
      ""
    ).trim();
    if (candidate && candidate.startsWith("/uploads/")) {
      return `http://localhost:5000${candidate}`;
    }
    if (candidate) return candidate;
    const seed = (fallbackName && fallbackName.trim()) || "Doctor";
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
      seed
    )}&background=%23ffffff&radius=50`;
  };

  const filteredDoctors = useMemo(() => {
    if (!searchTerm.trim()) return doctors;
    return doctors.filter((doctor) => {
      const fullName = `${doctor.firstName} ${doctor.lastName}`.toLowerCase();
      const specialization = doctor.specialization?.toLowerCase() || "";
      const phone = doctor.phone?.toLowerCase() || "";
      const search = searchTerm.toLowerCase();
      return (
        fullName.includes(search) ||
        specialization.includes(search) ||
        phone.includes(search)
      );
    });
  }, [doctors, searchTerm]);

  const visibleDoctors = useMemo(() => {
    return filteredDoctors.filter((d) => {
      const name = `${(d.firstName || "").trim()} ${(d.lastName || "").trim()}`
        .trim()
        .toLowerCase();
      return !excludedNames.has(name);
    });
  }, [filteredDoctors, excludedNames]);

  useEffect(() => {
    const computeAvailable = async () => {
      try {
        if (!selectedDoctorId) {
          setAvailableDates && setAvailableDates([]);
          return;
        }
        const doctor = doctors.find((d) => d.id === parseInt(selectedDoctorId));
        const { days: workingDays } = parseWorkingHours(
          doctor?.workingHours || ""
        );
        const days = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        for (let i = 0; i < 30; i++) {
          const d = new Date(today);
          d.setDate(today.getDate() + i);
          const dateStr = new Date(
            Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())
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
      } catch (e) {
        console.warn("Failed to compute available dates", e);
        setAvailableDates && setAvailableDates([]);
      }
    };
    if (typeof setAvailableDates === "function") {
      computeAvailable();
    }
  }, [selectedDoctorId, doctors, setAvailableDates]);

  if (variant === "tabButton") {
    return (
      <button
        className={`tab-button ${active ? "active" : ""}`}
        onClick={onClick}
      >
        Doctors
      </button>
    );
  }

  if (!active) {
    return null;
  }

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">Doctors</h3>
      </div>
      <div className="admin-doctors">
        <div className="section-content">
          <div className="admin-doctors-header">
            <div className="admin-doctors-header-left">
              <h2>Doctors Management</h2>
              <span className="doctors-count">
                {visibleDoctors.length} doctor
                {visibleDoctors.length !== 1 ? "s" : ""} in SmartCare
              </span>
            </div>
            <div className="admin-doctors-header-right">
              <div className="search-container">
                <FaSearch className="search-icon" />
                <input
                  type="text"
                  placeholder="Search doctors..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>
            </div>
          </div>

          <div className="cards-grid">
            {visibleDoctors && visibleDoctors.length > 0 ? (
              visibleDoctors.map((doctor) => (
                <div key={doctor.id} className="doctor-card">
                  <div className="doctor-image">
                    {(() => {
                      const displayName = `${doctor.firstName} ${doctor.lastName}`;
                      const src = resolveDoctorImage(doctor, displayName);
                      if (src) {
                        return (
                          <img
                            src={src}
                            alt={`${doctor.firstName} ${doctor.lastName}`}
                            className="doctor-photo"
                            loading="lazy"
                          />
                        );
                      }
                      return (
                        <span className="doctor-photo-icon">
                          <FaUserDoctor />
                        </span>
                      );
                    })()}
                  </div>
                  <div className="doctor-description">
                    <div className="doctor-name">
                      <span className="label">Name:</span>
                      <span className="value">
                        {doctor.firstName} {doctor.lastName}
                      </span>
                    </div>
                    <div className="doctor-specialization">
                      <span className="label">Specialization:</span>
                      <span className="value">{doctor.specialization}</span>
                    </div>
                    <div className="doctor-experience">
                      <span className="label">Experience:</span>
                      <span className="value">
                        {doctor.experience !== undefined
                          ? `${doctor.experience} years`
                          : "Experienced"}
                      </span>
                    </div>
                    <div className="doctor-phone">
                      <span className="label">Numbers:</span>
                      <span className="value">{doctor.phone}</span>
                    </div>
                    {showBookButton && (
                      <div className="doctor-actions">
                        <button
                          className="btn btn-primary"
                          type="button"
                          onClick={() => {
                            onSelectDoctor(doctor.id);
                            if (typeof openModal === "function") {
                              openModal("book");
                            }
                          }}
                        >
                          Book Appointment
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <span className="empty-icon">🩺</span>
                <p>
                  {searchTerm.trim()
                    ? `No doctors found matching "${searchTerm}"`
                    : "No doctors found"}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardDoctor;

export const BookAppointmentModal = ({
  selectedDoctorId,
  setSelectedDoctorId,
  availableSlots,
  availableDates,
  selectedDateForBooking,
  setSelectedDateForBooking,
  selectedTimeForBooking,
  setSelectedTimeForBooking,
  availableTimes,
  setAvailableTimes,
  handleBookAppointment,
  closeModal,
}) => {
  const selectedDoctor = availableSlots.find(
    (d) => d.id === parseInt(selectedDoctorId)
  );
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const appointmentData = {
          doctorId: parseInt(formData.get("doctorId")),
          appointmentDate: formData.get("appointmentDate"),
          appointmentTime: formData.get("appointmentTime")
            ? `${formData.get("appointmentTime")}:00`
            : null,
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
            <input type="hidden" name="doctorId" value={selectedDoctorId} />
          </>
        ) : (
          <select
            name="doctorId"
            className="form-control"
            value={selectedDoctorId || ""}
            onChange={(e) => {
              setSelectedDoctorId && setSelectedDoctorId(e.target.value);
              setSelectedDateForBooking("");
              setSelectedTimeForBooking("");
            }}
            required
          >
            <option value="">Choose a doctor</option>
            {availableSlots.map((doctor) => (
              <option key={doctor.id} value={doctor.id}>
                Dr. {doctor.firstName} {doctor.lastName} -{" "}
                {doctor.specialization}
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
              Status:{" "}
              {selectedDoctor?.availability ? "Available" : "Unavailable"}
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
                if (d) {
                  try {
                    const resp = await patientAPI.getDoctorBookedTimes(
                      selectedDoctorId,
                      d
                    );
                    const bookedTimes = resp.success
                      ? resp.data?.bookedTimes || []
                      : [];
                    const doc = availableSlots.find(
                      (x) => x.id === parseInt(selectedDoctorId)
                    );
                    const { start, end } = parseWorkingHours(
                      doc?.workingHours || ""
                    );
                    const slots = generateTimeSlots(start, end);
                    const available = slots.filter(
                      (t) => !bookedTimes.includes(t)
                    );
                    setAvailableTimes(available);
                  } catch {
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
                <option key={d} value={d}>
                  {d}
                </option>
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
            <>
              <div className="form-hint" style={{ marginBottom: 6 }}>
                Available window:{" "}
                {(() => {
                  const doc = availableSlots.find(
                    (x) => x.id === parseInt(selectedDoctorId)
                  );
                  const { start, end } = parseWorkingHours(
                    doc?.workingHours || ""
                  );
                  return start && end ? `${start} - ${end}` : "09:00 - 17:00";
                })()}
              </div>
              <select
                name="appointmentTime"
                className="form-control"
                value={selectedTimeForBooking}
                onChange={(e) => setSelectedTimeForBooking(e.target.value)}
                required
              >
                <option value="">Choose a time</option>
                {(() => {
                  const timesByHour = availableTimes.reduce((acc, t) => {
                    const hour = String(t).slice(0, 2);
                    if (!acc[hour]) acc[hour] = [];
                    acc[hour].push(t);
                    return acc;
                  }, {});
                  return Object.entries(timesByHour).map(([hour, times]) => (
                    <optgroup key={hour} label={`${hour}:00`}>
                      {times.map((tt) => (
                        <option key={tt} value={tt}>
                          {tt}
                        </option>
                      ))}
                    </optgroup>
                  ));
                })()}
              </select>
            </>
          ) : (
            <div className="alert alert-warning" style={{ marginTop: 6 }}>
              {selectedDateForBooking
                ? "No available times for selected date."
                : "Please choose a date to see times."}
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
        <select name="reason" className="form-control" required>
          <option value="">Select reason</option>
          <option value="Consultation">Consultation</option>
          <option value="Follow-up">Follow-up</option>
          <option value="Routine Checkup">Routine Checkup</option>
          <option value="Chronic Condition Management">
            Chronic Condition Management
          </option>
          <option value="Prescription Renewal">Prescription Renewal</option>
          <option value="Test Results Discussion">
            Test Results Discussion
          </option>
          <option value="Other">Other</option>
        </select>
      </div>
      <div className="modal-actions">
        <button type="button" className="btn btn-outline" onClick={closeModal}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary">
          Book Appointment
        </button>
      </div>
    </form>
  );
};
