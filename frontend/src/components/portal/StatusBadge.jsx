// Visit status in words the reader understands, with a small dot whose colour matches its meaning.
// Patients and doctors see the same steps from different sides, so each has its own words.
const STATUS = {
  scheduled: { patient: "Booked", doctor: "Booked", dot: "bg-forest" },
  "checked-in": { patient: "Checked in", doctor: "Waiting", dot: "bg-champagne" },
  "in-progress": { patient: "With the doctor", doctor: "With you", dot: "bg-champagne animate-pulse" },
  completed: { patient: "Completed", doctor: "Seen", dot: "bg-forest-soft" },
  cancelled: { patient: "Cancelled", doctor: "Cancelled", dot: "bg-muted/50" },
  "no-show": { patient: "Missed", doctor: "Did not come", dot: "bg-alert" },
};

export default function StatusBadge({ status, viewer = "patient" }) {
  const entry = STATUS[status];
  const label = entry ? entry[viewer] : status;
  return (
    <span className="inline-flex items-center gap-2 text-[14px] whitespace-nowrap text-ink">
      <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full motion-reduce:animate-none ${entry?.dot || "bg-muted/50"}`} />
      {label}
    </span>
  );
}
