// Date, time and working-hours helpers shared by the booking controllers

const isIsoDate = (v) => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);
const parseId = (v) => {
  const n = Number.parseInt(String(v), 10);
  return Number.isFinite(n) ? n : null;
};
const normalizeTimeToSql = (v) => {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  if (!s) return null;
  if (/^\d{2}:\d{2}:\d{2}$/.test(s)) return s;
  if (/^\d{2}:\d{2}$/.test(s)) return `${s}:00`;
  return null;
};
const to24Hour = (t) => {
  if (!t || typeof t !== "string") return "";
  const m = t.trim().match(/^(\d{1,2}):(\d{2})(?:\s*([AP]M))?$/i);
  if (!m) return "";
  let h = Number.parseInt(m[1], 10);
  const minutes = m[2];
  const mer = String(m[3] || "").toUpperCase();
  if (mer === "PM" && h < 12) h += 12;
  if (mer === "AM" && h === 12) h = 0;
  if (h < 0 || h > 23) return "";
  return `${String(h).padStart(2, "0")}:${minutes}`;
};
const toMinutes = (hhmm) => {
  const [hh, mm] = String(hhmm || "").split(":");
  const h = Number.parseInt(hh, 10);
  const m = Number.parseInt(mm, 10);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  return h * 60 + m;
};
const expandDayRange = (start, end) => {
  const order = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const si = order.indexOf(start);
  const ei = order.indexOf(end);
  if (si === -1 || ei === -1) return [];
  const days = [];
  let i = si;
  for (let guard = 0; guard < 8; guard++) {
    days.push(order[i]);
    if (i === ei) break;
    i = (i + 1) % 7;
  }
  return days;
};
const parseWorkingHoursText = (workingHours) => {
  if (!workingHours || typeof workingHours !== "string") {
    return { days: [], start: "09:00", end: "17:00" };
  }
  const timePattern = "\\d{1,2}:\\d{2}(?:\\s*[AP]M)?";
  const fullPattern = new RegExp(
    `^(.*?)(\\s+(${timePattern})\\s*-\\s*(${timePattern}))$`,
    "i",
  );
  const match = String(workingHours).trim().match(fullPattern);
  let daysPart = String(workingHours).trim();
  let startRaw = "";
  let endRaw = "";
  if (match) {
    daysPart = String(match[1] || "").trim();
    startRaw = match[3];
    endRaw = match[4];
  } else {
    const timeOnlyPattern = new RegExp(
      `^\\s*(${timePattern})\\s*-\\s*(${timePattern})\\s*$`,
      "i",
    );
    const m2 = String(workingHours).trim().match(timeOnlyPattern);
    if (m2) {
      daysPart = "";
      startRaw = m2[1];
      endRaw = m2[2];
    } else {
      const parts = String(workingHours).split(/\d{1,2}:\d{2}/);
      daysPart = String(parts[0] || "").trim();
    }
  }

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
  const normalizeDayToken = (s) => {
    const raw = String(s || "").trim();
    if (!raw) return "";
    const t = raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
    return map[t] || map[raw] || "";
  };

  const dayTokens = [];
  const items = String(daysPart || "")
    .split(",")
    .map((d) => d.trim())
    .filter(Boolean);
  for (const item of items) {
    const range = item.match(/^(.+?)\s*-\s*(.+?)$/);
    if (range) {
      const a = normalizeDayToken(range[1]);
      const b = normalizeDayToken(range[2]);
      const expanded = expandDayRange(a, b);
      if (expanded.length) {
        dayTokens.push(...expanded);
        continue;
      }
    }
    const d = normalizeDayToken(item);
    if (d) dayTokens.push(d);
  }

  const days = Array.from(new Set(dayTokens));
  const start = to24Hour(startRaw) || "09:00";
  const end = to24Hour(endRaw) || "17:00";
  return { days, start, end };
};

const isSlotAllowedByWorkingHours = (doctor, isoDate, sqlTime) => {
  const parsed = parseWorkingHoursText(doctor?.workingHours || "");
  const days = parsed.days || [];
  if (Array.isArray(days) && days.length > 0) {
    const dt = new Date(`${isoDate}T00:00:00`);
    const dayMap = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const dow = dayMap[dt.getDay()];
    if (!days.includes(dow)) {
      return {
        ok: false,
        message: `Doctor is not available on ${dow}`,
      };
    }
  }
  const startM = toMinutes(parsed.start);
  const endM = toMinutes(parsed.end);
  const slotM = toMinutes(String(sqlTime || "").slice(0, 5));
  if (startM !== null && endM !== null && slotM !== null && startM < endM) {
    if (slotM < startM || slotM >= endM) {
      return {
        ok: false,
        message: "Selected time is outside doctor's working hours",
      };
    }
  }
  return { ok: true };
};

module.exports = {
  isIsoDate,
  parseId,
  normalizeTimeToSql,
  isSlotAllowedByWorkingHours,
};
