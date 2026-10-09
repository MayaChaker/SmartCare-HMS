import { useState } from "react";
import PageHead from "../PageHead";
import { doctorName, formatDate, formatTime } from "../format";
import { departmentPlace } from "../../../content/portal";
import { ui } from "../ui";
import { PatientInitials } from "../doctor/PatientChart";
import ActivationCode from "./ActivationCode";
import { personName } from "./desk";
import { BusyLabel } from "../../Loader";

const SHOWN_DAYS = 6;
const SHOWN_TIMES = 10;

function StepTitle({ number, done, children }) {
  return (
    <h2 className="flex items-baseline gap-4 font-serif text-3xl text-ink">
      <span aria-hidden="true" className={`w-5 font-sans text-[15px] ${done ? "text-champagne" : "text-muted"}`}>
        {done ? "✓" : number}
      </span>
      {children}
    </h2>
  );
}

// Open a file for a new patient: name, mobile and date of birth only. The patient adds the rest themselves.
function NewFileForm({ onOpen, onBack }) {
  const [values, setValues] = useState({ firstName: "", lastName: "", phone: "", dateOfBirth: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const set = (key) => (e) => setValues((v) => ({ ...v, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    const result = await onOpen(values);
    setBusy(false);
    if (!result.success) setError(result.message);
  };

  return (
    <form onSubmit={submit} className="mt-5 grid gap-4 sm:grid-cols-2 sm:pl-9">
      {[
        ["firstName", "First name", "e.g. Rana", "text"],
        ["lastName", "Last name", "e.g. Haddad", "text"],
        ["phone", "Mobile", "e.g. +961 70 123 456", "tel"],
        ["dateOfBirth", "Date of birth", "", "date"],
      ].map(([key, label, placeholder, type]) => (
        <div key={key} className="grid gap-2">
          <label htmlFor={`file-${key}`} className="text-[14px] font-medium text-ink">
            {label}
          </label>
          <input id={`file-${key}`} type={type} value={values[key]} onChange={set(key)} placeholder={placeholder} required={key !== "dateOfBirth"} className={`${ui.input} h-12`} />
        </div>
      ))}
      {error && (
        <p role="alert" className="text-[15px] text-alert sm:col-span-2">
          {error}
        </p>
      )}
      <div className="flex flex-wrap gap-3 sm:col-span-2">
        <button type="submit" disabled={busy} className={ui.primary}>
          {busy ? "Opening…" : "Open file"}
        </button>
        <button type="button" onClick={onBack} className={ui.outline}>
          Back to search
        </button>
      </div>
      <p className="text-[14px] text-muted sm:col-span-2">
        The patient completes their health information and chooses their own password from the patient portal.
      </p>
    </form>
  );
}

// Booking for a patient on the phone or at the desk. Also used to move a visit (preset.moving).
export default function DeskBookSection({ desk, preset = {}, onFinished }) {
  const moving = preset.moving || null;
  const [patientId, setPatientId] = useState(moving?.Patient?.id || preset.patientId || null);
  const [search, setSearch] = useState("");
  const [newFile, setNewFile] = useState(Boolean(preset.newFile));
  const [code, setCode] = useState(null);
  const [doctorId, setDoctorId] = useState(moving?.doctorId || preset.doctorId || "");
  const [slot, setSlot] = useState(preset.date && preset.time ? { date: preset.date, time: preset.time } : null);
  const [expanded, setExpanded] = useState({});
  const [reason, setReason] = useState(moving?.reason || "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [booked, setBooked] = useState(null);

  const patient = desk.patients.find((p) => p.id === patientId) || (moving && moving.Patient);
  const doctor = desk.doctors.find((d) => Number(d.id) === Number(doctorId));
  const days = (doctor && desk.availability[doctor.id]) || [];
  const query = search.trim().toLowerCase();
  const matches =
    query.length >= 2
      ? desk.patients.filter((p) => `${personName(p)} ${p.phone || ""}`.toLowerCase().includes(query)).slice(0, 6)
      : [];

  const openFile = async (values) => {
    const result = await desk.openFile(values);
    if (result.success) {
      setPatientId(result.data.patient.id);
      setCode({ name: personName(result.data.patient), code: result.data.activationCode, expiresAt: result.data.activationExpiresAt });
      setNewFile(false);
    }
    return result;
  };

  const ready = patient && doctor && slot && (moving || reason.trim());

  const confirm = async () => {
    setBusy(true);
    setError("");
    const when = { appointmentDate: slot.date, appointmentTime: slot.time };
    const result = moving
      ? await desk.move(moving.id, when)
      : await desk.book({ patientId: patient.id, doctorId: doctor.id, ...when, reason: reason.trim() });
    setBusy(false);
    if (result.success) setBooked({ patient, doctor, ...slot });
    else setError(result.message);
  };

  if (booked) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <svg width="44" height="44" viewBox="0 0 44 44" aria-hidden="true">
          <circle cx="22" cy="22" r="21" fill="none" className="stroke-champagne" />
          <path d="m14 22.5 5.5 5.5L30.5 17" fill="none" strokeWidth="1.6" className="stroke-forest" />
        </svg>
        <h1 className="mt-6 font-serif text-5xl text-ink">
          {moving ? "Moved" : "Booked"} for {booked.patient.firstName}.
        </h1>
        <p className="mt-3 text-[17px] text-muted">
          {doctorName(booked.doctor)}, {formatDate(booked.date, { weekday: "long", day: "numeric", month: "long" })} at {formatTime(booked.time)}.{" "}
          {departmentPlace(booked.doctor.specialization)}.
        </p>
        <p className="mt-8 border-l-2 border-champagne bg-white px-5 py-4 text-[15px]">
          Read back to the patient: the date, time, doctor and floor. Ask them to arrive 15 minutes early with their ID and insurance card.
        </p>
        {code && (
          <div className="mt-6">
            <ActivationCode {...code} />
          </div>
        )}
        <div className="mt-10 flex flex-wrap gap-3">
          <button type="button" onClick={onFinished} className={ui.primary}>
            Back to the desk
          </button>
        </div>
      </section>
    );
  }

  return (
    <>
      <PageHead
        title={moving ? "Move a visit" : "Book a visit"}
        intro={moving ? "Choose the new time. The old time stays booked until you confirm." : "For a phone call or a walk-in. Find the patient first, so the visit lands in the right file."}
      />
      <div className={`${ui.page} grid grid-cols-1 gap-12 pb-24 lg:grid-cols-[minmax(0,1fr)_340px]`}>
        <div className="min-w-0 border-b border-ivory-line">
          <section className="border-t border-ivory-line py-7">
            <StepTitle number={1} done={Boolean(patient)}>
              Patient
            </StepTitle>
            {patient ? (
              <div className="mt-4 grid gap-5 sm:pl-9">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <PatientInitials patient={patient} size={44} />
                    <div>
                      <p className="text-[17px] text-ink">{personName(patient)}</p>
                      <p className="text-[14px] text-muted">
                        {[patient.phone, patient.dateOfBirth && `born ${formatDate(patient.dateOfBirth, { day: "numeric", month: "short", year: "numeric" })}`, patient.insurance]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </div>
                  </div>
                  {!moving && (
                    <button
                      type="button"
                      onClick={() => {
                        setPatientId(null);
                        setCode(null);
                      }}
                      className={ui.link}
                    >
                      Change
                    </button>
                  )}
                </div>
                {code && <ActivationCode {...code} />}
              </div>
            ) : newFile ? (
              <NewFileForm onOpen={openFile} onBack={() => setNewFile(false)} />
            ) : (
              <div className="mt-5 sm:pl-9">
                <label htmlFor="desk-patient-search" className="text-[14px] font-medium text-ink">
                  Name or mobile
                </label>
                <input
                  id="desk-patient-search"
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="e.g. Khoury or 70 000"
                  autoComplete="off"
                  className={`${ui.input} mt-2 h-12`}
                />
                {query.length >= 2 && (
                  <ol className="mt-3 border border-ivory-line bg-white">
                    {matches.length === 0 && <li className="px-4 py-3 text-[15px] text-muted">No patient found.</li>}
                    {matches.map((p) => (
                      <li key={p.id} className="border-b border-ivory-line last:border-b-0">
                        <button type="button" onClick={() => setPatientId(p.id)} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-ivory/60">
                          <PatientInitials patient={p} size={36} />
                          <span className="min-w-0">
                            <span className="block text-[16px] text-ink">{personName(p)}</span>
                            <span className="block text-[13px] text-muted">
                              {[p.phone, p.dateOfBirth && `born ${formatDate(p.dateOfBirth, { day: "numeric", month: "short", year: "numeric" })}`].filter(Boolean).join(" · ")}
                            </span>
                          </span>
                        </button>
                      </li>
                    ))}
                  </ol>
                )}
                <button type="button" onClick={() => setNewFile(true)} className={`${ui.link} mt-4`}>
                  New patient? Open a file
                </button>
              </div>
            )}
          </section>

          <section className={`border-t border-ivory-line py-7 ${patient ? "" : "opacity-50"}`}>
            <StepTitle number={2} done={Boolean(slot)}>
              Doctor and time
            </StepTitle>
            {patient ? (
              <div className="mt-5 grid gap-6 sm:pl-9">
                <div className="grid gap-2 sm:max-w-sm">
                  <label htmlFor="desk-doctor" className="text-[14px] font-medium text-ink">
                    Doctor
                  </label>
                  <select
                    id="desk-doctor"
                    value={doctorId}
                    disabled={Boolean(moving)}
                    onChange={(e) => {
                      setDoctorId(e.target.value);
                      setSlot(null);
                    }}
                    className={`${ui.input} h-12 px-3`}
                  >
                    <option value="">Choose a doctor</option>
                    {desk.doctors
                      .filter((d) => d.availability !== false)
                      .map((d) => (
                        <option key={d.id} value={d.id}>
                          {doctorName(d)} · {d.specialization}
                        </option>
                      ))}
                  </select>
                </div>
                {doctor &&
                  (days.some((d) => d.times.length) ? (
                    days
                      .filter((d) => d.times.length)
                      .slice(0, SHOWN_DAYS)
                      .map((d) => {
                        const all = expanded[d.date];
                        const times = all ? d.times : d.times.slice(0, SHOWN_TIMES);
                        return (
                          <div key={d.date}>
                            <p className="text-[15px] text-muted">{formatDate(d.date, { weekday: "long", day: "numeric", month: "short" })}</p>
                            <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label={formatDate(d.date, { weekday: "long", day: "numeric", month: "long" })}>
                              {times.map((t) => {
                                const on = slot?.date === d.date && slot?.time === t;
                                return (
                                  <button
                                    key={t}
                                    type="button"
                                    role="radio"
                                    aria-checked={on}
                                    onClick={() => setSlot({ date: d.date, time: t })}
                                    className={`h-10 border px-3 text-[14px] tabular-nums ${on ? "border-forest bg-forest text-ivory" : "border-ivory-line bg-white text-ink hover:border-forest"}`}
                                  >
                                    {formatTime(t)}
                                  </button>
                                );
                              })}
                              {!all && d.times.length > SHOWN_TIMES && (
                                <button type="button" onClick={() => setExpanded((x) => ({ ...x, [d.date]: true }))} className="self-center text-[13px] text-forest underline underline-offset-4">
                                  +{d.times.length - SHOWN_TIMES} more
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })
                  ) : (
                    <p className="text-[15px] text-muted">No free times in the next two weeks.</p>
                  ))}
              </div>
            ) : (
              <p className="mt-3 text-[15px] text-muted sm:pl-9">Choose the patient first.</p>
            )}
          </section>

          {!moving && (
            <section className={`border-t border-ivory-line py-7 ${slot ? "" : "opacity-50"}`}>
              <StepTitle number={3} done={false}>
                Reason
              </StepTitle>
              {slot && (
                <div className="mt-5 grid gap-2 sm:pl-9">
                  <label htmlFor="desk-reason" className="text-[14px] font-medium text-ink">
                    What is the visit for?
                  </label>
                  <input id="desk-reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Follow-up after surgery" className={`${ui.input} h-12`} />
                </div>
              )}
            </section>
          )}
        </div>

        <aside aria-label="Summary" className="lg:sticky lg:top-40 lg:self-start">
          <div className="border border-ivory-line bg-white p-6">
            <h2 className="font-serif text-2xl text-ink">Summary</h2>
            <dl className="mt-4 grid gap-3 text-[15px]">
              {[
                ["Patient", patient && personName(patient)],
                ["Doctor", doctor && doctorName(doctor)],
                ["When", slot && `${formatDate(slot.date, { weekday: "short", day: "numeric", month: "short" })}, ${formatTime(slot.time)}`],
                ["Insurance", patient?.insurance],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-4 border-b border-ivory-line pb-3">
                  <dt className="text-muted">{label}</dt>
                  <dd className={`text-right ${value ? "text-ink" : "text-muted/70"}`}>{value || "Not given"}</dd>
                </div>
              ))}
            </dl>
            {patient?.allergies && <p className="mt-4 text-[14px] text-alert">Allergy on file: {patient.allergies}</p>}
            {moving && (
              <p className="mt-4 text-[14px] text-muted">
                Now {formatDate(moving.appointmentDate, { weekday: "short", day: "numeric", month: "short" })} at {formatTime(moving.appointmentTime)}
              </p>
            )}
            {error && (
              <p role="alert" className="mt-4 text-[14px] text-alert">
                {error}
              </p>
            )}
            <button type="button" onClick={confirm} disabled={!ready || busy} aria-busy={busy} className={`${ui.primary} mt-6 h-12 w-full`}>
              <BusyLabel busy={busy} text={moving ? "Move visit" : "Book visit"} />
            </button>
          </div>
        </aside>
      </div>
    </>
  );
}
