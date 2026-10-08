import { useEffect, useState } from "react";
import usePrefersReducedMotion from "../../hooks/usePrefersReducedMotion";
import { testimonials } from "../../content/site";

const INTERVAL_MS = 7000;

// One quote at a time with a slow crossfade. It pauses while the visitor hovers or uses the keyboard inside it.
export default function TestimonialsSection() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (paused || reduced) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % testimonials.length), INTERVAL_MS);
    return () => clearInterval(timer);
  }, [paused, reduced, index]);

  const go = (step) => setIndex((i) => (i + step + testimonials.length) % testimonials.length);

  return (
    <section
      aria-roledescription="carousel"
      aria-label="What our patients say"
      className="bg-ivory-warm py-24 md:py-36"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="mx-auto grid max-w-site gap-8 px-5 md:grid-cols-12 md:px-10">
        <p className="eyebrow text-champagne md:col-span-3">In their words</p>
        <div className="md:col-span-8 md:col-start-5">
          {/* All quotes share one grid cell, so the box is as tall as the longest quote */}
          <div className="grid" aria-live="polite">
            {testimonials.map((item, i) => (
              <figure
                key={item.author}
                aria-hidden={i !== index}
                className={`col-start-1 row-start-1 transition-opacity duration-[900ms] ${i === index ? "opacity-100" : "opacity-0"}`}
              >
                <blockquote className="font-serif text-[30px] leading-[1.18] text-ink italic md:text-[44px]">“{item.quote}”</blockquote>
                <figcaption className="mt-8 text-[15px] text-muted">{item.author}</figcaption>
              </figure>
            ))}
          </div>
          <div className="mt-10 flex items-center gap-6">
            {[
              { step: -1, label: "Previous quote", icon: "←" },
              { step: 1, label: "Next quote", icon: "→" },
            ].map((btn) => (
              <button
                key={btn.label}
                type="button"
                aria-label={btn.label}
                onClick={() => go(btn.step)}
                className="grid h-12 w-12 place-items-center border border-ink/30 transition-colors hover:border-forest hover:bg-forest hover:text-ivory"
              >
                {btn.icon}
              </button>
            ))}
            <span className="text-[14px] text-muted tabular-nums">
              {index + 1} / {testimonials.length}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
