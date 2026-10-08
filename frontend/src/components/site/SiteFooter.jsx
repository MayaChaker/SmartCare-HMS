import { Link } from "react-router-dom";
import Logo from "./Logo";
import { contact, footerLinks, openingHours } from "../../content/site";

// Links starting with "/" are app pages (router), the rest are anchors on this page
function FooterLink({ href, children }) {
  const className = "text-ivory/70 transition-colors hover:text-ivory";
  return href.startsWith("/") ? (
    <Link to={href} className={className}>{children}</Link>
  ) : (
    <a href={href} className={className}>{children}</a>
  );
}

function Column({ title, wide = false, children }) {
  return (
    <div className={wide ? "col-span-2 md:col-span-1" : ""}>
      <h2 className="text-[15px] font-medium text-ivory">{title}</h2>
      <div className="mt-5 grid gap-3 text-[15px]">{children}</div>
    </div>
  );
}

export default function SiteFooter() {
  return (
    <footer id="site-footer" className="bg-forest-deep text-ivory">
      <div className="mx-auto max-w-site px-5 md:px-10">
        {/* Brand and emergency line */}
        <div className="grid gap-10 border-b border-ivory/10 py-16 md:grid-cols-2 md:items-end md:py-20">
          <div className="grid gap-5">
            <Logo />
            <p className="max-w-[40ch] text-[15px] leading-relaxed text-ivory/65">
              A private hospital in Beirut with six centers of excellence, 32 specialists and 48 private inpatient rooms.
            </p>
          </div>
          <div className="md:justify-self-end md:text-right">
            <p className="flex items-center gap-2 text-[15px] text-ivory/70 md:justify-end">
              <span className="h-2 w-2 rounded-full bg-emergency" aria-hidden="true" />
              Emergency, open 24 hours
            </p>
            <p className="mt-2 font-serif text-6xl leading-none select-all md:text-7xl">{contact.emergency}</p>
            <p className="mt-3 text-[15px] text-ivory/60">Gate B, Hamra Street</p>
          </div>
        </div>

        {/* Four columns */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-12 py-14 md:grid-cols-4">
          <Column title="Visit us" wide>
            <address className="text-ivory/70 not-italic">{contact.address}</address>
            {openingHours.map((item) => (
              <p key={item.label} className="text-ivory/70">
                {item.label}
                <span className="block text-ivory/50">{item.value}</span>
              </p>
            ))}
          </Column>
          <Column title="Contact" wide>
            <p className="text-ivory/70">
              Main line
              <span className="block text-ivory select-all">{contact.mainLine}</span>
            </p>
            <p className="text-ivory/70">
              Coordinators, call or WhatsApp
              <span className="block text-ivory select-all">{contact.coordinators}</span>
            </p>
            <p className="text-ivory/70">
              International desk
              <span className="block text-ivory select-all">{contact.internationalEmail}</span>
            </p>
          </Column>
          {footerLinks.map((column) => (
            <Column key={column.title} title={column.title}>
              {column.links.map((link) => (
                <FooterLink key={link.label} href={link.href}>{link.label}</FooterLink>
              ))}
            </Column>
          ))}
        </div>

        {/* Legal */}
        <div className="flex flex-col gap-3 border-t border-ivory/10 py-6 text-[13px] text-ivory/50 md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} SmartCare Private Hospital. Demo project with example content. Photos from Unsplash.</p>
          <p>Privacy policy · Terms of use · Accessibility</p>
        </div>
      </div>
    </footer>
  );
}
