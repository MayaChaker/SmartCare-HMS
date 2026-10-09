import { useCallback, useEffect, useState } from "react";
import { receptionAPI } from "../utils/api";
import { toLocalDateString } from "../utils/schedule";

const REFRESH_MS = 60000;

// doctorId -> [{ date, working, times }]
const byDoctor = (result) =>
  result.success ? Object.fromEntries((result.data?.doctors || []).map((d) => [d.doctorId, d.days])) : {};

// Loads what the front desk works with and keeps today's visits fresh, since several people change them.
// Each action returns the API result ({ success, message }) so the caller can show feedback.
export default function useFrontDesk() {
  const [data, setData] = useState({ doctors: [], patients: [], today: [], availability: {} });
  const [status, setStatus] = useState("loading");

  const refreshToday = useCallback(async () => {
    const [today, availability] = await Promise.all([receptionAPI.getDay(toLocalDateString(new Date())), receptionAPI.getAvailability(14)]);
    setData((d) => ({
      ...d,
      today: today.success ? today.data : d.today,
      availability: availability.success ? byDoctor(availability) : d.availability,
    }));
  }, []);

  const refreshPatients = useCallback(async () => {
    const result = await receptionAPI.getPatients();
    if (result.success) setData((d) => ({ ...d, patients: result.data }));
  }, []);

  const load = useCallback(async () => {
    setStatus("loading");
    const [doctors, patients, today, availability] = await Promise.all([
      receptionAPI.getDoctors(),
      receptionAPI.getPatients(),
      receptionAPI.getDay(toLocalDateString(new Date())),
      receptionAPI.getAvailability(14),
    ]);
    if (!doctors.success && !today.success) {
      setStatus("error");
      return;
    }
    setData({
      doctors: doctors.success ? doctors.data : [],
      patients: patients.success ? patients.data : [],
      today: today.success ? today.data : [],
      availability: byDoctor(availability),
    });
    setStatus("ready");
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // The board is a live screen: pick up check-ins and bookings made elsewhere
  useEffect(() => {
    const id = setInterval(refreshToday, REFRESH_MS);
    return () => clearInterval(id);
  }, [refreshToday]);

  const thenRefresh = (request, alsoPatients = false) => async (...args) => {
    const result = await request(...args);
    if (result.success) await Promise.all([refreshToday(), alsoPatients ? refreshPatients() : null]);
    return result;
  };

  return {
    ...data,
    status,
    reload: load,
    checkIn: thenRefresh(receptionAPI.checkIn),
    markNoShow: thenRefresh((id) => receptionAPI.setStatus(id, "no-show")),
    cancel: thenRefresh((id) => receptionAPI.setStatus(id, "cancelled")),
    move: thenRefresh(receptionAPI.move),
    book: thenRefresh(receptionAPI.book),
    openFile: thenRefresh(receptionAPI.openFile, true),
    updatePatient: thenRefresh(receptionAPI.updatePatient, true),
    newActivationCode: thenRefresh(receptionAPI.newActivationCode, true),
    getDay: receptionAPI.getDay,
  };
}
