import { Component } from "react";
import "../styles/site.css";

// If a page throws while rendering, show a calm message with a way out instead of a blank screen.
// React only supports this as a class component (getDerivedStateFromError / componentDidCatch).
export default class ErrorBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error, info) {
    console.error("Page failed to render:", error, info.componentStack);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div role="alert" className="site flex min-h-screen flex-col justify-center bg-ivory px-5 md:px-10">
        <div className="mx-auto w-full max-w-site">
          <h1 className="max-w-3xl font-serif text-5xl leading-[1.05] text-ink md:text-6xl">Something went wrong on this page.</h1>
          <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-muted">
            Your information is safe. Reload the page to try again, or go back to the website.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <button type="button" onClick={() => window.location.reload()} className="inline-flex h-12 items-center bg-forest px-6 text-[15px] text-ivory transition-colors hover:bg-forest-soft">
              Reload the page
            </button>
            {/* A full page load, so the broken state is left behind */}
            <a href="/" className="inline-flex h-12 items-center border border-ivory-line bg-white px-6 text-[15px] text-ink transition-colors hover:border-forest">
              Back to the website
            </a>
          </div>
        </div>
      </div>
    );
  }
}
