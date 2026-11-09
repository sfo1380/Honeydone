/**
 * Calendar-date helpers. Dates are plain "YYYY-MM-DD" strings so time zones can't shift them;
 * Postgres `date` columns come back from Prisma as UTC-midnight Date objects.
 */
export type DateStr = string;

export function toDateStr(d: Date): DateStr {
  return d.toISOString().slice(0, 10);
}

export function fromDateStr(s: DateStr): Date {
  return new Date(`${s}T00:00:00.000Z`);
}

export function isDateStr(s: unknown): s is DateStr {
  return typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s) && toDateStr(fromDateStr(s)) === s;
}

/** Today's date in a time zone, e.g. todayIn("America/Chicago"). */
export function todayIn(timeZone: string, now = new Date()): DateStr {
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

export function addDays(s: DateStr, n: number): DateStr {
  const d = fromDateStr(s);
  d.setUTCDate(d.getUTCDate() + n);
  return toDateStr(d);
}

export function weekday(s: DateStr): number {
  return fromDateStr(s).getUTCDay();
}

/** Days from a to b (b - a). */
export function daysBetween(a: DateStr, b: DateStr): number {
  return Math.round((fromDateStr(b).getTime() - fromDateStr(a).getTime()) / 86_400_000);
}

/** The Sunday that starts the week containing s. */
export function weekStart(s: DateStr): DateStr {
  return addDays(s, -weekday(s));
}

/** Same day-of-month `months` later, clamped to the month's last day (Jan 31 + 1 month = Feb 28/29). */
export function addMonths(s: DateStr, months: number, dayOfMonth = Number(s.slice(8, 10))): DateStr {
  const [y, m] = s.split("-").map(Number);
  const total = y * 12 + (m - 1) + months;
  const ny = Math.floor(total / 12);
  const nm = total % 12;
  const lastDay = new Date(Date.UTC(ny, nm + 1, 0)).getUTCDate();
  return toDateStr(new Date(Date.UTC(ny, nm, Math.min(dayOfMonth, lastDay))));
}

const WEEKDAY_FMT = new Intl.DateTimeFormat("en-US", { weekday: "long", timeZone: "UTC" });
const SHORT_FMT = new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" });

/** "Today", "Tomorrow", "Yesterday", a weekday within the week, or "Mon, Nov 9". */
export function friendlyDate(s: DateStr, today: DateStr): string {
  const diff = daysBetween(today, s);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  if (diff > 1 && diff < 7) return WEEKDAY_FMT.format(fromDateStr(s));
  return SHORT_FMT.format(fromDateStr(s));
}

/** "7:30 PM" from "19:30". */
export function friendlyTime(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${suffix}`;
}
