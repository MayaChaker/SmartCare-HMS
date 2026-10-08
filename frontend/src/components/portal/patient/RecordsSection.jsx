import { useState } from "react";
import PageHead from "../PageHead";
import { doctorName, formatDate, patientNumber } from "../format";
import { patientOffice } from "../../../content/portal";
import { ui } from "../ui";

const SECTIONS = [
  ["symptoms", "Symptoms"],
  ["notes", "Doctor's notes"],
  ["treatment", "Treatment"],
  ["testResults", "Test results"],
  ["medications", "Medicines"],
  ["prescriptions", "Prescription"],
];

// The cross from the logo, in the hospital's colours, for the letterhead
const Mark = () => (
  <svg width="26" height="26" viewBox="0 0 30 30" aria-hidden="true" className="shrink-0">
    <rect x="12" y="1" width="6" height="11" rx="3" className="fill-champagne" />
    <rect x="12" y="18" width="6" height="11" rx="3" className="fill-champagne" />
    <rect x="1" y="12" width="11" height="6" rx="3" className="fill-forest" />
    <rect x="18" y="12" width="11" height="6" rx="3" className="fill-forest" />
  </svg>
);

// One visit summary, laid out like the letter the hospital would hand you
function Summary({ record, profile }) {
  const doctor = record.Doctor;
  const sections = SECTIONS.filter(([key]) => record[key]);
  return (
    <article aria-label="Visit summary" className="min-w-0 border border-ivory-line bg-[#fffdf9] px-6 py-8 sm:px-12 sm:py-12">
      <header className="flex flex-wrap items-start justify-between gap-6 border-b border-ink/80 pb-6">
        <div className="flex items-center gap-3">
          <Mark />
          <div className="leading-tight">
            <p className="font-serif text-[22px] text-forest">SmartCare Private Hospital</p>
            <p className="text-[13px] text-muted">Hamra Street, Beirut · {patientOffice.phone}</p>
          </div>
        </div>
        <div className="text-right leading-tight">
          <p className="font-serif text-[22px]">Visit summary</p>
          <p className="text-[13px] text-muted tabular-nums">No. {String(record.id).padStart(6, "0")}</p>
        </div>
      </header>

      <dl className="grid grid-cols-2 gap-x-8 gap-y-4 border-b border-ivory-line py-6 text-[15px] md:grid-cols-4">
        {[
          ["Patient", [profile.firstName, profile.lastName].filter(Boolean).join(" ")],
          ["Patient number", patientNumber(profile.id)],
          ["Date of visit", formatDate(record.visitDate, { day: "numeric", month: "short", year: "numeric" })],
          ["Doctor", `${doctorName(doctor)}${doctor?.specialization ? `, ${doctor.specialization}` : ""}`],
        ].map(([label, value]) => (
          <div key={label}>
            <dt className="text-[13px] text-muted">{label}</dt>
            <dd className="mt-0.5 tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>

      <section className="py-7">
        <h2 className="text-[13px] text-muted">Diagnosis</h2>
        <p className="mt-1 font-serif text-4xl leading-tight text-ink">{record.diagnosis || "Not recorded"}</p>
      </section>

      {sections.length > 0 && (
        <div className="grid gap-8 border-t border-ivory-line py-7 md:grid-cols-2">
          {sections.map(([key, label]) => (
            <section key={key} className="min-w-0">
              <h2 className="text-[15px] font-medium">{label}</h2>
              <p className="mt-2 text-[16px] leading-relaxed whitespace-pre-line text-ink/85">{record[key]}</p>
            </section>
          ))}
        </div>
      )}

      {record.followUpDate && (
        <p className="border-t border-ivory-line pt-6 text-[15px]">
          <span className="text-muted">Follow-up visit recommended by </span>
          {formatDate(record.followUpDate, { day: "numeric", month: "long", year: "numeric" })}
        </p>
      )}

      <footer className="mt-10 flex flex-wrap items-end justify-between gap-4 text-[14px] text-muted">
        <p>
          Written by <span className="text-ink">{doctorName(doctor)}</span>
          {doctor?.specialization ? `, ${doctor.specialization}` : ""}
        </p>
        <p>Questions about this summary? Private Patient Office, {patientOffice.phone}</p>
      </footer>
    </article>
  );
}

export default function RecordsSection({ portal, focusAppointmentId }) {
  const { records, profile } = portal;
  const initial = records.find((r) => focusAppointmentId && r.appointmentId === focusAppointmentId) || records[0];
  const [selectedId, setSelectedId] = useState(initial?.id);
  const selected = records.find((r) => r.id === selectedId) || records[0];

  return (
    <>
      <PageHead title="Medical records" intro="The summary your doctor writes after each visit: what they found, your treatment and your medicines." />
      <div className={`${ui.page} pb-24`}>
        {records.length === 0 ? (
          <p className="border-t border-ivory-line py-12 text-[16px] text-muted">Your visit summaries will appear here after your first visit.</p>
        ) : (
          <div className="grid gap-10 lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-14">
            <nav aria-label="Visit summaries" className="min-w-0">
              <ol className="border-t border-ivory-line">
                {records.map((r) => {
                  const on = r.id === selected.id;
                  return (
                    <li key={r.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedId(r.id)}
                        aria-current={on ? "true" : undefined}
                        className={`block w-full border-b border-l-2 border-b-ivory-line py-5 pl-4 text-left ${
                          on ? "border-l-forest bg-white" : "border-l-transparent hover:bg-white/60"
                        }`}
                      >
                        <span className="block text-[13px] text-muted">{formatDate(r.visitDate, { day: "numeric", month: "long", year: "numeric" })}</span>
                        <span className="mt-1 block font-serif text-[22px] leading-tight text-ink">{r.diagnosis || "Visit summary"}</span>
                        <span className="block text-[14px] text-muted">{doctorName(r.Doctor)}</span>
                      </button>
                    </li>
                  );
                })}
              </ol>
            </nav>
            <Summary record={selected} profile={profile} />
          </div>
        )}
      </div>
    </>
  );
}
