import Reveal from "./Reveal";

// Eyebrow label, serif title, and an optional short intro directly under the title.
export default function SectionHeading({ eyebrow, title, intro, dark = false }) {
  return (
    <Reveal className="max-w-3xl">
      <p className={`eyebrow ${dark ? "text-champagne-light" : "text-champagne"}`}>{eyebrow}</p>
      <h2 className={`mt-5 font-serif text-5xl leading-[1.05] text-balance md:text-6xl ${dark ? "" : "text-ink"}`}>{title}</h2>
      {intro && (
        <p className={`mt-6 max-w-[60ch] text-[17px] leading-relaxed ${dark ? "text-ivory/75" : "text-muted"}`}>{intro}</p>
      )}
    </Reveal>
  );
}
