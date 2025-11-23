import "./Home.css";
import {
  FaUserDoctor,
  FaUserTie,
  FaUserInjured,
  FaClipboardUser,
} from "react-icons/fa6";
import { RiAdminLine, RiCheckLine } from "react-icons/ri";
import { GrUserExpert } from "react-icons/gr";
import {
  RiBarChart2Line,
  RiShieldCheckLine,
  RiSmartphoneLine,
} from "react-icons/ri";
import Hero from "../../components/Hero/Hero";
import Footer from "../../components/Footer/Footer";
import Navbar from "../../components/Navbar/Navbar";

const Home = () => {
  return (
    <div className="homepage">
      <Navbar />

      <main className="homepage-main">
        {/* Hero Section */}
        <Hero />

        {/* Features Section */}
        <div className="features">
          <div className="features-container">
            <div className="section-header">
              <h2>Comprehensive Healthcare Solutions</h2>
            </div>
            <div className="features-grid">
              <div className="feature-card">
                <div className="feature-icon">
                  <FaClipboardUser />
                </div>
                <h3>Patient Management</h3>
                <p>
                  Complete patient profiles, medical history, and treatment
                  tracking
                </p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">
                  <GrUserExpert />
                </div>
                <h3>Appointment Scheduling</h3>
                <p>
                  Smart scheduling system with automated reminders and
                  notifications
                </p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">
                  <FaUserDoctor />
                </div>
                <h3>Doctor Portal</h3>
                <p>
                  Dedicated interface for doctors to manage patients and medical
                  records
                </p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">
                  <RiBarChart2Line />
                </div>
                <h3>Analytics Dashboard</h3>
                <p>Real-time insights and reports for better decision making</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">
                  <RiShieldCheckLine />
                </div>
                <h3>Secure & Compliant</h3>
                <p>HIPAA compliant with advanced security measures</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">
                  <RiSmartphoneLine />
                </div>
                <h3>Mobile Responsive</h3>
                <p>Access your system from any device, anywhere, anytime</p>
              </div>
            </div>
          </div>
        </div>

        {/* User Roles Section */}
        <div className="roles">
          <div className="roles-container">
            <div className="section-header">
              <h2>Built for Every Healthcare Professional</h2>
            </div>
            <div className="roles-grid">
              <div className="role-card">
                <div className="role-icon">
                  <RiAdminLine />
                </div>
                <h3>Admin Panel</h3>
                <p>
                  Complete system control with user management, analytics, and
                  configuration settings
                </p>
                <ul className="role-list">
                  <li>
                    <span className="list-icon">
                      <RiCheckLine />
                    </span>
                    User Management
                  </li>
                  <li>
                    <span className="list-icon">
                      <RiCheckLine />
                    </span>
                    System Analytics
                  </li>
                  <li>
                    <span className="list-icon">
                      <RiCheckLine />
                    </span>
                    Configuration
                  </li>
                  <li>
                    <span className="list-icon">
                      <RiCheckLine />
                    </span>
                    Reports
                  </li>
                </ul>
              </div>
              <div className="role-card">
                <div className="role-icon">
                  <FaUserTie />
                </div>
                <h3>Receptionist Console</h3>
                <p>
                  Front desk tools to manage appointments, check-ins, and
                  patient queries
                </p>
                <ul className="role-list">
                  <li>
                    <span className="list-icon">
                      <RiCheckLine />
                    </span>{" "}
                    Appointment Booking
                  </li>
                  <li>
                    <span className="list-icon">
                      <RiCheckLine />
                    </span>{" "}
                    Patient Check-in
                  </li>
                  <li>
                    <span className="list-icon">
                      <RiCheckLine />
                    </span>{" "}
                    Manage Schedules
                  </li>
                  <li>
                    <span className="list-icon">
                      <RiCheckLine />
                    </span>{" "}
                    Notifications
                  </li>
                </ul>
              </div>
              <div className="role-card">
                <div className="role-icon">
                  <FaUserDoctor />
                </div>
                <h3>Doctor Dashboard</h3>
                <p>
                  Comprehensive patient management with medical records and
                  appointment scheduling
                </p>
                <ul className="role-list">
                  <li>
                    <span className="list-icon">
                      <RiCheckLine />
                    </span>{" "}
                    Patient Records
                  </li>
                  <li>
                    <span className="list-icon">
                      <RiCheckLine />
                    </span>{" "}
                    Appointment Management
                  </li>
                  <li>
                    <span className="list-icon">
                      <RiCheckLine />
                    </span>{" "}
                    Medical History
                  </li>
                  <li>
                    <span className="list-icon">
                      <RiCheckLine />
                    </span>{" "}
                    Prescriptions
                  </li>
                </ul>
              </div>
              <div className="role-card">
                <div className="role-icon">
                  <FaUserInjured />
                </div>
                <h3>Patient Portal</h3>
                <p>
                  Easy access to personal health information and appointment
                  booking
                </p>
                <ul className="role-list">
                  <li>
                    <span className="list-icon">
                      <RiCheckLine />
                    </span>{" "}
                    Book Appointments
                  </li>
                  <li>
                    <span className="list-icon">
                      <RiCheckLine />
                    </span>{" "}
                    View Medical Records
                  </li>
                  <li>
                    <span className="list-icon">
                      <RiCheckLine />
                    </span>{" "}
                    Profile Management
                  </li>
                  <li>
                    <span className="list-icon">
                      <RiCheckLine />
                    </span>{" "}
                    Notifications
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Home;
