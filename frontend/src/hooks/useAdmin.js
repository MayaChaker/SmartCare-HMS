import { useCallback, useEffect, useState } from "react";
import { adminAPI } from "../utils/api";

// Loads the administration's figures, accounts and doctors, and exposes the actions that change them.
// Each action returns the API result ({ success, data, message }) so the caller can show feedback.
export default function useAdmin() {
  const [days, setDays] = useState(30);
  const [analytics, setAnalytics] = useState(null);
  const [users, setUsers] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [status, setStatus] = useState("loading");

  const loadAnalytics = useCallback(async (period) => {
    const result = await adminAPI.getAnalytics(period);
    if (result.success) setAnalytics(result.data);
    return result;
  }, []);

  const refreshPeople = useCallback(async () => {
    const [u, d] = await Promise.all([adminAPI.getUsers(), adminAPI.getDoctors()]);
    if (u.success) setUsers(u.data);
    if (d.success) setDoctors(d.data);
  }, []);

  const load = useCallback(async () => {
    setStatus("loading");
    const [a, u, d] = await Promise.all([adminAPI.getAnalytics(30), adminAPI.getUsers(), adminAPI.getDoctors()]);
    if (!a.success && !u.success) {
      setStatus("error");
      return;
    }
    if (a.success) setAnalytics(a.data);
    if (u.success) setUsers(u.data);
    if (d.success) setDoctors(d.data);
    setStatus("ready");
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const changePeriod = async (period) => {
    setDays(period);
    await loadAnalytics(period);
  };

  const thenRefresh = (request) => async (...args) => {
    const result = await request(...args);
    if (result.success) await refreshPeople();
    return result;
  };

  return {
    status,
    reload: load,
    days,
    changePeriod,
    analytics,
    users,
    doctors,
    createUser: thenRefresh(adminAPI.createUser),
    resetPassword: thenRefresh(adminAPI.resetPassword),
    updateDoctor: thenRefresh(adminAPI.updateDoctor),
    uploadDoctorPhoto: thenRefresh(adminAPI.uploadDoctorPhoto),
    getActivity: adminAPI.getActivity,
  };
}
