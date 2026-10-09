import { useEffect, useState } from "react";
import PageHead from "../PageHead";
import StatusBadge from "../StatusBadge";
import { doctorName, formatDate, formatTime } from "../format";
import { ui } from "../ui";
import { toLocalDateString } from "../../../utils/schedule";
import VisitDialog from "./VisitDialog";
import { isLate, personName } from "./desk";

const STATUSES = [
  ["all", "All"],
  ["late", "Late"],
  ["scheduled", "Booked"],
  ["checked-in", "Waiting"],
  ["in-progress", "With doctor"],
  ["completed", "Done"],
  ["no-show", "No-show"],
  ["cancelled", "Cancelled"],
];

// Every visit on one day, with filters, for the week ahead
export default function DeskVisitsSection({ desk, now, onMove, onOpenPatient }) {
  const today = toLocalDateString(now);
  const week = Array.from({ length: 7 }, (_, i) => toLocalDateString(new Date(now.getFullYear(), now.getMonth(), now.getDate() + i)));
  const [date, setDate] = useState(today);
  const [doctorId, setDoctorId] = useState("all");
  const [status, setStatus] = useState("all");
  const [other, setOther] = useState({ date: null, visits: [] });
  const [reload, setReload] = useState(0);
  const [open, setOpen] = useState(null);
  const [message, setMessage] = useState("");

  // Today comes live from the desk; other days are fetched when chosen
  useEffect(() => {
    if (date === today) return undefined;
    let cancelled = false;
    desk.getDay(date).then((result) => {
      if (!cancelled) setOther({ date, visits: result.success ? result.data : [] });
    });
    return () => {
      cancelled = true;
    };
    // desk.getDay is a stable API function
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, today, reload]);

  const visits = date === today ? desk.today : other.date === date ? other.visits : null;
  const shown = (visits || [])
    .filter((v) => doctorId === "all" || Number(v.doctorId) === Number(doctorId))
    .filter((v) => status === "all" || (status === "late" ? isLate(v) : v.status === status))
    .sort((a, b) => String(a.appointmentTime).localeCompare(String(b.appointmentTime)));

  const checkIn = async (visit) => {
    const result = await desk.checkIn(visit.id);
    setMessage(result.success ? `${personName(visit.Patient)} checked in.` : result.message);
  };

  return (
    <>
      <PageHead
        title="Visits"
        intro="Every visit by day. Filter by doctor or status."
        action={
          <a href="#book" className={ui.primary}>
            Book a visit
          </a>
        }
      />
      <div className={`${ui.page} pb-24`}>
        <div className="flex flex-wrap items-end gap-4">
          <div role="tablist" aria-label="Day" className="flex flex-wrap gap-2">
            {week.map((d) => {
              const on = d === date;
              return (
                <button
                  key={d}
                  type="button"
                  role="tab"
                  aria-selected={on}
                  onClick={() => setDate(d)}
                  className={`grid h-16 w-16 place-items-center content-center border ${on ? "border-forest bg-forest text-ivory" : "border-ivory-line bg-white text-ink hover:border-forest"}`}
                >
                  <span className={`text-[12px] ${on ? "text-ivory/70" : "text-muted"}`}>{d === today ? "Today" : formatDate(d, { weekday: "short" })}</span>
                  <span className="font-serif text-[26px] leading-none tabular-nums lining-nums">{formatDate(d, { day: "numeric" })}</span>
                </button>
              );
            })}
          </div>
          <div className="grid gap-2">
            <label htmlFor="visits-doctor" className="text-[13px] text-muted">
              Doctor
            </label>
            <select id="visits-doctor" value={doctorId} onChange={(e) => setDoctorId(e.target.value)} className={`${ui.input} h-11 px-3`}>
              <option value="all">All doctors</option>
              {desk.doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  {doctorName(d)}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-2">
            <label htmlFor="visits-status" className="text-[13px] text-muted">
              Status
            </label>
            <select id="visits-status" value={status} onChange={(e) => setStatus(e.target.value)} className={`${ui.input} h-11 px-3`}>
              {STATUSES.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {message && (
          <p role="status" className="mt-6 border-l-2 border-forest bg-white px-5 py-3 text-[15px]">
            {message}
          </p>
        )}

        {visits === null ? (
          <p className="py-10 text-[16px] text-muted">Loading…</p>
        ) : shown.length === 0 ? (
          <p className="py-10 text-[16px] text-muted">No visits match.</p>
        ) : (
          <div className="relative mt-8 overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-[15px]">
              <thead>
                <tr className="border-b border-ivory-line text-[13px] text-muted">
                  {["Time", "Patient", "Doctor", "Reason", "Status"].map((h) => (
                    <th key={h} className="py-3 font-normal">
                      {h}
                    </th>
                  ))}
                  <th className="py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {shown.map((v) => (
                  <tr key={v.id} className="border-b border-ivory-line">
                    <td className="py-4 pr-4 tabular-nums">{formatTime(v.appointmentTime)}</td>
                    <td className="py-4 pr-4">
                      <button type="button" onClick={() => onOpenPatient(v.Patient?.id)} className="text-left">
                        <span className="block font-serif text-[21px] leading-tight text-ink">{personName(v.Patient)}</span>
                        <span className="text-[13px] text-muted">{v.Patient?.phone}</span>
                      </button>
                    </td>
                    <td className="py-4 pr-4">{doctorName(v.Doctor)}</td>
                    <td className="py-4 pr-4 text-muted">{v.reason}</td>
                    <td className="py-4 pr-4">
                      <StatusBadge status={v.status} viewer="desk" late={isLate(v)} />
                    </td>
                    <td className="py-4 text-right">
                      {v.status === "scheduled" && (
                        <div className="flex justify-end gap-2">
                          {date === today && (
                            <button type="button" onClick={() => checkIn(v)} className={`${ui.primary} h-9 px-3 text-[14px]`}>
                              Check in
                            </button>
                          )}
                          <button type="button" onClick={() => setOpen(v)} className={`${ui.outline} h-9 px-3 text-[14px]`}>
                            More
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {open && (
        <VisitDialog
          visit={open}
          desk={desk}
          onMove={(visit) => {
            setOpen(null);
            onMove(visit);
          }}
          onDone={(text) => {
            setMessage(text);
            setReload((r) => r + 1);
          }}
          checkInMessage={(visit) => `${personName(visit.Patient)} checked in.`}
          onClose={() => setOpen(null)}
        />
      )}
    </>
  );
}
