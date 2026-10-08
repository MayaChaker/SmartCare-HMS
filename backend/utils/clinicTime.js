// Dates and times in the clinic's own time zone.
// The server runs in UTC (Render), but "today" and "now" must follow the hospital's clock in Beirut.
const CLINIC_TIME_ZONE = process.env.CLINIC_TIME_ZONE || "Asia/Beirut";

// Returns { date: "YYYY-MM-DD", time: "HH:MM:SS" } for the given moment in the clinic's time zone
const clinicNow = (moment = new Date()) => {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: CLINIC_TIME_ZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(moment)
      .map((p) => [p.type, p.value]),
  );
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    time: `${parts.hour}:${parts.minute}:${parts.second}`,
  };
};

const clinicToday = (moment) => clinicNow(moment).date;

// True when the slot (YYYY-MM-DD, HH:MM:SS) has already started in the clinic's time zone.
// The fixed-width formats compare correctly as strings.
const isSlotInPast = (date, time, moment) => {
  const now = clinicNow(moment);
  return `${date} ${time}` <= `${now.date} ${now.time}`;
};

module.exports = { CLINIC_TIME_ZONE, clinicNow, clinicToday, isSlotInPast };
