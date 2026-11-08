import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { db } from "./db";
import { getCurrentUser } from "./session";

/** The signed-in user; sends visitors to sign in. */
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin");
  return user;
}

/** The signed-in user and their household; sends them to setup if they have none. */
export const requireHousehold = cache(async () => {
  const user = await requireUser();
  if (!user.householdId) redirect("/setup");
  const household = await db.household.findUniqueOrThrow({
    where: { id: user.householdId },
    include: {
      members: { orderBy: { createdAt: "asc" }, select: { id: true, displayName: true, color: true, email: true } },
      kids: { orderBy: { createdAt: "asc" } },
    },
  });
  const partner = household.members.find((m) => m.id !== user.id) ?? null;
  return { user, household, partner };
});
