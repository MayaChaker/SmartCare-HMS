import React, { useState, useMemo } from "react";
import { FaUserDoctor } from "react-icons/fa6";
import { FaSearch } from "react-icons/fa";
import "./AdminDoctorsButton.css";

const AdminDoctorsButton = ({
  activeSection,
  setActiveSection,
  renderContent = false,
  doctors = [],
  openModal,
  showBookButton = false,
  onSelectDoctor,
}) => {
  const isActive = activeSection === "doctors";
  const [searchTerm, setSearchTerm] = useState("");
  const excludedNames = new Set(["john doe"]);

  // Resolve stored photo URL to an absolute URL when it's a backend-served path
  const resolveDoctorImage = (doctor) => {
    const candidate = doctor.profileImage || doctor.photoUrl || '';
    if (candidate && candidate.startsWith('/uploads/')) {
      return `http://localhost:5000${candidate}`;
    }
    if (candidate) return candidate;
    return '';
  };

  // Filter doctors based on search term
  const filteredDoctors = useMemo(() => {
    if (!searchTerm.trim()) return doctors;
    
    return doctors.filter(doctor => {
      const fullName = `${doctor.firstName} ${doctor.lastName}`.toLowerCase();
      const specialization = doctor.specialization?.toLowerCase() || '';
      const phone = doctor.phone?.toLowerCase() || '';
      const search = searchTerm.toLowerCase();
      
      return fullName.includes(search) || 
             specialization.includes(search) || 
             phone.includes(search);
    });
  }, [doctors, searchTerm]);
  const visibleDoctors = useMemo(() => {
    return filteredDoctors.filter(d => {
      const name = `${(d.firstName || '').trim()} ${(d.lastName || '').trim()}`.trim().toLowerCase();
      return !excludedNames.has(name);
    });
  }, [filteredDoctors]);
  
  return (
    <>
      {!renderContent && (
        <button
          className={`admin-nav-item ${isActive ? "active" : ""}`}
          onClick={() => setActiveSection("doctors")}
        >
          <span className="admin-nav-icon">
            <FaUserDoctor />
          </span>
          <span className="admin-nav-label">Doctors</span>
        </button>
      )}

      {renderContent && isActive && (
        <div className="admin-doctors">
          <div className="section-content">
            <div className="admin-doctors-header">
              <div className="admin-doctors-header-left">
                <h2>Doctors Management</h2>
                <span className="doctors-count">
                  {visibleDoctors.length} doctor{visibleDoctors.length !== 1 ? 's' : ''} in SmartCare
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
                visibleDoctors.map((doctor, idx) => (
                  <div
                    key={doctor.id}
                    className="doctor-card"
                    style={{ display: "flex", flexDirection: "column" }}
                  >
                    <div
                      className="doctor-image"
                      style={{
                        width: "100%",
                        height: 220,
                        background: "transparent",
                        overflow: "hidden",
                        borderTopLeftRadius: 20,
                        borderTopRightRadius: 20,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {(() => {
                        const src = resolveDoctorImage(doctor);
                        if (src) {
                          return (
                            <img
                              src={src}
                              alt={`${doctor.firstName} ${doctor.lastName}`}
                              className="doctor-photo"
                              loading="lazy"
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "contain",
                                objectPosition: "center top",
                                display: "block",
                                borderTopLeftRadius: 20,
                                borderTopRightRadius: 20,
                              }}
                            />
                          );
                        }
                        return (
                          <span className="doctor-photo-icon" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: "100%" }}>
                            <FaUserDoctor style={{ fontSize: 96, color: "#6b7280" }} />
                          </span>
                        );
                      })()}
                    </div>
                    <div
                      className="doctor-description"
                      style={{
                        width: "100%",
                        display: "flex",
                        flexDirection: "column",
                        gap: "10px",
                        padding: "20px",
                        flex: "1 1 auto",
                      }}
                    >
                      <div className="doctor-name" style={{ marginBottom: 0, display: "flex", alignItems: "flex-start", gap: "8px", whiteSpace: "normal", overflow: "visible", textOverflow: "clip" }}>
                        <span className="label">Name:</span>
                        <span className="value" style={{ whiteSpace: "normal", overflow: "visible", textOverflow: "clip" }}>{doctor.firstName} {doctor.lastName}</span>
                      </div>
                      <div className="doctor-specialization" style={{ marginBottom: 0, display: "flex", alignItems: "flex-start", gap: "8px", whiteSpace: "normal", overflow: "visible", textOverflow: "clip" }}>
                        <span className="label">Specialization:</span>
                        <span className="value" style={{ whiteSpace: "normal", overflow: "visible", textOverflow: "clip" }}>{doctor.specialization}</span>
                      </div>
                      <div className="doctor-experience" style={{ marginBottom: 0, display: "flex", alignItems: "flex-start", gap: "8px", whiteSpace: "normal", overflow: "visible", textOverflow: "clip" }}>
                        <span className="label">Experience:</span>
                        <span className="value" style={{ whiteSpace: "normal", overflow: "visible", textOverflow: "clip" }}>{doctor.experience !== undefined ? `${doctor.experience} years` : 'Experienced'}</span>
                      </div>
                      <div className="doctor-phone" style={{ marginBottom: 0, display: "flex", alignItems: "flex-start", gap: "8px", whiteSpace: "normal", overflow: "visible", textOverflow: "clip" }}>
                        <span className="label">Numbers:</span>
                        <span className="value" style={{ whiteSpace: "normal", overflow: "visible", textOverflow: "clip" }}>{doctor.phone}</span>
                      </div>
                      {showBookButton && (
                        <div className="doctor-actions">
                          <button
                            className="btn btn-primary"
                            type="button"
                            onClick={() => {
                              if (typeof onSelectDoctor === "function") {
                                onSelectDoctor(doctor.id);
                              }
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
                      : "No doctors found"
                    }
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminDoctorsButton;