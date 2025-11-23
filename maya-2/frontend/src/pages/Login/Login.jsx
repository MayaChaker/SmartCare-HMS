import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./Login.css";

const Login = () => {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
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
    setLoading(true);

    try {
      const result = await login(formData);

      if (result.success) {
        const userRole = result.data.user.role;
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
        setError(result.error);
      }
    } catch (_error) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container auth-container--login">
      <div className="auth-card auth-card--login">
        <div className="login-card">
          <div className="login-media">
            <img
              src="../src/assets/login.jpg"
              alt="Doctor with patient"
              className="login-image"
            />
          </div>
          <div className="login-body">
            <div className="auth-header">
              <Link to="/" className="brand-logo">SmartCare HMS</Link>
            </div>

            {error && <div className="error-message">{error}</div>}

            <form className="auth-form" onSubmit={handleSubmit}>
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
                <p className="login-note">
                  Don't have an account?{" "}
                  <Link to="/register" className="auth-link">
                    Create an account
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
                    Signing in...
                  </div>
                ) : (
                  "Sign In"
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;