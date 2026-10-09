import { useEffect, useState } from "react";
import StatusBadge from "../StatusBadge";
import { formatDate, formatTime } from "../format";
import { ui } from "../ui";
import PatientChart from "./PatientChart";
import { FOLLOW_UPS, followUpDate, prescriptionToRows, rowsToPrescription } from "./chart";

const COLUMNS = ["Medicine", "Dose", "How often", "For"];

function TextArea({ id, label, value, onChange, placeholder, rows = 2 }) {
  return (
    <div className="grid gap-2">
      <label htmlFor={id} className="text-[15px] font-medium text-ink">
        {label}
      </label>
      <textarea id={id} rows={rows} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={`${ui.input} resize-y py-3`} />
    </div>
  );
}

// The note form. Starts from the saved note when the visit already has one.
function NoteForm({ visit, record, allergies, onSave, onComplete }) {
  const [note, setNote] = useState(() => ({
    symptoms: record?.symptoms || "",
    notes: record?.notes || "",
    diagnosis: record?.diagnosis || "",
    treatment: record?.treatment || "",
    rows: prescriptionToRows(record?.prescriptions),
    followUp: record?.followUpDate ? "saved" : "",
  }));
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState(null);

  const set = (key) => (value) => setNote((n) => ({ ...n, [key]: value }));
  const setCell = (i, j, value) => setNote((n) => ({ ...n, rows: n.rows.map((r, ri) => (ri === i ? r.map((c, ci) => (ci === j ? value : c)) : r)) }));

  const payload = () => ({
    symptoms: note.symptoms,
    notes: note.notes,
    diagnosis: note.diagnosis,
    treatment: note.treatment,
    prescriptions: rowsToPrescription(note.rows),
    followUpDate: note.followUp === "saved" ? record.followUpDate : followUpDate(visit.appointmentDate, note.followUp) || "",
  });

  const run = async (kind) => {
    setBusy(kind);
    setMessage(null);
    const saved = await onSave(payload());
    if (saved.success && kind === "complete") {
      const done = await onComplete();
      if (!done.success) setMessage({ ok: false, text: done.message });
    } else {
      setMessage(saved.success ? { ok: true, text: "Saved." } : { ok: false, text: saved.message });
    }
    setBusy("");
  };

  const completing = visit.status === "in-progress";
  const hasDiagnosis = note.diagnosis.trim().length > 0;

  return (
    <form onSubmit={(e) => e.preventDefault()} className="grid grid-cols-1 gap-6 pt-8">
      <TextArea id="note-symptoms" label="What the patient tells you" value={note.symptoms} onChange={set("symptoms")} placeholder="e.g. Chest pain when climbing stairs for two weeks" />
      <TextArea id="note-exam" label="Examination" value={note.notes} onChange={set("notes")} placeholder="e.g. BP 134/84 mmHg, HR 62, regular" />
      <div className="grid gap-2">
        <label htmlFor="note-diagnosis" className="text-[15px] font-medium text-ink">
          Diagnosis
        </label>
        <input id="note-diagnosis" value={note.diagnosis} onChange={(e) => set("diagnosis")(e.target.value)} placeholder="e.g. Stable after stent, mild ankle oedema" className={`${ui.input} h-12`} />
      </div>
      <TextArea id="note-treatment" label="Treatment and advice" value={note.treatment} onChange={set("treatment")} placeholder="e.g. Raise legs in the evening, reduce salt" />

      <fieldset className="min-w-0">
        <legend className="text-[15px] font-medium text-ink">Prescription</legend>
        <div className="relative mt-2 overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-[15px]">
            <thead>
              <tr className="text-[13px] text-muted">
                {COLUMNS.map((c) => (
                  <th key={c} className="pb-2 font-normal">
                    {c}
                  </th>
                ))}
                <th className="pb-2">
                  <span className="sr-only">Remove</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {note.rows.map((row, i) => (
                <tr key={i}>
                  {row.map((cell, j) => (
                    <td key={j} className="pr-2 pb-2">
                      <input aria-label={`${COLUMNS[j]}, line ${i + 1}`} value={cell} onChange={(e) => setCell(i, j, e.target.value)} className={`${ui.input} h-11 px-3`} />
                    </td>
                  ))}
                  <td className="pb-2">
                    <button
                      type="button"
                      aria-label={`Remove line ${i + 1}`}
                      onClick={() => setNote((n) => ({ ...n, rows: n.rows.length > 1 ? n.rows.filter((_, ri) => ri !== i) : [["", "", "", ""]] }))}
                      className="h-11 px-2 text-muted hover:text-alert"
                    >
                      ×
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button type="button" onClick={() => setNote((n) => ({ ...n, rows: [...n.rows, ["", "", "", ""]] }))} className={`${ui.link} mt-1`}>
          Add a medicine
        </button>
        {allergies && <p className="mt-3 text-[14px] text-alert">Check against the allergy: {allergies}</p>}
      </fieldset>

      <div className="grid gap-2 sm:max-w-xs">
        <label htmlFor="note-follow" className="text-[15px] font-medium text-ink">
          Follow-up
        </label>
        <select id="note-follow" value={note.followUp} onChange={(e) => set("followUp")(e.target.value)} className={`${ui.input} h-12 px-3`}>
          {record?.followUpDate && <option value="saved">By {formatDate(record.followUpDate, { day: "numeric", month: "long", year: "numeric" })}</option>}
          {FOLLOW_UPS.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="sticky bottom-[calc(64px+env(safe-area-inset-bottom))] -mx-4 flex flex-wrap items-center justify-between gap-4 border-t border-ivory-line bg-ivory/95 px-4 py-4 backdrop-blur sm:mx-0 sm:px-0 lg:bottom-0">
        <p role={message && !message.ok ? "alert" : "status"} className={`text-[14px] ${message ? (message.ok ? "text-forest" : "text-alert") : "text-muted"}`}>
          {message?.text || (hasDiagnosis ? "The patient will see this summary in their portal." : "Add a diagnosis to complete the visit.")}
        </p>
        <div className="flex gap-3">
          {completing && (
            <button type="button" onClick={() => run("draft")} disabled={Boolean(busy)} className={ui.outline}>
              {busy === "draft" ? "Saving…" : "Save draft"}
            </button>
          )}
          <button type="button" onClick={() => run(completing ? "complete" : "draft")} disabled={!hasDiagnosis || Boolean(busy)} className={ui.primary}>
            {busy && busy !== "draft" ? "Saving…" : completing ? "Complete visit" : "Save note"}
          </button>
        </div>
      </div>
    </form>
  );
}

export default function VisitSection({ portal, visitId, onDone }) {
  const visit = portal.appointments.find((a) => Number(a.id) === Number(visitId));
  const [records, setRecords] = useState(null);
  const patientId = visit?.Patient?.id;

  useEffect(() => {
    if (!patientId) return undefined;
    let cancelled = false;
    portal.getPatient(patientId).then((result) => {
      if (!cancelled) setRecords(result.success ? result.data.medicalRecords : []);
    });
    return () => {
      cancelled = true;
    };
    // portal.getPatient is a stable API function
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId]);

  if (!visit) {
    return (
      <div className={`${ui.page} py-16`}>
        <p className="font-serif text-3xl text-ink">This visit is not on your list.</p>
        <a href="#today" className={`${ui.link} mt-4 inline-block`}>
          Back to today
        </a>
      </div>
    );
  }

  const record = records?.find((r) => Number(r.appointmentId) === Number(visit.id));
  const canWrite = visit.status === "in-progress" || visit.status === "completed";

  return (
    <>
      <div className={`${ui.page} pt-8`}>
        <a href="#today" className="text-[15px] text-muted hover:text-ink">
          ← Today
        </a>
      </div>
      <div className={`${ui.page} grid grid-cols-1 gap-12 pt-6 pb-24 lg:grid-cols-[380px_minmax(0,1fr)] lg:gap-16`}>
        <aside aria-label="Patient" className="min-w-0 lg:sticky lg:top-40 lg:self-start">
          <PatientChart patient={visit.Patient || {}} records={records && records.filter((r) => Number(r.appointmentId) !== Number(visit.id))} showDetails={false} />
        </aside>

        <section aria-labelledby="visit-note" className="min-w-0">
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-ivory-line pb-5">
            <div>
              <p className="text-[14px] text-champagne">
                {formatDate(visit.appointmentDate, { weekday: "long", day: "numeric", month: "long" })} · {formatTime(visit.appointmentTime)}
                {visit.reason ? ` · ${visit.reason}` : ""}
              </p>
              <h1 id="visit-note" className="mt-2 font-serif text-5xl leading-none text-ink">
                Visit note
              </h1>
            </div>
            <StatusBadge status={visit.status} viewer="doctor" />
          </div>

          {!canWrite ? (
            <p className="pt-8 text-[16px] text-muted">You can write the note once the visit has started.</p>
          ) : records === null ? (
            <p className="pt-8 text-[16px] text-muted">Loading…</p>
          ) : (
            <NoteForm
              key={record?.id || "new"}
              visit={visit}
              record={record}
              allergies={visit.Patient?.allergies}
              onSave={(note) => portal.saveNote(visit, note)}
              onComplete={async () => {
                const result = await portal.completeVisit(visit.id);
                if (result.success) onDone();
                return result;
              }}
            />
          )}
        </section>
      </div>
    </>
  );
}
