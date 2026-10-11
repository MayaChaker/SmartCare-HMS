import { useId, useRef, useState } from "react";

// "YYYY-MM-DD" that is a real calendar day (no 31 April)
export const isRealDate = (ymd) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd || "")) return false;
  const date = new Date(`${ymd}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === ymd;
};

const split = (ymd) => {
  const [year = "", month = "", day = ""] = /^\d{4}-\d{2}-\d{2}$/.test(ymd || "") ? ymd.split("-") : [];
  return { day, month, year };
};

// Day, month and year as three short number boxes, as hospital and government forms ask for a birth date.
// It looks the same on every phone (a native date picker does not on iPhone, and has no placeholder),
// and nobody has to scroll back decades in a calendar.
// `value` and `onChange(value)` use "YYYY-MM-DD"; an unfinished date is passed on as it is, so it fails validation.
export default function DateOfBirthField({ label = "Date of birth", name, value, onChange, error, hint = "For example 21 07 1990", required }) {
  const id = useId();
  const [parts, setParts] = useState(() => split(value));
  const monthRef = useRef(null);
  const yearRef = useRef(null);
  const describedBy = error ? `${id}-error` : `${id}-hint`;

  const update = (key, next) => (e) => {
    const digits = e.target.value.replace(/\D/g, "").slice(0, key === "year" ? 4 : 2);
    const updated = { ...parts, [key]: digits };
    setParts(updated);
    const { day, month, year } = updated;
    onChange(day || month || year ? `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}` : "");
    // Move on once a box is full, like a printed form
    if (next && digits.length === 2) next.current?.focus();
  };

  const box = "h-12 w-full border border-ivory-line bg-white px-2 text-center text-[16px] text-ink tabular-nums placeholder:text-muted/70 outline-none transition-colors focus:border-forest aria-[invalid=true]:border-alert";
  // [key, label, placeholder, length, box to focus next, ref]. The day box also carries the field's
  // `name`, so a form can move focus to it when the date needs fixing.
  const fields = [
    ["day", "Day", "DD", 2, monthRef, null],
    ["month", "Month", "MM", 2, yearRef, monthRef],
    ["year", "Year", "YYYY", 4, null, yearRef],
  ];

  return (
    <fieldset className="grid content-start gap-2" aria-describedby={describedBy}>
      <legend className="mb-2 text-[14px] font-medium text-ink">
        {label}
        {required && <span className="sr-only"> (required)</span>}
      </legend>
      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.6fr)] gap-2.5">
        {fields.map(([key, boxLabel, placeholder, length, next, ref]) => (
          <input
            key={key}
            ref={ref}
            name={key === "day" ? name : undefined}
            aria-label={boxLabel}
            inputMode="numeric"
            autoComplete={`bday-${key}`}
            placeholder={placeholder}
            maxLength={length}
            value={parts[key]}
            onChange={update(key, next)}
            aria-invalid={Boolean(error)}
            className={box}
          />
        ))}
      </div>
      {error ? (
        <p id={`${id}-error`} className="text-[14px] text-alert">
          {error}
        </p>
      ) : (
        <p id={`${id}-hint`} className="text-[13px] text-muted">
          {hint}
        </p>
      )}
    </fieldset>
  );
}
