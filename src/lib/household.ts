import "server-only";
import { Prisma } from "@prisma/client";
import { db } from "./db";
import { MAX_PARTNERS, PARTNER_COLORS } from "./constants";
import { randomToken } from "./tokens";

export type JoinResult =
  | { ok: true; householdId: string }
  | { ok: false; reason: "invalid" | "full" | "already-member" | "has-household" };

export function newInviteCode() {
  return randomToken(18);
}

export async function createHousehold(userId: string, name: string, timeZone: string) {
  return db.$transaction(async (tx) => {
    const user = await tx.user.findUniqueOrThrow({ where: { id: userId } });
    if (user.householdId) return user.householdId;
    const household = await tx.household.create({
      data: { name, timeZone, inviteCode: newInviteCode(), members: { connect: { id: userId } } },
    });
    return household.id;
  });
}

/**
 * Adds a user to the household that owns `inviteCode`. Locks the household row so two
 * people can't both join as "second partner" at the same moment.
 */
export async function joinHousehold(userId: string, inviteCode: string): Promise<JoinResult> {
  return db.$transaction(
    async (tx) => {
      const rows = await tx.$queryRaw<{ id: string }[]>(
        Prisma.sql`SELECT id FROM "Household" WHERE "inviteCode" = ${inviteCode} FOR UPDATE`,
      );
      const householdId = rows[0]?.id;
      if (!householdId) return { ok: false, reason: "invalid" } as const;

      const user = await tx.user.findUniqueOrThrow({ where: { id: userId } });
      if (user.householdId === householdId) return { ok: false, reason: "already-member" } as const;
      if (user.householdId) return { ok: false, reason: "has-household" } as const;

      const count = await tx.user.count({ where: { householdId } });
      if (count >= MAX_PARTNERS) return { ok: false, reason: "full" } as const;

      // Give the new partner a different color from the first one, so it's clear who owns what.
      const taken = (await tx.user.findMany({ where: { householdId }, select: { color: true } })).map((u) => u.color);
      const color = taken.includes(user.color)
        ? (PARTNER_COLORS.find((c) => !taken.includes(c.value))?.value ?? user.color)
        : user.color;
      await tx.user.update({ where: { id: userId }, data: { householdId, color } });
      if (count + 1 >= MAX_PARTNERS) {
        await tx.household.update({ where: { id: householdId }, data: { inviteCode: null } });
      }
      return { ok: true, householdId } as const;
    },
  );
}

/** A household with a free spot gets a fresh invite code; old links stop working. */
export async function regenerateInvite(householdId: string) {
  const count = await db.user.count({ where: { householdId } });
  if (count >= MAX_PARTNERS) return null;
  const { inviteCode } = await db.household.update({
    where: { id: householdId },
    data: { inviteCode: newInviteCode() },
  });
  return inviteCode;
}
