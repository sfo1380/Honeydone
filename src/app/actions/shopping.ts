"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireHousehold } from "@/lib/dal";
import {
  addItem,
  clearChecked,
  createList,
  deleteList,
  removeItem,
  renameList,
  setChecked,
  updateItem,
} from "@/lib/shopping";
import { SHOPPING_CATEGORIES } from "@/lib/shopping-catalog";
import { fieldErrors, itemSchema, listNameSchema } from "@/lib/validation";
import type { FormState } from "@/lib/form-state";

function refresh() {
  revalidatePath("/shopping", "layout");
  revalidatePath("/dashboard");
}

export async function createListAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const { household } = await requireHousehold();
  const parsed = listNameSchema.safeParse({ name: formData.get("name") ?? "" });
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  const list = await createList(household.id, parsed.data.name);
  refresh();
  redirect(`/shopping/${list.id}`);
}

export async function renameListAction(listId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const { household } = await requireHousehold();
  const parsed = listNameSchema.safeParse({ name: formData.get("name") ?? "" });
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  await renameList(household.id, listId, parsed.data.name);
  refresh();
  return { message: "List renamed.", values: { name: parsed.data.name } };
}

export async function deleteListAction(listId: string) {
  const { household } = await requireHousehold();
  await deleteList(household.id, listId);
  refresh();
  redirect("/shopping");
}

export async function addItemAction(listId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const { household, user } = await requireHousehold();
  const parsed = itemSchema.safeParse({
    name: formData.get("name") ?? "",
    quantity: formData.get("quantity") ?? "",
    note: formData.get("note") ?? "",
    category: formData.get("category") ?? "",
  });
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  const item = await addItem(household.id, listId, user.id, parsed.data);
  if (!item) return { errors: { form: "This list no longer exists." } };
  refresh();
  return { message: `Added ${item.name}.` };
}

/** One-tap add from the frequent-items chips. */
export async function quickAddAction(listId: string, name: string) {
  const { household, user } = await requireHousehold();
  const parsed = itemSchema.safeParse({ name, quantity: "", note: "", category: "" });
  if (!parsed.success) return;
  await addItem(household.id, listId, user.id, parsed.data);
  refresh();
}

export async function setCheckedAction(itemId: string, checked: boolean) {
  const { household } = await requireHousehold();
  await setChecked(household.id, itemId, checked);
  refresh();
}

export async function updateItemAction(itemId: string, listId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const { household } = await requireHousehold();
  const parsed = itemSchema.safeParse({
    name: formData.get("name") ?? "",
    quantity: formData.get("quantity") ?? "",
    note: formData.get("note") ?? "",
    category: formData.get("category") ?? "",
  });
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  const category =
    parsed.data.category && (SHOPPING_CATEGORIES as readonly string[]).includes(parsed.data.category)
      ? parsed.data.category
      : "Other";
  const ok = await updateItem(household.id, itemId, { ...parsed.data, category });
  if (!ok) return { errors: { form: "That item is no longer on the list." } };
  refresh();
  redirect(`/shopping/${listId}`);
}

export async function removeItemAction(itemId: string) {
  const { household } = await requireHousehold();
  await removeItem(household.id, itemId);
  refresh();
}

export async function clearCheckedAction(listId: string) {
  const { household } = await requireHousehold();
  await clearChecked(household.id, listId);
  refresh();
}
