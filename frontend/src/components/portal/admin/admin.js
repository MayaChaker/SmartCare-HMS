export const ROLE_LABEL = { receptionist: "Reception", doctor: "Doctor", patient: "Patient", admin: "Administration", system: "System" };

// The activity log stores fixed action keys; these turn an entry into a plain sentence.
// `self` is true when the person acted on their own visit or account.
const PHRASES = {
  "visit.booked": (t, self) => (self ? "booked a visit" : `booked a visit for ${t}`),
  "visit.moved": (t, self) => (self ? "moved their visit" : `moved the visit of ${t}`),
  "visit.cancelled": (t, self) => (self ? "cancelled their visit" : `cancelled the visit of ${t}`),
  "visit.checked_in": (t) => `checked in ${t}`,
  "visit.no_show": (t) => `marked ${t} as a no-show`,
  "visit.started": (t) => `started the visit with ${t}`,
  "visit.completed": (t) => `completed the visit with ${t}`,
  "note.written": (t) => `wrote the visit note for ${t}`,
  "note.updated": () => "updated a visit note",
  "file.opened": (t) => `opened a file for ${t}`,
  "file.code_reissued": (t) => `gave a new activation code to ${t}`,
  "patient.contact_updated": (t) => `updated the contact details of ${t}`,
  "account.registered": () => "created their patient account",
  "account.activated": () => "activated their account",
  "account.created": (t) => `created an account for ${t}`,
  "account.password_reset": (t) => `reset the password of ${t}`,
  "account.password_changed": () => "chose a new password",
  "account.updated": (t) => `updated the account ${t}`,
  "account.deleted": (t) => `deleted the account ${t}`,
  "doctor.updated": (t) => `updated ${t}`,
  "doctor.photo_changed": (t, self) => (self ? "changed their portrait" : `changed the portrait of ${t}`),
  "doctor.hours_changed": () => "changed their booking hours",
};

export const activitySentence = (entry) => {
  const target = entry.targetName || "a record";
  const self = entry.targetName === entry.actorName || entry.actorRole === "patient";
  const phrase = PHRASES[entry.action];
  return phrase ? phrase(target, self) : entry.action;
};

// Change against the previous period, and whether that change is good news
export const delta = (now, before, { higherIsBetter = true, unit = "" } = {}) => {
  if (now === null || now === undefined || before === null || before === undefined) return null;
  const diff = Math.round((now - before) * 10) / 10;
  if (diff === 0) return { text: `no change`, good: true, direction: "none" };
  return {
    text: `${Math.abs(diff)}${unit}`,
    direction: diff > 0 ? "up" : "down",
    good: diff > 0 === higherIsBetter,
  };
};

export const percentChange = (now, before) => {
  if (!before) return null;
  return Math.round(((now - before) / before) * 100);
};
