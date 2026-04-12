export const parseWorkingHours = (workingHours) => {
  if (!workingHours || typeof workingHours !== "string") {
    return { days: [], start: "", end: "", time: "" };
  }
  const timePattern = "\\d{1,2}:\\d{2}(?:\\s*[AP]M)?";
  const fullPattern = new RegExp(
    `^(.*?)(\\s+(${timePattern})\\s*-\\s*(${timePattern}))$`,
    "i"
  );
  const match = workingHours.match(fullPattern);
  let daysPart = workingHours;
  let startRaw = "";
  let endRaw = "";
  if (match) {
    daysPart = (match[1] || "").trim();
    startRaw = match[3];
    endRaw = match[4];
  } else {
    const timeOnlyPattern = new RegExp(
      `^\\s*(${timePattern})\\s*-\\s*(${timePattern})\\s*$`,
      "i"
    );
    const m2 = workingHours.match(timeOnlyPattern);
    if (m2) {
      daysPart = "";
      startRaw = m2[1];
      endRaw = m2[2];
    }
  }
  const to24Hour = (t) => {
    if (!t || typeof t !== "string") return "";
    const m = t.trim().match(/^(\d{1,2}):(\d{2})(?:\s*([AP]M))?$/i);
    if (!m) return "";
    let h = parseInt(m[1], 10);
    const minutes = m[2];
    const mer = (m[3] || "").toUpperCase();
    if (mer === "PM" && h < 12) h += 12;
    if (mer === "AM" && h === 12) h = 0;
    return `${String(h).padStart(2, "0")}:${minutes}`;
  };
  const days = daysPart
    .split(",")
    .map((d) => d.trim())
    .filter(Boolean);
  const start = to24Hour(startRaw) || "09:00";
  const end = to24Hour(endRaw) || "17:00";
  const time = start && end ? `${start} - ${end}` : "";
  return { days, start, end, time };
};

// Default slot size in minutes, configurable via Vite env `VITE_SLOT_MINUTES`
export const DEFAULT_SLOT_MINUTES =
  Number(import.meta.env?.VITE_SLOT_MINUTES) || 20;

// Generate discrete time slots between `start` and `end` inclusive of start, exclusive of end
// Times are in 24-hour "HH:MM" format; returns an array like ["09:00","09:20",...]
export const generateTimeSlots = (
  start,
  end,
  slotMinutes = DEFAULT_SLOT_MINUTES
) => {
  const slots = [];
  const toMinutes = (t) => {
    const [hh, mm] = String(t).split(":");
    return parseInt(hh, 10) * 60 + parseInt(mm, 10);
  };
  const pad = (n) => String(n).padStart(2, "0");
  const s = toMinutes(start);
  const e = toMinutes(end);
  if (isNaN(s) || isNaN(e) || s >= e) return slots;
  for (let m = s; m < e; m += slotMinutes) {
    const hh = Math.floor(m / 60);
    const mm = m % 60;
    slots.push(`${pad(hh)}:${pad(mm)}`);
  }
  return slots;
};

// Extract normalized day abbreviations from a working hours string
// Accepts ranges like "Mon - Fri" or lists like "Monday, Tuesday"
export const parseWorkingDays = (wh) => {
  const defaultDays = ["Mon", "Tue", "Wed", "Thu", "Fri"];
  if (!wh || typeof wh !== "string") return defaultDays;

  const daysPart = wh.split(/\d{2}:\d{2}/)[0]?.trim() || "";
  if (!daysPart) return defaultDays;

  const map = {
    Sunday: "Sun",
    Monday: "Mon",
    Tuesday: "Tue",
    Wednesday: "Wed",
    Thursday: "Thu",
    Friday: "Fri",
    Saturday: "Sat",
    Sun: "Sun",
    Mon: "Mon",
    Tue: "Tue",
    Wed: "Wed",
    Thu: "Thu",
    Fri: "Fri",
    Sat: "Sat",
  };

  if (/^Mon\s*-\s*Fri$/i.test(daysPart)) return defaultDays;

  const parts = daysPart
    .split(/,\s*/)
    .map((p) => p.trim())
    .filter(Boolean);

  const days = parts
    .map((p) => map[p] || p)
    .filter((d) =>
      ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].includes(d)
    );

  return days.length ? days : defaultDays;
};

// Enumerated appointment lifecycle statuses used across UI
export const APPOINTMENT_STATUSES = [
  "scheduled",
  "checked-in",
  "in-progress",
  "completed",
  "cancelled",
];

// Format "HH:MM" into localized time (e.g., "10:15 PM"), leveraging toHHMM normalization
export const formatTimeHHMM = (hhmm) => {
  const s = String(hhmm);
  const base = `1970-01-01T${toHHMM(s)}:00`;
  return new Date(base).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

// Normalize arbitrary time input into 24-hour "HH:MM"
// Supports "10:15 PM", "22:15", and rejects invalid inputs
export const normalizeTimeTo24 = (input) => {
  if (!input || typeof input !== "string") return "";
  const s = input.trim().toUpperCase();
  const m12 = s.match(/^([0-1]?\d):([0-5]\d)\s*([AP]M)$/);
  if (m12) {
    let hh = parseInt(m12[1], 10);
    const mm = m12[2];
    const ap = m12[3];
    if (ap === "PM" && hh !== 12) hh += 12;
    if (ap === "AM" && hh === 12) hh = 0;
    return `${String(hh).padStart(2, "0")}:${mm}`;
  }
  const m24 = s.match(/^([0-2]?\d):([0-5]\d)$/);
  if (m24) {
    let hh = parseInt(m24[1], 10);
    const mm = m24[2];
    if (hh > 23) return "";
    return `${String(hh).padStart(2, "0")}:${mm}`;
  }
  return "";
};

// Convert "HH:MM" to "H:MM AM/PM" without localization
export const formatTimeWithMeridiem = (hhmm) => {
  const [hStr, mStr] = String(hhmm || "").split(":");
  const h = parseInt(hStr, 10);
  if (Number.isNaN(h)) return hhmm;
  const meridiem = h < 12 ? "AM" : "PM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${mStr} ${meridiem}`;
};

// Ensure the provided time string conforms to "HH:MM"
export const toHHMM = (t) => String(t).slice(0, 5);

// Determine the best image URL for a doctor profile
// Handles absolute URLs and backend-served paths under `/uploads`
export const resolveDoctorImage = (doctorObj) => {
  const candidate = (
    doctorObj?.profileImage ||
    doctorObj?.photoUrl ||
    ""
  ).trim();
  if (!candidate) return "";
  const lc = candidate.toLowerCase();
  if (lc === "null" || lc === "undefined") return "";
  if (candidate.startsWith("/uploads/")) {
    return `http://localhost:5000${candidate}`;
  }
  return candidate;
};
