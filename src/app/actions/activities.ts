"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireHousehold } from "@/lib/dal";
import { isDateStr, todayIn } from "@/lib/dates";
import {
  addEvent,
  addSchedule,
  createActivity,
  deleteActivity,
  deleteEvent,
  removeSchedule,
  setDriver,
  updateActivity,
  updateEvent,
} from "@/lib/activities";
import { activitySchema, eventSchema, fieldErrors, scheduleSchema } from "@/lib/validation";
import type { FormState } from "@/lib/form-state";

function refresh() {
  revalidatePath("/activities", "layout");
  revalidatePath("/dashboard");
}

const str = (f: FormData, k: string) => String(f.get(k) ?? "");

function parseActivity(f: FormData) {
  const parsed = activitySchema.safeParse({
    kidId: str(f, "kidId"),
    name: str(f, "name"),
    team: str(f, "team"),
    coachName: str(f, "coachName"),
    coachContact: str(f, "coachContact"),
    location: str(f, "location"),
    seasonStart: str(f, "seasonStart"),
    seasonEnd: str(f, "seasonEnd"),
    bringList: str(f, "bringList"),
    notes: str(f, "notes"),
  });
  if (!parsed.success) return { errors: fieldErrors(parsed.error) } as const;
  if (!isDateStr(parsed.data.seasonStart) || !isDateStr(parsed.data.seasonEnd)) {
    return { errors: { seasonStart: "Pick real dates." } } as const;
  }
  return { data: parsed.data } as const;
}

function parseEvent(f: FormData) {
  const parsed = eventSchema.safeParse({
    kind: str(f, "kind"),
    title: str(f, "title"),
    date: str(f, "date"),
    startTime: str(f, "startTime"),
    endTime: str(f, "endTime"),
    location: str(f, "location"),
    notes: str(f, "notes"),
    dropOffId: str(f, "dropOffId"),
    pickUpId: str(f, "pickUpId"),
    cancelled: f.get("cancelled") === "on",
  });
  if (!parsed.success) return { errors: fieldErrors(parsed.error) } as const;
  if (!isDateStr(parsed.data.date)) return { errors: { date: "Pick a real date." } } as const;
  return { data: parsed.data } as const;
}

export async function createActivityAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const { household } = await requireHousehold();
  const r = parseActivity(formData);
  if ("errors" in r) return { errors: r.errors };
  const activity = await createActivity(household.id, r.data);
  if (!activity) return { errors: { kidId: "Pick a kid." } };
  refresh();
  redirect(`/activities/${activity.id}?added=1`);
}

export async function updateActivityAction(activityId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const { household } = await requireHousehold();
  const r = parseActivity(formData);
  if ("errors" in r) return { errors: r.errors };
  const saved = await updateActivity(household.id, activityId, r.data, todayIn(household.timeZone));
  if (!saved) return { errors: { form: "That activity no longer exists." } };
  refresh();
  return { message: "Saved." };
}

export async function deleteActivityAction(activityId: string) {
  const { household } = await requireHousehold();
  await deleteActivity(household.id, activityId);
  refresh();
  redirect("/activities?view=manage");
}

export async function addScheduleAction(activityId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const { household } = await requireHousehold();
  const parsed = scheduleSchema.safeParse({
    kind: str(formData, "kind"),
    weekdays: formData.getAll("weekdays").map(String),
    startTime: str(formData, "startTime"),
    endTime: str(formData, "endTime"),
    location: str(formData, "location"),
    defaultDropOffId: str(formData, "defaultDropOffId"),
    defaultPickUpId: str(formData, "defaultPickUpId"),
  });
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  const s = await addSchedule(household.id, activityId, parsed.data, todayIn(household.timeZone));
  if (!s) return { errors: { form: "That activity no longer exists." } };
  refresh();
  return { message: "Weekly time added to the calendar." };
}

export async function removeScheduleAction(scheduleId: string) {
  const { household } = await requireHousehold();
  await removeSchedule(household.id, scheduleId, todayIn(household.timeZone));
  refresh();
}

export async function addEventAction(activityId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const { household } = await requireHousehold();
  const r = parseEvent(formData);
  if ("errors" in r) return { errors: r.errors };
  const e = await addEvent(household.id, activityId, r.data);
  if (!e) return { errors: { form: "That activity no longer exists." } };
  refresh();
  redirect(`/activities/${activityId}`);
}

export async function updateEventAction(eventId: string, back: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const { household } = await requireHousehold();
  const r = parseEvent(formData);
  if ("errors" in r) return { errors: r.errors };
  const e = await updateEvent(household.id, eventId, r.data);
  if (!e) return { errors: { form: "That event no longer exists." } };
  refresh();
  redirect(back.startsWith("/activities") ? back : "/activities");
}

export async function deleteEventAction(eventId: string) {
  const { household } = await requireHousehold();
  await deleteEvent(household.id, eventId);
  refresh();
  redirect("/activities");
}

export async function setDriverAction(eventId: string, role: "dropOff" | "pickUp", userId: string | null) {
  const { household } = await requireHousehold();
  await setDriver(household.id, eventId, role, userId);
  refresh();
}
