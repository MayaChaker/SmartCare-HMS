import { useEffect, useRef, useState } from "react";
import SectionHeading from "./SectionHeading";
import { experienceStories } from "../../content/site";

function Facts({ facts }) {
  return (
    <dl className="mt-8 grid grid-cols-2 border-t border-ivory/15">
      {facts.map((fact, i) => (
        <div
          key={fact.label}
          className={`py-5 ${i % 2 ? "border-l border-ivory/15 pl-4" : "pr-4"} ${i < 2 ? "border-b border-ivory/15" : ""}`}
        >
          <dt className="text-[14px] text-ivory/60">{fact.label}</dt>
          <dd className={fact.big ? "mt-1 font-serif text-4xl" : "mt-1 text-[16px]"}>{fact.value}</dd>
        </div>
      ))}
    </dl>
  );
}

// Large screens: the photo stays fixed on the left while three stories scroll on the right.
// The story in the middle of the screen decides which photo is shown.
export default function ExperienceSection() {
  const [active, setActive] = useState(0);
  const storyRefs = useRef([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(Number(entry.target.dataset.index));
        });
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    storyRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <section id="experience" className="bg-forest py-24 text-ivory md:py-40">
      <div className="mx-auto max-w-site px-5 md:px-10">
        <SectionHeading
          dark
          eyebrow="Patient Experience"
          title="The care of a leading hospital. The calm of a private room."
          intro="What changes when you are admitted to SmartCare, from the room you recover in to the person who answers your call."
        />

        <div className="mt-16 grid gap-10 md:mt-24 lg:grid-cols-12 lg:gap-8">
          <div className="hidden lg:col-span-6 lg:block">
            <div className="sticky top-28">
              <div className="relative aspect-[4/5] max-h-[78vh] w-full overflow-hidden">
                {experienceStories.map((story, i) => (
                  <img
                    key={story.caption}
                    src={story.image}
                    alt={i === active ? story.imageAlt : ""}
                    className={`photo-grade absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${i === active ? "opacity-100" : "opacity-0"}`}
                  />
                ))}
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between bg-linear-to-t from-forest-deep/80 to-transparent p-6">
                  <span className="font-serif text-2xl">{experienceStories[active].caption}</span>
                  <span className="flex gap-1.5" aria-hidden="true">
                    {experienceStories.map((story, i) => (
                      <i key={story.caption} className={`block h-[2px] w-8 ${i === active ? "bg-champagne" : "bg-ivory/30"}`} />
                    ))}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-20 lg:col-span-5 lg:col-start-8 lg:gap-0">
            {experienceStories.map((story, i) => (
              <article
                key={story.caption}
                ref={(el) => (storyRefs.current[i] = el)}
                data-index={i}
                className="flex flex-col justify-center lg:min-h-[78vh]"
              >
                <img src={story.image} alt={story.imageAlt} loading="lazy" className="photo-grade mb-8 aspect-[4/3] w-full object-cover lg:hidden" />
                <p className="eyebrow text-champagne-light">{story.label}</p>
                <h3 className="mt-4 font-serif text-4xl md:text-5xl">{story.title}</h3>
                <p className="mt-5 text-[17px] leading-relaxed text-ivory/75">{story.text}</p>
                <Facts facts={story.facts} />
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
