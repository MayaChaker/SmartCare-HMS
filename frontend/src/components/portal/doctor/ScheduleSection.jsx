import { useState } from "react";
import PageHead from "../PageHead";
import { formatTime } from "../format";
import { ui } from "../ui";
import { toLocalDateString } from "../../../utils/schedule";
import { patientName, readHours, WEEK } from "./chart";

const HOUR_HEIGHT = 64; // px

const TONE = {
  scheduled: "border-l-2 border-forest bg-white text-ink",
  "checked-in": "border-l-2 border-champagne bg-champagne/25 text-ink",
  "in-progress": "bg-forest text-ivory",
  completed: "bg-ivory-warm text-muted",
  "no-show": "bg-white text-muted line-through",
};
const LEGEND = [
  ["Booked", TONE.scheduled],
  ["Waiting", TONE["checked-in"]],
  ["With you", TONE["in-progress"]],
  ["Seen", TONE.completed],
];

const hourOf = (time) => {
  const [h, m] = String(time).split(":").map(Number);
  return h + m / 60;
};

// The doctor's week as a calendar: one column per working day, visits placed at their time
export default function ScheduleSection({ portal, now, onOpenPatient }) {
  const [weekOffset, setWeekOffset] = useState(0);
  const hours = readHours(portal.profile.workingHours);

  // Monday of the chosen week
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7) + weekOffset * 7);
  const week = WEEK.map((key, i) => {
    const date = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
    const ymd = toLocalDateString(date);
    const visits = portal.appointments.filter((a) => a.appointmentDate === ymd && a.status !== "cancelled");
    return { key, date, ymd, visits, working: hours.days.length === 0 || hours.days.includes(key) };
  });
  const days = week.filter((d) => d.working || d.visits.length);

  const shown = days.flatMap((d) => d.visits.map((a) => hourOf(a.appointmentTime)));
  const first = Math.floor(Math.min(hourOf(hours.from), ...shown));
  const last = Math.ceil(Math.max(hourOf(hours.to), ...shown.map((h) => h + 1 / 3)));
  const rows = Array.from({ length: Math.max(1, last - first) }, (_, i) => first + i);
  const todayYmd = toLocalDateString(now);
  const nowTop = (now.getHours() + now.getMinutes() / 60 - first) * HOUR_HEIGHT;

  const range = `${days[0]?.date.toLocaleDateString("en-GB", { day: "numeric", month: "long" }) || ""} to ${
    days[days.length - 1]?.date.toLocaleDateString("en-GB", { day: "numeric", month: "long" }) || ""
  }`;

  return (
    <>
      <PageHead
        title={weekOffset === 0 ? "This week" : weekOffset === 1 ? "Next week" : weekOffset === -1 ? "Last week" : "Week"}
        intro={`${range}. Choose a visit to open the patient's chart.`}
        action={
          <div className="flex gap-2">
            <button type="button" onClick={() => setWeekOffset((w) => w - 1)} className={ui.outline} aria-label="Previous week">
              ← Previous
            </button>
            {weekOffset !== 0 && (
              <button type="button" onClick={() => setWeekOffset(0)} className={ui.outline}>
                This week
              </button>
            )}
            <button type="button" onClick={() => setWeekOffset((w) => w + 1)} className={ui.outline} aria-label="Next week">
              Next →
            </button>
          </div>
        }
      />
      <div className={`${ui.page} pb-24`}>
        <div className="overflow-x-auto border border-ivory-line bg-white">
          <div className="grid min-w-[760px]" style={{ gridTemplateColumns: `64px repeat(${days.length}, minmax(0, 1fr))` }}>
            <div className="border-b border-ivory-line" />
            {days.map((d) => (
              <div key={d.ymd} className={`border-b border-l border-ivory-line px-3 py-3 ${d.ymd === todayYmd ? "bg-ivory" : ""}`}>
                <p className="text-[13px] text-muted">{d.key}</p>
                <p className="font-serif text-[28px] leading-none lining-nums">{d.date.getDate()}</p>
                <p className="mt-1 text-[12px] text-muted">
                  {d.visits.length} {d.visits.length === 1 ? "visit" : "visits"}
                </p>
              </div>
            ))}

            <div className="relative" style={{ height: rows.length * HOUR_HEIGHT }}>
              {rows.map((h, i) => (
                <p key={h} className="absolute right-2 text-[12px] text-muted tabular-nums" style={{ top: i * HOUR_HEIGHT + 2 }}>
                  {formatTime(`${String(h).padStart(2, "0")}:00`).replace(":00", "")}
                </p>
              ))}
            </div>
            {days.map((d) => (
              <div key={d.ymd} className={`relative border-l border-ivory-line ${d.ymd === todayYmd ? "bg-ivory/60" : ""}`} style={{ height: rows.length * HOUR_HEIGHT }}>
                {rows.map((h, i) => (
                  <div key={h} className="absolute inset-x-0 border-t border-ivory-line" style={{ top: i * HOUR_HEIGHT }} />
                ))}
                {d.ymd === todayYmd && nowTop >= 0 && nowTop <= rows.length * HOUR_HEIGHT && (
                  <div aria-hidden="true" className="absolute inset-x-0 z-10 border-t-2 border-champagne" style={{ top: nowTop }}>
                    <span className="absolute -top-1.5 -left-1 h-3 w-3 rounded-full bg-champagne" />
                  </div>
                )}
                {d.visits.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => onOpenPatient(a.Patient?.id)}
                    title={`${formatTime(a.appointmentTime)} · ${patientName(a.Patient)}${a.reason ? ` · ${a.reason}` : ""}`}
                    className={`absolute inset-x-1 overflow-hidden px-2 py-1 text-left shadow-[0_0_0_1px_var(--color-ivory-line)] ${TONE[a.status] || TONE.scheduled}`}
                    style={{ top: (hourOf(a.appointmentTime) - first) * HOUR_HEIGHT + 1, height: HOUR_HEIGHT / 3 - 2 }}
                  >
                    <span className="block truncate text-[12px] leading-tight">
                      <span className="tabular-nums">{formatTime(a.appointmentTime)}</span> · {patientName(a.Patient)}
                    </span>
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-[14px] text-muted">
          {LEGEND.map(([label, tone]) => (
            <span key={label} className="flex items-center gap-2">
              <span aria-hidden="true" className={`h-3.5 w-5 shadow-[0_0_0_1px_var(--color-ivory-line)] ${tone}`} />
              {label}
            </span>
          ))}
        </div>
      </div>
    </>
  );
}
