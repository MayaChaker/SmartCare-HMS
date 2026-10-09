import { useEffect, useState } from "react";

// The current time, refreshed every 30 seconds, for live waiting times and the "now" line
export default function useNow(intervalMs = 30000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}
