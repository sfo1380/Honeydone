/** Database tests for kids' activities. Run with TEST_DATABASE_URL set (see household.test.ts). */
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { execSync } from "node:child_process";

const url = process.env.TEST_DATABASE_URL;
if (url) process.env.DATABASE_URL = url;

describe.skipIf(!url)("kids' activities", async () => {
  const { db } = await import("@/lib/db");
  const { createHousehold, joinHousehold } = await import("@/lib/household");
  const act = await import("@/lib/activities");
  const { toDateStr } = await import("@/lib/dates");

  let hh: string, alex: string, blair: string, kid: string;
  const TODAY = "2026-11-09"; // a Monday
  const activity = (over: Partial<Parameters<typeof act.createActivity>[1]> = {}) =>
    act.createActivity(hh, {
      kidId: kid,
      name: "Soccer",
      team: null,
      coachName: null,
      coachContact: null,
      location: "Park",
      seasonStart: "2026-11-09",
      seasonEnd: "2026-11-22",
      bringList: ["Cleats"],
      notes: null,
      ...over,
    });
  const practice = { kind: "PRACTICE" as const, weekdays: [2, 4], startTime: "17:30", endTime: "19:00", location: null, defaultDropOffId: null, defaultPickUpId: null };
  const dates = async (activityId: string) =>
    (await db.activityEvent.findMany({ where: { activityId }, orderBy: { date: "asc" } })).map((e) => toDateStr(e.date));

  beforeAll(() => {
    execSync("npx prisma migrate deploy", { env: { ...process.env, DATABASE_URL: url }, stdio: "ignore" });
  });

  beforeEach(async () => {
    await db.activityEvent.deleteMany();
    await db.activitySchedule.deleteMany();
    await db.activity.deleteMany();
    await db.household.deleteMany();
    await db.user.deleteMany();
    const a = await db.user.create({ data: { displayName: "Alex", email: "a@t.dev", passwordHash: "x" } });
    const b = await db.user.create({ data: { displayName: "Blair", email: "b@t.dev", passwordHash: "x" } });
    hh = await createHousehold(a.id, "Home", "America/Chicago");
    const { inviteCode } = await db.household.findUniqueOrThrow({ where: { id: hh } });
    await joinHousehold(b.id, inviteCode!);
    alex = a.id;
    blair = b.id;
    kid = (await db.kid.create({ data: { householdId: hh, name: "Emma" } })).id;
  });

  it("a weekly practice fills the season, with default drivers", async () => {
    const a = await activity();
    await act.addSchedule(hh, a!.id, { ...practice, defaultDropOffId: alex, defaultPickUpId: blair }, TODAY);
    expect(await dates(a!.id)).toEqual(["2026-11-10", "2026-11-12", "2026-11-17", "2026-11-19"]);
    const e = await db.activityEvent.findFirstOrThrow({ where: { activityId: a!.id } });
    expect([e.dropOffId, e.pickUpId, e.startTime, e.endTime]).toEqual([alex, blair, "17:30", "19:00"]);
  });

  it("ignores drivers who aren't in the household", async () => {
    const a = await activity();
    const outsider = await db.user.create({ data: { displayName: "X", email: "x@t.dev", passwordHash: "x" } });
    await act.addSchedule(hh, a!.id, { ...practice, defaultDropOffId: outsider.id }, TODAY);
    const e = await db.activityEvent.findFirstOrThrow({ where: { activityId: a!.id } });
    expect(e.dropOffId).toBeNull();
    await act.setDriver(hh, e.id, "pickUp", outsider.id);
    expect((await db.activityEvent.findUniqueOrThrow({ where: { id: e.id } })).pickUpId).toBeNull();
  });

  it("extending the season adds events and keeps drivers already chosen", async () => {
    const a = await activity();
    await act.addSchedule(hh, a!.id, practice, TODAY);
    const first = await db.activityEvent.findFirstOrThrow({ where: { activityId: a!.id }, orderBy: { date: "asc" } });
    await act.setDriver(hh, first.id, "dropOff", blair);
    await act.updateActivity(hh, a!.id, { kidId: kid, name: "Soccer", team: null, coachName: null, coachContact: null, location: "Park", seasonStart: "2026-11-09", seasonEnd: "2026-11-29", bringList: [], notes: null }, TODAY);
    expect(await dates(a!.id)).toHaveLength(6);
    expect((await db.activityEvent.findUniqueOrThrow({ where: { id: first.id } })).dropOffId).toBe(blair);
  });

  it("a hand-edited or moved event survives schedule re-syncs and isn't duplicated", async () => {
    const a = await activity();
    await act.addSchedule(hh, a!.id, practice, TODAY);
    const e = await db.activityEvent.findFirstOrThrow({ where: { activityId: a!.id, date: new Date("2026-11-10T00:00:00Z") } });
    await act.updateEvent(hh, e.id, {
      kind: "PRACTICE", title: null, date: "2026-11-11", startTime: "18:00", endTime: null, location: "Gym",
      notes: "Rain plan", dropOffId: alex, pickUpId: null, cancelled: false,
    });
    // Re-sync by saving the activity again.
    await act.updateActivity(hh, a!.id, { kidId: kid, name: "Soccer", team: null, coachName: null, coachContact: null, location: "Park", seasonStart: "2026-11-09", seasonEnd: "2026-11-22", bringList: [], notes: null }, TODAY);
    expect(await dates(a!.id)).toEqual(["2026-11-11", "2026-11-12", "2026-11-17", "2026-11-19"]);
    const moved = await db.activityEvent.findUniqueOrThrow({ where: { id: e.id } });
    expect([moved.startTime, moved.location, moved.customized]).toEqual(["18:00", "Gym", true]);
  });

  it("shortening the season removes events past the new end, not past ones", async () => {
    const a = await activity({ seasonStart: "2026-11-02" });
    await act.addSchedule(hh, a!.id, practice, "2026-11-02");
    expect(await dates(a!.id)).toHaveLength(6);
    await act.updateActivity(hh, a!.id, { kidId: kid, name: "Soccer", team: null, coachName: null, coachContact: null, location: null, seasonStart: "2026-11-02", seasonEnd: "2026-11-15", bringList: [], notes: null }, TODAY);
    expect(await dates(a!.id)).toEqual(["2026-11-03", "2026-11-05", "2026-11-10", "2026-11-12"]);
  });

  it("removing a weekly time clears its upcoming events but keeps past ones", async () => {
    const a = await activity({ seasonStart: "2026-11-02" });
    const s = await act.addSchedule(hh, a!.id, practice, "2026-11-02");
    await act.removeSchedule(hh, s!.id, TODAY);
    expect(await dates(a!.id)).toEqual(["2026-11-03", "2026-11-05"]);
  });

  it("one-off games, drivers and needsDriver", async () => {
    const a = await activity();
    const g = await act.addEvent(hh, a!.id, {
      kind: "GAME", title: "vs. Rockets", date: "2026-11-14", startTime: "09:00", endTime: null, location: null,
      notes: "Snack duty", dropOffId: null, pickUpId: null, cancelled: false,
    });
    expect(act.needsDriver(g!)).toBe(true);
    await act.setDriver(hh, g!.id, "dropOff", alex);
    await act.setDriver(hh, g!.id, "pickUp", blair);
    const after = await db.activityEvent.findUniqueOrThrow({ where: { id: g!.id } });
    expect(act.needsDriver(after)).toBe(false);
    expect(act.needsDriver({ ...after, pickUpId: null, cancelled: true })).toBe(false);
    const week = await act.eventsBetween(hh, "2026-11-09", "2026-11-15");
    expect(week.map((e) => e.title)).toEqual(["vs. Rockets"]);
  });

  it("other households can't add to, edit or delete this activity", async () => {
    const a = await activity();
    const other = await db.user.create({ data: { displayName: "C", email: "c@t.dev", passwordHash: "x" } });
    const otherHh = await createHousehold(other.id, "Other", "America/Chicago");
    expect(await act.addSchedule(otherHh, a!.id, practice, TODAY)).toBeNull();
    expect(await act.createActivity(otherHh, { kidId: kid, name: "x", team: null, coachName: null, coachContact: null, location: null, seasonStart: TODAY, seasonEnd: TODAY, bringList: [], notes: null })).toBeNull();
    await act.deleteActivity(otherHh, a!.id);
    expect(await db.activity.count({ where: { id: a!.id } })).toBe(1);
  });
});
