require("./setup");
const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { isSlotAllowedByWorkingHours, normalizeTimeToSql, isIsoDate } = require("../utils/schedule");
const { getStatusChangeError } = require("../utils/appointmentStatus");
const { getCredentialsError } = require("../utils/validation");

// 2026-10-05 is a Monday
const MONDAY = "2026-10-05";
const SATURDAY = "2026-10-10";

describe("working hours", () => {
  const doctor = { workingHours: "Mon - Fri 09:00 AM - 05:00 PM" };

  it("accepts a slot inside the doctor's days and hours", () => {
    assert.equal(isSlotAllowedByWorkingHours(doctor, MONDAY, "10:00:00").ok, true);
  });

  it("rejects a day the doctor does not work", () => {
    const result = isSlotAllowedByWorkingHours(doctor, SATURDAY, "10:00:00");
    assert.equal(result.ok, false);
    assert.match(result.message, /not available on Sat/);
  });

  it("rejects times before opening and at closing time", () => {
    assert.equal(isSlotAllowedByWorkingHours(doctor, MONDAY, "08:40:00").ok, false);
    assert.equal(isSlotAllowedByWorkingHours(doctor, MONDAY, "17:00:00").ok, false);
  });

  it("understands full day names and lists", () => {
    const listed = { workingHours: "Monday, Wednesday 10:00 - 14:00" };
    assert.equal(isSlotAllowedByWorkingHours(listed, MONDAY, "10:00:00").ok, true);
    assert.equal(isSlotAllowedByWorkingHours(listed, "2026-10-06", "10:00:00").ok, false);
  });

  it("allows every day when no days are set", () => {
    const hoursOnly = { workingHours: "09:00 - 17:00" };
    assert.equal(isSlotAllowedByWorkingHours(hoursOnly, SATURDAY, "09:00:00").ok, true);
  });
});

describe("date and time parsing", () => {
  it("normalizes HH:MM to HH:MM:SS and rejects other formats", () => {
    assert.equal(normalizeTimeToSql("09:20"), "09:20:00");
    assert.equal(normalizeTimeToSql("09:20:00"), "09:20:00");
    assert.equal(normalizeTimeToSql("9am"), null);
  });

  it("only accepts YYYY-MM-DD dates", () => {
    assert.equal(isIsoDate("2026-10-05"), true);
    assert.equal(isIsoDate("05/10/2026"), false);
  });
});

describe("visit status rules", () => {
  it("allows the normal flow", () => {
    assert.equal(getStatusChangeError("scheduled", "checked-in"), null);
    assert.equal(getStatusChangeError("checked-in", "in-progress"), null);
    assert.equal(getStatusChangeError("in-progress", "completed"), null);
  });

  it("allows cancelling before the visit is completed", () => {
    assert.equal(getStatusChangeError("scheduled", "cancelled"), null);
  });

  it("does not complete a visit before check-in", () => {
    assert.match(getStatusChangeError("scheduled", "completed"), /after check-in/);
  });

  it("treats completed and cancelled visits as final", () => {
    assert.match(getStatusChangeError("completed", "scheduled"), /already completed or cancelled/);
    assert.match(getStatusChangeError("cancelled", "checked-in"), /already completed or cancelled/);
  });

  it("rejects unknown statuses", () => {
    assert.equal(getStatusChangeError("scheduled", "done"), "Invalid status");
  });
});

describe("credential validation", () => {
  it("requires a username of 3+ and a password of 6+ characters", () => {
    assert.equal(getCredentialsError("", "secret1"), "Username and password are required");
    assert.match(getCredentialsError("ab", "secret1"), /Username/);
    assert.match(getCredentialsError("abc", "12345"), /Password/);
    assert.equal(getCredentialsError("abc", "123456"), null);
  });
});
