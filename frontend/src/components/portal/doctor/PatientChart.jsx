import { doctorName, formatDate, patientNumber } from "../format";
import { initials, patientFacts, patientName } from "./chart";
import Loader from "../../Loader";

export function PatientInitials({ patient, size = 44 }) {
  return (
    <span
      aria-hidden="true"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.4) }}
      className="grid shrink-0 place-items-center rounded-full bg-ivory-warm font-serif text-forest"
    >
      {initials(patient)}
    </span>
  );
}

export function AllergyNote({ allergies, className = "" }) {
  if (!allergies) return null;
  return (
    <p className={`border-l-2 border-alert bg-alert/5 px-4 py-3 text-[15px] text-alert ${className}`}>
      <span className="font-medium">Allergy:</span> {allergies}
    </p>
  );
}

// What the doctor needs before and during a visit: who, allergies, medicines, history and past summaries.
// `records` is null while loading.
export default function PatientChart({ patient, records, showDetails = true }) {
  return (
    <>
      <div className="flex items-center gap-4">
        <PatientInitials patient={patient} size={64} />
        <div className="min-w-0">
          <p className="font-serif text-[36px] leading-none text-ink">{patientName(patient)}</p>
          <p className="mt-1 text-[15px] text-muted tabular-nums lining-nums">
            {[patientFacts(patient), patientNumber(patient.id)].filter(Boolean).join(" · ")}
          </p>
        </div>
      </div>

      {patient.allergies ? (
        <AllergyNote allergies={patient.allergies} className="mt-6" />
      ) : (
        <p className="mt-6 border-l-2 border-ivory-line px-4 py-3 text-[15px] text-muted">No known allergies</p>
      )}

      <dl className="mt-6 grid gap-4 border-t border-ivory-line pt-5 text-[15px]">
        {[
          ["Blood type", patient.bloodType],
          ["Medicines", patient.permanentMedicine],
          ["History", patient.medicalHistory],
          ["Phone", patient.phone],
        ].map(([label, value]) => (
          <div key={label}>
            <dt className="text-[13px] text-muted">{label}</dt>
            <dd className={`mt-0.5 ${value ? "text-ink" : "text-muted"}`}>{value || "Not recorded"}</dd>
          </div>
        ))}
      </dl>

      <h3 className="mt-10 font-serif text-2xl text-ink">Past visits</h3>
      {records === null ? (
        <Loader variant="section" label="Loading the chart…" className="mt-3" />
      ) : records.length === 0 ? (
        <p className="mt-3 text-[15px] text-muted">No visit summaries yet.</p>
      ) : (
        <ol className="mt-3 border-t border-ivory-line">
          {records.map((r) => (
            <li key={r.id} className="border-b border-ivory-line py-4">
              <p className="text-[13px] text-muted">
                {formatDate(r.visitDate, { day: "numeric", month: "short", year: "numeric" })} · {doctorName(r.Doctor)}
              </p>
              <p className="mt-0.5 font-serif text-[22px] leading-tight text-ink">{r.diagnosis || "Visit note"}</p>
              {showDetails && (
                <>
                  {r.notes && <p className="mt-1 text-[14px] text-ink/80">{r.notes}</p>}
                  {r.prescriptions && <p className="mt-1 text-[14px] whitespace-pre-line text-muted">{r.prescriptions}</p>}
                </>
              )}
            </li>
          ))}
        </ol>
      )}
    </>
  );
}
