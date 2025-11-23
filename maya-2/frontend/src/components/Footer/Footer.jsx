
import "./Footer.css";

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-content">
          <div className="footer-brand">
            <h3>SmartCare HMS</h3>
            <p>Modern Healthcare Management System</p>
          </div>
          <div className="footer-links">
            <div className="footer-section">
              <h4>Product</h4>
              <ul className="footer-list">
                <li>Features</li>
                <li>Pricing</li>
                <li>Security</li>
              </ul>
            </div>
            <div className="footer-section">
              <h4>Support</h4>
              <ul className="footer-list">
                <li>Help Center</li>
                <li>Contact</li>
                <li>Documentation</li>
              </ul>
            </div>
            <div className="footer-section">
              <h4>Company</h4>
              <ul className="footer-list">
                <li>About</li>
                <li>Careers</li>
                <li>Privacy</li>
              </ul>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2024 SmartCare HMS. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;