// SmartCare brand mark: a medical cross made of four rounded bars, plus the wordmark.
export default function Logo() {
  return (
    <span className="flex items-center gap-3">
      <svg width="30" height="30" viewBox="0 0 30 30" aria-hidden="true" className="shrink-0">
        <rect x="12" y="1" width="6" height="11" rx="3" className="fill-champagne" />
        <rect x="12" y="18" width="6" height="11" rx="3" className="fill-champagne" />
        <rect x="1" y="12" width="11" height="6" rx="3" fill="currentColor" />
        <rect x="18" y="12" width="11" height="6" rx="3" fill="currentColor" />
      </svg>
      <span className="grid leading-none">
        <span className="font-serif text-[26px] tracking-wide">SmartCare</span>
        <span className="mt-1 text-[9.5px] uppercase tracking-[0.32em] opacity-75">Private Hospital</span>
      </span>
    </span>
  );
}
