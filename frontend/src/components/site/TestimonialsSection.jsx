import Reveal from "./Reveal";
import SectionHeading from "./SectionHeading";
import { testimonials } from "../../content/site";

// All quotes visible side by side (no carousel), so nothing is hidden behind arrows.
export default function TestimonialsSection() {
  return (
    <section id="stories" aria-labelledby="testimonials-title" className="bg-ivory-warm py-24 md:py-40">
      <div className="mx-auto max-w-site px-5 md:px-10">
        <SectionHeading
          eyebrow="Patient stories"
          title={<span id="testimonials-title">In their words.</span>}
          intro="Shared with permission. Names are shortened to protect our patients' privacy."
        />

        <ul className="mt-16 grid gap-6 md:grid-cols-3 lg:gap-8">
          {testimonials.map((item) => (
            <Reveal as="li" key={item.initials} className="flex flex-col border border-ivory-line bg-white p-8 lg:p-10">
              <svg width="36" height="28" viewBox="0 0 36 28" aria-hidden="true" className="fill-champagne">
                <path d="M0 28V16.8C0 7.3 4.6 1.7 13.7 0l1.6 3.4C10.6 4.9 8.3 8 8.2 12.6H15V28H0Zm21 0V16.8C21 7.3 25.6 1.7 34.7 0l1.3 3.4c-4.7 1.5-7 4.6-7.1 9.2H36V28H21Z" />
              </svg>
              <blockquote className="mt-8 mb-10 font-serif text-[26px] leading-[1.25] text-ink">{item.quote}</blockquote>
              <div className="mt-auto flex items-center gap-4 border-t border-ivory-line pt-6">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-forest text-[14px] text-ivory" aria-hidden="true">
                  {item.initials.replace(/[.\s]/g, "")}
                </span>
                <p className="text-[15px] leading-snug">
                  <span className="block text-ink">{item.initials}</span>
                  <span className="text-muted">
                    {item.center} patient · {item.city}
                  </span>
                </p>
              </div>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
