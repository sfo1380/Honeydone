/** Database tests for the reward tracker. Run with TEST_DATABASE_URL set (see household.test.ts). */
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { execSync } from "node:child_process";

const url = process.env.TEST_DATABASE_URL;
if (url) process.env.DATABASE_URL = url;

describe.skipIf(!url)("rewards", async () => {
  const { db } = await import("@/lib/db");
  const { createHousehold, joinHousehold } = await import("@/lib/household");
  const chores = await import("@/lib/chores");
  const rewards = await import("@/lib/rewards");

  let hh: string, alex: string, blair: string;
  const at = (d: string) => new Date(`${d}T17:00:00Z`);
  const base = {
    notes: null,
    category: "Kitchen",
    effort: "MEDIUM" as const,
    rotate: false,
    repeat: "DAILY" as const,
    interval: 1,
    weekdays: [] as number[],
    dueTime: null,
  };
  const household = () => db.household.findUniqueOrThrow({ where: { id: hh }, include: { members: true } });

  beforeAll(() => {
    execSync("npx prisma migrate deploy", { env: { ...process.env, DATABASE_URL: url }, stdio: "ignore" });
  });

  beforeEach(async () => {
    await db.award.deleteMany();
    await db.coupon.deleteMany();
    await db.choreTask.deleteMany();
    await db.chore.deleteMany();
    await db.session.deleteMany();
    await db.user.deleteMany();
    await db.household.deleteMany();
    const a = await db.user.create({ data: { displayName: "Alex", email: "a@t.dev", passwordHash: "x" } });
    const b = await db.user.create({ data: { displayName: "Blair", email: "b@t.dev", passwordHash: "x" } });
    hh = await createHousehold(a.id, "Home", "America/Chicago");
    const { inviteCode } = await db.household.findUniqueOrThrow({ where: { id: hh } });
    await joinHousehold(b.id, inviteCode!);
    // Pretend the household has existed since October so past weeks can be settled.
    await db.household.update({ where: { id: hh }, data: { createdAt: new Date("2026-10-01T12:00:00Z") } });
    alex = a.id;
    blair = b.id;
  });

  /** Does a daily chore every day from `from` for `days` days, alternating partners. */
  async function doDaily(from: string, days: number, skip: number[] = []) {
    const c = await chores.createChore(hh, { ...base, title: "Dishes", ownerId: null, startDate: from });
    await db.chore.update({ where: { id: c.id }, data: { createdAt: new Date("2026-10-01T12:00:00Z") } });
    for (let i = 0; i < days; i++) {
      const [t] = await db.choreTask.findMany({ where: { choreId: c.id, completedAt: null } });
      const d = t.dueDate.toISOString().slice(0, 10);
      const late = skip.includes(i);
      const doneOn = late ? new Date(Date.parse(`${d}T17:00:00Z`) + 86_400_000) : at(d);
      await chores.completeTask(hh, t.id, i % 2 ? blair : alex, doneOn);
    }
  }

  it("gives each partner a coupon when last week met the team goal, once", async () => {
    // Sunday Nov 1 – Saturday Nov 7, all on time.
    await doDaily("2026-11-01", 7);
    const h = await household();
    await rewards.rewardsOverview(h, h.members, at("2026-11-09"));
    await rewards.rewardsOverview(h, h.members, at("2026-11-10"));
    const awards = await db.award.findMany({ where: { householdId: hh } });
    expect(awards.map((a) => [a.winnerId, a.reason]).sort()).toEqual([[alex, "TEAM_GOAL"], [blair, "TEAM_GOAL"]].sort());
  });

  it("gives nothing when the week missed the goal, and no crown in co-op mode", async () => {
    await doDaily("2026-11-01", 7, [0, 2]); // 5 of 7 on time = 71%
    const h = await household();
    await rewards.rewardsOverview(h, h.members, at("2026-11-09"));
    expect(await db.award.count()).toBe(0);
  });

  it("crowns the top scorer only for weeks after head-to-head was switched on", async () => {
    await doDaily("2026-10-25", 14, [1, 3, 5]); // Blair's days in the first week are late
    await db.household.update({ where: { id: hh }, data: { competition: true, competitionSince: new Date("2026-11-02T00:00:00Z"), teamGoal: 100 } });
    const h = await household();
    await rewards.rewardsOverview(h, h.members, at("2026-11-09"));
    const crowns = await db.award.findMany({ where: { reason: "CROWN" } });
    // Week of Oct 25 is before the switch; week of Nov 1 gets a crown.
    expect(crowns.map((c) => c.weekStart.toISOString().slice(0, 10))).toEqual(["2026-11-01"]);
    // Week of Nov 1 also met the 100% goal.
    expect(await db.award.count({ where: { reason: "TEAM_GOAL" } })).toBe(2);
  });

  it("seeds the starter coupon book once per partner", async () => {
    await rewards.ensureStarterCoupons(hh, alex);
    await rewards.ensureStarterCoupons(hh, alex);
    expect(await db.coupon.count({ where: { giverId: alex } })).toBe(rewards.STARTER_COUPONS.length);
    expect(await db.coupon.count({ where: { giverId: blair } })).toBe(0);
  });
});
