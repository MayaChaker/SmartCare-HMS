import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import "./Register.css";
import loginImage from "../../assets/login.jpg";

const Register = () => {
  // Form data for all input fields
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    dob: "",
    contact: "",
  });

  // Error + loading states
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Auth context function
  const { register } = useAuth();

  // Router navigation
  const navigate = useNavigate();

  // Used for animation when component loads
  const [entered, setEntered] = useState(false);

  // Trigger card animation on mount
  useEffect(() => {
    setEntered(true);
  }, []);

  // Update form data when user types in inputs
  const handleChange = (e) => {
    setFormData({
      ...formData, // keep existing fields
      [e.target.name]: e.target.value, // update only the changed field
    });
  };

  // Form submission logic
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const clean = {
      ...formData,
      username: String(formData.username || "").trim(),
      firstName: String(formData.firstName || "").trim(),
      lastName: String(formData.lastName || "").trim(),
      contact: String(formData.contact || "").trim(),
    };

    if (clean.username.length < 3) {
      setError("Username must be at least 3 characters long");
      return;
    }

    const contactDigits = clean.contact.replace(/\D/g, "");
    if (contactDigits.length < 7) {
      setError("Please enter a valid contact number");
      return;
    }

    // Basic validation — passwords must match
    if (clean.password !== clean.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    // Basic validation — minimum password length
    if (String(clean.password || "").length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    setLoading(true);

    try {
      // Remove confirmPassword before submitting to backend
      const { confirmPassword: CONFIRM_PASSWORD, ...registrationData } = clean;

      // Call register function from auth context
      const result = await register(registrationData);

      if (result.success) {
        // Redirect to patient dashboard after successful account creation
        navigate("/dashboard");
      } else {
        setError(result.error);
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container auth-container--register">
      {/* Card with animation when page enters */}
      <div
        className={`auth-card auth-card--register${entered ? " entered" : ""}`}
      >
        <div className="register-card">
          {/* Left side image */}
          <div className="register-media">
            <img
              src={loginImage}
              alt="Doctor with patient"
              className="register-image"
            />
          </div>

          {/* Right side form */}
          <div className="register-body">
            {/* App name / logo */}
            <div className="auth-header">
              <Link to="/" className="brand-logo">
                SmartCare
              </Link>
            </div>

            {/* Error message container */}
            <div className={`error-message${error ? " visible" : ""}`}>
              {error}
            </div>

            {/* Registration form */}
            <form className="auth-form" onSubmit={handleSubmit}>
              {/* Row: first name + last name */}
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

              {/* Username field */}
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

              {/* Password field */}
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

              {/* Confirm password */}
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

              {/* Row: date of birth + contact */}
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

              {/* Sign-in link for existing users */}
              <p className="medical-history-note">
                Already have an account?{" "}
                <Link to="/login" className="auth-link">
                  Sign in
                </Link>
              </p>

              {/* Submit button */}
              <button
                type="submit"
                disabled={loading}
                className={`auth-button${loading ? " loading" : ""}`}
              >
                Create Account
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
