import { useCallback, useEffect, useState } from "react";
import { doctorAPI } from "../utils/api";

// Loads the doctor's profile, visits and patients, and exposes the actions that change them.
// Each action returns the API result ({ success, message }) so the caller can show feedback.
export default function useDoctorPortal() {
  const [data, setData] = useState({ profile: {}, appointments: [], patients: [] });
  const [status, setStatus] = useState("loading");

  const load = useCallback(async () => {
    setStatus("loading");
    const [profile, appointments, patients] = await Promise.all([
      doctorAPI.getProfile(),
      doctorAPI.getAppointments(),
      doctorAPI.getPatients(),
    ]);
    if (!profile.success && !appointments.success) {
      setStatus("error");
      return;
    }
    setData({
      profile: profile.success ? profile.data : {},
      appointments: appointments.success ? appointments.data : [],
      patients: patients.success ? patients.data : [],
    });
    setStatus("ready");
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const refreshAppointments = async () => {
    const result = await doctorAPI.getAppointments();
    if (result.success) setData((d) => ({ ...d, appointments: result.data }));
  };

  const setVisitStatus = async (id, next) => {
    const result = await doctorAPI.setStatus(id, next);
    if (result.success) await refreshAppointments();
    return result;
  };

  // Creates the visit note, or updates it when the visit already has one
  const saveNote = async (appointment, note) => {
    const recordId = appointment.MedicalRecord?.id;
    const result = recordId
      ? await doctorAPI.updateRecord(recordId, note)
      : await doctorAPI.createRecord({ ...note, appointmentId: appointment.id });
    if (result.success) await refreshAppointments();
    return result;
  };

  const saveAvailability = async (values) => {
    const result = await doctorAPI.updateAvailability(values);
    if (result.success) setData((d) => ({ ...d, profile: { ...d.profile, ...result.data.doctor } }));
    return result;
  };

  return {
    ...data,
    status,
    reload: load,
    startVisit: (id) => setVisitStatus(id, "in-progress"),
    completeVisit: (id) => setVisitStatus(id, "completed"),
    saveNote,
    saveAvailability,
    getPatient: doctorAPI.getPatient,
  };
}
