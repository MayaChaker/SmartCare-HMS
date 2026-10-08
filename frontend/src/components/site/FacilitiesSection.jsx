import Reveal from "./Reveal";
import SectionHeading from "./SectionHeading";
import { facilities, hospitalNumbers } from "../../content/site";

// Placement of each photo in the 12-column gallery grid, in the same order as `facilities`
const layout = [
  "col-span-2 md:col-span-7 md:row-span-2",
  "col-span-1 md:col-span-5",
  "col-span-1 md:col-span-5",
  "col-span-1 md:col-span-4",
  "col-span-1 md:col-span-4",
];

export default function FacilitiesSection() {
  return (
    <section id="facilities" className="py-24 md:py-40">
      <div className="mx-auto max-w-site px-5 md:px-10">
        <SectionHeading
          eyebrow="Technology & Facilities"
          title="Precision you rarely see, and never feel."
          intro="Diagnostics, surgery and recovery on four connected floors, so results reach your doctor within the hour."
        />

        <div className="mt-16 grid grid-cols-2 gap-4 md:grid-cols-12 md:gap-6">
          {facilities.map((item, i) => (
            <Reveal as="figure" key={item.title} className={layout[i]}>
              <div className={`overflow-hidden ${item.featured ? "aspect-[4/3] md:aspect-auto md:h-full" : "aspect-[4/3]"}`}>
                <img src={item.image} alt={item.alt} loading="lazy" className="photo-grade h-full w-full object-cover" />
              </div>
              <figcaption className="mt-3 text-[15px] text-muted">
                <span className="font-medium text-ink">{item.title}</span>
                {item.detail && ` · ${item.detail}`}
              </figcaption>
            </Reveal>
          ))}

          <Reveal className="col-span-2 flex flex-col justify-between gap-8 bg-forest p-8 text-ivory md:col-span-4">
            <p className="eyebrow text-champagne-light">In numbers</p>
            <dl className="grid grid-cols-2 gap-6">
              {hospitalNumbers.map((item) => (
                <div key={item.label}>
                  <dt className="text-[14px] text-ivory/70">{item.label}</dt>
                  <dd className="font-serif text-5xl">{item.value}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
