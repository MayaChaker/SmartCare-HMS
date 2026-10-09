import { useEffect, useState } from "react";
import PortalLayout from "../../components/portal/PortalLayout";
import Loader from "../../components/Loader";
import HomeSection from "../../components/portal/patient/HomeSection";
import VisitsSection from "../../components/portal/patient/VisitsSection";
import BookSection from "../../components/portal/patient/BookSection";
import RecordsSection from "../../components/portal/patient/RecordsSection";
import ProfileSection from "../../components/portal/patient/ProfileSection";
import { patientNumber } from "../../components/portal/format";
import { ui } from "../../components/portal/ui";
import usePatientPortal from "../../hooks/usePatientPortal";
import { patientOffice } from "../../content/portal";
import { useAuth } from "../../context/useAuth";

const SECTIONS = [
  { id: "home", label: "Home", Component: HomeSection },
  { id: "visits", label: "Visits", Component: VisitsSection },
  { id: "book", label: "Book a visit", short: "Book", Component: BookSection },
  { id: "records", label: "Records", Component: RecordsSection },
  { id: "profile", label: "Profile", Component: ProfileSection },
];

// The section lives in the URL hash (#book, #records…), so it survives a refresh and the back button works
const sectionFromHash = () => {
  const id = window.location.hash.slice(1);
  return SECTIONS.some((s) => s.id === id) ? id : "home";
};

// Patient portal
export default function Dashboard() {
  const portal = usePatientPortal();
  const { user } = useAuth();
  const [active, setActive] = useState(sectionFromHash);
  // What to open a section with: a doctor or visit for Book, a visit's summary for Records
  const [intent, setIntent] = useState({ key: 0 });

  useEffect(() => {
    const onHashChange = () => {
      const id = sectionFromHash();
      // Keep the details only for the section they were meant for; a plain menu click starts fresh
      setIntent((current) => (current.section === id && current.fresh ? { ...current, fresh: false } : { key: current.key + 1 }));
      setActive(id);
      window.scrollTo({ top: 0 });
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const open = (id, details = {}) => {
    setIntent((current) => ({ key: current.key + 1, section: id, fresh: true, ...details }));
    if (window.location.hash === `#${id}`) {
      setActive(id);
      window.scrollTo({ top: 0 });
    } else {
      window.location.hash = id;
    }
  };

  const findDoctor = (id) => portal.doctors.find((d) => Number(d.id) === Number(id));
  const name = [portal.profile.firstName, portal.profile.lastName].filter(Boolean).join(" ") || user?.username || "Patient";
  const { Component } = SECTIONS.find((s) => s.id === active);

  const actions = {
    onReschedule: (visit) => open("book", { doctorId: visit.doctorId, moving: visit }),
    onRebook: (doctor) => open("book", { doctorId: doctor.id }),
    onOpenRecord: (appointmentId) => open("records", { appointmentId }),
  };

  return (
    <PortalLayout
      sections={SECTIONS}
      active={active}
      userName={name}
      userDetail={portal.profile.id ? `Patient ${patientNumber(portal.profile.id)}` : ""}
      homeLabel="patient portal home"
      strip={
        <>
          Private Patient Office · WhatsApp <span className="text-ivory tabular-nums">{patientOffice.whatsapp}</span> · {patientOffice.hours}
        </>
      }
    >
      {portal.status === "loading" && <Loader label="Loading your portal…" />}
      {portal.status === "error" && (
        <div role="alert" className={`${ui.page} py-16`}>
          <p className="font-serif text-3xl text-ink">We could not load your portal.</p>
          <p className="mt-2 text-[15px] text-muted">Please check your connection and try again.</p>
          <button type="button" onClick={portal.reload} className={`${ui.primary} mt-6`}>
            Try again
          </button>
        </div>
      )}
      {portal.status === "ready" && (
        <Component
          // A new key starts the section fresh when it is opened with new details
          key={`${active}-${intent.key}`}
          portal={portal}
          findDoctor={findDoctor}
          preset={active === "book" && intent.section === "book" ? intent : undefined}
          focusAppointmentId={active === "records" && intent.section === "records" ? intent.appointmentId : undefined}
          {...actions}
        />
      )}
    </PortalLayout>
  );
}
