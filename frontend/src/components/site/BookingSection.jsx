import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Reveal from "./Reveal";
import ArrowIcon from "./ArrowIcon";
import { actions, centers, contact, requestTypes } from "../../content/site";
import { onBookingRequest } from "../../utils/bookingIntent";

const nextSteps = [
  { title: "We call you back", text: "A patient coordinator calls you within two hours, in your language." },
  { title: "We match you with a specialist", text: "Based on what you tell us, we suggest the right doctor and a time." },
  { title: "Your visit is confirmed", text: "You receive the date, the doctor's name and how to prepare." },
];

const emptyForm = { type: "appointment", name: "", reach: "", center: "", date: "", message: "", consent: false };

const fieldClass =
  "h-12 w-full border border-ivory-line bg-ivory/40 px-4 text-[16px] text-ink placeholder:text-muted/70 outline-none transition-colors focus:border-forest focus:bg-white aria-[invalid=true]:border-alert";
const labelClass = "text-[14px] font-medium text-ink";

function validate(values) {
  const errors = {};
  if (values.name.trim().length < 2) errors.name = "Please enter your full name.";
  if (!/@|\d{6,}/.test(values.reach.replace(/\s/g, ""))) errors.reach = "Please enter a phone number or email so we can reach you.";
  if (!values.consent) errors.consent = "Please confirm so we can contact you.";
  return errors;
}

// Request form for an appointment or a private consultation.
// Buttons elsewhere on the page can pre-select the request type and the center (see utils/bookingIntent).
// Note: there is no backend endpoint for these requests yet, so the form only confirms on screen.
export default function BookingSection() {
  const [values, setValues] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [sent, setSent] = useState(false);

  useEffect(
    () =>
      onBookingRequest((intent) => {
        setSent(false);
        setValues((v) => ({ ...v, type: intent.type ?? v.type, center: intent.center ?? v.center }));
      }),
    [],
  );

  const selectedType = requestTypes.find((t) => t.value === values.type);

  const update = (e) => {
    const { name, type, value, checked } = e.target;
    setValues((v) => ({ ...v, [name]: type === "checkbox" ? checked : value }));
  };

  const submit = (e) => {
    e.preventDefault();
    const found = validate(values);
    setErrors(found);
    const firstInvalid = Object.keys(found)[0];
    if (firstInvalid) {
      document.getElementById(`book-${firstInvalid}`)?.focus();
      return;
    }
    setSent(true);
  };

  const fieldProps = (field) => ({
    id: `book-${field}`,
    name: field,
    value: values[field],
    onChange: update,
    "aria-invalid": Boolean(errors[field]),
    "aria-describedby": errors[field] ? `book-${field}-error` : undefined,
  });

  const errorText = (field) =>
    errors[field] && (
      <p id={`book-${field}-error`} className="text-[14px] text-alert">
        {errors[field]}
      </p>
    );

  const today = new Date().toISOString().slice(0, 10);

  return (
    <section id="book" className="border-t border-ivory-line py-24 md:py-40">
      <div className="mx-auto grid max-w-site gap-16 px-5 md:px-10 lg:grid-cols-12 lg:gap-8">
        <Reveal className="lg:col-span-5">
          <h2 className="font-serif text-5xl leading-[1.05] text-ink md:text-6xl">Book your visit.</h2>
          <p className="mt-6 max-w-[40ch] text-[17px] leading-relaxed text-muted">
            Tell us what you need and a patient coordinator will arrange the rest. Everything you share stays confidential.
          </p>

          <ol className="mt-12 grid gap-8">
            {nextSteps.map((step, i) => (
              <li key={step.title} className="grid grid-cols-[48px_1fr] gap-4">
                <span className="grid h-12 w-12 place-items-center border border-champagne text-[17px] text-forest">{i + 1}</span>
                <div>
                  <p className="font-medium text-ink">{step.title}</p>
                  <p className="mt-1 text-[15px] leading-relaxed text-muted">{step.text}</p>
                </div>
              </li>
            ))}
          </ol>

          <p className="mt-12 border-t border-ivory-line pt-6 text-[15px] text-muted">
            Already a patient?{" "}
            <Link to={actions.portal.href} className="border-b border-champagne text-forest hover:text-champagne">
              Book in the patient portal
            </Link>
          </p>
        </Reveal>

        <Reveal className="lg:col-span-7">
          <div className="border border-ivory-line bg-white p-6 sm:p-10">
            {sent ? (
              <div role="status" className="grid gap-4 py-10">
                <p className="eyebrow text-champagne">Request received</p>
                <p className="font-serif text-4xl text-ink">Thank you, {values.name.trim().split(" ")[0]}.</p>
                <p className="text-[17px] text-muted">
                  A patient coordinator will call you within two hours. If it is urgent, call us on{" "}
                  <span className="text-ink select-all">{contact.coordinators}</span>.
                </p>
              </div>
            ) : (
              <form onSubmit={submit} noValidate className="grid gap-6 sm:grid-cols-2">
                <fieldset className="grid gap-3 sm:col-span-2">
                  <legend className={`${labelClass} mb-2`}>What would you like to book?</legend>
                  <div className="grid grid-cols-2 border border-ivory-line p-1">
                    {requestTypes.map((t) => (
                      <label
                        key={t.value}
                        className={`cursor-pointer px-4 py-3 text-center text-[15px] transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-champagne ${values.type === t.value ? "bg-forest text-ivory" : "text-muted hover:text-ink"}`}
                      >
                        <input type="radio" name="type" value={t.value} checked={values.type === t.value} onChange={update} className="sr-only" />
                        {t.label}
                      </label>
                    ))}
                  </div>
                  <p className="text-[14px] text-muted">{selectedType.hint}</p>
                </fieldset>
                <div className="grid content-start gap-2">
                  <label htmlFor="book-name" className={labelClass}>Full name</label>
                  <input {...fieldProps("name")} autoComplete="name" placeholder="e.g. Lina Haddad" className={fieldClass} />
                  {errorText("name")}
                </div>
                <div className="grid content-start gap-2">
                  <label htmlFor="book-reach" className={labelClass}>Phone or email</label>
                  <input {...fieldProps("reach")} autoComplete="email" placeholder="+961 70 123 456" className={fieldClass} />
                  {errorText("reach")}
                </div>
                <div className="grid content-start gap-2">
                  <label htmlFor="book-center" className={labelClass}>Center <span className="font-normal text-muted">(optional)</span></label>
                  <select {...fieldProps("center")} className={`${fieldClass} ${values.center ? "" : "text-muted/70"}`}>
                    <option value="">Not sure yet</option>
                    {centers.map((c) => (
                      <option key={c.name} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="grid content-start gap-2">
                  <label htmlFor="book-date" className={labelClass}>Preferred date <span className="font-normal text-muted">(optional)</span></label>
                  <input {...fieldProps("date")} type="date" min={today} className={fieldClass} />
                </div>
                <div className="grid gap-2 sm:col-span-2">
                  <label htmlFor="book-message" className={labelClass}>How can we help? <span className="font-normal text-muted">(optional)</span></label>
                  <textarea
                    {...fieldProps("message")}
                    rows={4}
                    placeholder="Briefly describe your symptoms, or the doctor you would like to see."
                    className={`${fieldClass} h-auto resize-none py-3`}
                  />
                </div>
                <div className="grid gap-2 sm:col-span-2">
                  <label className="flex items-start gap-3 text-[15px] text-muted">
                    <input
                      id="book-consent"
                      name="consent"
                      type="checkbox"
                      checked={values.consent}
                      onChange={update}
                      aria-invalid={Boolean(errors.consent)}
                      aria-describedby={errors.consent ? "book-consent-error" : undefined}
                      className="mt-1 h-4 w-4 accent-forest"
                    />
                    I agree that SmartCare may contact me about this request. My information will not be shared.
                  </label>
                  {errorText("consent")}
                </div>
                <div className="flex flex-wrap items-center justify-between gap-4 border-t border-ivory-line pt-6 sm:col-span-2">
                  <p className="text-[14px] text-muted">
                    Prefer to call? <span className="text-ink select-all">{contact.coordinators}</span>
                  </p>
                  <button type="submit" className="inline-flex items-center gap-4 bg-forest px-8 py-4 text-[15px] tracking-wide text-ivory transition-colors hover:bg-forest-soft">
                    {values.type === "consultation" ? "Request consultation" : "Request appointment"}
                    <ArrowIcon />
                  </button>
                </div>
              </form>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
