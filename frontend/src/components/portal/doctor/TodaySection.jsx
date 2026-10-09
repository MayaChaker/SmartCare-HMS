import { useState } from "react";
import StatusBadge from "../StatusBadge";
import { formatTime } from "../format";
import { ui } from "../ui";
import { AllergyNote, PatientInitials } from "./PatientChart";
import { byTime, clockTime, isToday, minutesSince, patientFacts, patientName } from "./chart";
import { hasVisitTimePassed } from "../../../utils/schedule";

// Waiting this long or more is shown in red
const LONG_WAIT = 15;

const greeting = (now) => (now.getHours() < 12 ? "Good morning" : now.getHours() < 18 ? "Good afternoon" : "Good evening");

function WithYou({ visit, now, onOpen }) {
  const p = visit.Patient || {};
  return (
    <section aria-labelledby="with-you" className="border border-ivory-line bg-white">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-ivory-line px-6 py-4 sm:px-8">
        <p id="with-you" className="text-[14px] text-champagne">
          With you now{visit.startedAt ? ` · since ${clockTime(visit.startedAt)} (${minutesSince(visit.startedAt, now)} min)` : ""}
        </p>
        <StatusBadge status={visit.status} viewer="doctor" />
      </div>
      <div className="grid gap-8 p-6 sm:p-8 md:grid-cols-2">
        <div className="min-w-0">
          <div className="flex items-center gap-4">
            <PatientInitials patient={p} size={56} />
            <div>
              <p className="font-serif text-[34px] leading-none text-ink">{patientName(p)}</p>
              <p className="mt-1 text-[15px] text-muted">{[patientFacts(p), p.bloodType && `Blood ${p.bloodType}`].filter(Boolean).join(" · ")}</p>
            </div>
          </div>
          {visit.reason && (
            <p className="mt-5 text-[16px]">
              <span className="text-muted">Reason · </span>
              {visit.reason}
            </p>
          )}
          <AllergyNote allergies={p.allergies} className="mt-4" />
        </div>
        <dl className="grid content-start gap-4 text-[15px]">
          <div>
            <dt className="text-[13px] text-muted">Medicines</dt>
            <dd className="mt-0.5">{p.permanentMedicine || "None recorded"}</dd>
          </div>
          <div>
            <dt className="text-[13px] text-muted">History</dt>
            <dd className="mt-0.5">{p.medicalHistory || "Nothing recorded"}</dd>
          </div>
        </dl>
      </div>
      <div className="border-t border-ivory-line px-6 py-5 sm:px-8">
        <button type="button" onClick={() => onOpen(visit.id)} className={ui.primary}>
          Open visit and write note
        </button>
      </div>
    </section>
  );
}

function NextUp({ visit, now, busy, onStart }) {
  if (!visit) {
    return (
      <section className="border border-ivory-line bg-white p-8">
        <p className="font-serif text-3xl text-ink">No one is with you</p>
        <p className="mt-2 text-[16px] text-muted">When reception checks a patient in, they appear in the waiting room.</p>
      </section>
    );
  }
  const p = visit.Patient || {};
  return (
    <section className="border border-ivory-line bg-white p-6 sm:p-8">
      <p className="text-[14px] text-champagne">Next patient{visit.checkedInAt ? ` · waiting ${minutesSince(visit.checkedInAt, now)} min` : ""}</p>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <PatientInitials patient={p} size={56} />
          <div>
            <p className="font-serif text-[34px] leading-none text-ink">{patientName(p)}</p>
            <p className="mt-1 text-[15px] text-muted">{[patientFacts(p), visit.reason].filter(Boolean).join(" · ")}</p>
          </div>
        </div>
        <button type="button" onClick={() => onStart(visit.id)} disabled={busy} className={ui.primary}>
          {busy ? "Starting…" : "Start visit"}
        </button>
      </div>
      <AllergyNote allergies={p.allergies} className="mt-5" />
    </section>
  );
}

export default function TodaySection({ portal, now, onOpenVisit }) {
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");

  const today = portal.appointments.filter((a) => isToday(a.appointmentDate, now) && a.status !== "cancelled").sort(byTime);
  const withYou = today.find((a) => a.status === "in-progress");
  const waiting = today
    .filter((a) => a.status === "checked-in")
    .sort((a, b) => String(a.checkedInAt || a.appointmentTime).localeCompare(String(b.checkedInAt || b.appointmentTime)));
  const seen = today.filter((a) => a.status === "completed");
  // Booked visits whose time has passed without a check-in
  const late = (a) => a.status === "scheduled" && hasVisitTimePassed(a.appointmentDate, a.appointmentTime);
  const toCome = today.filter((a) => a.status === "scheduled" && !late(a));
  const missingNotes = seen.filter((a) => !a.MedicalRecord);
  const last = today[today.length - 1];

  const start = async (id) => {
    setBusyId(id);
    setError("");
    const result = await portal.startVisit(id);
    setBusyId(null);
    if (result.success) onOpenVisit(id);
    else setError(result.message);
  };

  return (
    <>
      <section className="bg-forest-deep text-ivory">
        <div className={`${ui.page} grid gap-10 pt-12 pb-12 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end lg:pt-14`}>
          <div>
            <p className="text-[15px] text-ivory/65">
              {now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })} · {clockTime(now)}
            </p>
            <h1 className="mt-3 font-serif text-[40px] leading-[1.05] sm:text-[56px]">
              {greeting(now)}, Dr. {portal.profile.lastName || ""}.
            </h1>
            <p className="mt-4 max-w-xl text-[17px] text-ivory/75">
              {today.length
                ? `${today.length} ${today.length === 1 ? "visit" : "visits"} today. Your last patient is at ${formatTime(last.appointmentTime)}.`
                : "No visits booked for today."}
            </p>
          </div>
          <dl className="grid grid-cols-4 gap-px bg-ivory/10 text-center">
            {[
              ["Waiting", waiting.length],
              ["With you", withYou ? 1 : 0],
              ["Seen", seen.length],
              ["Still to come", toCome.length],
            ].map(([label, count]) => (
              <div key={label} className="flex flex-col-reverse bg-forest-deep px-3 py-1 sm:px-6">
                <dt className="mt-1 text-[12px] text-ivory/60 sm:text-[13px]">{label}</dt>
                <dd className="font-serif text-[44px] leading-none tabular-nums lining-nums">{count}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <div className={`${ui.page} grid gap-14 py-12 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-16 lg:py-16`}>
        <div className="min-w-0">
          {error && (
            <p role="alert" className="mb-6 border-l-2 border-alert bg-white px-5 py-4 text-[15px] text-alert">
              {error}
            </p>
          )}
          {withYou ? (
            <WithYou visit={withYou} now={now} onOpen={onOpenVisit} />
          ) : (
            <NextUp visit={waiting[0]} now={now} busy={busyId === waiting[0]?.id} onStart={start} />
          )}

          {missingNotes.length > 0 && (
            <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-l-2 border-champagne bg-white px-5 py-4">
              <p className="text-[15px]">
                <span className="font-medium">Visit note missing</span> for{" "}
                {missingNotes.map((a) => `${patientName(a.Patient)} (${formatTime(a.appointmentTime)})`).join(", ")}.
              </p>
              <button type="button" onClick={() => onOpenVisit(missingNotes[0].id)} className={ui.link}>
                Write it now
              </button>
            </div>
          )}

          <section aria-labelledby="today-list" className="mt-14">
            <div className="flex items-end justify-between gap-4 border-b border-ivory-line pb-4">
              <h2 id="today-list" className="font-serif text-4xl text-ink">
                Today's list
              </h2>
              <a href="#schedule" className={ui.link}>
                This week
              </a>
            </div>
            {today.length === 0 ? (
              <p className="py-10 text-[16px] text-muted">Nothing booked today. New bookings appear here as patients make them.</p>
            ) : (
              <ol>
                {today.map((a) => {
                  const p = a.Patient || {};
                  const done = a.status === "completed" || a.status === "no-show" || late(a);
                  const isNow = a.status === "in-progress";
                  return (
                    <li
                      key={a.id}
                      className={`grid grid-cols-[64px_minmax(0,1fr)] items-center gap-x-5 gap-y-3 border-b border-ivory-line py-5 sm:grid-cols-[72px_minmax(0,1fr)_auto] ${
                        isNow ? "-mx-4 bg-white px-4 sm:-mx-5 sm:px-5" : ""
                      }`}
                    >
                      <p className={`text-[14px] whitespace-nowrap tabular-nums sm:text-[15px] ${done ? "text-muted" : "text-ink"}`}>{formatTime(a.appointmentTime)}</p>
                      <div className="min-w-0">
                        <p className={`font-serif text-[24px] leading-tight ${done ? "text-muted" : "text-ink"}`}>
                          {patientName(p)}
                          {p.allergies && (
                            <span className="ml-2 align-middle font-sans text-[12px] text-alert" title={`Allergy: ${p.allergies}`}>
                              Allergy
                            </span>
                          )}
                        </p>
                        <p className="text-[14px] text-muted">{[patientFacts(p), a.reason].filter(Boolean).join(" · ")}</p>
                      </div>
                      <div className="col-span-2 flex flex-wrap items-center gap-4 pl-[84px] sm:col-span-1 sm:justify-end sm:pl-0">
                        {late(a) ? <span className="text-[14px] text-muted">Not arrived</span> : <StatusBadge status={a.status} viewer="doctor" />}
                        {a.status === "checked-in" && !withYou && (
                          <button type="button" onClick={() => start(a.id)} disabled={busyId === a.id} className={`${ui.primary} h-10`}>
                            {busyId === a.id ? "Starting…" : "Start visit"}
                          </button>
                        )}
                        {isNow && (
                          <button type="button" onClick={() => onOpenVisit(a.id)} className={`${ui.primary} h-10`}>
                            Open visit
                          </button>
                        )}
                        {a.status === "completed" && (
                          <button type="button" onClick={() => onOpenVisit(a.id)} className={ui.link}>
                            {a.MedicalRecord ? "Note" : "Write note"}
                          </button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </section>
        </div>

        <aside aria-labelledby="waiting-room" className="min-w-0">
          <div className="border border-ivory-line bg-white">
            <div className="flex items-baseline justify-between gap-4 border-b border-ivory-line p-6">
              <h2 id="waiting-room" className="font-serif text-3xl text-ink">
                Waiting room
              </h2>
              <span className="text-[14px] text-muted">{waiting.length} checked in</span>
            </div>
            {waiting.length === 0 ? (
              <p className="p-6 text-[15px] text-muted">No one is waiting.</p>
            ) : (
              <ol>
                {waiting.map((a) => {
                  const wait = minutesSince(a.checkedInAt, now);
                  return (
                    <li key={a.id} className="flex items-center gap-4 border-b border-ivory-line px-6 py-5 last:border-b-0">
                      <PatientInitials patient={a.Patient} size={44} />
                      <div className="min-w-0 flex-1">
                        <p className="text-[16px] text-ink">{patientName(a.Patient)}</p>
                        <p className="text-[14px] text-muted">
                          Booked {formatTime(a.appointmentTime)}
                          {a.checkedInAt ? ` · arrived ${clockTime(a.checkedInAt)}` : ""}
                        </p>
                      </div>
                      {wait !== null && (
                        <p className="shrink-0 text-right">
                          <span className={`block font-serif text-[28px] leading-none tabular-nums lining-nums ${wait >= LONG_WAIT ? "text-alert" : "text-ink"}`}>
                            {wait}
                          </span>
                          <span className="text-[12px] text-muted">min</span>
                        </p>
                      )}
                    </li>
                  );
                })}
              </ol>
            )}
            <p className="border-t border-ivory-line bg-ivory/60 px-6 py-4 text-[14px] text-muted">
              Reception checks patients in. Waits of {LONG_WAIT} minutes or more show in red.
            </p>
          </div>

          {toCome.length > 0 && (
            <div className="mt-8 bg-forest p-6 text-ivory">
              <h2 className="font-serif text-2xl">Next on your list</h2>
              {toCome.slice(0, 3).map((a) => (
                <div key={a.id} className="mt-4 flex items-baseline justify-between gap-4 border-t border-ivory/15 pt-4">
                  <div className="min-w-0">
                    <p className="text-[16px]">{patientName(a.Patient)}</p>
                    {a.reason && <p className="text-[14px] text-ivory/60">{a.reason}</p>}
                  </div>
                  <p className="shrink-0 tabular-nums">{formatTime(a.appointmentTime)}</p>
                </div>
              ))}
            </div>
          )}
        </aside>
      </div>
    </>
  );
}
