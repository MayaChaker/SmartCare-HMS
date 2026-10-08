import { useState } from "react";
import Reveal from "./Reveal";
import ArrowIcon from "./ArrowIcon";
import { centers, contact } from "../../content/site";

const fieldClass = "border-b border-ink/30 py-3 text-[17px] outline-none focus:border-forest";
const labelClass = "text-[14px] font-medium text-ink";

function validate(values) {
  const errors = {};
  if (values.name.trim().length < 2) errors.name = "Please enter your name.";
  if (!/@|\d{6,}/.test(values.reach.replace(/\s/g, ""))) errors.reach = "Please enter a phone number or email so we can reach you.";
  if (!values.consent) errors.consent = "Please confirm so we can contact you.";
  return errors;
}

// Consultation request form.
// Note: there is no backend endpoint for these requests yet, so the form only confirms on screen.
export default function ContactSection() {
  const [values, setValues] = useState({ name: "", reach: "", center: "Not sure yet", date: "", message: "", consent: false });
  const [errors, setErrors] = useState({});
  const [sent, setSent] = useState(false);

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
      document.getElementById(`contact-${firstInvalid}`)?.focus();
      return;
    }
    setSent(true);
  };

  const errorText = (field) =>
    errors[field] && (
      <p id={`contact-${field}-error`} className="text-[14px] text-alert">
        {errors[field]}
      </p>
    );
  const a11y = (field) => ({ "aria-invalid": Boolean(errors[field]), "aria-describedby": errors[field] ? `contact-${field}-error` : undefined });

  return (
    <section id="contact" className="py-24 md:py-40">
      <div className="mx-auto grid max-w-site gap-16 px-5 md:px-10 lg:grid-cols-12 lg:gap-8">
        <Reveal className="lg:col-span-4">
          <p className="eyebrow text-champagne">Contact</p>
          <h2 className="mt-5 font-serif text-5xl leading-[1.05] text-ink md:text-6xl">Request a private consultation.</h2>
          <p className="mt-6 text-[17px] leading-relaxed text-muted">
            A patient coordinator will call you within two hours, in your language. Everything you share stays confidential.
          </p>
          <dl className="mt-12 grid gap-6 text-[16px]">
            {[
              ["Patient coordinators", contact.coordinators],
              ["International desk", contact.internationalEmail],
              ["Address", contact.address],
            ].map(([label, value]) => (
              <div key={label} className="border-t border-ivory-line pt-4">
                <dt className="eyebrow text-muted">{label}</dt>
                <dd className="mt-1 text-lg text-ink select-all">{value}</dd>
              </div>
            ))}
          </dl>
        </Reveal>

        <Reveal className="lg:col-span-7 lg:col-start-6">
          {sent ? (
            <div className="bg-forest p-8 text-ivory" role="status">
              <p className="font-serif text-3xl">Thank you, {values.name.trim().split(" ")[0]}. Your request is with us.</p>
              <p className="mt-3 text-ivory/80">A patient coordinator will call you within two hours.</p>
            </div>
          ) : (
            <form onSubmit={submit} noValidate className="grid gap-x-8 gap-y-8 sm:grid-cols-2">
              <div className="grid gap-2">
                <label htmlFor="contact-name" className={labelClass}>Full name</label>
                <input id="contact-name" name="name" autoComplete="name" value={values.name} onChange={update} className={fieldClass} {...a11y("name")} />
                {errorText("name")}
              </div>
              <div className="grid gap-2">
                <label htmlFor="contact-reach" className={labelClass}>Phone or email</label>
                <input id="contact-reach" name="reach" autoComplete="email" value={values.reach} onChange={update} className={fieldClass} {...a11y("reach")} />
                {errorText("reach")}
              </div>
              <div className="grid gap-2">
                <label htmlFor="contact-center" className={labelClass}>Center</label>
                <select id="contact-center" name="center" value={values.center} onChange={update} className={fieldClass}>
                  <option>Not sure yet</option>
                  {centers.map((c) => (
                    <option key={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2">
                <label htmlFor="contact-date" className={labelClass}>Preferred date</label>
                <input id="contact-date" name="date" type="date" value={values.date} onChange={update} className={fieldClass} />
              </div>
              <div className="grid gap-2 sm:col-span-2">
                <label htmlFor="contact-message" className={labelClass}>
                  How can we help? <span className="font-normal text-muted">(optional)</span>
                </label>
                <textarea id="contact-message" name="message" rows={3} value={values.message} onChange={update} className={`${fieldClass} resize-none`} />
              </div>
              <div className="grid gap-2 sm:col-span-2">
                <label className="flex items-start gap-3 text-[15px] text-muted">
                  <input
                    id="contact-consent"
                    name="consent"
                    type="checkbox"
                    checked={values.consent}
                    onChange={update}
                    className="mt-1 h-4 w-4 accent-forest"
                    {...a11y("consent")}
                  />
                  I agree that SmartCare may contact me about this request. My information will not be shared.
                </label>
                {errorText("consent")}
              </div>
              <div className="sm:col-span-2">
                <button type="submit" className="inline-flex items-center gap-4 bg-forest px-8 py-4 text-[15px] tracking-wide text-ivory transition-colors hover:bg-forest-soft">
                  Send request
                  <ArrowIcon />
                </button>
              </div>
            </form>
          )}
        </Reveal>
      </div>
    </section>
  );
}
