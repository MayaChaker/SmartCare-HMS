import React from "react";
import { Link } from "react-router-dom";
import { RiBarChart2Line } from "react-icons/ri";
import { FaUserDoctor } from "react-icons/fa6";
import { FaCalendarDay } from "react-icons/fa";
import "./Hero.css";

const Hero = ({ user, getDashboardRoute }) => {
  return (
    <section className="hero home-hero" aria-labelledby="home-hero-title">
      <div className="hero-container" role="region">
        <div className="hero-content">
          <div className="hero-text">
            <h1 id="home-hero-title" className="hero-title">
              Modern Healthcare Management
              <span className="hero-highlight"> Made Simple</span>
            </h1>
            <p className="hero-description">
              Streamline your healthcare operations with our comprehensive
              Hospital Management System. Manage patients, appointments, medical
              records, and more with ease.
            </p>
          </div>
          <div className="hero-actions">
            {user && (
              <Link to={getDashboardRoute()} className="btn btn-primary btn-large">
                Go to Dashboard
              </Link>
            )}
          </div>
        </div>
        <div className="hero-image" aria-hidden="true">
          <figure className="hero-graphic" aria-hidden="true">
            <div className="medical-icon">
              {/* Colorful gradient medical shield with white cross */}
              <svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">
                <defs>
                  <linearGradient id="heroIconGradientShield" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="50%" stopColor="#22d3ee" />
                    <stop offset="100%" stopColor="#10b981" />
                  </linearGradient>
                </defs>
                {/* Shield shape */}
                <path
                  d="M50 12 L78 22 V44 C78 62 66 76 50 84 C34 76 22 62 22 44 V22 Z"
                  fill="url(#heroIconGradientShield)"
                  stroke="rgba(255,255,255,0.9)"
                  strokeWidth="2"
                  vectorEffect="non-scaling-stroke"
                />
                {/* White medical cross */}
                <rect x="46" y="30" width="8" height="28" rx="4" ry="4" fill="rgba(255,255,255,0.96)" />
                <rect x="34" y="42" width="32" height="8" rx="4" ry="4" fill="rgba(255,255,255,0.96)" />
              </svg>
            </div>
            <div className="floating-cards">
              <div className="card-1"><RiBarChart2Line /> Analytics</div>
              <div className="card-2"><FaUserDoctor /> Doctors</div>
              <div className="card-3"><FaCalendarDay /> Appointments</div>
            </div>
          </figure>
        </div>
      </div>
    </section>
  );
};

export default Hero;