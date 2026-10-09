import { useState } from "react";
import PageHead from "../PageHead";
import { doctorName, doctorPhoto, formatFee } from "../format";
import { departmentPlace } from "../../../content/portal";
import { ui } from "../ui";
import DoctorAvatar from "../DoctorAvatar";
import { readHours, WEEK, writeHours } from "./chart";
import { BusyLabel } from "../../Loader";

const SLOT_MINUTES = 20;

const slotsPerDay = (from, to) => {
  const [fh, fm] = from.split(":").map(Number);
  const [th, tm] = to.split(":").map(Number);
  return Math.max(0, Math.floor((th * 60 + tm - (fh * 60 + fm)) / SLOT_MINUTES));
};

export default function DoctorProfileSection({ portal }) {
  const { profile } = portal;
  const [hours, setHours] = useState(() => readHours(profile.workingHours));
  const [accepting, setAccepting] = useState(profile.availability !== false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);

  const toggleDay = (day) => setHours((h) => ({ ...h, days: h.days.includes(day) ? h.days.filter((d) => d !== day) : [...h.days, day] }));
  const perDay = slotsPerDay(hours.from, hours.to);
  const valid = hours.days.length > 0 && perDay > 0;

  const save = async () => {
    setBusy(true);
    setMessage(null);
    const result = await portal.saveAvailability({ availability: accepting, workingHours: writeHours(hours) });
    setBusy(false);
    setMessage(result.success ? { ok: true, text: "Saved. Patients see the new hours straight away." } : { ok: false, text: result.message });
  };

  return (
    <>
      <PageHead title="Profile" intro="How patients find you, and the hours they can book." />
      <div className={`${ui.page} grid gap-14 pb-24 lg:grid-cols-2 lg:gap-16`}>
        <section aria-labelledby="seen-by-patients" className="min-w-0">
          <h2 id="seen-by-patients" className="font-serif text-3xl text-ink">
            What patients see
          </h2>
          <p className="mt-1 text-[14px] text-muted">Your row on the Book a visit page.</p>
          <div className="mt-5 grid grid-cols-[104px_minmax(0,1fr)] gap-5 border border-ivory-line bg-white p-6">
            {doctorPhoto(profile) ? (
              <img src={doctorPhoto(profile)} alt="" className="photo-grade aspect-[4/5] w-full object-cover object-top" />
            ) : (
              <DoctorAvatar doctor={profile} size={104} />
            )}
            <div className="min-w-0">
              <p className="font-serif text-[28px] leading-tight text-ink">{doctorName(profile)}</p>
              <p className="text-[15px] text-ink">{profile.specialization}</p>
              <p className="mt-2 text-[14px] leading-relaxed text-muted">
                {[profile.qualification, profile.experience ? `${profile.experience} years` : ""].filter(Boolean).join(" · ")}
                <br />
                {departmentPlace(profile.specialization)}
              </p>
              {formatFee(profile.fee) && <p className="mt-2 text-[15px] text-ink">Consultation {formatFee(profile.fee)}</p>}
              <p className={`mt-3 text-[14px] ${profile.availability === false ? "text-alert" : "text-muted"}`}>
                {profile.availability === false ? "Not taking new bookings" : "Taking new bookings"}
              </p>
            </div>
          </div>
          <dl className="mt-8 grid gap-x-10 sm:grid-cols-2">
            {[
              ["Qualification", profile.qualification],
              ["Experience", profile.experience ? `${profile.experience} years` : ""],
              ["Licence number", profile.licenseNumber],
              ["Phone", profile.phone],
            ].map(([label, value]) => (
              <div key={label} className="border-b border-ivory-line py-4">
                <dt className="text-[13px] text-muted">{label}</dt>
                <dd className={`mt-0.5 text-[16px] ${value ? "text-ink" : "text-muted"}`}>{value || "Not added yet"}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-5 text-[14px] leading-relaxed text-muted">The hospital administration updates your photo and details.</p>
        </section>

        <section aria-labelledby="booking-hours" className="min-w-0">
          <h2 id="booking-hours" className="font-serif text-3xl text-ink">
            Booking hours
          </h2>
          <div className="mt-5 flex items-center justify-between gap-6 border-y border-ivory-line py-5">
            <div>
              <p className="text-[16px] text-ink">Taking new bookings</p>
              <p className="text-[14px] text-muted">Turn off for leave or conferences. Booked visits stay.</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={accepting}
              aria-label="Taking new bookings"
              onClick={() => setAccepting((a) => !a)}
              className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${accepting ? "bg-forest" : "bg-ivory-line"}`}
            >
              <span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-all ${accepting ? "left-6" : "left-1"}`} />
            </button>
          </div>

          <fieldset className="mt-8">
            <legend className="text-[15px] font-medium text-ink">Days</legend>
            <div className="mt-3 grid grid-cols-7 gap-2">
              {WEEK.map((day) => {
                const on = hours.days.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggleDay(day)}
                    className={`h-11 border text-[14px] transition-colors ${on ? "border-forest bg-forest text-ivory" : "border-ivory-line bg-white text-ink hover:border-forest"}`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </fieldset>
          <div className="mt-6 grid grid-cols-2 gap-4">
            {[
              ["from", "From"],
              ["to", "To"],
            ].map(([key, label]) => (
              <div key={key} className="grid gap-2">
                <label htmlFor={`hours-${key}`} className="text-[15px] font-medium text-ink">
                  {label}
                </label>
                <input id={`hours-${key}`} type="time" step={SLOT_MINUTES * 60} value={hours[key]} onChange={(e) => setHours((h) => ({ ...h, [key]: e.target.value }))} className={`${ui.input} h-12`} />
              </div>
            ))}
          </div>
          <p className="mt-4 text-[14px] text-muted">
            {valid
              ? `Visits are ${SLOT_MINUTES} minutes. Patients see ${perDay} times a day, ${hours.days.length} ${hours.days.length === 1 ? "day" : "days"} a week.`
              : "Choose at least one day, and an end time after the start time."}
          </p>
          {message && (
            <p role={message.ok ? "status" : "alert"} className={`mt-4 text-[15px] ${message.ok ? "text-forest" : "text-alert"}`}>
              {message.text}
            </p>
          )}
          <button type="button" onClick={save} disabled={!valid || busy} aria-busy={busy} className={`${ui.primary} mt-6`}>
            <BusyLabel busy={busy} text="Save hours" />
          </button>
        </section>
      </div>
    </>
  );
}
