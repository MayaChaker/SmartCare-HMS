import { formatTimeWithMeridiem, hasVisitTimePassed, resolveDoctorImage, toHHMM, toLocalDateString } from "../../utils/schedule";

// "2026-10-16" -> Date at local midnight (never shifted by time zone)
export const toDate = (ymd) => {
  const [y, m, d] = String(ymd).slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d);
};

// "2026-10-16" -> "Thu 16 Oct 2026"
export const formatDate = (ymd, options = { weekday: "short", day: "numeric", month: "short", year: "numeric" }) =>
  ymd ? toDate(ymd).toLocaleDateString("en-GB", options) : "";

export const formatTime = (time) => (time ? formatTimeWithMeridiem(toHHMM(time)) : "");

// Days from today: 0 = today, 1 = tomorrow
export const daysFromToday = (ymd) => Math.round((toDate(ymd) - toDate(toLocalDateString(new Date()))) / 864e5);

// "Today", "Tomorrow", "In 5 days"
export const relativeDay = (ymd) => {
  const n = daysFromToday(ymd);
  return n === 0 ? "Today" : n === 1 ? "Tomorrow" : `In ${n} days`;
};

// "HH:MM" minus some minutes, e.g. the time to arrive before a visit
export const minutesBefore = (time, minutes) => {
  const [h, m] = toHHMM(time).split(":").map(Number);
  const total = h * 60 + m - minutes;
  return formatTime(`${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`);
};

export const doctorName = (doctor) =>
  doctor ? `Dr. ${`${doctor.firstName || ""} ${doctor.lastName || ""}`.trim()}` : "Your doctor";

export const doctorPhoto = (doctor) => resolveDoctorImage(doctor);

// Patient number as printed on the patient card: 218 -> "SC 000 218"
export const patientNumber = (id) => {
  const digits = String(id || 0).padStart(6, "0");
  return `SC ${digits.slice(0, 3)} ${digits.slice(3)}`;
};

// Visits that still lie ahead or are happening now
const OPEN_STATUSES = ["scheduled", "checked-in", "in-progress"];
export const isUpcoming = (appointment) =>
  OPEN_STATUSES.includes(appointment.status) &&
  (appointment.status !== "scheduled" || !hasVisitTimePassed(appointment.appointmentDate, appointment.appointmentTime));

export const byDateTime = (a, b) =>
  `${a.appointmentDate} ${a.appointmentTime}`.localeCompare(`${b.appointmentDate} ${b.appointmentTime}`);
