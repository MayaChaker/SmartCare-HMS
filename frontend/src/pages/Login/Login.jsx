import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import "./Login.css";
import loginImage from "../../assets/login.jpg";

// Public demo accounts; the buttons only appear when VITE_DEMO_PASSWORD is set
const DEMO_PASSWORD = import.meta.env.VITE_DEMO_PASSWORD;
const DEMO_ACCOUNTS = [
  { label: "Patient", username: "demo.patient" },
  { label: "Doctor", username: "dr.karim.mansour" },
  { label: "Receptionist", username: "demo.reception" },
  { label: "Admin", username: "demo.admin" },
];

const Login = () => {
  // Store the form input values
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  // Error message + loading state
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Auth context → login function
  const { login } = useAuth();

  // React Router navigation
  const navigate = useNavigate();

  // Handle input change for username/password fields
  const handleChange = (e) => {
    setFormData({
      ...formData, // keep existing fields
      [e.target.name]: e.target.value, // update only the edited field
    });
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault(); // prevent page refresh
    signIn(formData.username, formData.password);
  };

  const signIn = async (rawUsername, rawPassword) => {
    setError("");
    setLoading(true); // show loading state

    try {
      const username = String(rawUsername || "").trim();
      const password = String(rawPassword || "").trim();
      if (!username || !password) {
        setError("Please enter username and password");
        setLoading(false);
        return;
      }
      // Attempt login through Auth context
      const result = await login({ username, password });

      if (result.success) {
        // Extract user role for correct redirection
        const userRole = result.data.user.role;

        // Redirect user based on role
        switch (userRole) {
          case "admin":
            navigate("/admin");
            break;
          case "doctor":
            navigate("/doctor");
            break;
          case "receptionist":
            navigate("/receptionist");
            break;
          case "patient":
            navigate("/dashboard");
            break;
          default:
            navigate("/dashboard");
        }
      } else {
        // Show API error (wrong credentials, etc.)
        setError(result.error);
      }
    } catch {
      // Catch unexpected failure
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container auth-container--login">
      <div className="auth-card auth-card--login">
        {/* Login card layout: image + form */}
        <div className="login-card">
          {/* Left side image */}
          <div className="login-media">
            <img
              src={loginImage}
              alt="Doctor with patient"
              className="login-image"
            />
          </div>

          {/* Right side login form */}
          <div className="login-body">
            {/* Brand/logo */}
            <div className="auth-header">
              <Link to="/" className="brand-logo">
                SmartCare
              </Link>
            </div>

            {/* Display error message if exists */}
            {error && <div className="error-message">{error}</div>}

            {/* Login form */}
            <form className="auth-form" onSubmit={handleSubmit}>
              {/* Username input */}
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
                  placeholder="Your username"
                />
              </div>

              {/* Password input */}
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
                  placeholder="Your password"
                />

                {/* Registration link */}
                <p className="login-note">
                  Don't have an account?{" "}
                  <Link to="/register" className="auth-link">
                    Create an account
                  </Link>
                </p>
              </div>

              {/* Submit button */}
              <button type="submit" disabled={loading} className="auth-button">
                Sign In
              </button>
            </form>

            {DEMO_PASSWORD && (
              <div className="demo-accounts">
                <p className="demo-accounts-title">Try the demo as</p>
                <div className="demo-accounts-buttons">
                  {DEMO_ACCOUNTS.map((account) => (
                    <button
                      key={account.username}
                      type="button"
                      className="demo-account-button"
                      disabled={loading}
                      onClick={() => signIn(account.username, DEMO_PASSWORD)}
                    >
                      {account.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
