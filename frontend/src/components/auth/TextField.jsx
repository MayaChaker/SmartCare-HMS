import { useId, useState } from "react";

// Labelled input with an inline error. Password fields get a show/hide button.
export default function TextField({ label, error, hint, type = "text", className = "", ...inputProps }) {
  const id = useId();
  const [visible, setVisible] = useState(false);
  const isPassword = type === "password";
  const describedBy = [error && `${id}-error`, hint && `${id}-hint`].filter(Boolean).join(" ") || undefined;

  return (
    <div className={`grid content-start gap-2 ${className}`}>
      <label htmlFor={id} className="text-[14px] font-medium text-ink">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={isPassword && visible ? "text" : type}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          className={`h-12 w-full border border-ivory-line bg-white px-4 text-[16px] text-ink placeholder:text-muted/70 outline-none transition-colors focus:border-forest aria-[invalid=true]:border-alert ${isPassword ? "pr-20" : ""}`}
          {...inputProps}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? "Hide password" : "Show password"}
            aria-pressed={visible}
            className="absolute inset-y-0 right-0 px-4 text-[14px] text-muted transition-colors hover:text-forest"
          >
            {visible ? "Hide" : "Show"}
          </button>
        )}
      </div>
      {hint && !error && (
        <p id={`${id}-hint`} className="text-[13px] text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="text-[14px] text-alert">
          {error}
        </p>
      )}
    </div>
  );
}
