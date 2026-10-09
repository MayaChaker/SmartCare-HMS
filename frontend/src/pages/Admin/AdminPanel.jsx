import { useEffect, useState } from "react";
import PortalLayout from "../../components/portal/PortalLayout";
import Loader from "../../components/Loader";
import OverviewSection from "../../components/portal/admin/OverviewSection";
import ActivitySection from "../../components/portal/admin/ActivitySection";
import DoctorsSection from "../../components/portal/admin/DoctorsSection";
import StaffSection from "../../components/portal/admin/StaffSection";
import { ui } from "../../components/portal/ui";
import useAdmin from "../../hooks/useAdmin";
import useNow from "../../hooks/useNow";
import { useAuth } from "../../context/useAuth";

const SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "activity", label: "Activity" },
  { id: "doctors", label: "Doctors" },
  { id: "staff", label: "Staff" },
];

const sectionFromHash = () => {
  const id = window.location.hash.slice(1);
  return SECTIONS.some((s) => s.id === id) ? id : "overview";
};

// Administration
export default function AdminPanel() {
  const admin = useAdmin();
  const now = useNow();
  const { user } = useAuth();
  const [active, setActive] = useState(sectionFromHash);

  useEffect(() => {
    const onHashChange = () => {
      setActive(sectionFromHash());
      window.scrollTo({ top: 0 });
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  return (
    <PortalLayout sections={SECTIONS} active={active} userName={user?.username || "Administration"} userDetail="Administration" homeLabel="administration" strip="Administration · Level 6">
      {admin.status === "loading" && <Loader label="Loading the administration…" />}
      {admin.status === "error" && (
        <div role="alert" className={`${ui.page} py-16`}>
          <p className="font-serif text-3xl text-ink">We could not load the administration.</p>
          <p className="mt-2 text-[15px] text-muted">Please check your connection and try again.</p>
          <button type="button" onClick={admin.reload} className={`${ui.primary} mt-6`}>
            Try again
          </button>
        </div>
      )}
      {admin.status === "ready" && (
        <>
          {active === "overview" && <OverviewSection admin={admin} now={now} />}
          {active === "activity" && <ActivitySection admin={admin} now={now} />}
          {active === "doctors" && <DoctorsSection admin={admin} />}
          {active === "staff" && <StaffSection admin={admin} now={now} me={user?.id} onDoctors={() => (window.location.hash = "doctors")} />}
        </>
      )}
    </PortalLayout>
  );
}
