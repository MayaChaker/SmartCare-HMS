import { useState } from "react";
import SectionHeading from "./SectionHeading";
import { actions, centers } from "../../content/site";

function CenterDetails({ center, showTitle = true }) {
  return (
    <div className="grid gap-8">
      <div className="aspect-[16/10] overflow-hidden bg-ivory-line">
        <img src={center.image} alt={center.imageAlt} className="photo-grade h-full w-full object-cover" />
      </div>
      <div className="grid gap-8 md:grid-cols-2">
        <div>
          {showTitle && <h3 className="mb-4 font-serif text-4xl text-ink">{center.name}</h3>}
          <p className="text-[17px] leading-relaxed text-muted">{center.summary}</p>
        </div>
        <div>
          <p className="eyebrow text-muted">Key services</p>
          <ul className="mt-3 border-t border-ivory-line">
            {center.services.map((service) => (
              <li key={service} className="border-b border-ivory-line py-3 text-[16px] text-ink">
                {service}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-ivory-line pt-6 text-[15px]">
        <p className="text-muted">
          Led by <span className="text-ink">{center.lead}</span> · {center.specialists} specialists
        </p>
        <a href={actions.book.href} className="inline-flex items-center gap-2 border-b border-champagne pb-0.5 text-forest transition-colors hover:text-champagne">
          {actions.book.label} <span aria-hidden="true">→</span>
        </a>
      </div>
    </div>
  );
}

// Large screens: the list of centers on the left, the selected center on the right (tabs).
// Phones: the same list opens like an accordion, details under the selected center.
export default function CentersSection() {
  const [active, setActive] = useState(0);

  const onKeyDown = (e) => {
    const step = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
    if (!step) return;
    e.preventDefault();
    const next = (active + step + centers.length) % centers.length;
    setActive(next);
    document.getElementById(`center-tab-${next}`)?.focus();
  };

  return (
    <section id="centers" className="py-24 md:py-40">
      <div className="mx-auto max-w-site px-5 md:px-10">
        <SectionHeading
          eyebrow="Centers of Excellence"
          title="Six centers. One standard of care."
          intro="Each center brings specialists, diagnostics and treatment under one roof, so you never repeat your story twice."
        />

        <div className="mt-16 grid gap-10 lg:grid-cols-12 lg:gap-16">
          <div role="tablist" aria-label="Centers of Excellence" aria-orientation="vertical" className="border-t border-ivory-line lg:col-span-4">
            {centers.map((center, i) => {
              const selected = i === active;
              return (
                <div key={center.name} className="border-b border-ivory-line">
                  <button
                    type="button"
                    role="tab"
                    id={`center-tab-${i}`}
                    aria-selected={selected}
                    aria-controls="center-panel"
                    tabIndex={selected ? 0 : -1}
                    onClick={() => setActive(i)}
                    onKeyDown={onKeyDown}
                    className={`flex w-full items-center justify-between gap-4 py-5 text-left transition-colors ${selected ? "text-forest" : "text-muted hover:text-ink"}`}
                  >
                    <span className="font-serif text-[28px] leading-tight">{center.name}</span>
                    <span className={`shrink-0 text-[14px] whitespace-nowrap tabular-nums ${selected ? "text-champagne" : ""}`}>{center.specialists} specialists</span>
                  </button>
                  {selected && (
                    <div className="pb-8 lg:hidden">
                      <CenterDetails center={center} showTitle={false} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div id="center-panel" role="tabpanel" aria-labelledby={`center-tab-${active}`} className="hidden lg:col-span-8 lg:block">
            <CenterDetails key={active} center={centers[active]} />
          </div>
        </div>
      </div>
    </section>
  );
}
