import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Logo from "./Logo";
import { navLinks } from "../../content/site";

// Transparent over the hero photo, then solid ivory once the visitor scrolls past it.
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
          <Link to="/login" className="transition-colors hover:text-champagne">
            Log in
          </Link>
        </nav>

        <a
          href="#contact"
          className="ml-auto hidden items-center border border-current px-5 py-2.5 text-[14px] tracking-wide transition-colors hover:border-champagne hover:bg-champagne hover:text-forest md:inline-flex lg:ml-2"
        >
          Private consultation
        </a>

        <button
          type="button"
          className="-mr-2 ml-auto p-2 md:ml-2 lg:hidden"
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

      {menuOpen && (
        <nav id="mobile-menu" aria-label="Mobile" className="grid gap-1 px-5 pt-2 pb-8 font-serif text-3xl lg:hidden">
          {navLinks.map((link) => (
            <a key={link.href} href={link.href} className="py-2" onClick={closeMenu}>
              {link.label}
            </a>
          ))}
          <Link to="/login" className="py-2">
            Log in
          </Link>
          <a href="#contact" onClick={closeMenu} className="mt-4 bg-champagne px-5 py-3 text-center font-sans text-base text-forest">
            Request a Private Consultation
          </a>
        </nav>
      )}
    </header>
  );
}
