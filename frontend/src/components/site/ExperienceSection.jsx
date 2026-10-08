import Reveal from "./Reveal";
import SectionHeading from "./SectionHeading";
import { experienceStories } from "../../content/site";

// Three equal columns: photo, what we promise, and the two numbers behind the promise.
export default function ExperienceSection() {
  return (
    <section id="experience" className="bg-forest py-24 text-ivory md:py-40">
      <div className="mx-auto max-w-site px-5 md:px-10">
        <SectionHeading
          dark
          eyebrow="Patient Experience"
          title="The care of a leading hospital. The calm of a private room."
          intro="What changes when you are admitted to SmartCare, from the room you recover in to the person who answers your call."
        />

        <div className="mt-16 grid gap-16 md:mt-24 md:grid-cols-3 md:gap-8 lg:gap-12">
          {experienceStories.map((story) => (
            <Reveal as="article" key={story.title} className="flex flex-col">
              <div className="aspect-[4/5] overflow-hidden">
                <img src={story.image} alt={story.imageAlt} loading="lazy" className="photo-grade h-full w-full object-cover" />
              </div>
              <p className="eyebrow mt-8 text-champagne-light">{story.label}</p>
              <h3 className="mt-3 font-serif text-[32px] leading-[1.1] text-balance">{story.title}</h3>
              <p className="mt-4 text-[16px] leading-relaxed text-ivory/75">{story.text}</p>
              <dl className="mt-auto grid grid-cols-2 border-t border-ivory/15 pt-6">
                {story.facts.map((fact, i) => (
                  <div key={fact.label} className={i ? "border-l border-ivory/15 pl-5" : "pr-5"}>
                    <dt className="text-[14px] text-ivory/60">{fact.label}</dt>
                    <dd className="mt-1 font-serif text-4xl">{fact.value}</dd>
                  </div>
                ))}
              </dl>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
