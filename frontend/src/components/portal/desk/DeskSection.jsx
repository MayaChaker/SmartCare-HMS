import { useState } from "react";
import DoctorAvatar from "../DoctorAvatar";
import { formatTime } from "../format";
import { ui } from "../ui";
import { clockTime, minutesSince, readHours } from "../doctor/chart";
import { PatientInitials } from "../doctor/PatientChart";
import { toLocalDateString } from "../../../utils/schedule";
import VisitDialog from "./VisitDialog";
import { isLate, LEGEND, minutesPast, personName, shortDoctorName, toneOf } from "./desk";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const STEP = 20; // minutes per row
const ROW = 30; // px per row
const COLUMN_MIN = 150; // px per doctor; the board scrolls sideways beyond that
const LONG_WAIT = 15;

const toMinutes = (hhmm) => {
  const [h, m] = String(hhmm).split(":").map(Number);
  return h * 60 + m;
};
const hhmm = (minutes) => `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;

const greeting = (now) => (now.getHours() < 12 ? "Good morning" : now.getHours() < 18 ? "Good afternoon" : "Good evening");

// Doctors as columns, the day in 20-minute rows: every visit where and when it happens
function Board({ doctors, visits, availability, now, onOpen, onBook }) {
  const columns = doctors.map((d) => ({ doctor: d, hours: readHours(d.workingHours) }));
  const starts = columns.map((c) => toMinutes(c.hours.from)).concat(visits.map((v) => toMinutes(v.appointmentTime)));
  const ends = columns.map((c) => toMinutes(c.hours.to)).concat(visits.map((v) => toMinutes(v.appointmentTime) + STEP));
  const first = Math.floor(Math.min(...starts, 9 * 60) / 60) * 60;
  const last = Math.ceil(Math.max(...ends, 17 * 60) / 60) * 60;
  const rows = [];
  for (let m = first; m < last; m += STEP) rows.push(m);
  const nowTop = ((now.getHours() * 60 + now.getMinutes() - first) / STEP) * ROW;
  const today = toLocalDateString(now);

  return (
    <>
      <div className="relative overflow-x-auto border border-ivory-line bg-white">
        <div className="grid" style={{ minWidth: 64 + columns.length * COLUMN_MIN, gridTemplateColumns: `64px repeat(${columns.length}, minmax(${COLUMN_MIN}px, 1fr))` }}>
          <div className="border-b border-ivory-line" />
          {columns.map(({ doctor }) => (
            <div key={doctor.id} className="flex items-center gap-3 border-b border-l border-ivory-line px-3 py-3">
              <DoctorAvatar doctor={doctor} size={40} />
              <div className="min-w-0">
                <p className="truncate text-[14px] font-medium">{shortDoctorName(doctor)}</p>
                <p className="truncate text-[12px] text-muted">
                  {doctor.specialization} · {visits.filter((v) => v.doctorId === doctor.id).length} visits
                </p>
              </div>
            </div>
          ))}

          <div className="relative" style={{ height: rows.length * ROW }}>
            {rows
              .filter((m) => m % 60 === 0)
              .map((m) => (
                <p key={m} className="absolute right-2 text-[12px] text-muted tabular-nums" style={{ top: ((m - first) / STEP) * ROW + 2 }}>
                  {formatTime(hhmm(m)).replace(":00", "")}
                </p>
              ))}
          </div>

          {columns.map(({ doctor, hours }) => {
            const worksToday = hours.days.length === 0 || hours.days.includes(WEEKDAYS[now.getDay()]);
            const open = (m) => worksToday && m >= toMinutes(hours.from) && m < toMinutes(hours.to);
            const freeToday = new Set(availability[doctor.id]?.find((d) => d.date === today)?.times || []);
            return (
              <div key={doctor.id} className="relative border-l border-ivory-line" style={{ height: rows.length * ROW }}>
                {rows.map((m, i) => (
                  <div key={m} className={`absolute inset-x-0 ${m % 60 === 0 ? "border-t border-ivory-line" : ""} ${open(m) ? "" : "bg-ivory/70"}`} style={{ top: i * ROW, height: ROW }} />
                ))}
                {rows.map((m, i) => {
                  const visit = visits.find((v) => v.doctorId === doctor.id && toMinutes(v.appointmentTime) === m);
                  if (visit) {
                    const p = visit.Patient || {};
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => onOpen(visit)}
                        title={`${formatTime(visit.appointmentTime)} · ${personName(p)}${visit.reason ? ` · ${visit.reason}` : ""}`}
                        className={`absolute inset-x-1 overflow-hidden px-2 text-left shadow-[0_0_0_1px_var(--color-ivory-line)] ${toneOf(visit)}`}
                        style={{ top: i * ROW + 2, height: ROW - 4 }}
                      >
                        <span className="block truncate text-[12px] leading-[26px]">
                          <span className="tabular-nums">{formatTime(visit.appointmentTime)}</span> {personName(p)}
                        </span>
                      </button>
                    );
                  }
                  if (!freeToday.has(hhmm(m))) return null;
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => onBook(doctor.id, hhmm(m))}
                      aria-label={`Book ${shortDoctorName(doctor)} at ${formatTime(hhmm(m))}`}
                      className="absolute inset-x-1 grid place-items-center text-[12px] text-transparent hover:border hover:border-dashed hover:border-champagne hover:text-forest focus:text-forest"
                      style={{ top: i * ROW + 2, height: ROW - 4 }}
                    >
                      + {formatTime(hhmm(m))}
                    </button>
                  );
                })}
                {nowTop >= 0 && nowTop <= rows.length * ROW && (
                  <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 z-10 border-t-2 border-champagne" style={{ top: nowTop }} />
                )}
              </div>
            );
          })}
        </div>
      </div>
      <p className="mt-3 text-[14px] text-muted">
        Choose a visit to check in, move or cancel it. Choose a free time to book it. Shaded times are outside the doctor's hours.
      </p>
    </>
  );
}

export default function DeskSection({ desk, now, staffName, onBook, onMove }) {
  const [open, setOpen] = useState(null);
  const [message, setMessage] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [department, setDepartment] = useState("");

  const visits = desk.today.filter((v) => v.status !== "cancelled");
  // The board shows the doctors working today, and anyone with a visit today
  const doctorIds = new Set(visits.map((v) => v.doctorId));
  const weekday = WEEKDAYS[now.getDay()];
  const working = desk.doctors.filter((d) => {
    const { days } = readHours(d.workingHours);
    return doctorIds.has(d.id) || (d.availability !== false && (days.length === 0 || days.includes(weekday)));
  });
  const departments = [...new Set(working.map((d) => d.specialization).filter(Boolean))].sort();
  const doctors = working.filter((d) => !department || d.specialization === department);
  const late = visits.filter(isLate);
  const arrivals = visits
    .filter((v) => v.status === "scheduled" && minutesPast(v, now) > -65)
    .sort((a, b) => String(a.appointmentTime).localeCompare(String(b.appointmentTime)));
  const waiting = visits
    .filter((v) => v.status === "checked-in")
    .sort((a, b) => String(a.checkedInAt || "").localeCompare(String(b.checkedInAt || "")));
  const counts = [
    ["Expected", visits.filter((v) => v.status === "scheduled" && !isLate(v)).length],
    ["Late", late.length],
    ["Waiting", waiting.length],
    ["With doctor", visits.filter((v) => v.status === "in-progress").length],
    ["Done", visits.filter((v) => v.status === "completed").length],
  ];

  // After check-in, remind the desk when the patient's own health information is missing
  const afterCheckIn = (visit) => {
    const p = visit.Patient || {};
    const missing = !p.allergies || !p.bloodType;
    return `${personName(p)} checked in for ${shortDoctorName(visit.Doctor)}.${
      missing ? " Ask them to complete their health information (allergies, blood type) in the patient portal." : ""
    }`;
  };

  const checkIn = async (visit) => {
    setBusyId(visit.id);
    const result = await desk.checkIn(visit.id);
    setBusyId(null);
    setMessage(result.success ? afterCheckIn(visit) : result.message);
  };

  return (
    <>
      <section className="bg-forest-deep text-ivory">
        <div className={`${ui.page} grid gap-8 py-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end`}>
          <div>
            <p className="text-[15px] text-ivory/65">
              {now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })} · <span className="tabular-nums">{clockTime(now)}</span>
            </p>
            <h1 className="mt-2 font-serif text-[40px] leading-tight sm:text-[52px]">
              {greeting(now)}
              {staffName ? `, ${staffName}` : ""}.
            </h1>
          </div>
          <dl className="grid grid-cols-5 gap-px bg-ivory/10 text-center">
            {counts.map(([label, n]) => (
              <div key={label} className="flex flex-col-reverse bg-forest-deep px-2 py-1 sm:px-5">
                <dt className={`mt-1 text-[12px] ${label === "Late" && n ? "text-[#e9a08f]" : "text-ivory/60"}`}>{label}</dt>
                <dd className="font-serif text-[40px] leading-none tabular-nums lining-nums">{n}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {message && (
        <div className={`${ui.page} pt-6`}>
          <p role="status" className="flex items-start justify-between gap-4 border-l-2 border-forest bg-white px-5 py-3 text-[15px]">
            {message}
            <button type="button" onClick={() => setMessage("")} aria-label="Dismiss" className="text-muted hover:text-ink">
              ×
            </button>
          </p>
        </div>
      )}

      <div className={`${ui.page} grid grid-cols-1 gap-10 py-10 xl:grid-cols-[minmax(0,1fr)_380px]`}>
        <section aria-labelledby="board" className="min-w-0">
          <div className="flex flex-wrap items-end justify-between gap-4 pb-4">
            <div className="flex flex-wrap items-end gap-6">
              <h2 id="board" className="font-serif text-4xl text-ink">
                Today's board
              </h2>
              {departments.length > 1 && (
                <div className="grid gap-1">
                  <label htmlFor="board-department" className="text-[13px] text-muted">
                    Department
                  </label>
                  <select id="board-department" value={department} onChange={(e) => setDepartment(e.target.value)} className={`${ui.input} h-10 px-3 text-[15px]`}>
                    <option value="">All ({working.length} doctors)</option>
                    {departments.map((name) => (
                      <option key={name}>{name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-1 text-[13px] text-muted">
              {LEGEND.map(([label, tone]) => (
                <span key={label} className="flex items-center gap-1.5">
                  <span aria-hidden="true" className={`h-3 w-4 ${tone}`} />
                  {label}
                </span>
              ))}
            </div>
          </div>
          {doctors.length ? (
            <Board doctors={doctors} visits={visits} availability={desk.availability} now={now} onOpen={setOpen} onBook={onBook} />
          ) : (
            <p className="border border-ivory-line bg-white p-8 text-[16px] text-muted">No doctors are working today.</p>
          )}
        </section>

        <aside className="order-first grid min-w-0 grid-cols-1 content-start gap-8 xl:order-none">
          <section aria-labelledby="arrivals" className="border border-ivory-line bg-white">
            <div className="flex items-baseline justify-between gap-4 border-b border-ivory-line p-5">
              <h2 id="arrivals" className="font-serif text-3xl text-ink">
                Arrivals
              </h2>
              <span className="text-[14px] text-muted">Late and next hour</span>
            </div>
            {arrivals.length === 0 ? (
              <p className="p-5 text-[15px] text-muted">No one expected in the next hour.</p>
            ) : (
              <ol>
                {arrivals.map((v) => {
                  const lateBy = minutesPast(v, now);
                  return (
                    <li key={v.id} className="flex items-center gap-4 border-b border-ivory-line px-5 py-4 last:border-b-0">
                      <PatientInitials patient={v.Patient} size={40} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[16px] text-ink">{personName(v.Patient)}</p>
                        <p className={`truncate text-[13px] ${isLate(v) ? "text-alert" : "text-muted"}`}>
                          <span className="tabular-nums">{formatTime(v.appointmentTime)}</span>
                          {isLate(v) ? ` · ${lateBy} min late` : ""} · {shortDoctorName(v.Doctor)}
                        </p>
                      </div>
                      <button type="button" onClick={() => checkIn(v)} disabled={busyId === v.id} className={`${ui.primary} h-10 px-4`}>
                        {busyId === v.id ? "…" : "Check in"}
                      </button>
                    </li>
                  );
                })}
              </ol>
            )}
          </section>

          <section aria-labelledby="waiting" className="border border-ivory-line bg-white">
            <div className="flex items-baseline justify-between gap-4 border-b border-ivory-line p-5">
              <h2 id="waiting" className="font-serif text-3xl text-ink">
                Waiting room
              </h2>
              <span className="text-[14px] text-muted">{waiting.length} waiting</span>
            </div>
            {waiting.length === 0 ? (
              <p className="p-5 text-[15px] text-muted">No one is waiting.</p>
            ) : (
              <ol>
                {waiting.map((v) => {
                  const wait = minutesSince(v.checkedInAt, now);
                  return (
                    <li key={v.id} className="flex items-center gap-4 border-b border-ivory-line px-5 py-4 last:border-b-0">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[16px] text-ink">{personName(v.Patient)}</p>
                        <p className="truncate text-[13px] text-muted">
                          For {shortDoctorName(v.Doctor)} · booked <span className="tabular-nums">{formatTime(v.appointmentTime)}</span>
                        </p>
                      </div>
                      {wait !== null && (
                        <p className="text-right">
                          <span className={`block font-serif text-[28px] leading-none tabular-nums lining-nums ${wait >= LONG_WAIT ? "text-alert" : "text-ink"}`}>{wait}</span>
                          <span className="text-[12px] text-muted">min</span>
                        </p>
                      )}
                    </li>
                  );
                })}
              </ol>
            )}
            <p className="border-t border-ivory-line bg-ivory/60 px-5 py-3 text-[13px] text-muted">
              Waits of {LONG_WAIT} minutes or more show in red. Offer water and tell the patient the expected time.
            </p>
          </section>
        </aside>
      </div>

      {open && (
        <VisitDialog
          visit={open}
          desk={desk}
          onMove={(visit) => {
            setOpen(null);
            onMove(visit);
          }}
          onDone={setMessage}
          checkInMessage={afterCheckIn}
          onClose={() => setOpen(null)}
        />
      )}
    </>
  );
}
