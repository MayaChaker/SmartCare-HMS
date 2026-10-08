import Reveal from "./Reveal";
import SectionHeading from "./SectionHeading";
import { testimonials } from "../../content/site";

function Attribution({ item }) {
  return (
    <figcaption className="mt-6 text-[15px] text-muted">
      <span className="text-ink">{item.initials}</span> · {item.center} patient, {item.city}
    </figcaption>
  );
}

// Editorial layout: one featured story, two shorter ones beside it. All visible at once.
export default function TestimonialsSection() {
  const [featured, ...others] = testimonials;

  return (
    <section id="stories" aria-labelledby="stories-title" className="bg-ivory-warm py-24 md:py-40">
      <div className="mx-auto max-w-site px-5 md:px-10">
        <SectionHeading
          id="stories-title"
          title="In their words."
          intro="Shared with permission. Names are shortened to protect our patients' privacy."
        />

        <div className="mt-16 grid gap-14 border-t border-ink/15 pt-14 lg:grid-cols-12 lg:gap-8">
          <Reveal as="figure" className="lg:col-span-7">
            <blockquote className="font-serif text-[34px] leading-[1.2] text-ink italic md:text-[46px]">“{featured.quote}”</blockquote>
            <Attribution item={featured} />
          </Reveal>

          <div className="grid content-start gap-10 lg:col-span-4 lg:col-start-9 lg:border-l lg:border-ink/15 lg:pl-10">
            {others.map((item, i) => (
              <Reveal as="figure" key={item.initials} className={i ? "border-t border-ink/15 pt-10" : ""}>
                <blockquote className="font-serif text-[24px] leading-[1.3] text-ink">“{item.quote}”</blockquote>
                <Attribution item={item} />
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
