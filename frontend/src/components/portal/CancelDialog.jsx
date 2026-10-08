import { useState } from "react";
import Modal from "./Modal";
import { doctorName, formatDate, formatTime } from "./format";
import { ui } from "./ui";

// Asks before cancelling a visit and shows the server's message if it fails
export default function CancelDialog({ appointment, doctor, onCancel, onClose }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const confirm = async () => {
    setBusy(true);
    setError("");
    const result = await onCancel(appointment.id);
    setBusy(false);
    if (result.success) onClose();
    else setError(result.message || "We could not cancel this visit. Please try again.");
  };

  return (
    <Modal title="Cancel this visit?" onClose={onClose}>
      <p className="text-[16px] leading-relaxed text-muted">
        {doctor ? doctorName(doctor) : appointment.doctorName}, {formatDate(appointment.appointmentDate, { weekday: "long", day: "numeric", month: "long" })} at{" "}
        {formatTime(appointment.appointmentTime)}. The time will be offered to another patient.
      </p>
      {error && (
        <p role="alert" className="mt-4 text-[15px] text-alert">
          {error}
        </p>
      )}
      <div className="mt-8 flex flex-wrap justify-end gap-3">
        <button type="button" onClick={onClose} className={ui.outline}>
          Keep visit
        </button>
        <button type="button" onClick={confirm} disabled={busy} className={ui.primary}>
          {busy ? "Cancelling…" : "Cancel visit"}
        </button>
      </div>
    </Modal>
  );
}
