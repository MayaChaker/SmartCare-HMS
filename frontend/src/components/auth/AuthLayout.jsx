import { Link } from "react-router-dom";
import "../../styles/site.css";
import Logo from "../site/Logo";
import { contact } from "../../content/site";

// Split screen used by the sign-in and sign-up pages: a photo panel with the brand on the left,
// the form on the right. On phones the photo is hidden and the logo sits above the form.
export default function AuthLayout({ image, imageAlt, title, intro, children }) {
  return (
    <div className="site grid min-h-screen lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden bg-forest text-ivory lg:sticky lg:top-0 lg:block lg:h-screen">
        <img src={image} alt={imageAlt} className="photo-grade absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-linear-to-t from-forest-deep/95 via-forest-deep/55 to-forest-deep/30" />
        <div className="relative flex h-full flex-col justify-between p-12 xl:p-16">
          <Link to="/" aria-label="SmartCare Private Hospital, home">
            <Logo />
          </Link>
          <div>
            <h1 className="max-w-[14ch] font-serif text-6xl leading-[1.02] text-balance xl:text-7xl">{title}</h1>
            <p className="mt-6 max-w-[42ch] text-[17px] leading-relaxed text-ivory/80">{intro}</p>
            <p className="mt-12 flex items-center gap-3 border-t border-ivory/15 pt-6 text-[15px] text-ivory/70">
              <span className="h-2 w-2 rounded-full bg-emergency" aria-hidden="true" />
              Emergency, open 24/7 · <span className="text-ivory">{contact.emergency}</span>
            </p>
          </div>
        </div>
      </aside>

      <main className="flex flex-col px-5 py-8 sm:px-10 lg:px-16 lg:py-12">
        <div className="flex items-center justify-between gap-4">
          <Link to="/" className="text-forest lg:invisible" aria-label="SmartCare Private Hospital, home">
            <Logo />
          </Link>
          <Link to="/" className="text-[15px] text-muted transition-colors hover:text-forest">
            ← Back to website
          </Link>
        </div>
        <div className="mx-auto flex w-full max-w-[480px] flex-1 flex-col justify-center py-12">{children}</div>
      </main>
    </div>
  );
}
