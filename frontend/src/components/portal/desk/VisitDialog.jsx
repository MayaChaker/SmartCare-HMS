import { useState } from "react";
import Modal from "../Modal";
import StatusBadge from "../StatusBadge";
import { doctorName, formatDate, formatTime } from "../format";
import { departmentPlace } from "../../../content/portal";
import { ui } from "../ui";
import { clockTime } from "../doctor/chart";
import { AllergyNote } from "../doctor/PatientChart";
import { isLate, personName } from "./desk";

// One visit at the desk: who, when, where, and what the desk can do with it now
export default function VisitDialog({ visit, desk, onMove, onDone, onClose, checkInMessage }) {
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [confirmCancel, setConfirmCancel] = useState(false);
  const p = visit.Patient || {};
  const late = isLate(visit);

  const run = async (kind, request, message) => {
    setBusy(kind);
    setError("");
    const result = await request(visit.id);
    setBusy("");
    if (result.success) {
      onDone(message);
      onClose();
    } else setError(result.message);
  };

  return (
    <Modal title={personName(p)} onClose={onClose}>
      <p className="-mt-4 text-[15px] text-muted">{[p.phone, p.insurance].filter(Boolean).join(" · ")}</p>
      <AllergyNote allergies={p.allergies} className="mt-5" />

      <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-ivory-line pt-5 text-[15px]">
        <div>
          <dt className="text-[13px] text-muted">Time</dt>
          <dd className="tabular-nums">
            {formatDate(visit.appointmentDate, { weekday: "short", day: "numeric", month: "short" })}, {formatTime(visit.appointmentTime)}
          </dd>
        </div>
        <div>
          <dt className="text-[13px] text-muted">Status</dt>
          <dd>
            <StatusBadge status={visit.status} viewer="desk" late={late} />
          </dd>
        </div>
        <div>
          <dt className="text-[13px] text-muted">Doctor</dt>
          <dd>{doctorName(visit.Doctor)}</dd>
        </div>
        <div>
          <dt className="text-[13px] text-muted">Where</dt>
          <dd>{departmentPlace(visit.Doctor?.specialization)}</dd>
        </div>
        {visit.reason && (
          <div className="col-span-2">
            <dt className="text-[13px] text-muted">Reason</dt>
            <dd>{visit.reason}</dd>
          </div>
        )}
        {visit.checkedInAt && (
          <div className="col-span-2">
            <dt className="text-[13px] text-muted">Arrived</dt>
            <dd className="tabular-nums">{clockTime(visit.checkedInAt)}</dd>
          </div>
        )}
      </dl>

      {error && (
        <p role="alert" className="mt-5 text-[15px] text-alert">
          {error}
        </p>
      )}

      {confirmCancel ? (
        <div className="mt-8 border-t border-ivory-line pt-5">
          <p className="text-[16px]">Cancel this visit? The time is offered to other patients straight away.</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button type="button" onClick={() => run("cancel", desk.cancel, `Visit for ${personName(p)} cancelled. The time is free again.`)} disabled={Boolean(busy)} className={ui.primary}>
              {busy === "cancel" ? "Cancelling…" : "Yes, cancel visit"}
            </button>
            <button type="button" onClick={() => setConfirmCancel(false)} className={ui.outline}>
              Keep visit
            </button>
          </div>
        </div>
      ) : (
        visit.status === "scheduled" && (
          <div className="mt-8 flex flex-wrap gap-3">
            <button type="button" onClick={() => run("checkin", desk.checkIn, checkInMessage(visit))} disabled={Boolean(busy)} className={ui.primary}>
              {busy === "checkin" ? "Checking in…" : "Check in"}
            </button>
            {late && (
              <button type="button" onClick={() => run("noshow", desk.markNoShow, `${personName(p)} marked as no-show.`)} disabled={Boolean(busy)} className={ui.outline}>
                Mark as no-show
              </button>
            )}
            <button type="button" onClick={() => onMove(visit)} className={ui.outline}>
              Move
            </button>
            <button type="button" onClick={() => setConfirmCancel(true)} className={ui.outline}>
              Cancel visit
            </button>
          </div>
        )
      )}
      {visit.status !== "scheduled" && <p className="mt-8 text-[15px] text-muted">Nothing to do at the desk for this visit.</p>}
    </Modal>
  );
}
