import { z } from "zod";
import { PARTNER_COLORS, TIME_ZONES } from "./constants";

const email = z.string().trim().toLowerCase().email("Enter a valid email address.");

export const signUpSchema = z.object({
  displayName: z.string().trim().min(1, "Enter your name.").max(40, "Keep your name under 40 characters."),
  email,
  password: z
    .string()
    .min(8, "Use at least 8 characters.")
    .max(200, "That password is too long."),
});

export const signInSchema = z.object({
  email,
  password: z.string().min(1, "Enter your password."),
});

const colorValues = PARTNER_COLORS.map((c) => c.value) as [string, ...string[]];

export const profileSchema = z.object({
  displayName: z.string().trim().min(1, "Enter your name.").max(40, "Keep your name under 40 characters."),
  color: z.enum(colorValues, "Pick one of the colors."),
});

export const householdSchema = z.object({
  name: z.string().trim().min(1, "Give your household a name.").max(60, "Keep the name under 60 characters."),
  timeZone: z.enum(TIME_ZONES, "Pick a time zone."),
});

export const kidSchema = z.object({
  name: z.string().trim().min(1, "Enter a name.").max(40, "Keep the name under 40 characters."),
});

/** Turns zod issues into `{ field: firstMessage }`. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    out[key] ??= issue.message;
  }
  return out;
}
