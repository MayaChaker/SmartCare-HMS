import { Link } from "react-router-dom";
import Logo from "./Logo";
import ArrowIcon from "./ArrowIcon";
import { contact, footerColumns, openingHours } from "../../content/site";

// Links starting with "/" are app pages (router), the rest are anchors on this page
function FooterLink({ href, children }) {
  const className = "transition-colors hover:text-ivory";
  return href.startsWith("/") ? (
    <Link to={href} className={className}>{children}</Link>
  ) : (
    <a href={href} className={className}>{children}</a>
  );
}

export default function SiteFooter() {
  return (
    <footer className="bg-forest-deep text-ivory">
      {/* Action band */}
      <div className="border-b border-ivory/10">
        <div className="mx-auto grid max-w-site items-center gap-10 px-5 py-14 md:grid-cols-12 md:px-10 md:py-20">
          <div className="md:col-span-6">
            <h2 className="font-serif text-4xl leading-tight md:text-5xl">Speak with a patient coordinator.</h2>
            <p className="mt-3 text-ivory/70">Monday to Saturday, 8 AM to 8 PM. We call back within two hours.</p>
            <a
              href="#contact"
              className="mt-7 inline-flex items-center gap-4 bg-ivory px-7 py-4 text-[15px] tracking-wide text-forest transition-colors hover:bg-champagne"
            >
              Request a Private Consultation
              <ArrowIcon />
            </a>
          </div>
          <div className="grid gap-2 border border-champagne/50 p-7 md:col-span-5 md:col-start-8 md:p-8">
            <p className="eyebrow flex items-center gap-3 text-champagne-light">
              <i className="block h-2 w-2 rounded-full bg-emergency" />
              Emergency · open 24/7
            </p>
            <p className="font-serif text-5xl select-all md:text-6xl">{contact.emergency}</p>
            <p className="text-[15px] text-ivory/70">Emergency entrance at Gate B, Hamra Street. Ambulance on request.</p>
          </div>
        </div>
      </div>

      {/* Link columns */}
      <div className="mx-auto grid max-w-site grid-cols-2 gap-x-8 gap-y-12 px-5 py-14 md:grid-cols-12 md:px-10 md:py-20">
        <div className="col-span-2 grid content-start gap-5 md:col-span-4">
          <Logo />
          <p className="max-w-[34ch] text-[15px] leading-relaxed text-ivory/65">
            A private hospital in Beirut with six centers of excellence, 32 specialists and 48 private inpatient rooms.
          </p>
          <address className="grid gap-1 text-[15px] text-ivory/80 not-italic">
            <span>{contact.address}</span>
            <span>Main line <span className="select-all">{contact.mainLine}</span></span>
            <span>Coordinators <span className="select-all">{contact.coordinators}</span></span>
            <span className="select-all">{contact.email}</span>
          </address>
        </div>
        {footerColumns.map((column) => (
          <nav key={column.title} aria-label={column.title} className="grid content-start gap-3 text-[15px] text-ivory/75 md:col-span-2">
            <p className="eyebrow mb-1 text-champagne-light">{column.title}</p>
            {column.links.map((link) => (
              <FooterLink key={link.label} href={link.href}>{link.label}</FooterLink>
            ))}
          </nav>
        ))}
      </div>

      {/* Opening hours */}
      <div id="visiting-hours" className="border-t border-ivory/10">
        <div className="mx-auto grid max-w-site gap-4 px-5 py-6 text-[14px] text-ivory/70 sm:grid-cols-3 md:px-10">
          {openingHours.map((item) => (
            <p key={item.label}>
              <span className="text-ivory">{item.label}</span> · {item.value}
            </p>
          ))}
        </div>
      </div>

      {/* Legal bar */}
      <div className="border-t border-ivory/10">
        <div className="mx-auto flex max-w-site flex-col justify-between gap-4 px-5 py-6 text-[13px] text-ivory/55 md:flex-row md:items-center md:px-10">
          <span>© {new Date().getFullYear()} SmartCare Private Hospital · Demo project with example content · Photos from Unsplash</span>
          <span>Privacy policy · Terms of use · Accessibility</span>
        </div>
      </div>
    </footer>
  );
}
