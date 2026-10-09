import { useEffect, useState } from "react";
import PageHead from "../PageHead";
import { ui } from "../ui";
import Loader, { BusyLabel } from "../../Loader";
import { clockTime } from "../doctor/chart";
import { ROLE_LABEL, activitySentence } from "./admin";
import { toLocalDateString } from "../../../utils/schedule";

const ROLES = ["", "receptionist", "doctor", "patient", "admin"];
const PAGE = 100;

const dayLabel = (moment, today) => {
  const ymd = toLocalDateString(new Date(moment));
  if (ymd === today) return "Today";
  return new Date(moment).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
};

// Who did what, and when. Newest first, by role, a page at a time.
export default function ActivitySection({ admin, now }) {
  const [role, setRole] = useState("");
  const [rows, setRows] = useState(null);
  const [more, setMore] = useState(false);
  const [busy, setBusy] = useState(false);
  const today = toLocalDateString(now);

  useEffect(() => {
    let cancelled = false;
    setRows(null);
    admin.getActivity({ role: role || undefined }).then((result) => {
      if (cancelled) return;
      setRows(result.success ? result.data : []);
      setMore(result.success && result.data.length === PAGE);
    });
    return () => {
      cancelled = true;
    };
    // admin.getActivity is a stable API function
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  const loadMore = async () => {
    setBusy(true);
    const result = await admin.getActivity({ role: role || undefined, before: rows[rows.length - 1].id });
    setBusy(false);
    if (result.success) {
      setRows((r) => [...r, ...result.data]);
      setMore(result.data.length === PAGE);
    }
  };

  // Group by day, keeping the order
  const groups = [];
  (rows || []).forEach((row) => {
    const label = dayLabel(row.createdAt, today);
    const last = groups[groups.length - 1];
    if (last?.label === label) last.rows.push(row);
    else groups.push({ label, rows: [row] });
  });

  return (
    <>
      <PageHead title="Activity" intro="Who did what, and when. Every booking, check-in, cancellation, visit note and account change is recorded and cannot be edited." />
      <div className={`${ui.page} pb-24`}>
        <div role="tablist" aria-label="Who" className="flex flex-wrap gap-x-7 gap-y-2 border-b border-ivory-line">
          {ROLES.map((r) => (
            <button
              key={r || "all"}
              type="button"
              role="tab"
              aria-selected={role === r}
              onClick={() => setRole(r)}
              className={`-mb-px border-b-2 py-3 text-[15px] ${role === r ? "border-forest text-ink" : "border-transparent text-muted hover:text-ink"}`}
            >
              {r ? ROLE_LABEL[r] : "Everyone"}
            </button>
          ))}
        </div>

        {rows === null ? (
          <Loader variant="section" label="Loading the activity…" className="py-10" />
        ) : rows.length === 0 ? (
          <p className="py-10 text-[16px] text-muted">Nothing recorded yet.</p>
        ) : (
          groups.map((group) => (
            <section key={group.label} className="pt-8">
              <h2 className="font-serif text-2xl text-muted">{group.label}</h2>
              <ol className="mt-3 border-t border-ivory-line">
                {group.rows.map((row) => (
                  <li key={row.id} className="grid grid-cols-[72px_minmax(0,1fr)] gap-x-5 gap-y-1 border-b border-ivory-line py-4 sm:grid-cols-[80px_minmax(0,1fr)_auto]">
                    <span className="text-[14px] text-muted tabular-nums">{clockTime(row.createdAt)}</span>
                    <p className="min-w-0 text-[16px]">
                      <span className="text-ink">{row.actorName}</span> <span className="text-muted">{activitySentence(row)}</span>
                      {row.detail && <span className="block text-[14px] text-muted">{row.detail}</span>}
                    </p>
                    <span className="col-start-2 text-[13px] text-muted sm:col-start-3 sm:text-right">{ROLE_LABEL[row.actorRole] || row.actorRole}</span>
                  </li>
                ))}
              </ol>
            </section>
          ))
        )}

        {more && (
          <button type="button" onClick={loadMore} disabled={busy} aria-busy={busy} className={`${ui.outline} mt-8 w-full`}>
            <BusyLabel busy={busy} busyText="Loading…" text="Show earlier activity" />
          </button>
        )}
        <p className="mt-6 text-[14px] text-muted">Only the administration can read the activity log.</p>
      </div>
    </>
  );
}
