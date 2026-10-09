import { useEffect, useState } from "react";
import PageHead from "../PageHead";
import { formatDate, formatTime } from "../format";
import { ui } from "../ui";
import PatientChart, { PatientInitials } from "./PatientChart";
import { ageOf, byTime, patientName } from "./chart";
import { toLocalDateString } from "../../../utils/schedule";

const OPEN = ["scheduled", "checked-in", "in-progress"];

export default function PatientsSection({ portal, now, focusPatientId }) {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState(focusPatientId || null);
  const [records, setRecords] = useState(null);
  const today = toLocalDateString(now);

  const rows = portal.patients
    .map((p) => {
      const visits = portal.appointments.filter((a) => a.Patient?.id === p.id).sort(byTime);
      return {
        patient: p,
        last: visits.filter((a) => a.status === "completed").pop(),
        next: visits.find((a) => OPEN.includes(a.status) && a.appointmentDate >= today),
      };
    })
    .filter(({ patient }) => patientName(patient).toLowerCase().includes(search.trim().toLowerCase()))
    .sort((a, b) => patientName(a.patient).localeCompare(patientName(b.patient)));

  const selected = portal.patients.find((p) => p.id === selectedId) || rows[0]?.patient;

  useEffect(() => {
    if (!selected?.id) return undefined;
    let cancelled = false;
    setRecords(null);
    portal.getPatient(selected.id).then((result) => {
      if (!cancelled) setRecords(result.success ? result.data.medicalRecords : []);
    });
    return () => {
      cancelled = true;
    };
    // portal.getPatient is a stable API function
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.id]);

  return (
    <>
      <PageHead title="Patients" intro="Everyone who has booked with you. Their chart shows allergies, medicines and every visit summary." />
      <div className={`${ui.page} grid grid-cols-1 gap-12 pb-24 lg:grid-cols-[minmax(0,1fr)_420px] lg:gap-16`}>
        <div className="min-w-0">
          <label htmlFor="patient-search" className="text-[14px] font-medium text-ink">
            Search
          </label>
          <input id="patient-search" type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Patient's name" className={`${ui.input} mt-2 h-12`} />

          {rows.length === 0 ? (
            <p className="py-10 text-[16px] text-muted">{portal.patients.length ? "No patient matches your search." : "Patients appear here once they book with you."}</p>
          ) : (
            <div className="mt-6 overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-[15px]">
                <thead>
                  <tr className="border-b border-ivory-line text-[13px] text-muted">
                    <th className="py-3 font-normal">Patient</th>
                    <th className="py-3 font-normal">Age</th>
                    <th className="py-3 font-normal">Last visit</th>
                    <th className="py-3 font-normal">Next visit</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(({ patient, last, next }) => (
                    <tr key={patient.id} className={`border-b border-ivory-line ${patient.id === selected?.id ? "bg-white" : "hover:bg-white/60"}`}>
                      <td className="py-4 pr-4">
                        <button
                          type="button"
                          onClick={() => setSelectedId(patient.id)}
                          aria-current={patient.id === selected?.id ? "true" : undefined}
                          className="flex items-center gap-3 text-left"
                        >
                          <PatientInitials patient={patient} size={40} />
                          <span>
                            <span className="block font-serif text-[22px] leading-tight text-ink">{patientName(patient)}</span>
                            {patient.allergies ? (
                              <span className="text-[13px] text-alert">Allergy: {patient.allergies}</span>
                            ) : (
                              <span className="text-[13px] text-muted">{patient.gender || " "}</span>
                            )}
                          </span>
                        </button>
                      </td>
                      <td className="py-4 pr-4 tabular-nums">{ageOf(patient.dateOfBirth, now) ?? "–"}</td>
                      <td className="py-4 pr-4">{last ? formatDate(last.appointmentDate, { day: "numeric", month: "short" }) : <span className="text-muted">None</span>}</td>
                      <td className="py-4">
                        {next ? (
                          `${formatDate(next.appointmentDate, { weekday: "short", day: "numeric", month: "short" })}, ${formatTime(next.appointmentTime)}`
                        ) : (
                          <span className="text-muted">None</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {selected && (
          <aside aria-label="Patient chart" className="min-w-0 border border-ivory-line bg-white p-6 sm:p-8 lg:sticky lg:top-40 lg:self-start">
            <PatientChart patient={selected} records={records} />
          </aside>
        )}
      </div>
    </>
  );
}
