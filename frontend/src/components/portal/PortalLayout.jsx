import { useNavigate } from "react-router-dom";
import "../../styles/site.css";
import Logo from "../site/Logo";
import { useAuth } from "../../context/useAuth";
import { contact } from "../../content/site";
import { ui } from "./ui";
import DoctorAvatar from "./DoctorAvatar";

// Line icons for the phone tab bar, drawn on a 24px grid
const ICONS = {
  home: <path d="M4 11.5 12 5l8 6.5V20h-5v-5H9v5H4z" />,
  visits: (
    <>
      <rect x="4" y="5.5" width="16" height="14.5" rx="1" />
      <path d="M4 10h16M8.5 3.5v4M15.5 3.5v4" />
    </>
  ),
  book: <path d="M12 5v14M5 12h14" />,
  records: (
    <>
      <path d="M7 3.5h7l4 4V20.5H7z" />
      <path d="M14 3.5v4h4M9.5 12h6M9.5 15.5h6" />
    </>
  ),
  today: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  schedule: (
    <>
      <rect x="4" y="5.5" width="16" height="14.5" rx="1" />
      <path d="M4 10h16M8.5 3.5v4M15.5 3.5v4" />
    </>
  ),
  patients: (
    <>
      <circle cx="9" cy="8.5" r="3.2" />
      <path d="M3.5 19c.6-3.2 2.8-5 5.5-5s4.9 1.8 5.5 5M15.5 5.5a3 3 0 0 1 0 6M17.5 14.3c1.6.6 2.7 2.2 3 4.7" />
    </>
  ),
  overview: <path d="M4 20V10M10 20V4M16 20v-7M21 20H3" />,
  activity: <path d="M4 6h16M4 12h16M4 18h10" />,
  doctors: (
    <>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c.8-3.6 3.6-5.5 7-5.5s6.2 1.9 7 5.5M12 15v3M10.5 16.5h3" />
    </>
  ),
  staff: (
    <>
      <circle cx="9" cy="8.5" r="3.2" />
      <path d="M3.5 19c.6-3.2 2.8-5 5.5-5s4.9 1.8 5.5 5M15.5 5.5a3 3 0 0 1 0 6M17.5 14.3c1.6.6 2.7 2.2 3 4.7" />
    </>
  ),
  desk: (
    <>
      <rect x="4" y="5" width="16" height="15" rx="1" />
      <path d="M4 10h16M10 10v10" />
    </>
  ),
  profile: (
    <>
      <circle cx="12" cy="8.5" r="3.5" />
      <path d="M5 20c.8-3.6 3.6-5.5 7-5.5s6.2 1.9 7 5.5" />
    </>
  ),
};

// App shell for signed-in people: a top bar on large screens, a tab bar at the bottom on phones.
// Sections are plain links to "#id", so the browser's back button moves between them.
// `strip` is the short line above the bar on large screens (who to call); `photo` is an optional person to show.
export default function PortalLayout({ sections, active, userName, userDetail, photo, strip, homeLabel = "home", children }) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const signOut = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="site min-h-screen pb-24 lg:pb-0">
      <header className="sticky top-0 z-40 bg-forest-deep text-ivory">
        <div className="hidden border-b border-ivory/10 lg:block">
          <div className={`${ui.page} flex items-center justify-between py-2 text-[13px] text-ivory/65`}>
            <p>{strip}</p>
            <p>
              Emergency 24/7 · <span className="text-ivory tabular-nums">{contact.emergency}</span>
            </p>
          </div>
        </div>
        <div className={`${ui.page} flex items-center justify-between gap-6 py-4`}>
          <a href={`#${sections[0].id}`} aria-label={`SmartCare, ${homeLabel}`}>
            <Logo />
          </a>
          <nav aria-label="Portal" className="hidden items-center gap-9 lg:flex">
            {sections.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                aria-current={s.id === active ? "page" : undefined}
                className={`border-b py-1 text-[15px] transition-colors ${
                  s.id === active ? "border-champagne text-ivory" : "border-transparent text-ivory/65 hover:text-ivory"
                }`}
              >
                {s.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-5">
            {photo && (
              <span className="hidden sm:block">
                <DoctorAvatar doctor={photo} size={36} />
              </span>
            )}
            <div className={`hidden leading-tight sm:block ${photo ? "text-left" : "text-right"}`}>
              <p className="text-[15px]">{userName}</p>
              {userDetail && <p className="text-[12px] text-ivory/60 tabular-nums">{userDetail}</p>}
            </div>
            <button type="button" onClick={signOut} className="text-[14px] text-ivory/70 underline-offset-4 hover:text-ivory hover:underline">
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main>{children}</main>

      <nav
        aria-label="Portal"
        style={{ gridTemplateColumns: `repeat(${sections.length}, minmax(0, 1fr))` }}
        className="fixed inset-x-0 bottom-0 z-40 grid border-t border-ivory/10 bg-forest-deep pb-[env(safe-area-inset-bottom)] text-ivory lg:hidden"
      >
        {sections.map((s) => {
          const on = s.id === active;
          return (
            <a
              key={s.id}
              href={`#${s.id}`}
              aria-current={on ? "page" : undefined}
              className={`grid place-items-center gap-1 pt-2.5 pb-2 text-[11px] ${on ? "text-ivory" : "text-ivory/55"}`}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={on ? "#d9c6a1" : "currentColor"} strokeWidth="1.4" aria-hidden="true">
                {ICONS[s.id]}
              </svg>
              {s.short || s.label}
            </a>
          );
        })}
      </nav>
    </div>
  );
}
