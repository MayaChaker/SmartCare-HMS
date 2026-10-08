import { pageHeadClass } from "./ui";

export default function PageHead({ title, intro, action }) {
  return (
    <div className={pageHeadClass}>
      <div className="min-w-0">
        <h1 className="font-serif text-5xl leading-none text-ink sm:text-6xl">{title}</h1>
        {intro && <p className="mt-4 max-w-xl text-[16px] leading-relaxed text-muted">{intro}</p>}
      </div>
      {action}
    </div>
  );
}
