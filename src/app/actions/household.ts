"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireHousehold, requireUser } from "@/lib/dal";
import { createHousehold, joinHousehold, regenerateInvite } from "@/lib/household";
import { fieldErrors, householdSchema, kidSchema, profileSchema } from "@/lib/validation";
import type { FormState } from "@/lib/form-state";

export async function createHouseholdAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const parsed = householdSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values: { name: String(formData.get("name") ?? "") } };
  await createHousehold(user.id, parsed.data.name, parsed.data.timeZone);
  redirect("/dashboard");
}

export async function joinHouseholdAction(code: string): Promise<FormState> {
  const user = await requireUser();
  const result = await joinHousehold(user.id, code);
  if (result.ok || result.reason === "already-member") redirect("/dashboard");
  const messages = {
    invalid: "This invite link isn't valid anymore. Ask your partner for a new one.",
    full: "This household already has two partners.",
    "has-household": "You're already in a household, so you can't join another one.",
  } as const;
  return { message: messages[result.reason] };
}

export async function updateProfileAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const parsed = profileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  await db.user.update({ where: { id: user.id }, data: parsed.data });
  revalidatePath("/", "layout");
  return { message: "Profile saved.", values: parsed.data };
}

export async function updateHouseholdAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const { household } = await requireHousehold();
  const parsed = householdSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  await db.household.update({ where: { id: household.id }, data: parsed.data });
  revalidatePath("/", "layout");
  return { message: "Household saved.", values: parsed.data };
}

export async function addKidAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const { household } = await requireHousehold();
  const parsed = kidSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  await db.kid.create({ data: { householdId: household.id, name: parsed.data.name } });
  revalidatePath("/settings");
  return { message: `Added ${parsed.data.name}.` };
}

export async function removeKidAction(kidId: string) {
  const { household } = await requireHousehold();
  await db.kid.deleteMany({ where: { id: kidId, householdId: household.id } });
  revalidatePath("/settings");
}

export async function regenerateInviteAction() {
  const { household } = await requireHousehold();
  await regenerateInvite(household.id);
  revalidatePath("/", "layout");
}
