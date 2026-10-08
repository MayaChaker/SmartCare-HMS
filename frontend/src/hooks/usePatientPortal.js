import { useCallback, useEffect, useState } from "react";
import { patientAPI } from "../utils/api";

const EMPTY = { profile: {}, appointments: [], records: [], doctors: [], availability: {} };
const AVAILABILITY_DAYS = 14;

// doctorId -> [{ date, working, times }]
const byDoctor = (result) =>
  result.success ? Object.fromEntries((result.data?.doctors || []).map((d) => [d.doctorId, d.days])) : {};

// Loads everything the patient portal shows and exposes the actions that change it.
// Each action returns the API result ({ success, message }) so the caller can show feedback.
export default function usePatientPortal() {
  const [data, setData] = useState(EMPTY);
  const [status, setStatus] = useState("loading");

  const load = useCallback(async () => {
    setStatus("loading");
    const [profile, appointments, records, doctors, availability] = await Promise.all([
      patientAPI.getProfile(),
      patientAPI.getAppointments(),
      patientAPI.getMedicalRecords(),
      patientAPI.getAllDoctors(),
      patientAPI.getAvailability(AVAILABILITY_DAYS),
    ]);
    if (!profile.success && !appointments.success) {
      setStatus("error");
      return;
    }
    setData({
      profile: profile.success ? profile.data : {},
      appointments: appointments.success ? appointments.data : [],
      records: records.success ? records.data : [],
      doctors: doctors.success && Array.isArray(doctors.data) ? doctors.data : [],
      availability: byDoctor(availability),
    });
    setStatus("ready");
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // After a change, reload the visits and the free times they affect
  const refresh = async () => {
    // The API client briefly caches GETs; drop it so we see the change we just made
    patientAPI._cache.clear();
    const [appointments, availability] = await Promise.all([
      patientAPI.getAppointments(),
      patientAPI.getAvailability(AVAILABILITY_DAYS),
    ]);
    setData((d) => ({
      ...d,
      appointments: appointments.success ? appointments.data : d.appointments,
      availability: availability.success ? byDoctor(availability) : d.availability,
    }));
  };

  const withRefresh = (request) => async (...args) => {
    const result = await request(...args);
    if (result.success) await refresh();
    return result;
  };

  const book = withRefresh((payload) => patientAPI.bookAppointment(payload));
  const cancel = withRefresh((id) => patientAPI.cancelAppointment(id));
  const reschedule = withRefresh((id, slot) => patientAPI.rescheduleAppointment(id, slot));

  const saveProfile = async (values) => {
    const result = await patientAPI.updateProfile(values);
    if (result.success) {
      setData((d) => ({ ...d, profile: { ...d.profile, ...result.data.patient } }));
    }
    return result;
  };

  return { ...data, status, reload: load, book, cancel, reschedule, saveProfile };
}
