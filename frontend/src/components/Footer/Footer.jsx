import "./Footer.css";

const Footer = () => {
  const year = new Date().getFullYear();
  return (
    // Main footer wrapper
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-content">
          <div className="footer-brand">
            <h3>SmartCare</h3>
            <p>Simple hospital care management</p>
            <div className="footer-hospital">
              <h4>Hospital Info</h4>
              <address className="footer-address">
                SmartCare Hospital
                <br />
                Main Street, City Center
                <br />
                <a className="footer-link" href="tel:+10000000000">
                  +1 (000) 000-0000
                </a>
                <br />
                <a className="footer-link" href="mailto:info@smartcare-hms.com">
                  info@smartcare-hms.com
                </a>
              </address>
            </div>
          </div>

          <div className="footer-links">
            {/* Product section */}
            <div className="footer-section">
              <h4>Quick links</h4>
              <ul className="footer-list">
                <li>
                  <a className="footer-link" href="/#features">
                    What we offer
                  </a>
                </li>
                <li>
                  <a className="footer-link" href="/login">
                    Sign in
                  </a>
                </li>
                <li>
                  <a className="footer-link" href="/register">
                    Create account
                  </a>
                </li>
              </ul>
            </div>

            {/* Support section */}
            <div className="footer-section">
              <h4>Support</h4>
              <ul className="footer-list">
                <li>
                  <a
                    className="footer-link"
                    href="mailto:support@smartcare-hms.com"
                  >
                    Support Email
                  </a>
                </li>
                <li>
                  <a
                    className="footer-link"
                    href="mailto:support@smartcare-hms.com"
                  >
                    Contact
                  </a>
                </li>
                <li>
                  <a className="footer-link" href="http://localhost:5000/">
                    System status
                  </a>
                </li>
              </ul>
            </div>

            {/* Company section */}
            <div className="footer-section">
              <h4>Company</h4>
              <ul className="footer-list">
                <li>
                  <a className="footer-link" href="/#top">
                    About SmartCare
                  </a>
                </li>
                <li>
                  <a className="footer-link" href="/#top">
                    Privacy
                  </a>
                </li>
                <li>
                  <a className="footer-link" href="/#top">
                    Back to top
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom copyright line */}
        <div className="footer-bottom">
          <p>&copy; {year} SmartCare. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
