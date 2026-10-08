import "../../styles/site.css";

import SiteHeader from "../../components/site/SiteHeader";
import HeroSection from "../../components/site/HeroSection";
import CentersSection from "../../components/site/CentersSection";
import DoctorsSection from "../../components/site/DoctorsSection";
import ExperienceSection from "../../components/site/ExperienceSection";
import FacilitiesSection from "../../components/site/FacilitiesSection";
import BookingSection from "../../components/site/BookingSection";
import SiteFooter from "../../components/site/SiteFooter";

// Public website of the hospital
export default function Home() {
  return (
    <div className="site">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:bg-forest focus:px-4 focus:py-2 focus:text-ivory"
      >
        Skip to content
      </a>
      <SiteHeader />
      <main id="main">
        <HeroSection />
        <CentersSection />
        <DoctorsSection />
        <ExperienceSection />
        <FacilitiesSection />
        <BookingSection />
      </main>
      <SiteFooter />
    </div>
  );
}
