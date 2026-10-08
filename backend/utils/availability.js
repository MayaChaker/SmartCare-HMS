// Free appointment times per doctor, computed from working hours and active bookings.
// All dates are plain "YYYY-MM-DD" calendar days in the clinic's time zone.
const { parseWorkingHoursText } = require("./schedule");

const SLOT_MINUTES = Number(process.env.SLOT_MINUTES) || 20;
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Calendar math in UTC so no local time zone can shift the day
const addDays = (ymd, n) => {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
};
const weekday = (ymd) => WEEKDAYS[new Date(`${ymd}T00:00:00Z`).getUTCDay()];

const toMinutes = (hhmm) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};
const toHHMM = (minutes) => `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;

/**
 * Free times for one doctor over `days` calendar days starting at `from`.
 * @param {string} workingHours  e.g. "Mon - Fri 09:00 AM - 05:00 PM"; no days listed means every day
 * @param {Record<string, Set<string>>} booked  "YYYY-MM-DD" -> booked "HH:MM" times
 * @param {{ date: string, time: string }} now  clinic date and "HH:MM:SS" time; earlier slots are not offered
 * @returns {{ date: string, working: boolean, times: string[] }[]}
 */
const getFreeSlots = ({ workingHours, booked = {}, from, days, now }) => {
  const { days: workDays, start, end } = parseWorkingHoursText(workingHours);
  const startM = toMinutes(start);
  const endM = toMinutes(end);
  const result = [];

  for (let i = 0; i < days; i++) {
    const date = addDays(from, i);
    const working = workDays.length === 0 || workDays.includes(weekday(date));
    const times = [];
    if (working) {
      for (let m = startM; m < endM; m += SLOT_MINUTES) {
        const time = toHHMM(m);
        const taken = booked[date]?.has(time);
        const past = `${date} ${time}:00` <= `${now.date} ${now.time}`;
        if (!taken && !past) times.push(time);
      }
    }
    result.push({ date, working, times });
  }
  return result;
};

module.exports = { SLOT_MINUTES, addDays, getFreeSlots };
