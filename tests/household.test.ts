/**
 * Runs against a real Postgres. Set TEST_DATABASE_URL to run it, for example:
 *   TEST_DATABASE_URL=postgresql://postgres@localhost:5432/honeydone_test npm test
 */
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { execSync } from "node:child_process";

const url = process.env.TEST_DATABASE_URL;
if (url) process.env.DATABASE_URL = url;

describe.skipIf(!url)("two-partner households", async () => {
  const { db } = await import("@/lib/db");
  const { createHousehold, joinHousehold, regenerateInvite } = await import("@/lib/household");

  const makeUser = (name: string) =>
    db.user.create({ data: { displayName: name, email: `${name.toLowerCase()}@test.dev`, passwordHash: "x" } });

  beforeAll(() => {
    execSync("npx prisma migrate deploy", {
      env: { ...process.env, DATABASE_URL: url },
      stdio: "ignore",
    });
  });

  beforeEach(async () => {
    await db.choreTask.deleteMany();
    await db.chore.deleteMany();
    await db.session.deleteMany();
    await db.kid.deleteMany();
    await db.user.deleteMany();
    await db.household.deleteMany();
  });

  it("lets exactly one partner join, then retires the invite", async () => {
    const a = await makeUser("Alex");
    const b = await makeUser("Blair");
    const c = await makeUser("Casey");
    const id = await createHousehold(a.id, "Home", "America/Chicago");
    const { inviteCode } = await db.household.findUniqueOrThrow({ where: { id } });

    expect(await joinHousehold(b.id, inviteCode!)).toEqual({ ok: true, householdId: id });
    expect(await joinHousehold(c.id, inviteCode!)).toEqual({ ok: false, reason: "invalid" });

    const after = await db.household.findUniqueOrThrow({ where: { id }, include: { members: true } });
    expect(after.members).toHaveLength(2);
    expect(new Set(after.members.map((m) => m.color)).size).toBe(2);
    expect(after.inviteCode).toBeNull();
    expect(await regenerateInvite(id)).toBeNull();
  });

  it("never lets two people both take the second spot", async () => {
    const a = await makeUser("Alex");
    const id = await createHousehold(a.id, "Home", "America/Chicago");
    const { inviteCode } = await db.household.findUniqueOrThrow({ where: { id } });
    const racers = await Promise.all(["B1", "B2", "B3", "B4"].map(makeUser));

    const results = await Promise.all(racers.map((r) => joinHousehold(r.id, inviteCode!)));
    expect(results.filter((r) => r.ok)).toHaveLength(1);
    expect(await db.user.count({ where: { householdId: id } })).toBe(2);
  });

  it("refuses someone who already has a household", async () => {
    const a = await makeUser("Alex");
    const b = await makeUser("Blair");
    await createHousehold(b.id, "Blair's", "America/Chicago");
    const id = await createHousehold(a.id, "Home", "America/Chicago");
    const { inviteCode } = await db.household.findUniqueOrThrow({ where: { id } });
    expect(await joinHousehold(b.id, inviteCode!)).toEqual({ ok: false, reason: "has-household" });
  });

  it("replacing the invite link kills the old one", async () => {
    const a = await makeUser("Alex");
    const b = await makeUser("Blair");
    const id = await createHousehold(a.id, "Home", "America/Chicago");
    const { inviteCode: old } = await db.household.findUniqueOrThrow({ where: { id } });
    const fresh = await regenerateInvite(id);
    expect(fresh).not.toBe(old);
    expect(await joinHousehold(b.id, old!)).toEqual({ ok: false, reason: "invalid" });
    expect((await joinHousehold(b.id, fresh!)).ok).toBe(true);
  });
});
