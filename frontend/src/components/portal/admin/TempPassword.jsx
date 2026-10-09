// A temporary password, shown once. The server keeps only its hash, and the person replaces it at first sign-in.
export default function TempPassword({ username, password }) {
  return (
    <div className="border border-champagne/60 bg-white p-5">
      <p className="text-[14px] text-muted">
        They sign in as <span className="text-ink">{username}</span> with:
      </p>
      <p className="mt-2 font-serif text-[34px] leading-none tracking-[0.08em] text-ink tabular-nums lining-nums">{password}</p>
      <p className="mt-3 text-[13px] leading-relaxed text-muted">Give it to them in person or by phone. It is shown only now, and they choose their own password when they first sign in.</p>
    </div>
  );
}
