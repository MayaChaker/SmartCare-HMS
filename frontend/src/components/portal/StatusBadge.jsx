// Visit status in words a patient understands, with a small dot whose colour matches its meaning
const STATUS = {
  scheduled: { label: "Booked", dot: "bg-forest" },
  "checked-in": { label: "Checked in", dot: "bg-champagne" },
  "in-progress": { label: "With the doctor", dot: "bg-champagne" },
  completed: { label: "Completed", dot: "bg-forest-soft" },
  cancelled: { label: "Cancelled", dot: "bg-muted/50" },
  "no-show": { label: "Missed", dot: "bg-alert" },
};

export default function StatusBadge({ status }) {
  const { label, dot } = STATUS[status] || { label: status, dot: "bg-muted/50" };
  return (
    <span className="inline-flex items-center gap-2 text-[14px] whitespace-nowrap text-ink">
      <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  );
}
