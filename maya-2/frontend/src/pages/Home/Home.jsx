import "./Home.css";
import { FaUserDoctor, FaClipboardUser } from "react-icons/fa6";
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
      </main>
      <Footer />
    </div>
  );
};

export default Home;
