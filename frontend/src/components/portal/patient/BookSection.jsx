import { useEffect, useRef, useState } from "react";
import DoctorAvatar from "../DoctorAvatar";
import PageHead from "../PageHead";
import { doctorName, doctorPhoto, formatDate, formatFee, formatTime, minutesBefore, relativeDay } from "../format";
import { departmentPlace, patientOffice, visitTypes } from "../../../content/portal";
import { ui } from "../ui";
import { BusyLabel } from "../../Loader";

const firstFreeDay = (days = []) => days.find((d) => d.times.length > 0);

const nextFreeLabel = (date) =>
  relativeDay(date) === "Today" || relativeDay(date) === "Tomorrow"
    ? `${relativeDay(date)}, ${formatDate(date, { day: "numeric", month: "short" })}`
    : formatDate(date, { weekday: "short", day: "numeric", month: "short" });

// A step of the booking. Once done it folds into one line with a "Change" link.
function Step({ number, title, open, summary, canChange = true, onOpen, children }) {
  const ref = useRef(null);
  const done = !open && summary;

  useEffect(() => {
    // Bring a step into view when it opens after the page has loaded
    if (open && number > 1) ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [open, number]);

  return (
    <section ref={ref} aria-labelledby={`step-${number}`} className="scroll-mt-44 border-t border-ivory-line">
      <div className="flex items-baseline justify-between gap-4 py-6">
        <h2 id={`step-${number}`} className={`flex items-baseline gap-4 font-serif ${open ? "text-[34px] text-ink" : `text-[26px] ${done ? "text-ink" : "text-muted"}`}`}>
          <span aria-hidden="true" className={`w-5 shrink-0 font-sans text-[15px] tabular-nums ${done ? "text-champagne" : "text-muted"}`}>
            {done ? "✓" : number}
          </span>
          {title}
        </h2>
        {done && canChange && (
          <button type="button" onClick={onOpen} className={`${ui.link} shrink-0`}>
            Change
          </button>
        )}
      </div>
      {done && <div className="-mt-3 pb-6 pl-9 text-[16px] text-ink">{summary}</div>}
      {open && <div className="pb-12 sm:pl-9">{children}</div>}
    </section>
  );
}

// Doctor photo in portrait format, or the doctor's initials when there is no photo
function Portrait({ doctor }) {
  const [broken, setBroken] = useState(false);
  const src = doctorPhoto(doctor);
  if (!src || broken) {
    return (
      <span aria-hidden="true" className="grid aspect-[4/5] w-full place-items-center bg-forest font-serif text-3xl text-ivory">
        {`${doctor.firstName?.[0] || ""}${doctor.lastName?.[0] || ""}`}
      </span>
    );
  }
  return <img src={src} alt="" onError={() => setBroken(true)} className="photo-grade aspect-[4/5] w-full object-cover object-top" />;
}

const FIRST_ROWS = 8;

function DoctorStep({ doctors, availability, onPickDoctor, onPickSlot }) {
  const [department, setDepartment] = useState("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("soon");
  const [showAll, setShowAll] = useState(false);

  const departments = [...new Set(doctors.map((d) => d.specialization).filter(Boolean))].sort();
  const query = search.trim().toLowerCase();
  const rows = doctors
    .filter((d) => (!department || d.specialization === department) && (!query || `${doctorName(d)} ${d.specialization}`.toLowerCase().includes(query)))
    .map((d) => ({ doctor: d, free: firstFreeDay(availability[d.id]) }));
  rows.sort((a, b) => {
    if (sort === "name") return doctorName(a.doctor).localeCompare(doctorName(b.doctor));
    if (!a.free || !b.free) return a.free ? -1 : b.free ? 1 : 0;
    return `${a.free.date} ${a.free.times[0]}`.localeCompare(`${b.free.date} ${b.free.times[0]}`);
  });
  const generalMedicine = doctors.find((d) => d.specialization === "General Medicine");

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_220px_200px]">
        <div className="grid gap-2">
          <label htmlFor="book-search" className="text-[14px] font-medium text-ink">
            Search
          </label>
          <input
            id="book-search"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Doctor's name or specialty, e.g. cardiology"
            autoComplete="off"
            className={ui.input}
          />
        </div>
        <div className="grid gap-2">
          <label htmlFor="book-department" className="text-[14px] font-medium text-ink">
            Department
          </label>
          <select id="book-department" value={department} onChange={(e) => setDepartment(e.target.value)} className={`${ui.input} px-3`}>
            <option value="">All departments</option>
            {departments.map((name) => (
              <option key={name}>{name}</option>
            ))}
          </select>
        </div>
        <div className="grid gap-2">
          <label htmlFor="book-sort" className="text-[14px] font-medium text-ink">
            Sort by
          </label>
          <select id="book-sort" value={sort} onChange={(e) => setSort(e.target.value)} className={`${ui.input} px-3`}>
            <option value="soon">Earliest available</option>
            <option value="name">Name</option>
          </select>
        </div>
      </div>
      <p className="mt-5 text-[14px] text-muted" aria-live="polite">
        {rows.length} {rows.length === 1 ? "doctor" : "doctors"}
        {department ? ` in ${department}` : ""}
      </p>

      <ol className="mt-3 border-t border-ivory-line">
        {rows.length === 0 && <li className="py-10 text-[16px] text-muted">No doctor matches your search. Try a specialty such as cardiology.</li>}
        {(showAll ? rows : rows.slice(0, FIRST_ROWS)).map(({ doctor, free }) => (
          <li
            key={doctor.id}
            className="grid grid-cols-[72px_minmax(0,1fr)] gap-x-5 gap-y-5 border-b border-ivory-line py-7 sm:grid-cols-[104px_minmax(0,1fr)] md:grid-cols-[104px_minmax(0,1fr)_minmax(0,300px)]"
          >
            <Portrait doctor={doctor} />
            <div className="min-w-0">
              <p className="font-serif text-[28px] leading-tight text-ink">{doctorName(doctor)}</p>
              <p className="text-[15px] text-ink">{doctor.specialization}</p>
              <p className="mt-2 text-[14px] leading-relaxed text-muted">
                {[doctor.qualification, doctor.experience ? `${doctor.experience} years` : ""].filter(Boolean).join(" · ")}
                {(doctor.qualification || doctor.experience) && <br />}
                {departmentPlace(doctor.specialization)}
              </p>
              {formatFee(doctor.fee) && (
                <p className="mt-2 text-[15px] text-ink">
                  Consultation <span className="tabular-nums">{formatFee(doctor.fee)}</span>
                </p>
              )}
            </div>
            <div className="col-span-2 md:col-span-1">
              {free ? (
                <>
                  <p className="text-[14px] text-muted">
                    Next free · <span className="text-ink">{nextFreeLabel(free.date)}</span>
                  </p>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {free.times.slice(0, 3).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => onPickSlot(doctor.id, free.date, t)}
                        aria-label={`${doctorName(doctor)}, ${formatDate(free.date, { weekday: "long", day: "numeric", month: "long" })} at ${formatTime(t)}`}
                        className="h-11 border border-ivory-line bg-white text-[15px] text-ink tabular-nums transition-colors hover:border-forest hover:bg-forest hover:text-ivory"
                      >
                        {formatTime(t)}
                      </button>
                    ))}
                  </div>
                  <button type="button" onClick={() => onPickDoctor(doctor.id)} className={`${ui.link} mt-3`}>
                    See all times
                  </button>
                </>
              ) : (
                <p className="text-[14px] text-muted">No free times in the next two weeks. The Private Patient Office can help.</p>
              )}
            </div>
          </li>
        ))}
      </ol>
      {!showAll && rows.length > FIRST_ROWS && (
        <button type="button" onClick={() => setShowAll(true)} className={`${ui.outline} mt-6 w-full`}>
          Show all {rows.length} doctors
        </button>
      )}

      <div className="mt-8 grid gap-6 bg-ivory-warm p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div>
          <p className="font-serif text-2xl text-ink">Not sure who to see?</p>
          <p className="mt-1 text-[15px] leading-relaxed text-muted">
            Start with a General Medicine consultation, or message the Private Patient Office and a nurse will guide you to the right specialist.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          {generalMedicine && (
            <button type="button" onClick={() => onPickDoctor(generalMedicine.id)} className={ui.primary}>
              Book General Medicine
            </button>
          )}
          <p className={`${ui.outline} cursor-default tabular-nums`}>WhatsApp {patientOffice.whatsapp}</p>
        </div>
      </div>
    </>
  );
}

function TimeStep({ doctor, days, date, time, onPickDate, onPickTime }) {
  const day = days.find((d) => d.date === date);
  const parts = [
    ["Morning", (t) => t < "12:00"],
    ["Afternoon", (t) => t >= "12:00" && t < "17:00"],
    ["Evening", (t) => t >= "17:00"],
  ].map(([label, test]) => [label, (day?.times || []).filter(test)]);

  return (
    <>
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2" role="radiogroup" aria-label="Day">
        {days.slice(0, 7).map((d) => (
          <p key={d.date} aria-hidden="true" className="pb-1 text-center text-[13px] text-muted">
            {formatDate(d.date, { weekday: "short" })}
          </p>
        ))}
        {days.map((d) => {
          const count = d.times.length;
          const on = d.date === date;
          const label = count ? `${count} free` : d.working ? "Full" : "Closed";
          return (
            <button
              key={d.date}
              type="button"
              role="radio"
              aria-checked={on}
              disabled={!count}
              onClick={() => onPickDate(d.date)}
              aria-label={`${formatDate(d.date, { weekday: "long", day: "numeric", month: "long" })}, ${label}`}
              className={`grid min-h-[56px] place-items-center content-center gap-0.5 border transition-colors sm:h-[76px] ${
                on
                  ? "border-forest bg-forest text-ivory"
                  : count
                    ? "border-ivory-line bg-white text-ink hover:border-forest"
                    : "cursor-not-allowed border-transparent text-muted/40"
              }`}
            >
              <span className="font-serif text-[24px] leading-none sm:text-[28px]">{formatDate(d.date, { day: "numeric" })}</span>
              <span className={`hidden text-[12px] sm:block ${on ? "text-champagne-light" : "text-muted"}`}>{label}</span>
            </button>
          );
        })}
      </div>
      <p className="mt-3 text-[14px] text-muted">
        {formatDate(days[0].date, { day: "numeric", month: "long" })} to {formatDate(days[days.length - 1].date, { day: "numeric", month: "long" })}.{" "}
        {doctor.workingHours ? `${doctorName(doctor)} sees patients ${doctor.workingHours}.` : ""}
      </p>

      {day && (
        <>
          <h3 className="mt-10 font-serif text-2xl text-ink">{formatDate(day.date, { weekday: "long", day: "numeric", month: "long" })}</h3>
          {parts
            .filter(([, times]) => times.length)
            .map(([label, times]) => (
              <div key={label} className="mt-5 grid gap-3 sm:grid-cols-[100px_minmax(0,1fr)]">
                <p className="pt-2.5 text-[15px] text-muted">{label}</p>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 xl:grid-cols-6" role="radiogroup" aria-label={`${label} times`}>
                  {times.map((t) => (
                    <button
                      key={t}
                      type="button"
                      role="radio"
                      aria-checked={time === t}
                      onClick={() => onPickTime(t)}
                      className={`h-11 border text-[15px] tabular-nums transition-colors ${
                        time === t ? "border-forest bg-forest text-ivory" : "border-ivory-line bg-white text-ink hover:border-forest"
                      }`}
                    >
                      {formatTime(t)}
                    </button>
                  ))}
                </div>
              </div>
            ))}
        </>
      )}
    </>
  );
}

function AboutStep({ doctor, reason, note, onReason, onNote }) {
  return (
    <>
      <fieldset>
        <legend className="text-[15px] font-medium text-ink">Type of visit</legend>
        <div className="mt-3 grid gap-2 sm:grid-cols-2" role="radiogroup">
          {visitTypes.map((type) => {
            const on = reason === type.label;
            return (
              <button
                key={type.label}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => onReason(type.label)}
                className={`flex items-start justify-between gap-4 border p-4 text-left transition-colors ${
                  on ? "border-forest bg-forest text-ivory" : "border-ivory-line bg-white text-ink hover:border-forest"
                }`}
              >
                <span>
                  <span className="block text-[16px]">{type.label}</span>
                  <span className={`block text-[14px] ${on ? "text-ivory/70" : "text-muted"}`}>{type.hint}</span>
                </span>
                <span className={`shrink-0 text-[13px] tabular-nums ${on ? "text-champagne-light" : "text-muted"}`}>{type.length}</span>
              </button>
            );
          })}
        </div>
      </fieldset>
      <label htmlFor="book-note" className="mt-8 block text-[15px] font-medium text-ink">
            Anything {doctorName(doctor)} should know? <span className="font-normal text-muted">Optional</span>
          </label>
          <textarea
            id="book-note"
            rows={3}
            value={note}
            maxLength={400}
            onChange={(e) => onNote(e.target.value)}
            placeholder="e.g. The rash started two weeks ago on my left arm"
            className={`${ui.input} mt-2 h-auto resize-none py-3`}
          />
      <p className="mt-2 text-[14px] text-muted">Only your care team can read this.</p>
    </>
  );
}

function Summary({ doctor, date, time, reason, insurance, moving, missing, busy, error, onConfirm }) {
  const rows = [
    ["Day", date && formatDate(date, { weekday: "short", day: "numeric", month: "long" })],
    ["Time", time && formatTime(time)],
    ["Visit", reason],
    ["Where", doctor && departmentPlace(doctor.specialization)],
    ["Consultation", doctor && formatFee(doctor.fee)],
  ].filter(([label, value]) => !(label === "Consultation" && doctor && !value));
  return (
    <aside aria-label="Your visit" className="lg:sticky lg:top-40 lg:self-start">
      <div className="border border-ivory-line bg-white">
        {doctor ? (
          <div className="flex items-center gap-4 p-6 pb-2">
            <DoctorAvatar doctor={doctor} size={60} />
            <div className="min-w-0">
              <p className="font-serif text-2xl leading-tight">{doctorName(doctor)}</p>
              <p className="text-[14px] text-muted">{doctor.specialization}</p>
            </div>
          </div>
        ) : (
          <p className="p-6 pb-2 font-serif text-2xl">Your visit</p>
        )}
        <dl className="px-6 text-[15px]">
          {rows.map(([label, value]) => (
            <div key={label} className="flex justify-between gap-6 border-b border-ivory-line py-3">
              <dt className="text-muted">{label}</dt>
              <dd className={`text-right ${value ? "text-ink" : "text-muted/70"}`}>{value || "Not chosen"}</dd>
            </div>
          ))}
        </dl>
        <div className="p-6">
          {moving && (
            <p className="mb-4 text-[14px] text-muted">
              Moving from {formatDate(moving.appointmentDate, { weekday: "short", day: "numeric", month: "short" })} at {formatTime(moving.appointmentTime)}
            </p>
          )}
          {error && (
            <p role="alert" className="mb-4 text-[14px] text-alert">
              {error}
            </p>
          )}
          <button type="button" onClick={onConfirm} disabled={Boolean(missing) || busy} aria-busy={busy} className={`${ui.primary} h-12 w-full`}>
            <BusyLabel busy={busy} text={moving ? "Confirm new time" : "Confirm visit"} />
          </button>
          <p className="mt-3 text-center text-[14px] text-muted" aria-live="polite">
            {missing || "Free to cancel up to the start of your visit."}
          </p>
        </div>
        {insurance && (
          <dl className="border-t border-ivory-line bg-ivory/60 p-6 text-[14px]">
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Insurance</dt>
              <dd className="text-right">{insurance}</dd>
            </div>
          </dl>
        )}
      </div>
    </aside>
  );
}

function Confirmation({ booking, doctor, moved, onAnother }) {
  return (
    <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:py-20">
      <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-16">
        <div>
          <svg width="44" height="44" viewBox="0 0 44 44" aria-hidden="true">
            <circle cx="22" cy="22" r="21" fill="none" className="stroke-champagne" />
            <path d="m14 22.5 5.5 5.5L30.5 17" fill="none" strokeWidth="1.6" className="stroke-forest" />
          </svg>
          <h1 className="mt-6 font-serif text-5xl leading-tight text-ink sm:text-6xl">{moved ? "Your visit has moved." : "Your visit is confirmed."}</h1>
          <p className="mt-4 max-w-lg text-[17px] leading-relaxed text-muted">
            {doctorName(doctor)} will see you on {formatDate(booking.date, { weekday: "long", day: "numeric", month: "long" })} at {formatTime(booking.time)}.
          </p>
          <h2 className="mt-12 font-serif text-2xl text-ink">What happens next</h2>
          <ol className="mt-4 border-t border-ivory-line">
            {[
              ["Now", "Your visit is in Visits, where you can move or cancel it up to its start time."],
              [minutesBefore(booking.time, 15), `Arrive at ${departmentPlace(doctor.specialization)}. Reception checks you in.`],
              [formatTime(booking.time), `${doctorName(doctor)} sees you.`],
            ].map(([when, what]) => (
              <li key={when} className="grid grid-cols-[100px_minmax(0,1fr)] gap-4 border-b border-ivory-line py-4 text-[15px]">
                <span className="text-muted">{when}</span>
                <span>{what}</span>
              </li>
            ))}
          </ol>
          <div className="mt-10 flex flex-wrap gap-3">
            <a href="#visits" className={ui.primary}>
              See my visits
            </a>
            <button type="button" onClick={onAnother} className={ui.outline}>
              Book another visit
            </button>
          </div>
        </div>
        <aside className="self-start border border-ivory-line bg-white">
          {doctorPhoto(doctor) && <img src={doctorPhoto(doctor)} alt="" className="photo-grade aspect-[4/3] w-full object-cover object-[50%_20%]" />}
          <dl className="grid gap-3 p-6 text-[15px]">
            {[
              ["Reference", booking.reference],
              ["Doctor", doctorName(doctor)],
              ["Visit", booking.reason],
              ["When", `${formatDate(booking.date, { weekday: "short", day: "numeric", month: "short" })}, ${formatTime(booking.time)}`],
            ]
              .filter(([, value]) => value)
              .map(([label, value]) => (
                <div key={label} className="flex justify-between gap-4">
                  <dt className="text-muted">{label}</dt>
                  <dd className="text-right tabular-nums">{value}</dd>
                </div>
              ))}
          </dl>
        </aside>
      </div>
    </section>
  );
}

// Booking on one page in three steps; also used to move an existing visit (preset.moving)
export default function BookSection({ portal, preset = {} }) {
  const moving = preset.moving || null;
  const [open, setOpen] = useState(preset.doctorId ? 2 : 1);
  const [doctorId, setDoctorId] = useState(preset.doctorId || null);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [reason, setReason] = useState(moving?.reason || "");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [booked, setBooked] = useState(null);

  const doctors = portal.doctors.filter((d) => d.availability !== false);
  const doctor = doctors.find((d) => Number(d.id) === Number(doctorId)) || portal.doctors.find((d) => Number(d.id) === Number(doctorId));
  const days = (doctor && portal.availability[doctor.id]) || [];
  const shownDate = date || firstFreeDay(days)?.date || "";

  const pickDoctor = (id) => {
    setDoctorId(id);
    setDate("");
    setTime("");
    setError("");
    setOpen(2);
  };
  const pickSlot = (id, slotDate, slotTime) => {
    setDoctorId(id);
    setDate(slotDate);
    setTime(slotTime);
    setError("");
    setOpen(3);
  };
  const pickTime = (t) => {
    setDate(shownDate);
    setTime(t);
    setError("");
    setOpen(3);
  };

  const missing = !doctor ? "Choose a doctor to continue." : !time ? "Choose a time to continue." : !reason && !moving ? "Choose the type of visit to continue." : "";

  const confirm = async () => {
    setBusy(true);
    setError("");
    const slot = { appointmentDate: date, appointmentTime: `${time}:00` };
    const result = moving
      ? await portal.reschedule(moving.id, slot)
      : await portal.book({ doctorId: String(doctor.id), ...slot, reason: note.trim() ? `${reason}: ${note.trim()}` : reason });
    setBusy(false);
    if (!result.success) {
      setError(result.message || "This time is no longer free. Please choose another.");
      return;
    }
    const id = result.data?.appointment?.id || moving?.id;
    setBooked({ date, time, reason, reference: id ? `No. ${String(id).padStart(6, "0")}` : "" });
    window.scrollTo({ top: 0 });
  };

  const startOver = () => {
    setBooked(null);
    setDoctorId(null);
    setDate("");
    setTime("");
    setReason("");
    setNote("");
    setOpen(1);
  };

  if (booked) return <Confirmation booking={booked} doctor={doctor} moved={Boolean(moving)} onAnother={startOver} />;

  return (
    <>
      <PageHead
        title={moving ? "Move your visit" : "Book a visit"}
        intro={
          moving
            ? "Choose a new time. Your current time stays booked until you confirm."
            : "Most patients book in under a minute. Pick a time from a doctor's list, or open their calendar for more."
        }
      />
      <div className={`${ui.page} grid gap-12 pb-24 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-16`}>
        <div className="min-w-0 border-b border-ivory-line">
          <Step
            number={1}
            title="Choose your doctor"
            open={open === 1}
            canChange={!moving}
            onOpen={() => setOpen(1)}
            summary={
              doctor && (
                <span className="flex items-center gap-3">
                  <DoctorAvatar doctor={doctor} size={40} />
                  {doctorName(doctor)} <span className="text-muted">· {doctor.specialization}</span>
                </span>
              )
            }
          >
            <DoctorStep doctors={doctors} availability={portal.availability} onPickDoctor={pickDoctor} onPickSlot={pickSlot} />
          </Step>
          <Step
            number={2}
            title="Choose a time"
            open={open === 2}
            onOpen={() => setOpen(2)}
            summary={time && `${formatDate(date, { weekday: "long", day: "numeric", month: "long" })} at ${formatTime(time)}`}
          >
            {doctor && days.length > 0 ? (
              <TimeStep doctor={doctor} days={days} date={shownDate} time={date === shownDate ? time : ""} onPickDate={(d) => {
                  setDate(d);
                  setTime("");
                }} onPickTime={pickTime} />
            ) : (
              <p className="text-[16px] text-muted">No free times in the next two weeks. The Private Patient Office can find you a time: WhatsApp {patientOffice.whatsapp}.</p>
            )}
          </Step>
          {!moving && (
            <Step number={3} title="About your visit" open={open === 3} summary={null}>
              {doctor && <AboutStep doctor={doctor} reason={reason} note={note} onReason={setReason} onNote={setNote} />}
            </Step>
          )}
        </div>
        <Summary
          doctor={doctor}
          date={time ? date : ""}
          time={time}
          reason={reason}
          insurance={portal.profile.insurance}
          moving={moving}
          missing={missing}
          busy={busy}
          error={error}
          onConfirm={confirm}
        />
      </div>

      {/* Phones: the summary sits at the end of the page, so keep the confirm button in reach once a time is chosen */}
      {doctor && time && (
        <div className="fixed inset-x-0 bottom-[calc(64px+env(safe-area-inset-bottom))] z-30 border-t border-ivory-line bg-white px-4 py-3 lg:hidden">
          <div className="flex items-center justify-between gap-4">
            <p className="min-w-0 text-[14px] leading-tight">
              <span className="block truncate text-ink">{doctorName(doctor)}</span>
              <span className="text-muted">
                {formatDate(date, { weekday: "short", day: "numeric", month: "short" })}, {formatTime(time)}
              </span>
            </p>
            <button type="button" onClick={confirm} disabled={Boolean(missing) || busy} aria-busy={busy} className={`${ui.primary} shrink-0`}>
              <BusyLabel busy={busy} text={moving ? "Confirm new time" : "Confirm visit"} />
            </button>
          </div>
          {(error || missing) && (
            <p role={error ? "alert" : undefined} className={`mt-1 text-[13px] ${error ? "text-alert" : "text-muted"}`}>
              {error || missing}
            </p>
          )}
        </div>
      )}
    </>
  );
}
