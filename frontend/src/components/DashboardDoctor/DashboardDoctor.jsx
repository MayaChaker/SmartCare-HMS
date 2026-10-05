import React, { useState, useMemo, useEffect } from "react";
import { FaSearch } from "react-icons/fa";
import { FaUserDoctor } from "react-icons/fa6";
import { patientAPI } from "../../utils/api";
import { resolveDoctorImage } from "../../utils/schedule";
import "./DashboardDoctor.css";
import { usePatientDashboard } from "../../context/PatientContext";

import { PatientBookAppointmentButton } from "../ui/BookAppointmentButton/BookAppointmentButton";

// DashboardDoctor Component
const DashboardDoctor = ({
  variant = "content",
  active = false,
  onClick = () => {},
  showBookButton = true,
}) => {
  //  Context values
  const { doctors, setDoctors } = usePatientDashboard();

  //  Local state
  const [searchTerm, setSearchTerm] = useState("");
  const [brokenImageIds, setBrokenImageIds] = useState(new Set());

  //  Load doctors from API
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

  const formatFee = (fee) =>
    fee === undefined || fee === null || String(fee) === ""
      ? "Not set"
      : `${fee} $`;

  // Filter doctors by search
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

  //Render tab button
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

  // Do not render content if tab is inactive
  if (!active) return null;

  // Main UI
  return (
    <div className="card">
      <div className="card-header doctor-header"></div>

      <div className="admin-doctors">
        <div className="section-content">
          {/* Header */}
          <div className="admin-doctors-header">
            <div className="admin-doctors-header-left">
              <h2>Doctors</h2>
              <span className="doctors-count">
                {filteredDoctors.length} doctor
                {filteredDoctors.length !== 1 ? "s" : ""}
              </span>
            </div>

            {/* Search */}
            <div className="admin-doctors-header-right">
              <div className="search-container">
                <FaSearch className="search-icon" />
                <input
                  type="text"
                  placeholder="Search by name or specialty..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>
            </div>
          </div>

          {/* Doctors cards */}
          <div className="cards-grid">
            {filteredDoctors.length > 0 ? (
              filteredDoctors.map((doctor) => (
                <div key={doctor.id} className="doctor-card">
                  {/* Doctor image */}
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

                      // Fallback icon if image fails
                      return (
                        <span className="doctor-photo-icon">
                          <FaUserDoctor />
                        </span>
                      );
                    })()}
                  </div>

                  {/* Doctor info */}
                  <div className="doctor-description">
                    <div className="doctor-name">
                      <span className="label">Name:</span>
                      <span className="value">
                        {doctor.firstName} {doctor.lastName}
                      </span>
                    </div>

                    <div className="doctor-info-grid">
                      <div className="info-row">
                        <span className="label">Specialty:</span>
                        <span className="value">{doctor.specialization}</span>
                      </div>

                      <div className="info-row">
                        <span className="label">Experience:</span>
                        <span className="value">
                          {doctor.experience !== undefined
                            ? `${doctor.experience} years`
                            : "Not added yet"}
                        </span>
                      </div>

                      <div className="info-row">
                        <span className="label">Fee:</span>
                        <span className="value">{formatFee(doctor.fee)}</span>
                      </div>

                      <div className="info-row">
                        <span className="label">Phone:</span>
                        <span className="value">
                          {doctor.phone || "Not added yet"}
                        </span>
                      </div>
                    </div>

                    {/* Book appointment button */}
                    {showBookButton && (
                      <PatientBookAppointmentButton doctorId={doctor.id} />
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
