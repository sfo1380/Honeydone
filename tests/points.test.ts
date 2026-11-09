import { describe, expect, it } from "vitest";
import { crownWinners, fairShare, metGoal, pointsFor, streak, weekSummary, type ScoredTask } from "@/lib/points";

const A = "alex";
const B = "blair";
const task = (over: Partial<ScoredTask>): ScoredTask => ({
  effort: "MEDIUM",
  dueDate: "2026-11-10",
  completedOn: "2026-11-10",
  completedById: A,
  assigneeId: A,
  onTime: true,
  ...over,
});

describe("pointsFor", () => {
  it("scores by effort and timing", () => {
    expect(pointsFor(task({}))).toEqual({ points: 10, kind: "on_time" });
    expect(pointsFor(task({ effort: "LARGE", completedOn: "2026-11-09" }))).toEqual({ points: 30, kind: "early" });
    expect(pointsFor(task({ effort: "SMALL", completedOn: "2026-11-12", onTime: false }))).toEqual({ points: 2, kind: "late" });
    expect(pointsFor(task({ completedOn: "2026-11-15", onTime: false }))).toEqual({ points: 2, kind: "very_late" });
  });

  it("gives a grab bonus for unassigned chores and half value for rescuing a partner's overdue one", () => {
    expect(pointsFor(task({ assigneeId: null }))).toEqual({ points: 13, kind: "grab" });
    expect(pointsFor(task({ assigneeId: B, completedOn: "2026-11-11", onTime: false }))).toEqual({ points: 5, kind: "assist" });
  });

  it("skips bonuses for a chore created and checked off within the hour", () => {
    expect(pointsFor(task({ assigneeId: null, completedOn: "2026-11-09", quick: true }))?.points).toBe(10);
  });

  it("gives nothing for open chores", () => {
    expect(pointsFor(task({ completedOn: null, completedById: null, onTime: null }))).toBeNull();
  });
});

describe("weekSummary", () => {
  // Week of Sunday 2026-11-08; today is Wednesday the 11th.
  const tasks = [
    task({ dueDate: "2026-11-09", completedOn: "2026-11-09" }),
    task({ dueDate: "2026-11-10", completedOn: null, completedById: null, onTime: null }), // overdue: a miss
    task({ dueDate: "2026-11-11", completedOn: null, completedById: null, onTime: null }), // due today, still open: not counted yet
    task({ dueDate: "2026-11-11", completedOn: "2026-11-11", completedById: B, assigneeId: B, effort: "LARGE" }),
    task({ dueDate: "2026-11-01", completedOn: "2026-11-01" }), // last week
  ];

  it("counts on-time rate and points per partner", () => {
    const w = weekSummary(tasks, "2026-11-08", "2026-11-11", [A, B]);
    expect(w).toMatchObject({ due: 3, onTime: 2, rate: 67, points: { [A]: 10, [B]: 25 } });
    expect(metGoal(w, 80)).toBe(false);
    expect(metGoal(w, 60)).toBe(true);
    expect(crownWinners(w)).toEqual([B]);
  });

  it("crowns both on a tie and nobody at zero", () => {
    expect(crownWinners({ weekStart: "", due: 1, onTime: 1, rate: 100, points: { [A]: 5, [B]: 5 } })).toEqual([A, B]);
    expect(crownWinners({ weekStart: "", due: 0, onTime: 0, rate: null, points: { [A]: 0, [B]: 0 } })).toEqual([]);
  });
});

describe("streak", () => {
  const day = (d: string, onTime: boolean) => task({ dueDate: d, completedOn: onTime ? d : null, onTime: onTime ? true : null });

  it("counts back over days with chores, skipping empty days and an unfinished today", () => {
    const tasks = [day("2026-11-05", true), day("2026-11-07", true), day("2026-11-09", true), day("2026-11-10", true), day("2026-11-11", false)];
    expect(streak(tasks, "2026-11-11").days).toBe(4);
  });

  it("forgives one missed day per week", () => {
    // Weeks start Sunday the 1st and the 8th.
    const tasks = [day("2026-11-03", true), day("2026-11-04", true), day("2026-11-09", true), day("2026-11-10", false), day("2026-11-11", true)];
    expect(streak(tasks, "2026-11-11")).toEqual({ days: 4, shieldUsed: true });
    const twoMisses = [...tasks, day("2026-11-09", false)];
    expect(streak(twoMisses, "2026-11-11").days).toBe(1);
  });
});

describe("fairShare", () => {
  it("splits effort points by who did the chores", () => {
    const tasks = [task({ effort: "LARGE" }), task({ completedById: B, effort: "SMALL" }), task({ completedById: B, effort: "SMALL" })];
    expect(fairShare(tasks, "2026-11-01", "2026-11-30", [A, B])).toEqual({ [A]: 71, [B]: 29 });
  });
});
