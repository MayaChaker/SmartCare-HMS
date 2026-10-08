import { useState } from "react";
import PageHead from "../PageHead";
import TextField from "../../auth/TextField";
import { formatDate, patientNumber } from "../format";
import { patientOffice } from "../../../content/portal";
import { useAuth } from "../../../context/useAuth";
import { ui } from "../ui";

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const GENDERS = ["Female", "Male"];

// Each group is shown and edited on its own: [field, label, input type, options]
const GROUPS = [
  {
    id: "personal",
    title: "Personal details",
    fields: [
      ["firstName", "First name"],
      ["lastName", "Last name"],
      ["dateOfBirth", "Date of birth", "date"],
      ["gender", "Gender", "select", GENDERS],
      ["phone", "Mobile", "tel"],
      ["email", "Email", "email"],
      ["address", "Address"],
    ],
  },
  {
    id: "health",
    title: "Health information",
    note: "Your doctors read this before every visit.",
    fields: [
      ["bloodType", "Blood type", "select", BLOOD_TYPES],
      ["allergies", "Allergies"],
      ["permanentMedicine", "Medicines you take", "wide"],
      ["medicalHistory", "Medical history", "wide"],
    ],
  },
  {
    id: "emergency",
    title: "Emergency contact and insurance",
    fields: [
      ["emergencyContact", "Emergency contact"],
      ["insurance", "Insurance"],
    ],
  },
];

const display = (key, value) => {
  if (!value) return <span className="text-muted">Not added yet</span>;
  return key === "dateOfBirth" ? formatDate(value, { day: "numeric", month: "long", year: "numeric" }) : value;
};

function SelectField({ id, label, options, value, onChange }) {
  return (
    <div className="grid content-start gap-2">
      <label htmlFor={id} className="text-[14px] font-medium text-ink">
        {label}
      </label>
      <select id={id} value={value} onChange={onChange} className={`${ui.input} px-3`}>
        <option value="">Choose…</option>
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    </div>
  );
}

function Group({ group, profile, onSave }) {
  const [values, setValues] = useState(null); // null while not editing
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);

  const edit = () => {
    setValues(Object.fromEntries(group.fields.map(([key]) => [key, profile[key] || ""])));
    setMessage(null);
  };
  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    const result = await onSave(values);
    setBusy(false);
    if (result.success) {
      setValues(null);
      setMessage({ ok: true, text: "Saved." });
    } else {
      setMessage({ ok: false, text: result.message || "We could not save your changes. Please try again." });
    }
  };
  const update = (key) => (e) => setValues((v) => ({ ...v, [key]: e.target.value }));

  return (
    <section aria-labelledby={`profile-${group.id}`}>
      <div className="flex items-end justify-between gap-4 border-b border-ivory-line pb-4">
        <div>
          <h2 id={`profile-${group.id}`} className="font-serif text-3xl text-ink">
            {group.title}
          </h2>
          {group.note && <p className="mt-1 text-[14px] text-muted">{group.note}</p>}
        </div>
        {!values && (
          <button type="button" onClick={edit} className={ui.link} aria-label={`Edit ${group.title.toLowerCase()}`}>
            Edit
          </button>
        )}
      </div>

      {message && (
        <p role={message.ok ? "status" : "alert"} className={`mt-4 text-[15px] ${message.ok ? "text-forest" : "text-alert"}`}>
          {message.text}
        </p>
      )}

      {values ? (
        <form onSubmit={save} className="grid gap-x-8 gap-y-5 pt-6 sm:grid-cols-2">
          {group.fields.map(([key, label, type, options]) =>
            type === "select" ? (
              <SelectField key={key} id={`profile-field-${key}`} label={label} options={options} value={values[key]} onChange={update(key)} />
            ) : (
              <div key={key} className={type === "wide" ? "sm:col-span-2" : ""}>
                <TextField label={label} type={type === "wide" ? "text" : type || "text"} value={values[key]} onChange={update(key)} />
              </div>
            ),
          )}
          <div className="flex gap-3 sm:col-span-2">
            <button type="submit" disabled={busy} className={ui.primary}>
              {busy ? "Saving…" : "Save changes"}
            </button>
            <button type="button" onClick={() => setValues(null)} className={ui.outline}>
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <dl className="grid gap-x-10 sm:grid-cols-2">
          {group.fields.map(([key, label, type]) => (
            <div key={key} className={`border-b border-ivory-line py-4 ${type === "wide" ? "sm:col-span-2" : ""}`}>
              <dt className="text-[13px] text-muted">{label}</dt>
              <dd className="mt-0.5 text-[16px] text-ink">{display(key, profile[key])}</dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}

// The patient card: shown at reception, styled like a membership card
function PatientCard({ profile }) {
  return (
    <div className="relative aspect-[1.586/1] w-full max-w-[400px] overflow-hidden bg-gradient-to-br from-forest-soft via-forest to-forest-deep p-2 text-ivory">
      <div className="relative flex h-full flex-col justify-between border border-champagne/40 p-5 sm:p-6">
        <div aria-hidden="true" className="absolute -right-20 -bottom-24 h-72 w-72 rounded-full border border-champagne/20" />
        <div aria-hidden="true" className="absolute -right-8 -bottom-12 h-48 w-48 rounded-full border border-champagne/15" />
        <div className="relative flex items-start justify-between gap-4">
          <span className="flex items-center gap-2.5">
            <svg width="24" height="24" viewBox="0 0 30 30" aria-hidden="true">
              <rect x="12" y="1" width="6" height="11" rx="3" className="fill-champagne" />
              <rect x="12" y="18" width="6" height="11" rx="3" className="fill-champagne" />
              <rect x="1" y="12" width="11" height="6" rx="3" className="fill-ivory" />
              <rect x="18" y="12" width="11" height="6" rx="3" className="fill-ivory" />
            </svg>
            <span className="font-serif text-[20px] leading-none">SmartCare</span>
          </span>
          <span className="text-[11px] tracking-[0.3em] text-champagne-light uppercase">Private Patient</span>
        </div>
        <div className="relative">
          <p className="text-[17px] tracking-[0.22em] text-ivory/85 tabular-nums">{patientNumber(profile.id)}</p>
          <p className="mt-2 font-serif text-[32px] leading-none">{[profile.firstName, profile.lastName].filter(Boolean).join(" ")}</p>
          {profile.bloodType && (
            <p className="mt-4 text-[12px]">
              <span className="block text-ivory/55">Blood type</span>
              <span className="text-[14px]">{profile.bloodType}</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProfileSection({ portal }) {
  const { profile } = portal;
  const { user } = useAuth();

  return (
    <>
      <PageHead title="Profile" intro="Your details and health information. Keep them up to date before each visit." />
      <div className={`${ui.page} grid gap-14 pb-24 lg:grid-cols-[400px_minmax(0,1fr)] lg:gap-20`}>
        <aside className="min-w-0 lg:sticky lg:top-44 lg:self-start">
          <PatientCard profile={profile} />
          <p className="mt-3 text-[14px] text-muted">Show this card at reception for a faster check-in.</p>

          {profile.allergies && (
            <div className="mt-8 max-w-[400px] border-l-2 border-alert bg-white px-5 py-4">
              <p className="text-[15px] font-medium text-alert">Allergy: {profile.allergies}</p>
              <p className="mt-1 text-[14px] text-muted">Every doctor and nurse sees this when they open your file.</p>
            </div>
          )}

          <div className="mt-8 max-w-[400px] border-t border-ivory-line pt-5">
            <p className="text-[15px] text-ink">Something you cannot change here?</p>
            <p className="mt-1 text-[14px] leading-relaxed text-muted">
              The Private Patient Office can update your records or your password. WhatsApp{" "}
              <span className="text-ink tabular-nums">{patientOffice.whatsapp}</span>
            </p>
          </div>
        </aside>

        <div className="grid min-w-0 gap-16">
          {GROUPS.map((group) => (
            <Group key={group.id} group={group} profile={profile} onSave={portal.saveProfile} />
          ))}
          <section aria-labelledby="profile-signin">
            <div className="border-b border-ivory-line pb-4">
              <h2 id="profile-signin" className="font-serif text-3xl text-ink">
                Sign-in
              </h2>
            </div>
            <dl className="grid gap-x-10 sm:grid-cols-2">
              <div className="border-b border-ivory-line py-4">
                <dt className="text-[13px] text-muted">Username</dt>
                <dd className="mt-0.5 text-[16px]">{user?.username}</dd>
              </div>
              <div className="border-b border-ivory-line py-4">
                <dt className="text-[13px] text-muted">Patient number</dt>
                <dd className="mt-0.5 text-[16px] tabular-nums">{patientNumber(profile.id)}</dd>
              </div>
            </dl>
          </section>
        </div>
      </div>
    </>
  );
}
