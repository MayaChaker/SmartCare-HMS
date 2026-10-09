// Visit status in words the reader understands, with a small dot whose colour matches its meaning.
// Patients, doctors and the front desk see the same steps from different sides, so each has its own words.
const STATUS = {
  scheduled: { patient: "Booked", doctor: "Booked", desk: "Booked", dot: "bg-forest" },
  "checked-in": { patient: "Checked in", doctor: "Waiting", desk: "Waiting", dot: "bg-champagne" },
  "in-progress": { patient: "With the doctor", doctor: "With you", desk: "With doctor", dot: "bg-champagne animate-pulse" },
  completed: { patient: "Completed", doctor: "Seen", desk: "Done", dot: "bg-forest-soft" },
  cancelled: { patient: "Cancelled", doctor: "Cancelled", desk: "Cancelled", dot: "bg-muted/50" },
  "no-show": { patient: "Missed", doctor: "Did not come", desk: "No-show", dot: "bg-alert" },
};

// `late` marks a booked visit whose time has passed without a check-in
export default function StatusBadge({ status, viewer = "patient", late = false }) {
  if (late) {
    return (
      <span className="inline-flex items-center gap-2 text-[14px] whitespace-nowrap text-alert">
        <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-alert" />
        Late
      </span>
    );
  }
  const entry = STATUS[status];
  const label = entry ? entry[viewer] : status;
  return (
    <span className="inline-flex items-center gap-2 text-[14px] whitespace-nowrap text-ink">
      <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full motion-reduce:animate-none ${entry?.dot || "bg-muted/50"}`} />
      {label}
    </span>
  );
}
