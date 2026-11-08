"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { createSession, deleteSession } from "@/lib/session";
import { fieldErrors, signInSchema, signUpSchema } from "@/lib/validation";
import type { FormState } from "@/lib/form-state";
import { safeNext } from "@/lib/safe-next";


export async function signUp(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = signUpSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values: { displayName: String(formData.get("displayName") ?? ""), email: String(formData.get("email") ?? "") } };
  const { displayName, email, password } = parsed.data;

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return { errors: { email: "There's already an account with that email. Try signing in." }, values: { displayName, email } };
  }

  const user = await db.user.create({
    data: { displayName, email, passwordHash: await bcrypt.hash(password, 12) },
  });
  await createSession(user.id);
  redirect(safeNext(formData.get("next")) ?? "/setup");
}

export async function signIn(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = signInSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values: { email: String(formData.get("email") ?? "") } };
  const { email, password } = parsed.data;

  const user = await db.user.findUnique({ where: { email } });
  const ok = user ? await bcrypt.compare(password, user.passwordHash) : false;
  if (!user || !ok) return { errors: { form: "That email and password don't match." }, values: { email } };

  await createSession(user.id);
  redirect(safeNext(formData.get("next")) ?? (user.householdId ? "/dashboard" : "/setup"));
}

export async function signOut() {
  await deleteSession();
  redirect("/");
}
