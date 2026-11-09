/** Database tests for chores. Run with TEST_DATABASE_URL set (see household.test.ts). */
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { execSync } from "node:child_process";

const url = process.env.TEST_DATABASE_URL;
if (url) process.env.DATABASE_URL = url;

describe.skipIf(!url)("chores", async () => {
  const { db } = await import("@/lib/db");
  const { createHousehold, joinHousehold } = await import("@/lib/household");
  const chores = await import("@/lib/chores");
  const { toDateStr } = await import("@/lib/dates");

  let hh: string, alex: string, blair: string;
  const base = {
    notes: null,
    category: "Kitchen",
    effort: "SMALL" as const,
    rotate: false,
    repeat: "NONE" as const,
    interval: 1,
    weekdays: [] as number[],
    dueTime: null,
  };
  const open = (choreId: string) =>
    db.choreTask.findMany({ where: { choreId, completedAt: null }, orderBy: { dueDate: "asc" } });
  // Noon UTC on a date is the same calendar day in every US time zone.
  const at = (d: string) => new Date(`${d}T17:00:00Z`);

  beforeAll(() => {
    execSync("npx prisma migrate deploy", { env: { ...process.env, DATABASE_URL: url }, stdio: "ignore" });
  });

  beforeEach(async () => {
    await db.choreTask.deleteMany();
    await db.chore.deleteMany();
    await db.session.deleteMany();
    await db.kid.deleteMany();
    await db.user.deleteMany();
    await db.household.deleteMany();
    const a = await db.user.create({ data: { displayName: "Alex", email: "a@t.dev", passwordHash: "x" } });
    const b = await db.user.create({ data: { displayName: "Blair", email: "b@t.dev", passwordHash: "x" } });
    hh = await createHousehold(a.id, "Home", "America/Chicago");
    const { inviteCode } = await db.household.findUniqueOrThrow({ where: { id: hh } });
    await joinHousehold(b.id, inviteCode!);
    alex = a.id;
    blair = b.id;
  });

  it("creates the first task on the first matching day", async () => {
    // 2026-11-09 is a Monday; the chore runs Wednesdays.
    const c = await chores.createChore(hh, { ...base, title: "Trash", ownerId: alex, repeat: "WEEKLY", weekdays: [3], startDate: "2026-11-09" });
    const tasks = await open(c.id);
    expect(tasks.map((t) => toDateStr(t.dueDate))).toEqual(["2026-11-11"]);
    expect(tasks[0].assigneeId).toBe(alex);
  });

  it("completing a repeating chore records on-time and creates the next, taking turns", async () => {
    const c = await chores.createChore(hh, { ...base, title: "Dishes", ownerId: alex, rotate: true, repeat: "DAILY", startDate: "2026-11-09" });
    const [t1] = await open(c.id);
    await chores.completeTask(hh, t1.id, alex, at("2026-11-09"));

    const done = await db.choreTask.findUniqueOrThrow({ where: { id: t1.id } });
    expect(done.onTime).toBe(true);
    expect(done.completedById).toBe(alex);
    expect(toDateStr(done.completedOn!)).toBe("2026-11-09");

    const [t2] = await open(c.id);
    expect(toDateStr(t2.dueDate)).toBe("2026-11-10");
    expect(t2.assigneeId).toBe(blair);

    // Late: done a day after it was due.
    await chores.completeTask(hh, t2.id, blair, at("2026-11-11"));
    expect((await db.choreTask.findUniqueOrThrow({ where: { id: t2.id } })).onTime).toBe(false);
    const [t3] = await open(c.id);
    expect(t3.assigneeId).toBe(alex);
  });

  it("uses the household's time zone to decide on time", async () => {
    const c = await chores.createChore(hh, { ...base, title: "Bills", ownerId: null, startDate: "2026-11-09" });
    const [t] = await open(c.id);
    // 11:30 PM in Chicago on the 9th is already the 10th in UTC.
    await chores.completeTask(hh, t.id, alex, new Date("2026-11-10T05:30:00Z"));
    expect((await db.choreTask.findUniqueOrThrow({ where: { id: t.id } })).onTime).toBe(true);
  });

  it("completing twice (both partners at once) only counts once", async () => {
    const c = await chores.createChore(hh, { ...base, title: "Dishes", ownerId: null, repeat: "DAILY", startDate: "2026-11-09" });
    const [t] = await open(c.id);
    await Promise.all([chores.completeTask(hh, t.id, alex, at("2026-11-09")), chores.completeTask(hh, t.id, blair, at("2026-11-09"))]);
    expect(await open(c.id)).toHaveLength(1);
    expect(await db.choreTask.count({ where: { choreId: c.id } })).toBe(2);
  });

  it("undo reopens the task and removes the follow-up", async () => {
    const c = await chores.createChore(hh, { ...base, title: "Dishes", ownerId: alex, repeat: "DAILY", startDate: "2026-11-09" });
    const [t] = await open(c.id);
    await chores.completeTask(hh, t.id, alex, at("2026-11-09"));
    await chores.undoTask(hh, t.id);
    const tasks = await open(c.id);
    expect(tasks.map((x) => x.id)).toEqual([t.id]);
    expect(tasks[0].onTime).toBeNull();
  });

  it("one-off chores don't come back", async () => {
    const c = await chores.createChore(hh, { ...base, title: "Fix the gate", ownerId: alex, startDate: "2026-11-09" });
    const [t] = await open(c.id);
    await chores.completeTask(hh, t.id, alex, at("2026-11-09"));
    expect(await open(c.id)).toHaveLength(0);
  });

  it("editing the schedule moves the open task but keeps history", async () => {
    const c = await chores.createChore(hh, { ...base, title: "Sheets", ownerId: alex, repeat: "WEEKLY", weekdays: [1], startDate: "2026-11-09" });
    const [t] = await open(c.id);
    await chores.completeTask(hh, t.id, alex, at("2026-11-09"));
    await chores.updateChore(hh, c.id, { ...base, title: "Sheets", ownerId: blair, repeat: "WEEKLY", weekdays: [6], startDate: "2026-11-10" });
    const tasks = await open(c.id);
    expect(tasks.map((x) => [toDateStr(x.dueDate), x.assigneeId])).toEqual([["2026-11-14", blair]]);
    expect(await db.choreTask.count({ where: { choreId: c.id, completedAt: { not: null } } })).toBe(1);
  });

  it("deleting a chore hides it but keeps completed history", async () => {
    const c = await chores.createChore(hh, { ...base, title: "Dishes", ownerId: alex, repeat: "DAILY", startDate: "2026-11-09" });
    const [t] = await open(c.id);
    await chores.completeTask(hh, t.id, alex, at("2026-11-09"));
    await chores.archiveChore(hh, c.id);
    expect(await open(c.id)).toHaveLength(0);
    expect(await db.choreTask.count({ where: { choreId: c.id } })).toBe(1);
  });

  it("won't touch another household's chores or assign outsiders", async () => {
    const c = await chores.createChore(hh, { ...base, title: "Dishes", ownerId: alex, startDate: "2026-11-09" });
    const [t] = await open(c.id);
    const other = await db.user.create({ data: { displayName: "Casey", email: "c@t.dev", passwordHash: "x" } });
    const otherHh = await createHousehold(other.id, "Other", "America/Chicago");
    expect(await chores.completeTask(otherHh, t.id, other.id)).toBeNull();
    expect(await chores.updateChore(otherHh, c.id, { ...base, title: "Hacked", ownerId: null, startDate: "2026-11-09" })).toBeNull();
    await expect(chores.createChore(hh, { ...base, title: "X", ownerId: other.id, startDate: "2026-11-09" })).rejects.toThrow();
  });

  it("starter chores skip ones already on the list", async () => {
    expect(await chores.addStarterChores(hh, ["dishes", "trash"], "2026-11-09")).toBe(2);
    expect(await chores.addStarterChores(hh, ["dishes", "laundry"], "2026-11-09")).toBe(1);
    expect(await db.chore.count({ where: { householdId: hh } })).toBe(3);
  });

  it("projects a week of repeats, with only the first one checkable", async () => {
    const c = await chores.createChore(hh, { ...base, title: "Dishes", ownerId: alex, rotate: true, repeat: "DAILY", interval: 2, startDate: "2026-11-08" });
    const tasks = await chores.openTasks(hh);
    const p = chores.projectTasks(tasks, "2026-11-09", "2026-11-15", [alex, blair]);
    expect(p.map((x) => [x.date, x.actionable, x.assigneeId === alex ? "A" : "B"])).toEqual([
      ["2026-11-08", true, "A"], // overdue keeps its date
      ["2026-11-10", false, "B"],
      ["2026-11-12", false, "A"],
      ["2026-11-14", false, "B"],
    ]);
    expect(c.id).toBeTruthy();
  });
});
