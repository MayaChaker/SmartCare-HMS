import { useEffect, useRef } from "react";
import ArrowIcon from "./ArrowIcon";
import usePrefersReducedMotion from "../../hooks/usePrefersReducedMotion";
import { actions } from "../../content/site";

export default function HeroSection() {
  const photoRef = useRef(null);
  const reduced = usePrefersReducedMotion();

  // Slow parallax: the photo moves at a fraction of the scroll speed
  useEffect(() => {
    if (reduced) return;
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (photoRef.current && window.scrollY < window.innerHeight) {
          photoRef.current.style.transform = `translate3d(0, ${window.scrollY * 0.15}px, 0)`;
        }
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
    };
  }, [reduced]);

  return (
    <section id="top" className="relative flex min-h-[max(100svh,680px)] items-end overflow-hidden bg-forest text-ivory">
      <div ref={photoRef} className="absolute inset-x-0 -top-[8%] h-[116%]">
        <img
          src="/images/site/corridor.jpg"
          alt="The light-filled glass corridor of the SmartCare inpatient wing"
          className="photo-grade h-full w-full object-cover object-[60%_50%] motion-safe:animate-settle"
          fetchPriority="high"
        />
      </div>
      <div className="absolute inset-0 bg-linear-to-r from-forest-deep/90 via-forest-deep/55 to-forest-deep/10" />
      <div className="absolute inset-0 bg-linear-to-t from-forest-deep/70 via-transparent to-forest-deep/30" />

      <div className="relative mx-auto grid w-full max-w-site items-end gap-8 px-5 pb-20 md:grid-cols-12 md:px-10 md:pb-28">
        <div className="md:col-span-8 motion-safe:animate-rise">
          <p className="eyebrow text-champagne-light">Private Hospital · Beirut</p>
          <h1 className="mt-6 font-serif text-[52px] leading-[1.02] text-balance sm:text-7xl lg:text-[104px] lg:leading-[0.98]">
            Exceptional medicine,
            <br />
            <em className="text-champagne-light">quietly</em> delivered.
          </h1>
          <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-5">
            <a
              href={actions.book.href}
              className="inline-flex items-center gap-4 bg-ivory px-7 py-4 text-[15px] tracking-wide text-forest transition-colors hover:bg-champagne"
            >
              {actions.book.label}
              <ArrowIcon />
            </a>
            <a href="#doctors" className="border-b border-ivory/50 pb-1 text-[15px] tracking-wide transition-colors hover:border-champagne hover:text-champagne-light">
              Find a doctor
            </a>
          </div>
        </div>
        <p className="hidden max-w-[32ch] border-l border-champagne/60 pl-5 text-[15px] leading-relaxed text-ivory/80 md:col-span-4 md:block md:justify-self-end motion-safe:animate-rise">
          Leading specialists, private rooms and a dedicated coordinator for every patient, from the first call to full recovery.
        </p>
      </div>
    </section>
  );
}
