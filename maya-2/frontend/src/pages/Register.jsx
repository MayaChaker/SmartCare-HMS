import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/AuthPages.css";

const Register = () => {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    dob: "",
    contact: "",
    medicalHistory: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    // Validate password length
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    setLoading(true);

    try {
      const { confirmPassword, ...registrationData } = formData;
      const result = await register(registrationData);

      if (result.success) {
        navigate("/login", {
          state: { message: "Registration successful! Please log in." },
        });
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card auth-card--wide">
        <div className="auth-card__scroll">
          <div className="auth-header">
            <h1 className="auth-title">Create Your Account</h1>
          </div>

          {error && <div className="error-message">{error}</div>}

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="firstName">First Name</label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="First name"
                />
              </div>
              <div className="form-group">
                <label htmlFor="lastName">Last Name</label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Last name"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                id="username"
                name="username"
                type="text"
                required
                value={formData.username}
                onChange={handleChange}
                className="form-input"
                placeholder="Choose a username"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="form-input"
                placeholder="Enter password (min 6 characters)"
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                className="form-input"
                placeholder="Confirm your password"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="dob">Date of Birth</label>
                <input
                  id="dob"
                  name="dob"
                  type="date"
                  required
                  value={formData.dob}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label htmlFor="contact">Contact Number</label>
                <input
                  id="contact"
                  name="contact"
                  type="tel"
                  required
                  value={formData.contact}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Your phone number"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="medicalHistory">Medical History (Optional)</label>
              <textarea
                id="medicalHistory"
                name="medicalHistory"
                rows={3}
                value={formData.medicalHistory}
                onChange={handleChange}
                className="form-textarea"
                placeholder="Any relevant medical history..."
              />
              <p className="medical-history-note">
                Already have an account?{" "}
                <Link to="/login" className="auth-link">
                  Sign in
                </Link>
              </p>
            </div>

            <button type="submit" disabled={loading} className="auth-button">
              {loading ? (
                <div className="loading-spinner">
                  <div className="spinner">
                    <div className="dot"></div>
                    <div className="dot"></div>
                    <div className="dot"></div>
                  </div>
                  Creating account...
                </div>
              ) : (
                "Create Account"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;
