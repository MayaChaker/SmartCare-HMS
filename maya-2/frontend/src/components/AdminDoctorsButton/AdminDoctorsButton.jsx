import React, { useState, useMemo } from "react";
import { FaUserDoctor } from "react-icons/fa6";
import { FaSearch } from "react-icons/fa";
import "./AdminDoctorsButton.css";
import img1 from "../../assets/59239756731e80105879a4f15abefbab.jpg";
import img2 from "../../assets/6635f88e3ee5f110f84ab4bfe8b3348c.jpg";
import img3 from "../../assets/6b3fb44e59834adc67596dfece91e9ea.jpg";
import img4 from "../../assets/6dfaa9ca9823ddf1db998afe0fa894a1.jpg";
import img5 from "../../assets/76849d0f31b25beb912daa192a7b8351.jpg";
import img6 from "../../assets/bc57f308d01acd9160a8c49bb246b3d1.jpg";

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
  const doctorImages = [img1, img2, img3, img4, img5, img6];

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
                  {doctors.length} doctor{doctors.length !== 1 ? 's' : ''} in SmartCare
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
              {filteredDoctors && filteredDoctors.length > 0 ? (
                filteredDoctors.map((doctor, idx) => (
                  <div
                    key={doctor.id}
                    className="doctor-card"
                    style={{ display: "flex", flexDirection: "column" }}
                  >
                    <div className="doctor-image" style={{ height: "180px", width: "100%", overflow: "hidden" }}>
                      <img
                        src={
                          doctor.profileImage ||
                          doctor.photoUrl ||
                          doctorImages[idx % doctorImages.length] ||
                          `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(`${doctor.firstName || ''}-${doctor.lastName || ''}`)}&background=%23ffffff&radius=50`
                        }
                        alt={`${doctor.firstName} ${doctor.lastName}`}
                        className="doctor-photo"
                        style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center" }}
                      />
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