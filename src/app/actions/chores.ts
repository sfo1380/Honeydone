"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireHousehold } from "@/lib/dal";
import { isDateStr, todayIn } from "@/lib/dates";
import {
  addStarterChores,
  archiveChore,
  completeTask,
  createChore,
  undoTask,
  updateChore,
  type ChoreInput,
} from "@/lib/chores";
import { choreFormValues, choreSchema, fieldErrors } from "@/lib/validation";
import type { FormState } from "@/lib/form-state";

async function parseChore(formData: FormData): Promise<{ input: ChoreInput } | { state: FormState }> {
  const { household } = await requireHousehold();
  const raw = choreFormValues(formData);
  const parsed = choreSchema.safeParse(raw);
  if (!parsed.success) return { state: { errors: fieldErrors(parsed.error) } };
  const c = parsed.data;
  if (!isDateStr(c.startDate)) return { state: { errors: { startDate: "Pick a real date." } } };
  const ownerId = c.owner === "either" ? null : c.owner;
  if (ownerId && !household.members.some((m) => m.id === ownerId)) {
    return { state: { errors: { owner: "Pick who does it." } } };
  }
  return {
    input: {
      title: c.title,
      notes: c.notes,
      category: c.category,
      effort: c.effort,
      ownerId,
      rotate: c.rotate && !!ownerId && household.members.length > 1,
      repeat: c.repeat,
      interval: c.repeat === "NONE" ? 1 : c.interval,
      weekdays: c.repeat === "WEEKLY" ? [...new Set(c.weekdays)].sort() : [],
      startDate: c.startDate,
      dueTime: c.dueTime,
    },
  };
}

function refresh() {
  // "layout" also covers /chores/[id], so an edit page never shows stale values.
  revalidatePath("/chores", "layout");
  revalidatePath("/dashboard");
}

export async function createChoreAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const { household } = await requireHousehold();
  const result = await parseChore(formData);
  if ("state" in result) return result.state;
  await createChore(household.id, result.input);
  refresh();
  redirect("/chores?view=all");
}

export async function updateChoreAction(choreId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const { household } = await requireHousehold();
  const result = await parseChore(formData);
  if ("state" in result) return result.state;
  const saved = await updateChore(household.id, choreId, result.input);
  if (!saved) return { errors: { form: "That chore no longer exists." } };
  refresh();
  redirect("/chores?view=all");
}

export async function deleteChoreAction(choreId: string) {
  const { household } = await requireHousehold();
  await archiveChore(household.id, choreId);
  refresh();
  redirect("/chores?view=all");
}

export async function completeTaskAction(taskId: string) {
  const { household, user } = await requireHousehold();
  await completeTask(household.id, taskId, user.id);
  refresh();
}

export async function undoTaskAction(taskId: string) {
  const { household } = await requireHousehold();
  await undoTask(household.id, taskId);
  refresh();
}

export async function addStarterChoresAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const { household } = await requireHousehold();
  const keys = formData.getAll("chores").map(String);
  if (!keys.length) return { errors: { form: "Pick at least one chore." } };
  await addStarterChores(household.id, keys, todayIn(household.timeZone));
  refresh();
  redirect("/chores?view=all");
}
