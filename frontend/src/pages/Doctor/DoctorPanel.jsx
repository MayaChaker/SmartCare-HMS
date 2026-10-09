import { useEffect, useState } from "react";
import PortalLayout from "../../components/portal/PortalLayout";
import Loader from "../../components/Loader";
import TodaySection from "../../components/portal/doctor/TodaySection";
import VisitSection from "../../components/portal/doctor/VisitSection";
import ScheduleSection from "../../components/portal/doctor/ScheduleSection";
import PatientsSection from "../../components/portal/doctor/PatientsSection";
import DoctorProfileSection from "../../components/portal/doctor/DoctorProfileSection";
import { doctorName } from "../../components/portal/format";
import { ui } from "../../components/portal/ui";
import useDoctorPortal from "../../hooks/useDoctorPortal";
import useNow from "../../hooks/useNow";
import { departmentPlace } from "../../content/portal";

const SECTIONS = [
  { id: "today", label: "Today" },
  { id: "schedule", label: "Schedule" },
  { id: "patients", label: "Patients" },
  { id: "profile", label: "Profile" },
];

// The hash names the view: #today, #schedule, #patients, #profile, or #visit-123 for one visit.
// It survives a refresh and the back button works.
const viewFromHash = () => {
  const hash = window.location.hash.slice(1);
  const visit = hash.match(/^visit-(\d+)$/);
  if (visit) return { id: "visit", visitId: Number(visit[1]) };
  return { id: SECTIONS.some((s) => s.id === hash) ? hash : "today" };
};

// Doctor portal
export default function DoctorPanel() {
  const portal = useDoctorPortal();
  const now = useNow();
  const [view, setView] = useState(viewFromHash);
  const [focusPatientId, setFocusPatientId] = useState(null);

  useEffect(() => {
    const onHashChange = () => {
      setView(viewFromHash());
      window.scrollTo({ top: 0 });
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const openVisit = (id) => {
    window.location.hash = `visit-${id}`;
  };
  const openPatient = (id) => {
    setFocusPatientId(id);
    window.location.hash = "patients";
  };

  const { profile } = portal;
  const active = view.id === "visit" ? "today" : view.id;

  return (
    <PortalLayout
      sections={SECTIONS}
      active={active}
      userName={profile.lastName ? doctorName(profile) : "Doctor"}
      userDetail={profile.specialization}
      photo={profile.id ? profile : null}
      homeLabel="doctor portal, today"
      strip={profile.specialization ? departmentPlace(profile.specialization) : "SmartCare Private Hospital"}
    >
      {portal.status === "loading" && <Loader label="Loading your day…" />}
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
        <>
          {view.id === "today" && <TodaySection portal={portal} now={now} onOpenVisit={openVisit} />}
          {view.id === "visit" && <VisitSection key={view.visitId} portal={portal} visitId={view.visitId} onDone={() => (window.location.hash = "today")} />}
          {view.id === "schedule" && <ScheduleSection portal={portal} now={now} onOpenPatient={openPatient} />}
          {view.id === "patients" && <PatientsSection key={focusPatientId || "all"} portal={portal} now={now} focusPatientId={focusPatientId} />}
          {view.id === "profile" && <DoctorProfileSection portal={portal} />}
        </>
      )}
    </PortalLayout>
  );
}
