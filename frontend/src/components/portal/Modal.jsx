import { useEffect, useId, useRef } from "react";

// Accessible dialog: closes on Escape or a click outside, and moves focus inside when it opens.
export default function Modal({ title, onClose, children, wide = false }) {
  const titleId = useId();
  const panelRef = useRef(null);

  useEffect(() => {
    const previous = document.activeElement;
    panelRef.current?.focus();
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      previous?.focus?.();
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-forest-deep/50 p-5" onMouseDown={onClose}>
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onMouseDown={(e) => e.stopPropagation()}
        className={`max-h-[90vh] w-full ${wide ? "max-w-2xl" : "max-w-lg"} overflow-y-auto bg-ivory p-8 shadow-2xl outline-none`}
      >
        <div className="flex items-start justify-between gap-6">
          <h2 id={titleId} className="font-serif text-3xl text-ink">
            {title}
          </h2>
          <button type="button" onClick={onClose} aria-label="Close" className="-mt-1 text-2xl leading-none text-muted hover:text-ink">
            ×
          </button>
        </div>
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}
