import Reveal from "./Reveal";
import SectionHeading from "./SectionHeading";
import { centers } from "../../content/site";
import { requestBooking } from "../../utils/bookingIntent";

// All six centers visible at once, in an even grid. Each one can be booked directly.
export default function CentersSection() {
  return (
    <section id="centers" className="py-24 md:py-40">
      <div className="mx-auto max-w-site px-5 md:px-10">
        <SectionHeading
          title="Six centers. One standard of care."
          intro="Each center brings specialists, diagnostics and treatment under one roof, so you never repeat your story twice."
        />

        <ul className="mt-16 grid gap-x-8 gap-y-16 sm:grid-cols-2 lg:grid-cols-3">
          {centers.map((center) => (
            <Reveal as="li" key={center.name} className="group flex flex-col">
              <div className="aspect-[4/3] overflow-hidden bg-ivory-line">
                <img
                  src={center.image}
                  alt={center.imageAlt}
                  loading="lazy"
                  className="photo-grade h-full w-full object-cover transition-transform duration-[1200ms] ease-soft group-hover:scale-[1.04]"
                />
              </div>

              <div className="mt-6 flex items-baseline justify-between gap-4">
                <h3 className="font-serif text-[32px] leading-tight text-ink">{center.name}</h3>
                <span className="shrink-0 text-[14px] whitespace-nowrap text-muted">{center.specialists} specialists</span>
              </div>
              {/* Fixed height for three lines, so the service lists line up across each row */}
              <p className="mt-3 text-[16px] leading-relaxed text-muted sm:min-h-[78px]">{center.summary}</p>

              <ul className="mt-5 grid gap-2 border-t border-ivory-line pt-5 text-[15px] text-ink">
                {center.services.slice(0, 3).map((service) => (
                  <li key={service} className="flex items-center gap-3">
                    <span className="h-px w-3 bg-champagne" aria-hidden="true" />
                    {service}
                  </li>
                ))}
              </ul>

              <div className="mt-auto flex items-center justify-between gap-4 pt-6 text-[15px]">
                <span className="text-muted">
                  Led by <span className="text-ink">{center.lead}</span>
                </span>
                <button
                  type="button"
                  onClick={() => requestBooking({ type: "appointment", center: center.name })}
                  className="inline-flex shrink-0 items-center gap-2 border-b border-champagne pb-0.5 text-forest transition-colors hover:text-champagne"
                  aria-label={`Book an appointment in ${center.name}`}
                >
                  Book <span aria-hidden="true">→</span>
                </button>
              </div>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
