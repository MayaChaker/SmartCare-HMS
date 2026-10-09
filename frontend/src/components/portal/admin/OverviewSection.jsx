import { useState } from "react";
import { formatDate } from "../format";
import { ui } from "../ui";
import DoctorAvatar from "../DoctorAvatar";
import { delta, percentChange } from "./admin";
import { toLocalDateString } from "../../../utils/schedule";

// Thresholds that turn a figure red or gold in the doctors table
const LONG_WAIT = 15;
const HIGH_NO_SHOW = 5;
const LOW_BOOKED = 55;

// A round top for the axis: 0, 20, 40, 60, 80
const niceMax = (value) => {
  const steps = [5, 10, 20, 25, 50, 100, 200, 250, 500, 1000];
  const step = steps.find((s) => value / s <= 4) || 1000;
  return Math.max(step, Math.ceil(value / step) * step);
};

function StatTile({ label, value, change, note }) {
  return (
    <div className="border border-ivory-line bg-white p-5">
      <p className="text-[14px] text-muted">{label}</p>
      <p className="mt-2 text-[34px] leading-none font-semibold text-ink">{value ?? "–"}</p>
      {change && (
        <p className={`mt-3 text-[13px] ${change.neutral || change.direction === "none" ? "text-muted" : change.good ? "text-[#2f6b45]" : "text-alert"}`}>
          {change.direction !== "none" && <span aria-hidden="true">{change.direction === "up" ? "↑ " : "↓ "}</span>}
          <span className="sr-only">{change.direction === "up" ? "up " : change.direction === "down" ? "down " : ""}</span>
          {change.text} <span className="text-muted">vs previous period</span>
        </p>
      )}
      {note && <p className="mt-1 text-[13px] text-muted">{note}</p>}
    </div>
  );
}

// One series, so one colour; today in gold, the peak labelled; hover or focus a day for its numbers
function VisitsChart({ perDay, today }) {
  const [active, setActive] = useState(null);
  const W = 860;
  const H = 240;
  const left = 36;
  const bottom = 26;
  const top = 18;
  const max = niceMax(Math.max(1, ...perDay.map((d) => d.visits)));
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(max * f));
  const band = (W - left) / perDay.length;
  const barWidth = Math.min(24, band - 2);
  const y = (v) => top + (H - top - bottom) * (1 - v / max);
  const peak = perDay.reduce((a, b) => (b.visits > a.visits ? b : a), perDay[0]);
  const labelEvery = perDay.length > 10 ? 7 : 1;

  return (
    <div className="relative overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full min-w-[640px]" role="img" aria-label={`Visits per day. Highest ${peak.visits} on ${formatDate(peak.date, { day: "numeric", month: "short" })}.`}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={left} x2={W} y1={y(t)} y2={y(t)} stroke="#ece6db" strokeWidth="1" />
            <text x={left - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fill="#625e57" className="tabular-nums">
              {t}
            </text>
          </g>
        ))}
        {perDay.map((d, i) => {
          const x = left + band * i + (band - barWidth) / 2;
          const barTop = y(d.visits);
          const height = y(0) - barTop;
          const isToday = d.date === today;
          const lastIndex = perDay.length - 1;
          const showLabel = isToday || (i % labelEvery === 0 && lastIndex - i >= 3);
          return (
            <g
              key={d.date}
              tabIndex={0}
              role="img"
              aria-label={`${formatDate(d.date, { weekday: "long", day: "numeric", month: "long" })}: ${d.visits} visits, ${d.noShows} no-shows`}
              onMouseEnter={() => setActive(i)}
              onMouseLeave={() => setActive(null)}
              onFocus={() => setActive(i)}
              onBlur={() => setActive(null)}
              className="outline-none"
            >
              <rect x={left + band * i} y={top} width={band} height={H - top - bottom} fill="transparent" />
              {height > 0 ? (
                <path
                  d={`M${x},${y(0)} V${barTop + 4} q0,-4 4,-4 h${barWidth - 8} q4,0 4,4 V${y(0)} Z`}
                  fill={isToday ? "#b39563" : "#16302b"}
                  opacity={active === null || active === i ? 1 : 0.55}
                />
              ) : (
                <rect x={x} y={y(0) - 1} width={barWidth} height="1" fill="#ece6db" />
              )}
              {showLabel && (
                <text x={x + barWidth / 2} y={H - 8} textAnchor="middle" fontSize="11" fill="#625e57">
                  {isToday ? "Today" : formatDate(d.date, { day: "numeric", month: "short" })}
                </text>
              )}
              {d === peak && d.visits > 0 && (
                <text x={x + barWidth / 2} y={barTop - 6} textAnchor="middle" fontSize="12" fontWeight="600" fill="#1c1f1d" className="tabular-nums">
                  {d.visits}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      {active !== null && (
        <div
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-full border border-ivory-line bg-white px-3 py-2 text-[13px] whitespace-nowrap shadow-sm"
          style={{ left: `${((left + band * active + band / 2) / W) * 100}%`, top: `${(y(perDay[active].visits) / H) * 100}%` }}
        >
          <span className="text-muted">{formatDate(perDay[active].date, { weekday: "short", day: "numeric", month: "short" })}</span>
          <br />
          <span className="font-semibold tabular-nums">{perDay[active].visits}</span> visits · <span className="tabular-nums">{perDay[active].noShows}</span> no-shows
        </div>
      )}
    </div>
  );
}

export default function OverviewSection({ admin, now }) {
  const [asTable, setAsTable] = useState(false);
  const [showIdle, setShowIdle] = useState(false);
  const a = admin.analytics;
  if (!a) return null;
  const { current, previous } = a;
  const today = toLocalDateString(now);
  const pct = (n, b) => {
    const p = percentChange(n, b);
    return p === null ? null : { text: `${Math.abs(p)}%`, direction: p > 0 ? "up" : p < 0 ? "down" : "none", good: p >= 0 };
  };
  const maxDept = Math.max(1, ...a.byDepartment.map((d) => d.visits));
  // Doctors without visits in the period are counted, and listed only on request
  const idle = a.doctors.filter((d) => d.visits === 0);
  const shownDoctors = showIdle ? a.doctors : a.doctors.filter((d) => d.visits > 0);

  return (
    <>
      <section className="bg-forest-deep text-ivory">
        <div className={`${ui.page} flex flex-wrap items-end justify-between gap-6 py-10`}>
          <div>
            <p className="text-[15px] text-ivory/65">{now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
            <h1 className="mt-2 font-serif text-[40px] leading-tight sm:text-[52px]">How the hospital is doing</h1>
          </div>
          <div role="group" aria-label="Period" className="flex border border-ivory/25">
            {[7, 30].map((d) => (
              <button
                key={d}
                type="button"
                aria-pressed={admin.days === d}
                onClick={() => admin.changePeriod(d)}
                className={`h-10 px-4 text-[14px] ${admin.days === d ? "bg-ivory text-forest-deep" : "text-ivory/75 hover:text-ivory"}`}
              >
                Last {d} days
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className={`${ui.page} grid grid-cols-1 gap-10 py-10`}>
        <section aria-label="Key figures" className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
          <StatTile label="Visits" value={current.visits.toLocaleString("en-US")} change={pct(current.visits, previous.visits)} />
          <StatTile
            label="No-show rate"
            value={current.noShowRate === null ? null : `${current.noShowRate}%`}
            change={delta(current.noShowRate, previous.noShowRate, { higherIsBetter: false, unit: " pts" })}
          />
          <StatTile
            label="Average wait"
            value={current.averageWait === null ? null : `${Math.round(current.averageWait)} min`}
            change={delta(current.averageWait, previous.averageWait, { higherIsBetter: false, unit: " min" })}
            note="Check-in to doctor"
          />
          <StatTile
            label="Visit length"
            value={current.averageLength === null ? null : `${Math.round(current.averageLength)} min`}
            change={(() => {
              const c = delta(current.averageLength, previous.averageLength, { unit: " min" });
              return c && { ...c, neutral: true };
            })()}
            note="Doctor start to end"
          />
          <StatTile label="New patients" value={current.newPatients} change={pct(current.newPatients, previous.newPatients)} />
          <StatTile label="Waiting to activate" value={a.waitingToActivate} note="Files opened at the desk" />
        </section>

        <div className="grid grid-cols-1 gap-10 xl:grid-cols-[minmax(0,1fr)_420px]">
          <section aria-labelledby="per-day" className="min-w-0 border border-ivory-line bg-white p-6">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h2 id="per-day" className="font-serif text-3xl text-ink">
                Visits per day
              </h2>
              <button type="button" onClick={() => setAsTable((t) => !t)} className={ui.link}>
                {asTable ? "Show chart" : "Show as table"}
              </button>
            </div>
            <p className="mt-1 text-[14px] text-muted">Last {a.days} days, cancelled visits left out. Today in gold.</p>
            <div className="mt-5">
              {asTable ? (
                <div className="max-h-[260px] overflow-y-auto">
                  <table className="w-full text-left text-[14px]">
                    <thead>
                      <tr className="border-b border-ivory-line text-muted">
                        <th className="py-2 font-normal">Day</th>
                        <th className="py-2 text-right font-normal">Visits</th>
                        <th className="py-2 text-right font-normal">No-shows</th>
                      </tr>
                    </thead>
                    <tbody>
                      {a.perDay.map((d) => (
                        <tr key={d.date} className="border-b border-ivory-line">
                          <td className="py-2">{formatDate(d.date, { weekday: "short", day: "numeric", month: "short" })}</td>
                          <td className="py-2 text-right tabular-nums">{d.visits}</td>
                          <td className="py-2 text-right tabular-nums">{d.noShows}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <VisitsChart perDay={a.perDay} today={today} />
              )}
            </div>
          </section>

          <section aria-labelledby="by-department" className="min-w-0 border border-ivory-line bg-white p-6">
            <h2 id="by-department" className="font-serif text-3xl text-ink">
              Visits by department
            </h2>
            <p className="mt-1 mb-5 text-[14px] text-muted">Last {a.days} days.</p>
            {a.byDepartment.length === 0 ? (
              <p className="text-[15px] text-muted">No visits in this period.</p>
            ) : (
              <ol className="grid gap-3">
                {a.byDepartment.map((d) => (
                  <li key={d.name} className="grid grid-cols-[130px_minmax(0,1fr)_44px] items-center gap-3 text-[14px] sm:grid-cols-[150px_minmax(0,1fr)_44px]">
                    <span className="truncate text-ink">{d.name}</span>
                    <span className="relative h-3" aria-hidden="true">
                      <span className="absolute inset-y-0 left-0 rounded-r-[4px] bg-forest" style={{ width: `${(d.visits / maxDept) * 100}%` }} />
                    </span>
                    <span className="text-right text-muted tabular-nums">{d.visits}</span>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>

        <section aria-labelledby="doctors-table" className="min-w-0">
          <div className="flex flex-wrap items-end justify-between gap-4 pb-4">
            <h2 id="doctors-table" className="font-serif text-4xl text-ink">
              Doctors
            </h2>
            <p className="text-[14px] text-muted">Last {a.days} days. Booked is the share of the doctor's open hours that patients booked.</p>
          </div>
          <div className="relative overflow-x-auto border border-ivory-line bg-white">
            <table className="w-full min-w-[860px] text-left text-[15px]">
              <thead>
                <tr className="border-b border-ivory-line text-[13px] text-muted">
                  {["Doctor", "Visits", "Booked", "Average wait", "Visit length", "No-show"].map((h, i) => (
                    <th key={h} className={`px-5 py-3 font-normal ${i ? "text-right" : ""}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {shownDoctors.map((d) => (
                  <tr key={d.id} className="border-b border-ivory-line last:border-b-0">
                    <td className="px-5 py-3">
                      <span className="flex items-center gap-3">
                        <DoctorAvatar doctor={d} size={36} />
                        <span>
                          <span className="block text-ink">{d.name}</span>
                          <span className="text-[13px] text-muted">{d.specialization}</span>
                        </span>
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums">{d.visits}</td>
                    <td className="px-5 py-3">
                      {d.bookedShare === null ? (
                        <span className="block text-right text-muted">–</span>
                      ) : (
                        <span className="flex items-center justify-end gap-3">
                          <span className="relative h-2 w-28 bg-ivory-warm" aria-hidden="true">
                            <span className={`absolute inset-y-0 left-0 ${d.bookedShare < LOW_BOOKED ? "bg-champagne" : "bg-forest"}`} style={{ width: `${d.bookedShare}%` }} />
                          </span>
                          <span className="w-12 text-right tabular-nums">{Math.round(d.bookedShare)}%</span>
                        </span>
                      )}
                    </td>
                    <td className={`px-5 py-3 text-right tabular-nums ${d.averageWait >= LONG_WAIT ? "text-alert" : ""}`}>{d.averageWait === null ? "–" : `${Math.round(d.averageWait)} min`}</td>
                    <td className="px-5 py-3 text-right tabular-nums">{d.averageLength === null ? "–" : `${Math.round(d.averageLength)} min`}</td>
                    <td className={`px-5 py-3 text-right tabular-nums ${d.noShowRate >= HIGH_NO_SHOW ? "text-alert" : ""}`}>{d.noShowRate === null ? "–" : `${d.noShowRate}%`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {idle.length > 0 && (
            <p className="mt-3 text-[14px] text-muted">
              {idle.length} {idle.length === 1 ? "doctor" : "doctors"} had no visits in this period.{" "}
              <button type="button" onClick={() => setShowIdle((v) => !v)} className={ui.link}>
                {showIdle ? "Hide them" : "Show them"}
              </button>
            </p>
          )}
          <p className="mt-3 text-[14px] text-muted">
            In red: an average wait of {LONG_WAIT} minutes or more, or a no-show rate of {HIGH_NO_SHOW}% or more. In gold: doctors booked under {LOW_BOOKED}% of their hours. A dash means
            there is nothing to measure yet.
          </p>
        </section>
      </div>
    </>
  );
}
