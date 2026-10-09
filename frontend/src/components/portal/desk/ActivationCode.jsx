import { formatDate } from "../format";

// The one-time code is shown once, right after it is created; the server keeps only its hash
export default function ActivationCode({ name, code, expiresAt }) {
  return (
    <div className="border border-champagne/60 bg-white p-6">
      <p className="text-[14px] text-champagne">Activation code for {name}</p>
      <p className="mt-2 font-serif text-[44px] leading-none tracking-[0.12em] text-ink tabular-nums lining-nums">{code}</p>
      <p className="mt-3 text-[14px] leading-relaxed text-muted">
        Give or read this code to the patient. On the website they choose <span className="text-ink">Register</span>, then{" "}
        <span className="text-ink">I have a code from reception</span>, and set their own username and password. It works until{" "}
        {formatDate(String(expiresAt).slice(0, 10), { day: "numeric", month: "long" })} and is shown only now.
      </p>
    </div>
  );
}
