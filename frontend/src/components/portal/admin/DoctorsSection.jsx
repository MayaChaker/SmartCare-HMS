import { useEffect, useState } from "react";
import Modal from "../Modal";
import PageHead from "../PageHead";
import { doctorName, doctorPhoto, formatFee } from "../format";
import { departments } from "../../../content/portal";
import { ui } from "../ui";
import { readHours, WEEK, writeHours } from "../doctor/chart";
import TempPassword from "./TempPassword";
import { BusyLabel } from "../../Loader";

const MAX_PHOTO = 3 * 1024 * 1024;
const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];

const initialsOf = (d) => `${d.firstName?.[0] || ""}${d.lastName?.[0] || ""}`;

function Field({ id, label, ...input }) {
  return (
    <div className="grid gap-2">
      <label htmlFor={id} className="text-[14px] font-medium text-ink">
        {label}
      </label>
      <input id={id} className={`${ui.input} h-12`} {...input} />
    </div>
  );
}

// Add a doctor (with their sign-in) or edit one: portrait, details patients see, fee and booking hours
function DoctorDialog({ doctor, admin, onClose }) {
  const hours = readHours(doctor?.workingHours);
  const [values, setValues] = useState({
    firstName: doctor?.firstName || "",
    lastName: doctor?.lastName || "",
    specialization: doctor?.specialization || departments[0],
    qualification: doctor?.qualification || "",
    experience: doctor?.experience ?? "",
    fee: doctor?.fee ? String(Number(doctor.fee)) : "",
    phone: doctor?.phone || "",
    licenseNumber: doctor?.licenseNumber || "",
    username: "",
  });
  const [days, setDays] = useState(doctor ? hours.days : ["Mon", "Tue", "Wed", "Thu", "Fri"]);
  const [from, setFrom] = useState(hours.from);
  const [to, setTo] = useState(hours.to);
  const [photo, setPhoto] = useState(null); // { file, preview }
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(null);

  // Free the preview's memory when it is replaced or the dialog closes
  useEffect(() => () => photo && URL.revokeObjectURL(photo.preview), [photo]);

  const set = (key) => (e) => setValues((v) => ({ ...v, [key]: e.target.value }));
  const choosePhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!PHOTO_TYPES.includes(file.type)) return setError("Choose a JPG, PNG or WebP image.");
    if (file.size > MAX_PHOTO) return setError("That photo is larger than 3 MB. Choose a smaller one.");
    setError("");
    setPhoto({ file, preview: URL.createObjectURL(file) });
  };

  const save = async (e) => {
    e.preventDefault();
    if (!values.firstName.trim() || !values.lastName.trim()) return setError("First and last name are required.");
    if (!days.length) return setError("Choose at least one booking day.");
    if (from >= to) return setError("The end time must be after the start time.");
    if (!doctor && values.username.trim().length < 3) return setError("Choose a username of at least 3 characters.");

    setBusy(true);
    setError("");
    const { username, ...profile } = values;
    const details = { ...profile, experience: profile.experience === "" ? undefined : Number(profile.experience), fee: profile.fee === "" ? 0 : Number(profile.fee), workingHours: writeHours({ days, from, to }) };

    const saved = doctor
      ? await admin.updateDoctor(doctor.id, details)
      : await admin.createUser({ ...details, role: "doctor", username: username.trim() });
    if (!saved.success) {
      setBusy(false);
      return setError(saved.message);
    }
    const doctorId = doctor ? doctor.id : saved.data.doctor.id;
    if (photo) {
      const uploaded = await admin.uploadDoctorPhoto(doctorId, photo.file);
      if (!uploaded.success) {
        setBusy(false);
        return setError(`Saved, but the photo was not: ${uploaded.message}`);
      }
    }
    setBusy(false);
    setDone(doctor ? { edited: true } : { username: saved.data.user.username, password: saved.data.tempPassword });
  };

  const currentPhoto = photo?.preview || doctorPhoto(doctor);
  const title = doctor ? `Edit ${doctorName(doctor)}` : "Add a doctor";

  if (done) {
    return (
      <Modal title={done.edited ? "Saved" : "Doctor added"} onClose={onClose}>
        {done.edited ? (
          <p className="text-[16px] text-muted">Patients see the new details when they book.</p>
        ) : (
          <TempPassword username={done.username} password={done.password} />
        )}
        <div className="mt-8 flex justify-end">
          <button type="button" onClick={onClose} className={ui.primary}>
            Done
          </button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal title={title} onClose={onClose} wide>
      <form onSubmit={save} className="grid gap-6">
        <div className="flex items-center gap-5 border-b border-ivory-line pb-6">
          <span className="grid h-28 w-24 shrink-0 place-items-center overflow-hidden bg-ivory-warm">
            {currentPhoto ? (
              <img src={currentPhoto} alt="" className="photo-grade h-full w-full object-cover object-top" />
            ) : (
              <span className="px-2 text-center text-[12px] text-muted">No photo yet</span>
            )}
          </span>
          <div className="grid min-w-0 flex-1 gap-2">
            <label htmlFor="doctor-photo" className="text-[14px] font-medium text-ink">
              Portrait
            </label>
            <input
              id="doctor-photo"
              type="file"
              accept={PHOTO_TYPES.join(",")}
              onChange={choosePhoto}
              className="text-[14px] file:mr-3 file:h-10 file:cursor-pointer file:border file:border-ivory-line file:bg-white file:px-4 file:text-[14px] file:text-ink hover:file:border-forest"
            />
            <p className="text-[13px] text-muted">JPG, PNG or WebP, up to 3 MB. A head-and-shoulders photo in portrait works best.</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="doctor-first" label="First name" value={values.firstName} onChange={set("firstName")} placeholder="e.g. Karim" />
          <Field id="doctor-last" label="Last name" value={values.lastName} onChange={set("lastName")} placeholder="e.g. Mansour" />
          <div className="grid gap-2">
            <label htmlFor="doctor-department" className="text-[14px] font-medium text-ink">
              Department
            </label>
            <select id="doctor-department" value={values.specialization} onChange={set("specialization")} className={`${ui.input} h-12 px-3`}>
              {[...new Set([...departments, values.specialization])].map((name) => (
                <option key={name}>{name}</option>
              ))}
            </select>
          </div>
          <Field id="doctor-qualification" label="Qualification" value={values.qualification} onChange={set("qualification")} placeholder="e.g. MD, Cardiology" />
          <Field id="doctor-experience" label="Years of experience" type="number" min="0" max="70" value={values.experience} onChange={set("experience")} placeholder="e.g. 12" />
          <Field id="doctor-fee" label="Consultation fee (USD)" type="number" min="0" step="1" value={values.fee} onChange={set("fee")} placeholder="e.g. 60" />
          <Field id="doctor-phone" label="Phone" type="tel" value={values.phone} onChange={set("phone")} placeholder="e.g. +961 3 555 214" />
          <Field id="doctor-licence" label="Licence number" value={values.licenseNumber} onChange={set("licenseNumber")} placeholder="e.g. LB-CARD-20419" />
        </div>

        <fieldset>
          <legend className="text-[14px] font-medium text-ink">Booking days</legend>
          <div className="mt-2 grid grid-cols-7 gap-2">
            {WEEK.map((day) => {
              const on = days.includes(day);
              return (
                <button
                  key={day}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setDays((list) => (on ? list.filter((d) => d !== day) : [...list, day]))}
                  className={`h-11 border text-[14px] ${on ? "border-forest bg-forest text-ivory" : "border-ivory-line bg-white text-ink hover:border-forest"}`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </fieldset>
        <div className="grid grid-cols-2 gap-4">
          <Field id="doctor-from" label="From" type="time" step="1200" value={from} onChange={(e) => setFrom(e.target.value)} />
          <Field id="doctor-to" label="To" type="time" step="1200" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>

        {!doctor && (
          <div className="grid gap-4 border-t border-ivory-line pt-6 sm:grid-cols-2">
            <Field id="doctor-username" label="Username" value={values.username} onChange={set("username")} placeholder="e.g. dr.karim.mansour" autoComplete="off" />
            <p className="self-end text-[14px] text-muted">A temporary password is shown after saving. The doctor chooses their own at first sign-in.</p>
          </div>
        )}

        {error && (
          <p role="alert" className="text-[15px] text-alert">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className={ui.outline}>
            Cancel
          </button>
          <button type="submit" disabled={busy} aria-busy={busy} className={ui.primary}>
            <BusyLabel busy={busy} text={doctor ? "Save changes" : "Add doctor"} />
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default function DoctorsSection({ admin }) {
  const [open, setOpen] = useState(null); // a doctor, "new", or null
  const [busyId, setBusyId] = useState(null);
  const [message, setMessage] = useState("");

  const toggleBookings = async (doctor) => {
    setBusyId(doctor.id);
    const result = await admin.updateDoctor(doctor.id, { availability: doctor.availability === false });
    setBusyId(null);
    setMessage(result.success ? `${doctorName(doctor)}: bookings ${doctor.availability === false ? "reopened" : "paused"}.` : result.message);
  };

  return (
    <>
      <PageHead
        title="Doctors"
        intro="The profiles patients see when they book, the consultation fee, and the hours they can book."
        action={
          <button type="button" onClick={() => setOpen("new")} className={ui.primary}>
            Add a doctor
          </button>
        }
      />
      <div className={`${ui.page} pb-24`}>
        {message && (
          <p role="status" className="mb-6 border-l-2 border-forest bg-white px-5 py-3 text-[15px]">
            {message}
          </p>
        )}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
          {admin.doctors.map((d) => (
            <article key={d.id} className="flex min-w-0 flex-col border border-ivory-line bg-white">
              {doctorPhoto(d) ? (
                <img src={doctorPhoto(d)} alt="" className="photo-grade aspect-[4/3] w-full object-cover object-[50%_20%]" />
              ) : (
                <span aria-hidden="true" className="grid aspect-[4/3] w-full place-items-center bg-forest font-serif text-5xl text-ivory">
                  {initialsOf(d)}
                </span>
              )}
              <div className="flex flex-1 flex-col p-5">
                <p className="font-serif text-[26px] leading-tight text-ink">{doctorName(d)}</p>
                <p className="text-[14px] text-muted">{d.specialization}</p>
                <dl className="mt-4 grid gap-2 border-t border-ivory-line pt-4 text-[14px]">
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted">Hours</dt>
                    <dd className="text-right">{d.workingHours || "Not set"}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted">Fee</dt>
                    <dd className="tabular-nums">{formatFee(d.fee) || "Not set"}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted">Bookings</dt>
                    <dd className={d.availability === false ? "text-alert" : ""}>{d.availability === false ? "Paused" : "Open"}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted">Sign-in</dt>
                    <dd className="truncate">{d.User?.username || "No account"}</dd>
                  </div>
                </dl>
                <div className="mt-auto flex gap-3 pt-5">
                  <button type="button" onClick={() => setOpen(d)} className={`${ui.outline} h-10 flex-1`}>
                    Edit
                  </button>
                  <button type="button" onClick={() => toggleBookings(d)} disabled={busyId === d.id} className={`${ui.outline} h-10 flex-1`}>
                    {d.availability === false ? "Reopen" : "Pause"}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
      {open && <DoctorDialog doctor={open === "new" ? null : open} admin={admin} onClose={() => setOpen(null)} />}
    </>
  );
}
