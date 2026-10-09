import { hasVisitTimePassed } from "../../../utils/schedule";

export const personName = (person) => [person?.firstName, person?.lastName].filter(Boolean).join(" ") || "Patient";

export const shortDoctorName = (doctor) => (doctor ? `Dr ${doctor.firstName || ""} ${doctor.lastName || ""}`.trim() : "Doctor");

// A booked visit whose time has passed without a check-in
export const isLate = (visit) => visit.status === "scheduled" && hasVisitTimePassed(visit.appointmentDate, visit.appointmentTime);

// Minutes from a visit's start until `now` (negative before it starts)
export const minutesPast = (visit, now) => Math.round((now - new Date(`${visit.appointmentDate}T${String(visit.appointmentTime).slice(0, 8)}`)) / 60000);

// Colours on the board and in its legend, by state
export const TONE = {
  scheduled: "border-l-2 border-forest bg-white text-ink",
  late: "border-l-2 border-alert bg-white text-ink",
  "checked-in": "border-l-2 border-champagne bg-champagne/25 text-ink",
  "in-progress": "bg-forest text-ivory",
  completed: "bg-ivory-warm text-muted",
  "no-show": "bg-white text-muted line-through",
};
export const LEGEND = [
  ["Booked", TONE.scheduled],
  ["Late", TONE.late],
  ["Waiting", TONE["checked-in"]],
  ["With doctor", TONE["in-progress"]],
  ["Done", TONE.completed],
];
export const toneOf = (visit) => (isLate(visit) ? TONE.late : TONE[visit.status] || TONE.scheduled);
