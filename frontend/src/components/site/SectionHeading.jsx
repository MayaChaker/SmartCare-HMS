import Reveal from "./Reveal";

// Serif section title with an optional short intro directly under it.
export default function SectionHeading({ id, title, intro, dark = false }) {
  return (
    <Reveal>
      <h2 id={id} className={`font-serif text-5xl leading-[1.05] text-balance md:text-6xl ${dark ? "" : "text-ink"}`}>
        {title}
      </h2>
      {intro && (
        <p className={`mt-6 max-w-[60ch] text-[17px] leading-relaxed ${dark ? "text-ivory/75" : "text-muted"}`}>{intro}</p>
      )}
    </Reveal>
  );
}
