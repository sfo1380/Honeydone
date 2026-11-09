import { describe, expect, it } from "vitest";
import { friendlyTime } from "@/lib/dates";
import { datesOnWeekdays, timeRange } from "@/lib/season";

describe("datesOnWeekdays", () => {
  it("lists Tuesdays and Thursdays in a range", () => {
    // 2026-11-09 is a Monday.
    expect(datesOnWeekdays([2, 4], "2026-11-09", "2026-11-20")).toEqual(["2026-11-10", "2026-11-12", "2026-11-17", "2026-11-19"]);
  });
  it("includes both ends", () => {
    expect(datesOnWeekdays([1], "2026-11-09", "2026-11-16")).toEqual(["2026-11-09", "2026-11-16"]);
  });
  it("is empty for no days or a backwards range", () => {
    expect(datesOnWeekdays([], "2026-11-09", "2026-12-09")).toEqual([]);
    expect(datesOnWeekdays([1], "2026-12-09", "2026-11-09")).toEqual([]);
  });
});

describe("timeRange", () => {
  it("shares AM/PM when both ends match", () => {
    expect(timeRange("17:30", "19:00", friendlyTime)).toBe("5:30–7:00 PM");
  });
  it("keeps both when they differ", () => {
    expect(timeRange("11:00", "13:00", friendlyTime)).toBe("11:00 AM–1:00 PM");
  });
  it("shows just the start without an end", () => {
    expect(timeRange("09:00", null, friendlyTime)).toBe("9:00 AM");
  });
});
