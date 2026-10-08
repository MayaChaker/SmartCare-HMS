import { useState } from "react";
import DoctorAvatar from "../DoctorAvatar";
import StatusBadge from "../StatusBadge";
import CancelDialog from "../CancelDialog";
import { byDateTime, doctorName, doctorPhoto, formatDate, formatTime, isUpcoming, minutesBefore, relativeDay } from "../format";
import { arrivalNote, departmentPlace, patientOffice, services, whatToBring } from "../../../content/portal";
import { ui } from "../ui";

const greeting = () => {
  const hour = new Date().getHours();
  return hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
};

// The next visit as a pass: doctor, date, and what to know before coming
function VisitPass({ visit, doctor, onCancel, onReschedule }) {
  const [cancelling, setCancelling] = useState(false);
  const specialty = doctor?.specialization || visit.specialty;
  const photo = doctorPhoto(doctor);

  return (
    <section aria-labelledby="next-visit" className="relative -mt-20 border border-ivory-line bg-white lg:-mt-24">
      <div className={`grid ${photo ? "lg:grid-cols-[200px_minmax(0,1fr)_minmax(0,1fr)]" : "lg:grid-cols-2"}`}>
        {photo && <img src={photo} alt={doctorName(doctor)} className="photo-grade hidden h-full w-full object-cover object-top lg:block" />}
        <div className="min-w-0 p-6 sm:p-8 lg:p-10">
          <p id="next-visit" className="text-[14px] text-champagne">
            Your next visit · {relativeDay(visit.appointmentDate)}
          </p>
          <div className="mt-4 flex items-end gap-5">
            <p className="font-serif text-[64px] leading-[0.8] text-ink">{formatDate(visit.appointmentDate, { day: "numeric" })}</p>
            <div className="pb-1 leading-tight">
              <p className="text-[17px] text-ink">{formatDate(visit.appointmentDate, { weekday: "long" })}</p>
              <p className="text-[17px] text-muted">
                {formatDate(visit.appointmentDate, { month: "long" })} · {formatTime(visit.appointmentTime)}
              </p>
            </div>
          </div>
          <div className="mt-7 flex items-center gap-4 border-t border-ivory-line pt-6">
            <span className="lg:hidden">
              <DoctorAvatar doctor={doctor} size={56} />
            </span>
            <div className="min-w-0">
              <p className="font-serif text-3xl leading-tight text-ink">{doctor ? doctorName(doctor) : visit.doctorName}</p>
              <p className="text-[15px] text-muted">
                {specialty}
                {visit.reason ? ` · ${visit.reason}` : ""}
              </p>
            </div>
          </div>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <StatusBadge status={visit.status} />
            {visit.status === "scheduled" && (
              <>
                <span aria-hidden="true" className="mx-2 hidden h-4 w-px bg-ivory-line sm:block" />
                <button type="button" onClick={() => onReschedule(visit)} className={ui.outline}>
                  Reschedule
                </button>
                <button type="button" onClick={() => setCancelling(true)} className={ui.outline}>
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>
        <div className="min-w-0 border-t border-ivory-line bg-ivory/50 p-6 sm:p-8 lg:border-t-0 lg:border-l lg:p-10">
          <h3 className="font-serif text-2xl text-ink">Before you come</h3>
          <dl className="mt-5 grid gap-5 text-[15px]">
            <div>
              <dt className="text-[13px] text-muted">Where</dt>
              <dd className="mt-0.5">
                {departmentPlace(specialty)}
                <br />
                <span className="text-muted">{arrivalNote}</span>
              </dd>
            </div>
            <div>
              <dt className="text-[13px] text-muted">Arrive by</dt>
              <dd className="mt-0.5">{minutesBefore(visit.appointmentTime, 15)}, to check in at reception</dd>
            </div>
            <div>
              <dt className="text-[13px] text-muted">Bring</dt>
              <dd className="mt-0.5">{whatToBring}</dd>
            </div>
          </dl>
        </div>
      </div>
      {cancelling && <CancelDialog appointment={visit} doctor={doctor} onCancel={onCancel} onClose={() => setCancelling(false)} />}
    </section>
  );
}

export default function HomeSection({ portal, findDoctor, onReschedule }) {
  const [next, ...later] = portal.appointments.filter(isUpcoming).sort(byDateTime);
  const nextDoctor = next && findDoctor(next.doctorId);
  const latest = portal.records[0];

  return (
    <>
      <section className="relative overflow-hidden bg-forest-deep text-ivory">
        <img src="/images/site/corridor.jpg" alt="" className="photo-grade absolute inset-0 h-full w-full animate-settle object-cover object-[50%_45%] motion-reduce:animate-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-forest-deep via-forest-deep/75 to-forest-deep/10" />
        <div className={`${ui.page} relative pt-14 pb-32 lg:pt-20 lg:pb-40`}>
          <p className="text-[15px] text-ivory/70">
            {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
          <h1 className="mt-3 max-w-3xl font-serif text-[44px] leading-[1.05] sm:text-6xl lg:text-7xl">
            {greeting()}, {portal.profile.firstName || "welcome"}.
          </h1>
          <p className="mt-5 max-w-xl text-[17px] leading-relaxed text-ivory/80">
            {next
              ? `Your next visit is ${relativeDay(next.appointmentDate).toLowerCase()} at ${formatTime(next.appointmentTime)} with ${nextDoctor ? doctorName(nextDoctor) : next.doctorName}. We have everything ready for you.`
              : "You have no upcoming visits. Our specialists are here when you need them."}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#book" className={ui.gold}>
              Book a visit
            </a>
            <a href="#records" className={ui.outlineLight}>
              Read your records
            </a>
          </div>
        </div>
      </section>

      <div className={ui.page}>
        {next ? (
          <VisitPass visit={next} doctor={nextDoctor} onCancel={portal.cancel} onReschedule={onReschedule} />
        ) : (
          <div className="relative -mt-20 border border-ivory-line bg-white p-8 lg:-mt-24 lg:p-10">
            <p className="font-serif text-3xl text-ink">No visits booked</p>
            <p className="mt-2 text-[16px] text-muted">Choose a specialist and a time that suits you. It takes about a minute.</p>
            <a href="#book" className={`${ui.primary} mt-6`}>
              Book a visit
            </a>
          </div>
        )}

        <div className="grid gap-14 py-16 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-20 lg:py-24">
          <div className="min-w-0">
            <section aria-labelledby="last-visit">
              <div className="flex flex-wrap items-end justify-between gap-3 border-b border-ivory-line pb-4">
                <h2 id="last-visit" className="font-serif text-4xl text-ink">
                  From your last visit
                </h2>
                {latest && (
                  <a href="#records" className={ui.link}>
                    All records
                  </a>
                )}
              </div>
              {latest ? (
                <article className="pt-8">
                  <p className="text-[14px] text-muted">
                    {formatDate(latest.visitDate, { day: "numeric", month: "long", year: "numeric" })} · {doctorName(latest.Doctor)}
                    {latest.Doctor?.specialization ? `, ${latest.Doctor.specialization}` : ""}
                  </p>
                  <h3 className="mt-2 font-serif text-3xl text-ink">{latest.diagnosis || "Visit summary"}</h3>
                  {latest.notes && <p className="mt-3 max-w-2xl text-[16px] leading-relaxed text-ink/85">{latest.notes}</p>}
                  {(latest.treatment || latest.prescriptions || latest.medications) && (
                    <dl className="mt-6 grid gap-x-10 gap-y-4 border-t border-ivory-line pt-5 sm:grid-cols-2">
                      {latest.treatment && (
                        <div>
                          <dt className="text-[13px] text-muted">Your treatment</dt>
                          <dd className="mt-1 text-[15px] whitespace-pre-line">{latest.treatment}</dd>
                        </div>
                      )}
                      {(latest.prescriptions || latest.medications) && (
                        <div>
                          <dt className="text-[13px] text-muted">Your medicine</dt>
                          <dd className="mt-1 text-[15px] whitespace-pre-line">{latest.prescriptions || latest.medications}</dd>
                        </div>
                      )}
                    </dl>
                  )}
                </article>
              ) : (
                <p className="pt-8 text-[16px] text-muted">After each visit, your doctor's summary will appear here.</p>
              )}
            </section>

            {later.length > 0 && (
              <section aria-labelledby="coming-up" className="mt-16">
                <div className="flex flex-wrap items-end justify-between gap-3 border-b border-ivory-line pb-4">
                  <h2 id="coming-up" className="font-serif text-4xl text-ink">
                    Also coming up
                  </h2>
                  <a href="#visits" className={ui.link}>
                    All visits
                  </a>
                </div>
                <ol>
                  {later.slice(0, 3).map((v) => {
                    const doctor = findDoctor(v.doctorId);
                    return (
                      <li key={v.id} className="grid grid-cols-[56px_minmax(0,1fr)] items-center gap-5 border-b border-ivory-line py-6 sm:grid-cols-[56px_minmax(0,1fr)_auto]">
                        <DoctorAvatar doctor={doctor} size={56} />
                        <div className="min-w-0">
                          <p className="font-serif text-[24px] leading-tight text-ink">{doctor ? doctorName(doctor) : v.doctorName}</p>
                          <p className="text-[15px] text-muted">
                            {doctor?.specialization || v.specialty}
                            {v.reason ? ` · ${v.reason}` : ""}
                          </p>
                        </div>
                        <p className="col-span-2 text-[15px] text-ink sm:col-span-1 sm:text-right">
                          {formatDate(v.appointmentDate, { weekday: "short", day: "numeric", month: "short" })}
                          <span className="sm:hidden"> · </span>
                          <span className="text-muted sm:block">{formatTime(v.appointmentTime)}</span>
                        </p>
                      </li>
                    );
                  })}
                </ol>
              </section>
            )}
          </div>

          <aside aria-labelledby="office" className="min-w-0">
            <div className="bg-forest p-8 text-ivory">
              <h2 id="office" className="font-serif text-3xl">
                Private Patient Office
              </h2>
              <p className="mt-3 text-[15px] leading-relaxed text-ivory/75">
                Your coordinators arrange visits, transport, interpreters and insurance approvals, so you only have to arrive.
              </p>
              <dl className="mt-6 grid gap-4 border-t border-ivory/15 pt-5 text-[15px]">
                {[
                  ["WhatsApp", patientOffice.whatsapp],
                  ["Phone", patientOffice.phone],
                  ["Hours", patientOffice.hours],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between gap-4">
                    <dt className="text-ivory/60">{label}</dt>
                    <dd className="text-right tabular-nums">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <h3 className="mt-10 font-serif text-2xl text-ink">Arranged for you</h3>
            <p className="mt-1 text-[14px] text-muted">Message the Private Patient Office to arrange any of these.</p>
            <ul className="mt-3 divide-y divide-ivory-line border-y border-ivory-line">
              {services.map((s) => (
                <li key={s.title} className="py-4">
                  <p className="text-[16px] text-ink">{s.title}</p>
                  <p className="mt-0.5 text-[14px] text-muted">{s.text}</p>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </div>
    </>
  );
}
