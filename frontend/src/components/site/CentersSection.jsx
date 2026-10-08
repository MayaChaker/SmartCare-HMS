import { useState } from "react";
import Reveal from "./Reveal";
import { centers } from "../../content/site";

// A typographic list of centers. On large screens, the hovered or focused center shows its photo.
export default function CentersSection() {
  const [active, setActive] = useState(0);

  return (
    <section id="centers" className="py-24 md:py-40">
      <div className="mx-auto grid max-w-site gap-12 px-5 md:px-10 lg:grid-cols-12 lg:gap-8">
        <Reveal className="lg:col-span-4">
          <p className="eyebrow text-champagne">Centers of Excellence</p>
          <h2 className="mt-5 font-serif text-5xl leading-[1.05] text-ink md:text-6xl">Six centers. One standard of care.</h2>
          <p className="mt-6 max-w-[38ch] text-[17px] leading-relaxed text-muted">
            Each center brings specialists, diagnostics and treatment under one roof, so you never repeat your story twice.
          </p>
          <div className="relative mt-12 hidden aspect-[4/5] overflow-hidden lg:block">
            {centers.map((center, i) => (
              <img
                key={center.name}
                src={center.image}
                alt=""
                loading="lazy"
                className={`photo-grade absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${i === active ? "opacity-100" : "opacity-0"}`}
              />
            ))}
          </div>
        </Reveal>

        <ul className="border-t border-ivory-line lg:col-span-7 lg:col-start-6">
          {centers.map((center, i) => (
            <li key={center.name}>
              <a
                href="#contact"
                className="group grid grid-cols-[1fr_auto] gap-x-6 gap-y-2 border-b border-ivory-line py-7"
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
              >
                <span className="font-serif text-[34px] leading-tight text-ink transition-colors group-hover:text-forest-soft md:text-[42px]">
                  {center.name}
                </span>
                <span className="self-center text-champagne" aria-hidden="true">→</span>
                <span className="col-span-2 flex items-center gap-4 text-[16px] text-muted">
                  <i
                    className={`block h-px w-8 origin-left bg-champagne transition-transform duration-500 ease-soft ${i === active ? "scale-x-100" : "scale-x-0"}`}
                  />
                  {center.summary}
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
