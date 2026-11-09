/**
 * Reward tracker scoring. Pure functions over completed chore tasks, so points never get out of sync:
 * undoing a chore removes its points, and nobody ever loses points for a miss.
 */
import { addDays, daysBetween, weekStart, type DateStr } from "./dates";

export type Effort = "SMALL" | "MEDIUM" | "LARGE";

export const BASE_POINTS: Record<Effort, number> = { SMALL: 5, MEDIUM: 10, LARGE: 25 };
/** Bonus for doing a chore nobody was assigned to, on time. */
export const GRAB_BONUS = 3;
/** How many days late still earns half points. */
export const LATE_GRACE_DAYS = 2;

export type ScoredTask = {
  effort: Effort;
  dueDate: DateStr;
  completedOn: DateStr | null;
  completedById: string | null;
  assigneeId: string | null;
  onTime: boolean | null;
  /** The chore was created less than an hour before it was checked off: no early or grab bonus. */
  quick?: boolean;
};

export type PointKind = "early" | "on_time" | "grab" | "assist" | "late" | "very_late";

export type Points = { points: number; kind: PointKind };

/** Points for one completed task, or null if it isn't done. */
export function pointsFor(t: ScoredTask): Points | null {
  if (!t.completedOn || !t.completedById) return null;
  const base = BASE_POINTS[t.effort];
  const daysLate = daysBetween(t.dueDate, t.completedOn);

  if (daysLate <= 0) {
    if (t.quick) return { points: base, kind: "on_time" };
    if (t.assigneeId === null) return { points: base + GRAB_BONUS, kind: "grab" };
    if (daysLate <= -1) return { points: Math.round(base * 1.2), kind: "early" };
    return { points: base, kind: "on_time" };
  }
  // Rescuing your partner's overdue chore is a favor, not a steal: half value, and they lose nothing.
  if (t.assigneeId && t.assigneeId !== t.completedById) return { points: Math.floor(base / 2), kind: "assist" };
  if (daysLate <= LATE_GRACE_DAYS) return { points: Math.floor(base / 2), kind: "late" };
  return { points: Math.floor(base / 5), kind: "very_late" };
}

export type WeekSummary = {
  weekStart: DateStr;
  /** Chores that came due this week (so far, for the current week). */
  due: number;
  onTime: number;
  /** 0–100, or null when nothing was due. */
  rate: number | null;
  points: Record<string, number>;
};

/**
 * One Sunday–Saturday week. A chore counts toward the team goal once its due date has passed or it's done;
 * one still open today isn't a miss yet. Points count by the day the chore was finished.
 */
export function weekSummary(tasks: ScoredTask[], start: DateStr, today: DateStr, memberIds: string[]): WeekSummary {
  const end = addDays(start, 6);
  const due = tasks.filter((t) => t.dueDate >= start && t.dueDate <= end && (t.dueDate < today || t.completedOn));
  const onTime = due.filter((t) => t.onTime).length;
  const points = Object.fromEntries(memberIds.map((id) => [id, 0]));
  for (const t of tasks) {
    if (!t.completedOn || t.completedOn < start || t.completedOn > end || !(t.completedById! in points)) continue;
    points[t.completedById!] += pointsFor(t)?.points ?? 0;
  }
  return { weekStart: start, due: due.length, onTime, rate: due.length ? Math.round((onTime / due.length) * 100) : null, points };
}

export function metGoal(week: WeekSummary, goal: number) {
  return week.rate !== null && week.rate >= goal;
}

/** Who wears the crown: the most points, both on a tie, nobody if nobody scored. */
export function crownWinners(week: WeekSummary): string[] {
  const best = Math.max(0, ...Object.values(week.points));
  if (best === 0) return [];
  return Object.entries(week.points)
    .filter(([, p]) => p === best)
    .map(([id]) => id);
}

/** Whose chore it is for a personal streak: the assignee, or whoever did an unassigned one. */
export function belongsTo(t: ScoredTask, userId: string) {
  return t.assigneeId === userId || (t.assigneeId === null && t.completedById === userId);
}

export type Streak = { days: number; shieldUsed: boolean };

/**
 * Days in a row where every chore due that day was done on time, counting back from today.
 * Days with nothing due neither count nor break it. Today counts once everything due today is done.
 * One missed day per week is forgiven (the streak shield).
 */
export function streak(tasks: ScoredTask[], today: DateStr, lookbackDays = 365): Streak {
  const byDay = new Map<DateStr, ScoredTask[]>();
  for (const t of tasks) {
    const list = byDay.get(t.dueDate) ?? [];
    list.push(t);
    byDay.set(t.dueDate, list);
  }
  const shields = new Set<DateStr>();
  let days = 0;
  for (let i = 0; i < lookbackDays; i++) {
    const day = addDays(today, -i);
    const due = byDay.get(day);
    if (!due) continue;
    const good = due.every((t) => t.onTime);
    if (good) {
      days++;
      continue;
    }
    if (day === today) continue; // today isn't over yet
    const week = weekStart(day);
    if (!shields.has(week)) {
      shields.add(week);
      continue;
    }
    break;
  }
  return { days, shieldUsed: shields.has(weekStart(today)) };
}

/** Each partner's share of effort points over a span, by who did the chores (on time or not). */
export function fairShare(tasks: ScoredTask[], from: DateStr, to: DateStr, memberIds: string[]): Record<string, number> {
  const totals = Object.fromEntries(memberIds.map((id) => [id, 0]));
  for (const t of tasks) {
    if (!t.completedOn || t.completedOn < from || t.completedOn > to || !(t.completedById! in totals)) continue;
    totals[t.completedById!] += BASE_POINTS[t.effort];
  }
  const sum = Object.values(totals).reduce((a, b) => a + b, 0);
  return Object.fromEntries(Object.entries(totals).map(([id, v]) => [id, sum ? Math.round((v / sum) * 100) : 0]));
}
