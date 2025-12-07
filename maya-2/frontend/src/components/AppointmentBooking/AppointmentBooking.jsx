import React, { useState, useEffect } from "react";
import { patientAPI } from "../../utils/api";
import { parseWorkingHours, generateTimeSlots } from "../../utils/schedule";
import "./AppointmentBooking.css";

const AppointmentBooking = ({ onClose, onBookingSuccess }) => {
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [appointmentType, setAppointmentType] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [doctors, setDoctors] = useState([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await patientAPI.getAllDoctors();
        if (mounted) {
          setDoctors(Array.isArray(res.data) ? res.data : []);
        }
      } catch {
        if (mounted) setDoctors([]);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const appointmentTypes = [
    "General Consultation",
    "Follow-up Visit",
    "Routine Checkup",
    "Specialist Consultation",
    "Emergency Visit",
  ];

  const handleDoctorSelect = (id) => {
    setSelectedDoctor(String(id));
    setSelectedDate("");
    setSelectedTime("");
    setAvailableSlots([]);
  };

  // Generate calendar days
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    // const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    const today = new Date();

    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);

      const isCurrentMonth = date.getMonth() === month;
      const isPast = date < today.setHours(0, 0, 0, 0);
      const isToday = date.toDateString() === new Date().toDateString();
      const isSelected = selectedDate === date.toISOString().split("T")[0];

      days.push({
        date,
        day: date.getDate(),
        isCurrentMonth,
        isPast,
        isToday,
        isSelected,
        dateString: date.toISOString().split("T")[0],
      });
    }

    return days;
  };

  const handleDateSelect = async (dateString) => {
    setSelectedDate(dateString);
    setSelectedTime("");
    if (!selectedDoctor) {
      setAvailableSlots([]);
      return;
    }
    try {
      const doc = doctors.find((d) => d.id === parseInt(selectedDoctor));
      const { start, end } = parseWorkingHours(doc?.workingHours || "");
      const slots = generateTimeSlots(start, end);
      const resp = await patientAPI.getDoctorBookedTimes(
        parseInt(selectedDoctor),
        dateString
      );
      const booked =
        resp.success && Array.isArray(resp.data?.bookedTimes)
          ? resp.data.bookedTimes
          : [];
      const available = slots.filter((t) => !booked.includes(t));
      setAvailableSlots(available);
    } catch {
      setAvailableSlots([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Mock API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const newAppointment = {
        id: Date.now(),
        date: selectedDate,
        time: selectedTime,
        doctor: doctors.find((d) => d.id === parseInt(selectedDoctor)),
        type: appointmentType,
        notes,
        status: "scheduled",
      };

      onBookingSuccess(newAppointment);
      onClose();
    } catch (error) {
      console.error("Booking failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const navigateMonth = (direction) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(currentMonth.getMonth() + direction);
    setCurrentMonth(newMonth);
  };

  const calendarDays = generateCalendarDays();
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  return (
    <div className="appointment-booking">
      <div className="booking-header">
        <h3>Book New Appointment</h3>
        <button className="close-btn" onClick={onClose}>
          <i className="fas fa-times"></i>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="booking-form">
        {/* Calendar Section */}
        <div className="form-section">
          <h4>Select Date</h4>
          <div className="calendar">
            <div className="calendar-header">
              <button
                type="button"
                className="nav-btn"
                onClick={() => navigateMonth(-1)}
              >
                <i className="fas fa-chevron-left"></i>
              </button>
              <h5>
                {monthNames[currentMonth.getMonth()]}{" "}
                {currentMonth.getFullYear()}
              </h5>
              <button
                type="button"
                className="nav-btn"
                onClick={() => navigateMonth(1)}
              >
                <i className="fas fa-chevron-right"></i>
              </button>
            </div>

            <div className="calendar-weekdays">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day} className="weekday">
                  {day}
                </div>
              ))}
            </div>

            <div className="calendar-days">
              {calendarDays.map((day, index) => (
                <button
                  key={index}
                  type="button"
                  className={`calendar-day ${
                    !day.isCurrentMonth ? "other-month" : ""
                  } ${day.isPast ? "past" : ""} ${day.isToday ? "today" : ""} ${
                    day.isSelected ? "selected" : ""
                  }`}
                  onClick={() =>
                    !day.isPast && handleDateSelect(day.dateString)
                  }
                  disabled={day.isPast}
                >
                  {day.day}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Time Selection */}
        {selectedDate && (
          <div className="form-section">
            <h4>Available Time Slots</h4>
            <div className="time-slots">
              {availableSlots.map((time) => (
                <button
                  key={time}
                  type="button"
                  className={`time-slot ${
                    selectedTime === time ? "selected" : ""
                  }`}
                  onClick={() => setSelectedTime(time)}
                >
                  {time}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Doctor Selection */}
        <div className="form-section">
          <h4>Select Doctor</h4>
          <div className="doctor-grid">
            {doctors.map((doctor) => (
              <div
                key={doctor.id}
                className={`doctor-card ${
                  selectedDoctor === String(doctor.id) ? "selected" : ""
                }`}
                onClick={() => handleDoctorSelect(doctor.id)}
              >
                <div className="doctor-avatar">
                  <i className="fas fa-user-md"></i>
                </div>
                <div className="doctor-info">
                  <h5>
                    {`${doctor.firstName || ""} ${
                      doctor.lastName || ""
                    }`.trim() || "Doctor"}
                  </h5>
                  <p>{doctor.specialization || "General"}</p>
                  <span
                    className={`status ${
                      doctor.availability ? "available" : "unavailable"
                    }`}
                  >
                    {doctor.availability ? "Available" : "Unavailable"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Appointment Type */}
        <div className="form-section">
          <h4>Appointment Type</h4>
          <select
            value={appointmentType}
            onChange={(e) => setAppointmentType(e.target.value)}
            className="form-control"
            required
          >
            <option value="">Select appointment type</option>
            {appointmentTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        {/* Notes */}
        <div className="form-section">
          <h4>Additional Notes (Optional)</h4>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="form-control"
            rows="3"
            placeholder="Any specific concerns or requirements..."
          />
        </div>

        {/* Submit Button */}
        <div className="form-actions">
          <button type="button" className="btn btn-outline" onClick={onClose}>
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={
              !selectedDate ||
              !selectedTime ||
              !selectedDoctor ||
              !appointmentType ||
              loading
            }
          >
            Book Appointment
          </button>
        </div>
      </form>
    </div>
  );
};

export default AppointmentBooking;
