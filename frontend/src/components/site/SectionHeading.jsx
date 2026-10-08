import Reveal from "./Reveal";

// Eyebrow label, serif title and an optional short intro on the right.
export default function SectionHeading({ eyebrow, title, intro, dark = false }) {
  return (
    <Reveal className="grid items-end gap-8 md:grid-cols-12">
      <div className="md:col-span-7">
        <p className={`eyebrow ${dark ? "text-champagne-light" : "text-champagne"}`}>{eyebrow}</p>
        <h2 className={`mt-5 font-serif text-5xl leading-[1.05] text-balance md:text-6xl ${dark ? "" : "text-ink"}`}>
          {title}
        </h2>
      </div>
      {intro && (
        <p className={`text-[17px] leading-relaxed md:col-span-4 md:col-start-9 ${dark ? "text-ivory/75" : "text-muted"}`}>
          {intro}
        </p>
      )}
    </Reveal>
  );
}
