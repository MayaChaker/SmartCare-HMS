import { useEffect, useState } from "react";
import "./Hero.css";

const Hero = () => {
  const [mounted, setMounted] = useState(false);
  const [underlineActive, setUnderlineActive] = useState(false);
  useEffect(() => {
    setMounted(true);
    setUnderlineActive(true);
    const id = setInterval(() => {
      setUnderlineActive((v) => !v);
    }, 3000);
    return () => clearInterval(id);
  }, []);
  return (
    <section className="hero home-hero" data-mounted={mounted ? "true" : "false"}>
      <div className="hero-container">
        <div className={`hero-content ${mounted ? "is-mounted" : ""}`}>
          <div className="hero-text">
            <h1 id="home-hero-title" className="hero-title">
              Modern Healthcare Management
              <span className={`hero-highlight ${underlineActive ? "underline-active" : ""}`}> Made Simple</span>
            </h1>
            <p className="hero-description">
              Streamline your healthcare operations with our comprehensive
              Hospital Management System. Manage patients, appointments, medical
              records, and more with ease.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
