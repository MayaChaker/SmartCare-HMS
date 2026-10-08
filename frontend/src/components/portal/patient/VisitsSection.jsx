import { useState } from "react";
import DoctorAvatar from "../DoctorAvatar";
import StatusBadge from "../StatusBadge";
import CancelDialog from "../CancelDialog";
import PageHead from "../PageHead";
import { byDateTime, doctorName, formatDate, formatTime, isUpcoming } from "../format";
import { ui } from "../ui";

function VisitRow({ visit, doctor, hasSummary, onCancel, onReschedule, onRebook, onOpenRecord }) {
  const [cancelling, setCancelling] = useState(false);
  const muted = visit.status === "cancelled" || visit.status === "no-show";
  const canChange = visit.status === "scheduled" && isUpcoming(visit);

  return (
    <li className="grid grid-cols-[56px_minmax(0,1fr)] items-start gap-x-5 gap-y-4 border-b border-ivory-line py-7 sm:grid-cols-[72px_64px_minmax(0,1fr)_auto] sm:items-center sm:gap-x-7">
      <div className="text-center">
        <p className={`font-serif text-5xl leading-none ${muted ? "text-muted" : "text-ink"}`}>{formatDate(visit.appointmentDate, { day: "numeric" })}</p>
        <p className="mt-1 text-[13px] text-muted">{formatDate(visit.appointmentDate, { weekday: "short" })}</p>
      </div>
      <span className={`hidden sm:block ${muted ? "opacity-60" : ""}`}>
        <DoctorAvatar doctor={doctor} size={64} />
      </span>
      <div className="min-w-0">
        <p className="font-serif text-[26px] leading-tight text-ink">{doctor ? doctorName(doctor) : visit.doctorName}</p>
        <p className="text-[15px] text-muted">
          {doctor?.specialization || visit.specialty} · {formatTime(visit.appointmentTime)}
          {visit.reason ? ` · ${visit.reason}` : ""}
        </p>
        <p className="mt-2">
          <StatusBadge status={visit.status} />
        </p>
      </div>
      <div className="col-span-2 flex flex-wrap items-center gap-3 sm:col-span-1 sm:justify-end">
        {canChange && (
          <>
            <button type="button" onClick={() => onReschedule(visit)} className={ui.outline}>
              Reschedule
            </button>
            <button type="button" onClick={() => setCancelling(true)} className={ui.outline}>
              Cancel
            </button>
          </>
        )}
        {hasSummary && (
          <button type="button" onClick={() => onOpenRecord(visit.id)} className={ui.link}>
            Visit summary
          </button>
        )}
        {muted && doctor && (
          <button type="button" onClick={() => onRebook(doctor)} className={ui.link}>
            Book again
          </button>
        )}
      </div>
      {cancelling && <CancelDialog appointment={visit} doctor={doctor} onCancel={onCancel} onClose={() => setCancelling(false)} />}
    </li>
  );
}

export default function VisitsSection({ portal, findDoctor, onReschedule, onRebook, onOpenRecord }) {
  const [tab, setTab] = useState("upcoming");
  const upcoming = portal.appointments.filter(isUpcoming).sort(byDateTime);
  const past = portal.appointments.filter((a) => !isUpcoming(a)).sort((a, b) => byDateTime(b, a));
  const list = tab === "upcoming" ? upcoming : past;
  const summaries = new Set(portal.records.map((r) => r.appointmentId).filter(Boolean));

  // Group by month, keeping the list's order
  const months = [];
  list.forEach((v) => {
    const label = formatDate(v.appointmentDate, { month: "long", year: "numeric" });
    const last = months[months.length - 1];
    if (last?.label === label) last.visits.push(v);
    else months.push({ label, visits: [v] });
  });

  return (
    <>
      <PageHead
        title="Visits"
        intro="Move or cancel a booked visit up to its start time. For same-day changes, the Private Patient Office can help."
        action={
          <a href="#book" className={ui.primary}>
            Book a visit
          </a>
        }
      />
      <div className={`${ui.page} pb-24`}>
        <div role="tablist" aria-label="Visits" className="flex gap-8 border-b border-ivory-line">
          {[
            ["upcoming", "Upcoming", upcoming.length],
            ["past", "Past", past.length],
          ].map(([id, label, count]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
              className={`-mb-px border-b-2 py-3 text-[16px] ${tab === id ? "border-forest text-ink" : "border-transparent text-muted hover:text-ink"}`}
            >
              {label} <span className="text-muted tabular-nums">{count}</span>
            </button>
          ))}
        </div>

        {list.length === 0 ? (
          <p className="py-16 text-[16px] text-muted">
            {tab === "upcoming" ? "You have no upcoming visits." : "Your past visits will appear here."}
          </p>
        ) : (
          months.map((month) => (
            <section key={month.label} className="pt-12">
              <h2 className="font-serif text-2xl text-muted">{month.label}</h2>
              <ol className="mt-4 border-t border-ivory-line">
                {month.visits.map((v) => (
                  <VisitRow
                    key={v.id}
                    visit={v}
                    doctor={findDoctor(v.doctorId)}
                    hasSummary={summaries.has(v.id)}
                    onCancel={portal.cancel}
                    onReschedule={onReschedule}
                    onRebook={onRebook}
                    onOpenRecord={onOpenRecord}
                  />
                ))}
              </ol>
            </section>
          ))
        )}
      </div>
    </>
  );
}
