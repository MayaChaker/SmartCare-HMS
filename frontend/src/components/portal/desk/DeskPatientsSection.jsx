import { useState } from "react";
import PageHead from "../PageHead";
import { formatDate, patientNumber } from "../format";
import { ui } from "../ui";
import { AllergyNote, PatientInitials } from "../doctor/PatientChart";
import ActivationCode from "./ActivationCode";
import { personName } from "./desk";
import { BusyLabel } from "../../Loader";

const FIELDS = [
  ["firstName", "First name", "text"],
  ["lastName", "Last name", "text"],
  ["phone", "Mobile", "tel"],
  ["dateOfBirth", "Date of birth", "date"],
];

// The desk's view of one patient: contact details it can correct, and the state of their account
function PatientCard({ patient, desk, onBook }) {
  const [values, setValues] = useState(null); // null while not editing
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);
  const [code, setCode] = useState(null);

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    const result = await desk.updatePatient(patient.id, values);
    setBusy(false);
    if (result.success) setValues(null);
    setMessage(result.success ? { ok: true, text: "Saved." } : { ok: false, text: result.message });
  };

  const newCode = async () => {
    setBusy(true);
    const result = await desk.newActivationCode(patient.id);
    setBusy(false);
    if (result.success) setCode({ name: personName(patient), code: result.data.activationCode, expiresAt: result.data.activationExpiresAt });
    else setMessage({ ok: false, text: result.message });
  };

  return (
    <aside aria-label="Patient" className="min-w-0 border border-ivory-line bg-white p-6 sm:p-8 lg:sticky lg:top-40 lg:self-start">
      <div className="flex items-center gap-4">
        <PatientInitials patient={patient} size={60} />
        <div className="min-w-0">
          <p className="font-serif text-[32px] leading-none text-ink">{personName(patient)}</p>
          <p className="mt-1 text-[14px] text-muted tabular-nums lining-nums">{patientNumber(patient.id)}</p>
        </div>
      </div>
      <AllergyNote allergies={patient.allergies} className="mt-5" />

      {values ? (
        <form onSubmit={save} className="mt-6 grid gap-4 border-t border-ivory-line pt-5">
          {FIELDS.map(([key, label, type]) => (
            <div key={key} className="grid gap-2">
              <label htmlFor={`desk-edit-${key}`} className="text-[14px] font-medium text-ink">
                {label}
              </label>
              <input
                id={`desk-edit-${key}`}
                type={type}
                value={values[key] || ""}
                onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))}
                required={key !== "dateOfBirth"}
                className={`${ui.input} h-12`}
              />
            </div>
          ))}
          <div className="flex gap-3">
            <button type="submit" disabled={busy} aria-busy={busy} className={ui.primary}>
              <BusyLabel busy={busy} text="Save" />
            </button>
            <button type="button" onClick={() => setValues(null)} className={ui.outline}>
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <dl className="mt-6 grid gap-3 border-t border-ivory-line pt-5 text-[15px]">
          {[
            ["Mobile", patient.phone],
            ["Date of birth", patient.dateOfBirth && formatDate(patient.dateOfBirth, { day: "numeric", month: "long", year: "numeric" })],
            ["Insurance", patient.insurance],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between gap-4">
              <dt className="text-muted">{label}</dt>
              <dd className={value ? "text-right text-ink" : "text-muted"}>{value || "Not given"}</dd>
            </div>
          ))}
        </dl>
      )}

      <div className="mt-6 border-t border-ivory-line pt-5 text-[15px]">
        <p className="text-[13px] text-muted">Patient portal</p>
        {patient.hasAccount ? (
          <p className="mt-0.5">
            Active
            {!patient.healthInfoComplete && <span className="block text-[14px] text-champagne">Health information not complete. Ask the patient to fill it in.</span>}
          </p>
        ) : (
          <p className="mt-0.5">
            {patient.activationPending ? "Waiting for the patient to activate it" : "Not activated; the code has expired"}
            <button type="button" onClick={newCode} disabled={busy} className={`${ui.link} mt-2 block`}>
              Give a new activation code
            </button>
          </p>
        )}
      </div>
      {code && (
        <div className="mt-5">
          <ActivationCode {...code} />
        </div>
      )}

      {message && (
        <p role={message.ok ? "status" : "alert"} className={`mt-4 text-[15px] ${message.ok ? "text-forest" : "text-alert"}`}>
          {message.text}
        </p>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        <button type="button" onClick={() => onBook(patient.id)} className={ui.primary}>
          Book for {patient.firstName}
        </button>
        {!values && (
          <button type="button" onClick={() => setValues(Object.fromEntries(FIELDS.map(([k]) => [k, patient[k] || ""])))} className={ui.outline}>
            Edit contact details
          </button>
        )}
      </div>
    </aside>
  );
}

export default function DeskPatientsSection({ desk, focusPatientId, onBook, onNewFile }) {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState(focusPatientId || null);

  const query = search.trim().toLowerCase();
  const rows = desk.patients.filter((p) => !query || `${personName(p)} ${p.phone || ""}`.toLowerCase().includes(query));
  const selected = desk.patients.find((p) => p.id === selectedId) || rows[0];

  return (
    <>
      <PageHead
        title="Patients"
        intro="Find a patient by name or mobile, correct their contact details or book for them."
        action={
          <button type="button" onClick={onNewFile} className={ui.outline}>
            Open a new file
          </button>
        }
      />
      <div className={`${ui.page} grid grid-cols-1 gap-12 pb-24 lg:grid-cols-[minmax(0,1fr)_420px]`}>
        <div className="min-w-0">
          <label htmlFor="desk-patients-search" className="text-[14px] font-medium text-ink">
            Search
          </label>
          <input id="desk-patients-search" type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name or mobile" className={`${ui.input} mt-2 h-12`} />
          <p className="mt-4 text-[14px] text-muted">{rows.length} patients</p>
          <ol className="mt-2 border-t border-ivory-line">
            {rows.slice(0, 50).map((p) => (
              <li key={p.id} className={`border-b border-ivory-line ${p.id === selected?.id ? "bg-white" : ""}`}>
                <button type="button" onClick={() => setSelectedId(p.id)} aria-current={p.id === selected?.id ? "true" : undefined} className="flex w-full items-center gap-4 px-3 py-4 text-left hover:bg-white/60">
                  <PatientInitials patient={p} size={40} />
                  <span className="min-w-0 flex-1">
                    <span className="block font-serif text-[22px] leading-tight text-ink">{personName(p)}</span>
                    <span className="text-[13px] text-muted">{[p.phone, p.insurance].filter(Boolean).join(" · ")}</span>
                  </span>
                  <span className="shrink-0 text-right text-[12px]">
                    {p.allergies && <span className="block text-alert">Allergy</span>}
                    {!p.hasAccount && <span className="block text-champagne">No account yet</span>}
                  </span>
                </button>
              </li>
            ))}
          </ol>
          {rows.length > 50 && <p className="mt-4 text-[14px] text-muted">Showing the first 50. Search to narrow the list.</p>}
        </div>
        {selected && <PatientCard key={selected.id} patient={selected} desk={desk} onBook={onBook} />}
      </div>
    </>
  );
}
