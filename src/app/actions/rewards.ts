"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireHousehold } from "@/lib/dal";
import { fromDateStr, todayIn } from "@/lib/dates";
import { fieldErrors } from "@/lib/validation";
import type { FormState } from "@/lib/form-state";

const settingsSchema = z.object({
  competition: z.literal("on").optional(),
  teamGoal: z.coerce.number().int("Use a whole number.").min(10, "Pick at least 10%.").max(100, "100% is the most."),
});

const couponSchema = z.object({
  title: z.string().trim().min(1, "Write what the coupon is for.").max(80, "Keep it under 80 characters."),
});

function refresh() {
  revalidatePath("/rewards");
  revalidatePath("/dashboard");
}

export async function updateRewardSettingsAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const { household } = await requireHousehold();
  const parsed = settingsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  const competition = parsed.data.competition === "on";
  await db.household.update({
    where: { id: household.id },
    data: {
      teamGoal: parsed.data.teamGoal,
      competition,
      // Restart the crown race from this week when it's switched on, so old weeks don't hand out crowns.
      ...(competition && !household.competition ? { competitionSince: fromDateStr(todayIn(household.timeZone)) } : {}),
    },
  });
  refresh();
  return {
    message: "Reward settings saved.",
    values: { teamGoal: String(parsed.data.teamGoal), competition: competition ? "on" : "" },
  };
}

export async function addCouponAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const { household, user } = await requireHousehold();
  const parsed = couponSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  await db.coupon.create({ data: { householdId: household.id, giverId: user.id, title: parsed.data.title } });
  refresh();
  return { message: "Coupon added." };
}

export async function removeCouponAction(couponId: string) {
  const { household, user } = await requireHousehold();
  await db.coupon.updateMany({ where: { id: couponId, householdId: household.id, giverId: user.id }, data: { archived: true } });
  refresh();
}

/** The winner picks a coupon from their partner's book. */
export async function chooseCouponAction(awardId: string, formData: FormData) {
  const { household, user, partner } = await requireHousehold();
  if (!partner) return;
  const coupon = await db.coupon.findFirst({
    where: { id: String(formData.get("couponId") ?? ""), householdId: household.id, giverId: partner.id, archived: false },
  });
  if (!coupon) return;
  await db.award.updateMany({
    where: { id: awardId, householdId: household.id, winnerId: user.id, couponId: null },
    data: { couponId: coupon.id, couponTitle: coupon.title, chosenAt: new Date() },
  });
  refresh();
}

/** Either partner can mark a picked coupon as used. */
export async function markCouponUsedAction(awardId: string) {
  const { household } = await requireHousehold();
  await db.award.updateMany({
    where: { id: awardId, householdId: household.id, couponTitle: { not: null }, usedAt: null },
    data: { usedAt: new Date() },
  });
  refresh();
}
