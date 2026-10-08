import { Link } from "react-router-dom";
import Logo from "./Logo";
import { contact, footerLinks, legalLinks, openingHours, socialLinks } from "../../content/site";

// Simple line icons for the social links
const socialIcons = {
  Instagram: (
    <>
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="0.6" fill="currentColor" />
    </>
  ),
  LinkedIn: (
    <>
      <rect x="3.5" y="3.5" width="17" height="17" rx="2" />
      <path d="M8 10.5V16M8 7.8v.2M11.5 16v-5.5M11.5 13c0-1.6 1-2.6 2.3-2.6s2.2.9 2.2 2.6V16" />
    </>
  ),
  Facebook: <path d="M14 8h2.5V4.5H14c-2.2 0-3.5 1.5-3.5 3.7V10H8v3.5h2.5v7h3.5v-7h2.5l.5-3.5h-3V8.4c0-.3.2-.4.5-.4Z" />,
  YouTube: (
    <>
      <rect x="2.5" y="5.5" width="19" height="13" rx="4" />
      <path d="m10.5 9.5 4 2.5-4 2.5Z" fill="currentColor" />
    </>
  ),
};

// Links starting with "/" are app pages (router), the rest are anchors on this page
function FooterLink({ href, children }) {
  const className = "text-ivory/65 transition-colors hover:text-champagne-light";
  return href.startsWith("/") ? (
    <Link to={href} className={className}>{children}</Link>
  ) : (
    <a href={href} className={className}>{children}</a>
  );
}

function ContactLine({ label, value }) {
  return (
    <div>
      <dt className="text-[14px] text-ivory/50">{label}</dt>
      <dd className="mt-0.5 text-[16px] text-ivory select-all">{value}</dd>
    </div>
  );
}

export default function SiteFooter() {
  return (
    <footer id="site-footer" className="bg-forest-deep text-ivory">
      <div className="mx-auto max-w-site px-5 md:px-10">
        {/* Brand, contact and link columns */}
        <div className="grid gap-16 py-20 md:py-24 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-4">
            <Logo />
            <p className="mt-6 max-w-[28ch] font-serif text-[26px] leading-snug text-ivory/90 italic">
              Exceptional medicine, quietly delivered.
            </p>

            <dl className="mt-10 grid gap-x-6 gap-y-5 sm:grid-cols-2">
              <ContactLine label="Main switchboard" value={contact.mainLine} />
              <ContactLine label="Appointments" value={contact.coordinators} />
              <ContactLine label="WhatsApp" value={contact.whatsapp} />
              <ContactLine label="Email" value={contact.email} />
            </dl>

            <a href="#book" className="mt-8 inline-flex items-center gap-2 border-b border-champagne pb-1 text-[15px] text-champagne-light transition-colors hover:text-ivory">
              Enquire online <span aria-hidden="true">→</span>
            </a>

            <ul className="mt-10 flex gap-3" aria-label="SmartCare on social media">
              {socialLinks.map((social) => (
                <li key={social.label}>
                  <a
                    href={social.href}
                    aria-label={social.label}
                    className="grid h-10 w-10 place-items-center rounded-full border border-ivory/20 text-ivory/70 transition-colors hover:border-champagne hover:text-champagne-light"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      {socialIcons[social.label]}
                    </svg>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <nav aria-label="Footer" className="grid grid-cols-2 content-start gap-x-8 gap-y-12 md:grid-cols-4 lg:col-span-8 lg:col-start-5">
            {footerLinks.map((column) => (
              <div key={column.title}>
                <h2 className="border-b border-champagne/30 pb-4 font-serif text-[22px] leading-tight text-ivory">{column.title}</h2>
                <ul className="mt-5 grid gap-3 text-[15px]">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      <FooterLink href={link.href}>{link.label}</FooterLink>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        {/* Emergency, address and opening hours */}
        <div className="grid gap-10 border-y border-ivory/10 py-10 md:grid-cols-3 md:gap-8">
          <div>
            <p className="flex items-center gap-2 text-[14px] text-ivory/60">
              <span className="h-2 w-2 rounded-full bg-emergency" aria-hidden="true" />
              Emergency department, open 24/7
            </p>
            <p className="mt-2 font-serif text-5xl leading-none select-all">{contact.emergency}</p>
          </div>
          <address className="text-[15px] leading-relaxed text-ivory/65 not-italic">
            <span className="block text-ivory">SmartCare Private Hospital</span>
            {contact.address}
            <span className="block">Main entrance Gate A · Emergency Gate B</span>
          </address>
          <dl className="grid gap-1 text-[15px]">
            {openingHours.map((item) => (
              <div key={item.label} className="flex justify-between gap-4">
                <dt className="text-ivory/65">{item.label}</dt>
                <dd className="text-right text-ivory">{item.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Licence and legal */}
        <div className="grid gap-4 py-8 text-[13px] text-ivory/50 md:grid-cols-2 md:items-center">
          <div>
            <p>Licensed private hospital · Ministry of Public Health, Lebanon</p>
            <p className="mt-1">© {new Date().getFullYear()} SmartCare Private Hospital. Demo project with example content. Photos from Unsplash.</p>
          </div>
          <div className="grid gap-2 md:justify-items-end">
            <p className="flex flex-wrap gap-x-5 gap-y-2">
              {legalLinks.map((label) => (
                <span key={label}>{label}</span>
              ))}
            </p>
            <p className="flex gap-4">
              <span className="text-ivory">English</span>
              <span lang="ar">العربية</span>
              <span lang="fr">Français</span>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
