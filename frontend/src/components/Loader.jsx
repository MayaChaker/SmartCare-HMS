// The SmartCare mark as a loading indicator: its four bars light up in turn, clockwise.
// - "page": centred under the header while a portal loads its data
// - "section": one line inside a page (a list or a chart panel)
// Buttons use BusyLabel below, which shows a small mark in the button's text colour.
const SIZES = { page: 40, section: 20, button: 16 };

function Mark({ size, mono }) {
  const gold = mono ? "fill-current" : "fill-champagne";
  return (
    <svg width={size} height={size} viewBox="0 0 30 30" aria-hidden="true" className="loader-mark shrink-0">
      <rect x="12" y="1" width="6" height="11" rx="3" className={gold} />
      <rect x="18" y="12" width="11" height="6" rx="3" className="fill-current" />
      <rect x="12" y="18" width="6" height="11" rx="3" className={gold} />
      <rect x="1" y="12" width="11" height="6" rx="3" className="fill-current" />
    </svg>
  );
}

// A button's text while it works: the small mark plus "Saving…". Give the button aria-busy={busy} too.
export function BusyLabel({ busy, text, busyText = "Saving…" }) {
  if (!busy) return text;
  return (
    <span className="inline-flex items-center gap-2.5">
      <Mark size={SIZES.button} mono />
      {busyText}
    </span>
  );
}

export default function Loader({ label = "Loading…", variant = "page", className = "" }) {
  const size = SIZES[variant];

  if (variant === "section") {
    return (
      <p role="status" className={`loader-appear flex items-center gap-3 text-[15px] text-muted ${className}`}>
        <span className="text-forest">
          <Mark size={size} />
        </span>
        {label}
      </p>
    );
  }

  return (
    <div role="status" className={`loader-appear flex min-h-[45vh] flex-col items-center justify-center gap-5 px-4 text-center ${className}`}>
      <span className="text-forest">
        <Mark size={size} />
      </span>
      <p className="text-[15px] tracking-wide text-muted">{label}</p>
    </div>
  );
}
