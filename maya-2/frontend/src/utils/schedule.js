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

export const generateTimeSlots = (start, end, slotMinutes = 30) => {
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
