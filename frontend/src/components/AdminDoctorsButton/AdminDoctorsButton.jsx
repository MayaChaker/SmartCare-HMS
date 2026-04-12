import React, { useState, useMemo } from "react";
import { FaSearch } from "react-icons/fa";
import { FaUserDoctor } from "react-icons/fa6";
import "./AdminDoctorsButton.css";

import { useAdmin } from "../../context/AdminContext";
import { resolveDoctorImage } from "../../utils/schedule";
import { AdminNavItem } from "../../pages/Admin/AdminPanel";
import BookAppointmentButton from "../ui/BookAppointmentButton/BookAppointmentButton";

const AdminDoctorsButton = ({
  renderContent = false,
  showBookButton = false,
  onSelectDoctor,
}) => {
  const { activeSection, setActiveSection, doctors, openModal } = useAdmin();
  const isActive = activeSection === "doctors";
  // Search input
  const [searchTerm, setSearchTerm] = useState("");
  // Names you want to hide from the list
  const excludedNames = useMemo(
    () => new Set(["", "dr. demo", "dr demo"]),
    []
  );

  // Track doctors whose image failed to load
  const [brokenImageIds, setBrokenImageIds] = useState(new Set());

  // Filter doctors based on search term
  const filteredDoctors = useMemo(() => {
    // If user didn't type anything, return all doctors
    if (!searchTerm.trim()) return doctors;

    const search = searchTerm.toLowerCase();

    // Return doctors where name OR specialization OR phone matches search text
    return doctors.filter((doctor) => {
      const fullName = `${doctor.firstName} ${doctor.lastName}`.toLowerCase();
      const specialization = doctor.specialization?.toLowerCase() || "";
      const phone = doctor.phone?.toLowerCase() || "";

      return (
        fullName.includes(search) ||
        specialization.includes(search) ||
        phone.includes(search)
      );
    });
  }, [doctors, searchTerm]);

  // Hide excluded doctors
  const visibleDoctors = useMemo(() => {
    return filteredDoctors.filter((d) => {
      const name = `${(d.firstName || "").trim()} ${(d.lastName || "").trim()}`
        .trim()
        .toLowerCase();

      return !excludedNames.has(name);
    });
  }, [filteredDoctors, excludedNames]);

  return (
    <>
      {/* Sidebar button*/}
      {!renderContent && (
        <AdminNavItem
          active={isActive}
          onClick={() => setActiveSection("doctors")}
          icon={<FaUserDoctor />}
          label="Doctors"
        />
      )}

      {/* Main doctors content */}
      {renderContent && isActive && (
        <div className="admin-doctors">
          <div className="section-content">
            {/* Header + search */}
            <div className="admin-doctors-header">
              <div className="admin-doctors-header-left">
                <h2>Doctors</h2>

                {/* Doctors count */}
                <span className="doctors-count">
                  {visibleDoctors.length} doctor
                  {visibleDoctors.length !== 1 ? "s" : ""}
                </span>
              </div>

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

            {/* Cards grid */}
            <div className="cards-grid">
              {/* If we have doctors, render cards */}
              {visibleDoctors && visibleDoctors.length > 0 ? (
                visibleDoctors.map((doctor) => {
                  //  Helpers for readability
                  const fullName = `${doctor.firstName} ${doctor.lastName}`;
                  const imgSrc = resolveDoctorImage(doctor);
                  const isBroken = brokenImageIds.has(doctor.id);

                  const experienceText =
                    doctor.experience !== undefined
                      ? `${doctor.experience} years`
                      : "Experienced";

                  const feeText =
                    doctor.fee !== undefined && doctor.fee !== null
                      ? `${doctor.fee} $`
                      : "N/A";

                  return (
                    <div key={doctor.id} className="doctor-card">
                      {/* Doctor image section */}
                      <div className="doctor-image">
                        {/* Show image if available and not broken */}
                        {imgSrc && !isBroken ? (
                          <img
                            src={imgSrc}
                            alt={fullName}
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
                        ) : (
                          // Fallback icon when no image
                          <span className="doctor-photo-icon">
                            <FaUserDoctor />
                          </span>
                        )}
                      </div>

                      {/* Doctor details */}
                      <div className="doctor-description">
                        {/* Name */}
                        <div className="doctor-name">
                          <span className="label">Name:</span>
                          <span className="value">{fullName}</span>
                        </div>

                        {/* Specialization */}
                        <div className="doctor-specialization">
                          <span className="label">Specialty:</span>
                          <span className="value">{doctor.specialization}</span>
                        </div>

                        {/* Experience */}
                        <div className="doctor-experience">
                          <span className="label">Experience:</span>
                          <span className="value">{experienceText}</span>
                        </div>

                        {/* Fee */}
                        <div className="doctor-fee">
                          <span className="label">Fee:</span>
                          <span className="value">{feeText}</span>
                        </div>

                        {/* Phone */}
                        <div className="doctor-phone">
                          <span className="label">Phone:</span>
                          <span className="value">{doctor.phone || "Not added yet"}</span>
                        </div>

                        {/* Optional: Book Appointment button */}
                        {showBookButton && (
                          <BookAppointmentButton
                            onClick={() => {
                              if (typeof onSelectDoctor === "function") {
                                onSelectDoctor(doctor.id);
                              }
                              if (typeof openModal === "function") {
                                openModal("book");
                              }
                            }}
                          />
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                // Empty state if no doctors
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
      )}
    </>
  );
};

export default AdminDoctorsButton;
