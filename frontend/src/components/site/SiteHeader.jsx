import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Logo from "./Logo";
import { actions, navLinks } from "../../content/site";
import { requestBooking } from "../../utils/bookingIntent";

// Transparent over the hero photo, then solid ivory once the visitor scrolls past it.
// Two actions with different roles: "Patient portal" (a link, for existing patients)
// and "Book an appointment" (the one button, for new visits). The hero offers the private consultation.
export default function SiteHeader() {
  const [solid, setSolid] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > window.innerHeight * 0.6);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const closeMenu = () => setMenuOpen(false);
  const bookAppointment = (e) => {
    e.preventDefault();
    closeMenu();
    requestBooking({ type: "appointment" });
  };
  const tone = menuOpen
    ? "bg-forest text-ivory"
    : solid
      ? "bg-ivory/95 text-ink border-ivory-line backdrop-blur-md"
      : "text-ivory";

  return (
    <header className={`fixed inset-x-0 top-0 z-50 border-b border-transparent transition-colors duration-500 ${tone}`}>
      <div className="mx-auto flex h-20 max-w-site items-center gap-6 px-5 md:px-10">
        <a href="#top" aria-label="SmartCare Private Hospital, back to top" onClick={closeMenu}>
          <Logo />
        </a>

        <nav aria-label="Main" className="ml-auto hidden items-center gap-8 text-[15px] lg:flex">
          {navLinks.map((link) => (
            <a key={link.href} href={link.href} className="transition-colors hover:text-champagne">
              {link.label}
            </a>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-6 lg:ml-4">
          <Link
            to={actions.portal.href}
            className="hidden items-center gap-2 border-l border-current/30 pl-6 text-[15px] transition-colors hover:text-champagne md:inline-flex"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
              <circle cx="8" cy="5.5" r="3" />
              <path d="M2.5 14.5c.6-3 2.8-4.5 5.5-4.5s4.9 1.5 5.5 4.5" />
            </svg>
            {actions.portal.label}
          </Link>
          <a
            href={actions.book.href}
            onClick={bookAppointment}
            className="hidden bg-champagne px-5 py-2.5 text-[14px] tracking-wide text-forest-deep transition-colors hover:bg-champagne-light md:inline-flex"
          >
            {actions.book.label}
          </a>
          <button
            type="button"
            className="-mr-2 p-2 lg:hidden"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <svg width="26" height="26" viewBox="0 0 26 26" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              {menuOpen ? <path d="M6 6l14 14M20 6L6 20" /> : <path d="M3 8h20M3 13h20M3 18h20" />}
            </svg>
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav id="mobile-menu" aria-label="Mobile" className="grid gap-1 px-5 pt-2 pb-8 lg:hidden">
          {navLinks.map((link) => (
            <a key={link.href} href={link.href} className="py-2 font-serif text-3xl" onClick={closeMenu}>
              {link.label}
            </a>
          ))}
          <div className="mt-6 grid gap-3 border-t border-ivory/15 pt-6">
            <a href={actions.book.href} onClick={bookAppointment} className="bg-champagne px-5 py-3 text-center text-forest-deep">
              {actions.book.label}
            </a>
            <Link to={actions.portal.href} className="border border-ivory/40 px-5 py-3 text-center">
              {actions.portal.label}
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
