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

export const choreSchema = z
  .object({
    title: z.string().trim().min(1, "Give the chore a name.").max(80, "Keep the name under 80 characters."),
    notes: z
      .string()
      .trim()
      .max(500, "Keep notes under 500 characters.")
      .transform((v) => v || null),
    category: z.string().trim().min(1).max(40),
    effort: z.enum(["SMALL", "MEDIUM", "LARGE"], "Pick a size."),
    owner: z.string().min(1, "Pick who does it."),
    rotate: z.boolean(),
    repeat: z.enum(["NONE", "DAILY", "WEEKLY", "MONTHLY"], "Pick how often."),
    interval: z.coerce.number().int().min(1, "Use 1 or more.").max(52, "Use 52 or less."),
    weekdays: z.array(z.coerce.number().int().min(0).max(6)),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a date."),
    dueTime: z
      .string()
      .regex(/^(\d{2}:\d{2})?$/, "Pick a time.")
      .transform((v) => v || null),
  })
  .refine((c) => c.repeat !== "WEEKLY" || c.weekdays.length > 0, {
    path: ["weekdays"],
    message: "Pick at least one day.",
  })
  .refine((c) => !c.rotate || c.owner !== "either", {
    path: ["rotate"],
    message: "Pick a starting partner to take turns.",
  });

/** Reads the chore form, including the repeated `weekdays` checkboxes. */
export function choreFormValues(formData: FormData) {
  return {
    title: String(formData.get("title") ?? ""),
    notes: String(formData.get("notes") ?? ""),
    category: String(formData.get("category") ?? "Other"),
    effort: String(formData.get("effort") ?? ""),
    owner: String(formData.get("owner") ?? ""),
    rotate: formData.get("rotate") === "on",
    repeat: String(formData.get("repeat") ?? ""),
    interval: String(formData.get("interval") ?? "1"),
    weekdays: formData.getAll("weekdays").map(String),
    startDate: String(formData.get("startDate") ?? ""),
    dueTime: String(formData.get("dueTime") ?? ""),
  };
}

const optionalText = (max: number, label: string) =>
  z
    .string()
    .trim()
    .max(max, `Keep ${label} under ${max} characters.`)
    .transform((v) => v || null);

export const listNameSchema = z.object({
  name: z.string().trim().min(1, "Give the list a name.").max(40, "Keep the name under 40 characters."),
});

export const itemSchema = z.object({
  name: z.string().trim().min(1, "Type an item.").max(80, "Keep the item under 80 characters."),
  quantity: optionalText(20, "the amount"),
  note: optionalText(120, "the note"),
  category: z
    .string()
    .trim()
    .transform((v) => (v && v !== "auto" ? v : null)),
});

const time = z.string().regex(/^\d{2}:\d{2}$/, "Pick a time.");
const optionalTime = z
  .string()
  .regex(/^(\d{2}:\d{2})?$/, "Pick a time.")
  .transform((v) => v || null);
const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a date.");
const personOrNone = z.string().transform((v) => (v && v !== "none" ? v : null));
const eventKind = z.enum(["PRACTICE", "GAME", "OTHER"], "Pick a type.");

export const activitySchema = z
  .object({
    kidId: z.string().min(1, "Pick a kid."),
    name: z.string().trim().min(1, "Name the activity.").max(60, "Keep the name under 60 characters."),
    team: optionalText(60, "the team"),
    coachName: optionalText(60, "the coach's name"),
    coachContact: optionalText(80, "the contact"),
    location: optionalText(120, "the location"),
    seasonStart: day,
    seasonEnd: day,
    bringList: z
      .string()
      .max(1000)
      .transform((v) =>
        v
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean)
          .slice(0, 20),
      ),
    notes: optionalText(500, "notes"),
  })
  .refine((a) => a.seasonEnd >= a.seasonStart, { path: ["seasonEnd"], message: "The season has to end after it starts." })
  .refine(
    (a) => (new Date(a.seasonEnd).getTime() - new Date(a.seasonStart).getTime()) / 86_400_000 <= 366,
    { path: ["seasonEnd"], message: "Keep a season to a year or less." },
  );

export const scheduleSchema = z
  .object({
    kind: eventKind,
    weekdays: z.array(z.coerce.number().int().min(0).max(6)).min(1, "Pick at least one day."),
    startTime: time,
    endTime: optionalTime,
    location: optionalText(120, "the location"),
    defaultDropOffId: personOrNone,
    defaultPickUpId: personOrNone,
  })
  .refine((s) => !s.endTime || s.endTime > s.startTime, { path: ["endTime"], message: "End after it starts." });

export const eventSchema = z
  .object({
    kind: eventKind,
    title: optionalText(60, "the title"),
    date: day,
    startTime: time,
    endTime: optionalTime,
    location: optionalText(120, "the location"),
    notes: optionalText(300, "notes"),
    dropOffId: personOrNone,
    pickUpId: personOrNone,
    cancelled: z.boolean(),
  })
  .refine((s) => !s.endTime || s.endTime > s.startTime, { path: ["endTime"], message: "End after it starts." });
