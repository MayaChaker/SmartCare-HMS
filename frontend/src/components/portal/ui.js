// Shared class names for the portal, so every button and link looks the same everywhere
const button = "inline-flex h-11 items-center justify-center px-5 text-[15px] transition-colors disabled:cursor-not-allowed disabled:opacity-40 aria-busy:cursor-wait aria-busy:opacity-100";

export const ui = {
  primary: `${button} bg-forest text-ivory hover:bg-forest-soft`,
  gold: `${button} bg-champagne text-forest-deep hover:bg-champagne-light`,
  outline: `${button} border border-ivory-line bg-white text-ink hover:border-forest`,
  outlineLight: `${button} border border-ivory/30 text-ivory hover:border-ivory`,
  link: "border-b border-champagne pb-0.5 text-[15px] text-forest transition-colors hover:border-forest",
  input: "h-12 w-full border border-ivory-line bg-white px-4 text-[16px] text-ink outline-none placeholder:text-muted/70 focus:border-forest",
  rule: "border-ivory-line",
  page: "mx-auto max-w-7xl px-4 sm:px-6 lg:px-10",
};

// Page title and short introduction, with an optional action on the right
export const pageHeadClass = `${ui.page} flex flex-wrap items-end justify-between gap-6 pt-12 pb-10 lg:pt-16 lg:pb-12`;
