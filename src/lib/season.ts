import { addDays, weekday, type DateStr } from "./dates";

/** Every date from `from` to `to` (inclusive) that falls on one of `weekdays` (0 = Sunday). */
export function datesOnWeekdays(weekdays: number[], from: DateStr, to: DateStr): DateStr[] {
  const out: DateStr[] = [];
  if (!weekdays.length || from > to) return out;
  for (let d = from; d <= to; d = addDays(d, 1)) {
    if (weekdays.includes(weekday(d))) out.push(d);
    if (out.length > 400) break; // a season is never this long; guards against bad input
  }
  return out;
}

/** "5:30–7:00 PM" style range, or just the start. */
export function timeRange(start: string, end: string | null, fmt: (t: string) => string): string {
  if (!end) return fmt(start);
  const a = fmt(start);
  const b = fmt(end);
  // Drop the repeated AM/PM: "5:30 PM–7:00 PM" -> "5:30–7:00 PM".
  if (a.slice(-2) === b.slice(-2)) return `${a.slice(0, -3)}–${b}`;
  return `${a}–${b}`;
}
