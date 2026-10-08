import { resolveUploadUrl } from "./api";

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

const DAY_KEYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// "Monday", "mon" and "Mon" all map to "Mon"
const toDayKey = (token) => {
  const prefix = String(token || "").trim().slice(0, 3).toLowerCase();
  return DAY_KEYS.find((d) => d.toLowerCase() === prefix) || "";
};

// Working days as day keys, e.g. "Mon - Wed, Fri 09:00 - 17:00" -> ["Mon", "Tue", "Wed", "Fri"].
// An empty list means no days were set, which the backend treats as every day.
export const parseWorkingDayKeys = (workingHours) => {
  const keys = [];
  parseWorkingHours(workingHours).days.forEach((item) => {
    const range = item.match(/^(.+?)\s*-\s*(.+)$/);
    const from = range ? DAY_KEYS.indexOf(toDayKey(range[1])) : -1;
    const to = range ? DAY_KEYS.indexOf(toDayKey(range[2])) : -1;
    if (from !== -1 && to !== -1) {
      for (let i = from; ; i = (i + 1) % 7) {
        keys.push(DAY_KEYS[i]);
        if (i === to) break;
      }
      return;
    }
    const key = toDayKey(item);
    if (key) keys.push(key);
  });
  return [...new Set(keys)];
};

// YYYY-MM-DD in the user's timezone (toISOString would shift it to UTC)
export const toLocalDateString = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;

// Dates from today on which the doctor works
export const getWorkingDates = (workingHours, daysAhead = 30) => {
  const keys = parseWorkingDayKeys(workingHours);
  const today = new Date();
  const dates = [];
  for (let i = 0; i < daysAhead; i++) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i);
    if (keys.length === 0 || keys.includes(DAY_KEYS[d.getDay()])) {
      dates.push(toLocalDateString(d));
    }
  }
  return dates;
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

// Enumerated appointment lifecycle statuses used across UI
export const APPOINTMENT_STATUSES = [
  "scheduled",
  "checked-in",
  "in-progress",
  "completed",
  "cancelled",
  "no-show",
];

// True once the visit's date and time are behind us (a no-show can only be recorded then)
export const hasVisitTimePassed = (date, time) => {
  if (!date || !time) return false;
  const start = new Date(`${String(date).slice(0, 10)}T${String(time).slice(0, 8)}`);
  return !Number.isNaN(start.getTime()) && start <= new Date();
};

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
    return resolveUploadUrl(candidate);
  }
  return candidate;
};
