import Reveal from "./Reveal";
import SectionHeading from "./SectionHeading";
import { facilities, hospitalNumbers } from "../../content/site";

export default function FacilitiesSection() {
  return (
    <section id="facilities" className="py-24 md:py-40">
      <div className="mx-auto max-w-site px-5 md:px-10">
        <SectionHeading
          eyebrow="Technology & Facilities"
          title="Precision you rarely see, and never feel."
          intro="Diagnostics, surgery and recovery on four connected floors, so results reach your doctor within the hour."
        />

        <div className="mt-16 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
          {facilities.map((item) => (
            <Reveal as="figure" key={item.title}>
              <div className="aspect-[3/4] overflow-hidden bg-ivory-line">
                <img src={item.image} alt={item.alt} loading="lazy" className="photo-grade h-full w-full object-cover" />
              </div>
              <figcaption className="mt-5">
                <h3 className="font-serif text-[26px] leading-tight text-ink">{item.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-muted">{item.detail}</p>
              </figcaption>
            </Reveal>
          ))}
        </div>

        <dl className="mt-20 grid grid-cols-2 border-y border-ivory-line md:grid-cols-4">
          {hospitalNumbers.map((item, i) => (
            <div
              key={item.label}
              className={`py-8 ${i % 2 ? "pl-6 md:pl-8" : "pr-6 md:pr-8"} ${i ? "md:border-l md:border-ivory-line md:pl-8" : ""} ${i % 2 ? "border-l border-ivory-line" : ""} ${i < 2 ? "border-b border-ivory-line md:border-b-0" : ""}`}
            >
              <dt className="text-[14px] text-muted">{item.label}</dt>
              <dd className="mt-1 font-serif text-5xl text-forest md:text-6xl">{item.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
