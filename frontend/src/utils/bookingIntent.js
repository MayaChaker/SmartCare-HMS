// Lets any button on the public site open the booking form with something already chosen,
// e.g. the hero opens it as a private consultation, a center card opens it with that center selected.
const EVENT = "smartcare:booking-intent";

export function requestBooking(intent = {}) {
  window.dispatchEvent(new CustomEvent(EVENT, { detail: intent }));
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.getElementById("book")?.scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
}

export function onBookingRequest(handler) {
  const listener = (e) => handler(e.detail);
  window.addEventListener(EVENT, listener);
  return () => window.removeEventListener(EVENT, listener);
}
