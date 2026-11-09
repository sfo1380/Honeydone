import "server-only";
import { db } from "./db";
import { addDays, fromDateStr, todayIn, toDateStr, weekStart, type DateStr } from "./dates";
import { belongsTo, crownWinners, metGoal, weekSummary, type ScoredTask } from "./points";

/** Every partner starts with these in their coupon book; they can edit or remove them. */
export const STARTER_COUPONS = [
  "I handle bedtime solo",
  "You pick the movie",
  "Sleep in Saturday, I've got the kids",
  "Back rub, no questions asked",
  "I cook dinner tonight",
  "Your next chore is on me",
] as const;

/** How far back history is read for streaks and weekly results. */
const LOOKBACK_DAYS = 120;
/** Closed weeks older than this are never settled, so turning rewards on can't award months of old weeks. */
const SETTLE_WEEKS = 8;

export async function scoredTasks(householdId: string, today: DateStr): Promise<ScoredTask[]> {
  const rows = await db.choreTask.findMany({
    where: { householdId, dueDate: { gte: fromDateStr(addDays(today, -LOOKBACK_DAYS)) } },
    select: {
      dueDate: true,
      completedOn: true,
      completedAt: true,
      completedById: true,
      assigneeId: true,
      onTime: true,
      chore: { select: { effort: true, createdAt: true } },
    },
  });
  return rows.map((r) => ({
    effort: r.chore.effort,
    dueDate: toDateStr(r.dueDate),
    completedOn: r.completedOn ? toDateStr(r.completedOn) : null,
    completedById: r.completedById,
    assigneeId: r.assigneeId,
    onTime: r.onTime,
    quick: !!r.completedAt && r.completedAt.getTime() - r.chore.createdAt.getTime() < 3_600_000,
  }));
}

/** Gives each partner the standard coupons the first time they open their coupon book. */
export async function ensureStarterCoupons(householdId: string, giverId: string) {
  const any = await db.coupon.count({ where: { householdId, giverId } });
  if (any) return;
  await db.coupon.createMany({ data: STARTER_COUPONS.map((title) => ({ householdId, giverId, title })) });
}

type HouseholdForRewards = {
  id: string;
  timeZone: string;
  createdAt: Date;
  teamGoal: number;
  competition: boolean;
  competitionSince: Date | null;
};

/**
 * Hands out coupons for finished weeks that haven't been settled yet. Safe to call on every page load:
 * the unique key on Award means each prize is created once.
 */
export async function settleWeeks(household: HouseholdForRewards, memberIds: string[], tasks: ScoredTask[], today: DateStr) {
  if (memberIds.length < 2) return;
  const thisWeek = weekStart(today);
  const firstWeek = weekStart(todayIn(household.timeZone, household.createdAt));
  const awards: { winnerId: string; weekStart: Date; reason: "TEAM_GOAL" | "CROWN"; householdId: string }[] = [];

  for (let i = 1; i <= SETTLE_WEEKS; i++) {
    const start = addDays(thisWeek, -7 * i);
    if (start < firstWeek) break;
    const week = weekSummary(tasks, start, today, memberIds);
    if (!week.due) continue;
    if (metGoal(week, household.teamGoal)) {
      for (const id of memberIds) awards.push({ householdId: household.id, winnerId: id, weekStart: fromDateStr(start), reason: "TEAM_GOAL" });
    }
    const since = household.competitionSince ? toDateStr(household.competitionSince) : null;
    if (household.competition && since && start >= weekStart(since)) {
      for (const id of crownWinners(week)) awards.push({ householdId: household.id, winnerId: id, weekStart: fromDateStr(start), reason: "CROWN" });
    }
  }
  if (awards.length) await db.award.createMany({ data: awards, skipDuplicates: true });
}

export async function rewardsOverview(
  household: HouseholdForRewards,
  members: { id: string }[],
  now = new Date(),
) {
  const today = todayIn(household.timeZone, now);
  const memberIds = members.map((m) => m.id);
  const tasks = await scoredTasks(household.id, today);
  await settleWeeks(household, memberIds, tasks, today);
  const thisWeek = weekSummary(tasks, weekStart(today), today, memberIds);
  const lastWeek = weekSummary(tasks, addDays(weekStart(today), -7), today, memberIds);
  return { today, tasks, thisWeek, lastWeek, mine: (id: string) => tasks.filter((t) => belongsTo(t, id)) };
}

/** Awards still waiting to be picked or used, for the dashboard badge. */
export async function openAwardCount(householdId: string, userId: string) {
  return db.award.count({ where: { householdId, winnerId: userId, usedAt: null } });
}
