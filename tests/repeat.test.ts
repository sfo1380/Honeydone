import { describe, expect, it } from "vitest";
import { addMonths, friendlyDate, friendlyTime, isDateStr, todayIn } from "@/lib/dates";
import { describeRepeat, firstDue, nextDue, type RepeatRule } from "@/lib/repeat";

const rule = (r: Partial<RepeatRule>): RepeatRule => ({ repeat: "NONE", interval: 1, weekdays: [], startDate: "2026-11-09", ...r });

describe("dates", () => {
  it("knows today per time zone", () => {
    const lateNightUtc = new Date("2026-11-10T03:00:00Z");
    expect(todayIn("America/Los_Angeles", lateNightUtc)).toBe("2026-11-09");
    expect(todayIn("America/New_York", lateNightUtc)).toBe("2026-11-09");
    expect(todayIn("UTC", lateNightUtc)).toBe("2026-11-10");
  });
  it("clamps months to their last day", () => {
    expect(addMonths("2026-01-31", 1)).toBe("2026-02-28");
    expect(addMonths("2028-01-31", 1)).toBe("2028-02-29");
    expect(addMonths("2026-02-28", 1, 31)).toBe("2026-03-31");
    expect(addMonths("2026-11-15", 2)).toBe("2027-01-15");
  });
  it("validates date strings", () => {
    expect(isDateStr("2026-11-09")).toBe(true);
    expect(isDateStr("2026-02-30")).toBe(false);
    expect(isDateStr("11/09/2026")).toBe(false);
  });
  it("formats friendly dates and times", () => {
    expect(friendlyDate("2026-11-09", "2026-11-09")).toBe("Today");
    expect(friendlyDate("2026-11-10", "2026-11-09")).toBe("Tomorrow");
    expect(friendlyDate("2026-11-08", "2026-11-09")).toBe("Yesterday");
    expect(friendlyDate("2026-11-12", "2026-11-09")).toBe("Thursday");
    expect(friendlyDate("2026-11-20", "2026-11-09")).toBe("Fri, Nov 20");
    expect(friendlyTime("19:05")).toBe("7:05 PM");
    expect(friendlyTime("00:30")).toBe("12:30 AM");
    expect(friendlyTime("12:00")).toBe("12:00 PM");
  });
});

describe("repeat rules", () => {
  it("one-off chores don't repeat", () => {
    expect(nextDue(rule({}), "2026-11-09")).toBeNull();
  });
  it("daily and every N days", () => {
    expect(nextDue(rule({ repeat: "DAILY" }), "2026-11-09")).toBe("2026-11-10");
    expect(nextDue(rule({ repeat: "DAILY", interval: 3 }), "2026-11-09")).toBe("2026-11-12");
  });
  it("weekly on chosen days", () => {
    // 2026-11-09 is a Monday. Mon + Thu.
    const r = rule({ repeat: "WEEKLY", weekdays: [1, 4] });
    expect(firstDue(r)).toBe("2026-11-09");
    expect(nextDue(r, "2026-11-09")).toBe("2026-11-12");
    expect(nextDue(r, "2026-11-12")).toBe("2026-11-16");
  });
  it("weekly starting on a day not in the list moves to the next listed day", () => {
    expect(firstDue(rule({ repeat: "WEEKLY", weekdays: [3] }))).toBe("2026-11-11");
  });
  it("every 2 weeks skips the off week", () => {
    const r = rule({ repeat: "WEEKLY", interval: 2, weekdays: [1, 4] });
    expect(nextDue(r, "2026-11-09")).toBe("2026-11-12");
    expect(nextDue(r, "2026-11-12")).toBe("2026-11-23");
  });
  it("weekly with no days uses the start date's weekday", () => {
    expect(nextDue(rule({ repeat: "WEEKLY" }), "2026-11-09")).toBe("2026-11-16");
  });
  it("monthly keeps the start day even after a short month", () => {
    const r = rule({ repeat: "MONTHLY", startDate: "2026-01-31" });
    expect(nextDue(r, "2026-01-31")).toBe("2026-02-28");
    expect(nextDue(r, "2026-02-28")).toBe("2026-03-31");
  });
  it("describes rules in words", () => {
    expect(describeRepeat({ repeat: "WEEKLY", interval: 2, weekdays: [4, 1] })).toBe("Every 2 weeks on Mon, Thu");
    expect(describeRepeat({ repeat: "DAILY", interval: 1, weekdays: [] })).toBe("Every day");
    expect(describeRepeat({ repeat: "NONE", interval: 1, weekdays: [] })).toBe("Once");
  });
});
