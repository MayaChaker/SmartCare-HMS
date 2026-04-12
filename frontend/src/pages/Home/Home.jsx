import "./Home.css";

// Icons used in the features section
import { FaUserDoctor, FaClipboardUser } from "react-icons/fa6";
import { GrUserExpert } from "react-icons/gr";
import {
  RiBarChart2Line,
  RiShieldCheckLine,
  RiSmartphoneLine,
} from "react-icons/ri";

// Reusable components
import Hero from "../../components/Hero/Hero";
import Footer from "../../components/Footer/Footer";
import Navbar from "../../components/Navbar/Navbar";

const Home = () => {
  return (
    <div className="homepage" id="top">
      {/* Top navigation bar */}
      <Navbar />

      <main className="homepage-main">
        {/* Hero section at the top of the page */}
        <Hero />

        {/* ======================================================
           FEATURES SECTION
           ====================================================== */}
        <div className="features" id="features">
          <div className="features-container">
            {/* Section title */}
            <div className="section-header">
              <h2>What you can do</h2>
            </div>

            {/* Grid of all feature cards */}
            <div className="features-grid">
              {/* Each card represents one feature of the HMS */}
              <div className="feature-card">
                <div className="feature-icon">
                  <FaClipboardUser />
                </div>
                <h3>Patients</h3>
                <p>View and update patient details and history</p>
              </div>

              <div className="feature-card">
                <div className="feature-icon">
                  <GrUserExpert />
                </div>
                <h3>Appointments</h3>
                <p>Book, change, and track visits</p>
              </div>

              <div className="feature-card">
                <div className="feature-icon">
                  <FaUserDoctor />
                </div>
                <h3>For doctors</h3>
                <p>See your patients, visits, and notes</p>
              </div>

              <div className="feature-card">
                <div className="feature-icon">
                  <RiBarChart2Line />
                </div>
                <h3>Reports</h3>
                <p>Simple charts to understand activity</p>
              </div>

              <div className="feature-card">
                <div className="feature-icon">
                  <RiShieldCheckLine />
                </div>
                <h3>Private and secure</h3>
                <p>Your data is protected</p>
              </div>

              <div className="feature-card">
                <div className="feature-icon">
                  <RiSmartphoneLine />
                </div>
                <h3>Works on mobile</h3>
                <p>Use it on phone, tablet, or computer</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer at the bottom of the page */}
      <Footer />
    </div>
  );
};

export default Home;
