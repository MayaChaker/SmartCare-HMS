import { formatTimeWithMeridiem, parseWorkingDayKeys, parseWorkingHours, toLocalDateString } from "../../../utils/schedule";
import { toDate } from "../format";

export const patientName = (patient) => [patient?.firstName, patient?.lastName].filter(Boolean).join(" ") || "Patient";

export const initials = (patient) => `${patient?.firstName?.[0] || ""}${patient?.lastName?.[0] || ""}` || "P";

// Full years since the date of birth
export const ageOf = (dateOfBirth, today = new Date()) => {
  if (!dateOfBirth) return null;
  const born = toDate(dateOfBirth);
  let age = today.getFullYear() - born.getFullYear();
  if (today < new Date(today.getFullYear(), born.getMonth(), born.getDate())) age -= 1;
  return age;
};

// "42 · Female" from what is known about the patient
export const patientFacts = (patient) => [ageOf(patient?.dateOfBirth), patient?.gender].filter(Boolean).join(" · ");

export const minutesSince = (moment, now) => (moment ? Math.max(0, Math.round((now - new Date(moment)) / 60000)) : null);

export const isToday = (ymd, now = new Date()) => String(ymd).slice(0, 10) === toLocalDateString(now);

export const byTime = (a, b) => `${a.appointmentDate} ${a.appointmentTime}`.localeCompare(`${b.appointmentDate} ${b.appointmentTime}`);

// A prescription is stored as text, one medicine per line: "Medicine, dose, how often, how long"
export const prescriptionToRows = (text) => {
  const lines = String(text || "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const rows = lines.map((line) => {
    const parts = line.split(",").map((p) => p.trim());
    return parts.length === 4 ? parts : [line, "", "", ""];
  });
  return rows.length ? rows : [["", "", "", ""]];
};

export const rowsToPrescription = (rows) =>
  rows
    .filter((r) => r[0].trim())
    .map((r) => r.map((c) => c.trim()).filter(Boolean).join(", "))
    .join("\n");

// Follow-up choices, saved as a date counted from the visit
export const FOLLOW_UPS = [
  ["", "No follow-up"],
  ["14d", "2 weeks"],
  ["1m", "1 month"],
  ["3m", "3 months"],
  ["6m", "6 months"],
];
export const followUpDate = (visitDate, choice) => {
  if (!choice) return null;
  const d = toDate(visitDate);
  if (choice.endsWith("d")) d.setDate(d.getDate() + parseInt(choice, 10));
  else d.setMonth(d.getMonth() + parseInt(choice, 10));
  return toLocalDateString(d);
};

// Working hours text <-> the form on the profile page
export const WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
export const readHours = (workingHours) => {
  const { start, end } = parseWorkingHours(workingHours || "");
  return { days: parseWorkingDayKeys(workingHours || ""), from: start || "09:00", to: end || "17:00" };
};
export const writeHours = ({ days, from, to }) =>
  `${WEEK.filter((d) => days.includes(d)).join(", ")} ${formatTimeWithMeridiem(from)} - ${formatTimeWithMeridiem(to)}`;

// A moment (Date or ISO string) as "10:03 AM" on the user's clock
export const clockTime = (moment) => new Date(moment).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
