import { useEffect } from "react";
import { Link } from "react-router-dom";
import "../../styles/site.css";
import Logo from "../../components/site/Logo";
import { contact } from "../../content/site";

// Any address the app does not know. The site is a single-page app on static hosting,
// so the server still answers 200; this page tells people (and search engines, via noindex) it is not a page.
export default function NotFound() {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = "Page not found · SmartCare Private Hospital";
    const robots = document.createElement("meta");
    robots.name = "robots";
    robots.content = "noindex";
    document.head.appendChild(robots);
    return () => {
      document.title = previousTitle;
      robots.remove();
    };
  }, []);

  return (
    <div className="site flex min-h-screen flex-col bg-ivory">
      <header className="bg-forest-deep text-ivory">
        <div className="mx-auto flex max-w-site items-center px-5 py-5 md:px-10">
          <Link to="/" aria-label="SmartCare Private Hospital, home">
            <Logo />
          </Link>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-site flex-1 flex-col justify-center px-5 py-20 md:px-10">
        <p className="text-[15px] text-muted">Error 404</p>
        <h1 className="mt-3 max-w-3xl font-serif text-5xl leading-[1.05] text-ink md:text-7xl">We could not find this page.</h1>
        <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-muted">
          The link may be old or mistyped. You can go back to the website or sign in to your portal.
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link to="/" className="inline-flex h-12 items-center bg-forest px-6 text-[15px] text-ivory transition-colors hover:bg-forest-soft">
            Back to the website
          </Link>
          <Link to="/login" className="inline-flex h-12 items-center border border-ivory-line bg-white px-6 text-[15px] text-ink transition-colors hover:border-forest">
            Sign in
          </Link>
        </div>
        <p className="mt-16 text-[14px] text-muted">
          Need help now? Call <a href={`tel:${contact.mainLine.replace(/\s/g, "")}`} className="text-ink underline decoration-champagne underline-offset-4">{contact.mainLine}</a>
        </p>
      </main>
    </div>
  );
}
