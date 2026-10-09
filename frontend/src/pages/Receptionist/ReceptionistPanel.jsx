import { useEffect, useState } from "react";
import PortalLayout from "../../components/portal/PortalLayout";
import Loader from "../../components/Loader";
import DeskSection from "../../components/portal/desk/DeskSection";
import DeskBookSection from "../../components/portal/desk/DeskBookSection";
import DeskVisitsSection from "../../components/portal/desk/DeskVisitsSection";
import DeskPatientsSection from "../../components/portal/desk/DeskPatientsSection";
import { ui } from "../../components/portal/ui";
import useFrontDesk from "../../hooks/useFrontDesk";
import useNow from "../../hooks/useNow";
import { useAuth } from "../../context/useAuth";
import { patientOffice } from "../../content/portal";
import { toLocalDateString } from "../../utils/schedule";

const SECTIONS = [
  { id: "desk", label: "Desk" },
  { id: "book", label: "Book a visit", short: "Book" },
  { id: "visits", label: "Visits" },
  { id: "patients", label: "Patients" },
];

const sectionFromHash = () => {
  const id = window.location.hash.slice(1);
  return SECTIONS.some((s) => s.id === id) ? id : "desk";
};

// Front desk
export default function ReceptionistPanel() {
  const desk = useFrontDesk();
  const now = useNow();
  const { user } = useAuth();
  const [active, setActive] = useState(sectionFromHash);
  // Details a section is opened with (a slot or visit for Book, a patient for Patients); a menu click starts fresh
  const [intent, setIntent] = useState({ key: 0 });

  useEffect(() => {
    const onHashChange = () => {
      const id = sectionFromHash();
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

  const todayYmd = toLocalDateString(now);
  const fresh = (id) => (intent.section === id ? intent : {});

  return (
    <PortalLayout
      sections={SECTIONS}
      active={active}
      userName={user?.username || "Front desk"}
      userDetail="Front desk"
      homeLabel="front desk"
      strip={
        <>
          Main reception · Ground floor · Private Patient Office <span className="text-ivory tabular-nums">{patientOffice.phone}</span>
        </>
      }
    >
      {desk.status === "loading" && <Loader label="Loading the desk…" />}
      {desk.status === "error" && (
        <div role="alert" className={`${ui.page} py-16`}>
          <p className="font-serif text-3xl text-ink">We could not load the desk.</p>
          <p className="mt-2 text-[15px] text-muted">Please check your connection and try again.</p>
          <button type="button" onClick={desk.reload} className={`${ui.primary} mt-6`}>
            Try again
          </button>
        </div>
      )}
      {desk.status === "ready" && (
        <>
          {active === "desk" && (
            <DeskSection
              desk={desk}
              now={now}
              onBook={(doctorId, time) => open("book", { doctorId, date: todayYmd, time })}
              onMove={(visit) => open("book", { moving: visit })}
            />
          )}
          {active === "book" && <DeskBookSection key={intent.key} desk={desk} preset={fresh("book")} onFinished={() => open("desk")} />}
          {active === "visits" && (
            <DeskVisitsSection
              key={intent.key}
              desk={desk}
              now={now}
              onMove={(visit) => open("book", { moving: visit })}
              onOpenPatient={(patientId) => open("patients", { patientId })}
            />
          )}
          {active === "patients" && (
            <DeskPatientsSection
              key={intent.key}
              desk={desk}
              focusPatientId={fresh("patients").patientId}
              onBook={(patientId) => open("book", { patientId })}
              onNewFile={() => open("book", { newFile: true })}
            />
          )}
        </>
      )}
    </PortalLayout>
  );
}
