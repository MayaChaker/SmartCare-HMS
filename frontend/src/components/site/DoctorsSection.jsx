import Reveal from "./Reveal";
import SectionHeading from "./SectionHeading";
import { actions, doctors } from "../../content/site";
import { requestBooking } from "../../utils/bookingIntent";

export default function DoctorsSection() {
  return (
    <section id="doctors" className="bg-ivory-warm py-24 md:py-40">
      <div className="mx-auto max-w-site px-5 md:px-10">
        <SectionHeading
          title="Specialists who take the time."
          intro="Every consultation lasts at least 45 minutes. Your doctor reads your file before you arrive."
        />

        {/* Swipe row on phones, four columns on larger screens */}
        <ul className="-mx-5 mt-16 flex snap-x snap-mandatory gap-5 overflow-x-auto px-5 pb-4 md:mx-0 md:grid md:grid-cols-4 md:gap-8 md:px-0 md:pb-0">
          {doctors.map((doctor) => (
            <Reveal as="li" key={doctor.name} className="w-[78%] shrink-0 snap-start sm:w-[46%] md:w-auto">
              <div className="aspect-[4/5] overflow-hidden bg-ivory-line">
                <img
                  src={doctor.photo}
                  alt={doctor.name}
                  loading="lazy"
                  className="photo-grade h-full w-full object-cover object-[50%_20%] transition-transform duration-[1400ms] hover:scale-[1.03]"
                />
              </div>
              <h3 className="mt-6 font-serif text-[28px] text-ink">{doctor.name}</h3>
              <p className="text-[15px] font-medium text-forest-soft">{doctor.role}</p>
              <p className="mt-3 border-t border-ivory-line pt-3 text-[15px] leading-relaxed text-muted">{doctor.credentials}</p>
              <p className="mt-2 text-[14px] text-muted">{doctor.languages}</p>
            </Reveal>
          ))}
        </ul>

        <a
          href={actions.book.href}
          onClick={(e) => {
            e.preventDefault();
            requestBooking({ type: "appointment" });
          }}
          className="mt-14 inline-flex items-center gap-3 border-b border-champagne pb-1 text-[15px] tracking-wide text-forest transition-colors hover:text-champagne"
        >
          {actions.book.label} with one of our 32 specialists <span aria-hidden="true">→</span>
        </a>
      </div>
    </section>
  );
}
