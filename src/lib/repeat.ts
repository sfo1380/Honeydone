import { addDays, addMonths, daysBetween, weekday, weekStart, type DateStr } from "./dates";

export type RepeatRule = {
  repeat: "NONE" | "DAILY" | "WEEKLY" | "MONTHLY";
  interval: number;
  /** 0 = Sunday ... 6 = Saturday. Used by WEEKLY. */
  weekdays: number[];
  /** Anchors which weeks count for "every N weeks" and the day for monthly. */
  startDate: DateStr;
};

function weeklyMatches(rule: RepeatRule, d: DateStr) {
  const days = rule.weekdays.length ? rule.weekdays : [weekday(rule.startDate)];
  if (!days.includes(weekday(d))) return false;
  const weeks = daysBetween(weekStart(rule.startDate), weekStart(d)) / 7;
  return weeks >= 0 && weeks % Math.max(1, rule.interval) === 0;
}

/** The first due date on or after the start date. */
export function firstDue(rule: RepeatRule): DateStr {
  if (rule.repeat !== "WEEKLY") return rule.startDate;
  for (let i = 0; i < 7 * Math.max(1, rule.interval) + 7; i++) {
    const d = addDays(rule.startDate, i);
    if (weeklyMatches(rule, d)) return d;
  }
  return rule.startDate;
}

/** The due date after `current`, or null for a one-off chore. */
export function nextDue(rule: RepeatRule, current: DateStr): DateStr | null {
  const n = Math.max(1, rule.interval);
  switch (rule.repeat) {
    case "NONE":
      return null;
    case "DAILY":
      return addDays(current, n);
    case "MONTHLY":
      return addMonths(current, n, Number(rule.startDate.slice(8, 10)));
    case "WEEKLY":
      for (let i = 1; i <= 7 * n + 7; i++) {
        const d = addDays(current, i);
        if (weeklyMatches(rule, d)) return d;
      }
      return addDays(current, 7 * n);
  }
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** "Every day", "Every 2 weeks on Mon, Thu", "Monthly", "Once". */
export function describeRepeat(rule: Pick<RepeatRule, "repeat" | "interval" | "weekdays">): string {
  const n = Math.max(1, rule.interval);
  switch (rule.repeat) {
    case "NONE":
      return "Once";
    case "DAILY":
      return n === 1 ? "Every day" : `Every ${n} days`;
    case "MONTHLY":
      return n === 1 ? "Every month" : `Every ${n} months`;
    case "WEEKLY": {
      const days = [...rule.weekdays].sort().map((d) => DAY_NAMES[d]).join(", ");
      const base = n === 1 ? "Every week" : `Every ${n} weeks`;
      return days ? `${base} on ${days}` : base;
    }
  }
}
