import React, { useState, useMemo, useEffect } from "react";
import { FaSearch } from "react-icons/fa";
import { FaUserDoctor } from "react-icons/fa6";
import { patientAPI } from "../../utils/api";
import { parseWorkingHours, generateTimeSlots } from "../../utils/schedule";
import "./DashboardDoctor.css";
import { usePatientDashboard } from "../../context/PatientContext";

const DashboardDoctor = ({
  variant = "content",
  active = false,
  onClick = () => {},
  showBookButton = true,
}) => {
  const {
    doctors,
    setDoctors,
    selectedDoctorId,
    setSelectedDoctorId,
    setAvailableDates,
    openModal,
  } = usePatientDashboard();

  const [searchTerm, setSearchTerm] = useState("");
  const [brokenImageIds, setBrokenImageIds] = useState(new Set());
  const excludedNames = useMemo(() => new Set(["john doe"]), []);

  // Load doctors
  useEffect(() => {
    const loadDoctors = async () => {
      try {
        const result = await patientAPI.getDoctors();
        if (result.success) {
          const list = Array.isArray(result.data) ? result.data : [];
          setDoctors(list);
        } else {
          setDoctors([]);
        }
      } catch (e) {
        console.error(e);
        setDoctors([]);
      }
    };

    if (variant === "content" && active && doctors.length === 0) {
      loadDoctors();
    }
  }, [variant, active, doctors.length, setDoctors]);

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

  const computeFee = (doctorObj) => {
    const fees = [20, 25, 30, 35, 40, 45, 50, 60, 75, 80, 100];
    const idx = (parseInt(doctorObj?.id ?? 0, 10) || 0) % fees.length;
    return fees[idx];
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

  // Compute available dates for selected doctor
  useEffect(() => {
    const computeAvailable = async () => {
      try {
        if (!selectedDoctorId) {
          setAvailableDates && setAvailableDates([]);
          return;
        }
        const doctor = doctors.find(
          (d) => d.id === parseInt(selectedDoctorId, 10)
        );
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

  // Tab button
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

  if (!active) return null;

  // Content
  return (
    <div className="card">
      <div className="card-header doctor-header"></div>
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
                      const src = resolveDoctorImage(doctor);
                      const broken = brokenImageIds.has(doctor.id);
                      if (src && !broken) {
                        return (
                          <img
                            src={src}
                            alt={`${doctor.firstName} ${doctor.lastName}`}
                            className="doctor-photo"
                            loading="lazy"
                            onError={() =>
                              setBrokenImageIds((prev) => {
                                const next = new Set(prev);
                                next.add(doctor.id);
                                return next;
                              })
                            }
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
                    <div className="doctor-info-grid">
                      <div className="info-row specialization-row">
                        <span className="label">Specialization:</span>
                        <span className="value">{doctor.specialization}</span>
                      </div>
                      <div className="info-row">
                        <span className="label">Experience:</span>
                        <span className="value">
                          {doctor.experience !== undefined
                            ? `${doctor.experience} years`
                            : "Experienced"}
                        </span>
                      </div>
                      <div className="info-row">
                        <span className="label">Fee:</span>
                        <span className="value">{computeFee(doctor)} $</span>
                      </div>
                      <div className="info-row">
                        <span className="label">Phone:</span>
                        <span className="value">{doctor.phone}</span>
                      </div>
                    </div>
                    {showBookButton && (
                      <div className="doctor-actions">
                        <button
                          className="btn btn-primary"
                          type="button"
                          onClick={() => {
                            setSelectedDoctorId(doctor.id);
                            openModal("book");
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

// Keep BookAppointmentModal export as before
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
  doctors = [],
}) => {
  const doctorList =
    Array.isArray(doctors) && doctors.length > 0
      ? doctors
      : Array.isArray(availableSlots)
      ? availableSlots
      : [];

  const selectedDoctor = doctorList.find(
    (d) => d.id === parseInt(selectedDoctorId, 10)
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
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const appointmentData = {
          doctorId: parseInt(formData.get("doctorId"), 10),
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
            {doctorList.map((doctor) => (
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
                    const doc = doctorList.find(
                      (x) => x.id === parseInt(selectedDoctorId, 10)
                    );
                    const { start, end } = parseWorkingHours(
                      doc?.workingHours || ""
                    );
                    const slots = generateTimeSlots(start, end);
                    if (slots.length > 0) {
                      setAvailableTimes(slots);
                    }
                    const resp = await patientAPI.getDoctorBookedTimes(
                      selectedDoctorId,
                      d
                    );
                    const bookedTimes = resp.success
                      ? resp.data?.bookedTimes || []
                      : [];
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
                  const doc = doctorList.find(
                    (x) => x.id === parseInt(selectedDoctorId, 10)
                  );
                  const { start, end } = parseWorkingHours(
                    doc?.workingHours || ""
                  );
                  return start && end
                    ? `${formatTimeWithMeridiem(
                        start
                      )} - ${formatTimeWithMeridiem(end)}`
                    : `${formatTimeWithMeridiem(
                        "09:00"
                      )} - ${formatTimeWithMeridiem("17:00")}`;
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
                    <optgroup
                      key={hour}
                      label={`${formatTimeWithMeridiem(`${hour}:00`)}`}
                    >
                      {times.map((tt) => (
                        <option key={tt} value={tt}>
                          {formatTimeWithMeridiem(tt)}
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
        <button type="submit" className="btn btn-primary">
          Book Appointment
        </button>
      </div>
    </form>
  );
};
