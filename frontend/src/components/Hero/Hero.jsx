import { useEffect, useState } from "react";
import "./Hero.css";

const Hero = () => {
  // Controls the slide-in animation when the hero loads
  const [mounted, setMounted] = useState(false);

  // Controls the underline animation for "Made Simple"
  const [underlineActive, setUnderlineActive] = useState(false);

  useEffect(() => {
    // Trigger slide-in animation
    setMounted(true);

    // Start underline animation immediately
    setUnderlineActive(true);

    // Toggle underline every 3 seconds (infinite loop animation)
    const id = setInterval(() => {
      setUnderlineActive((v) => !v);
    }, 3000);

    // Cleanup interval when component unmounts
    return () => clearInterval(id);
  }, []);

  return (
    <section className="hero home-hero">
      <div className="hero-container">
        {/* Apply slide-in animation class only after mount */}
        <div className={`hero-content ${mounted ? "is-mounted" : ""}`}>
          <div className="hero-text">
            {/* Main title */}
            <h1 id="home-hero-title" className="hero-title">
              Hospital Care Made Simple
              {/* Highlight + animated underline */}
              <span
                className={`hero-highlight ${
                  underlineActive ? "underline-active" : ""
                }`}
              >
                {" "}
                For Everyone
              </span>
            </h1>

            {/* Subtitle text */}
            <p className="hero-description">
              Keep track of patients, visits, and records in one place.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
