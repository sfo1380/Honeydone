"use client";

import { useActionState } from "react";
import { updateItemAction } from "@/app/actions/shopping";
import { Field, FormMessage, SubmitButton } from "@/components/ui";
import { SHOPPING_CATEGORIES } from "@/lib/shopping-catalog";

export function EditItemForm({
  itemId,
  listId,
  item,
}: {
  itemId: string;
  listId: string;
  item: { name: string; quantity: string; note: string; category: string };
}) {
  const [state, action] = useActionState(updateItemAction.bind(null, itemId, listId), undefined);
  const e = state?.errors ?? {};
  return (
    <form action={action} className="space-y-4">
      <FormMessage error={e.form} />
      <Field label="Item" name="name" required maxLength={80} defaultValue={item.name} error={e.name} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Amount (optional)" name="quantity" maxLength={20} defaultValue={item.quantity} error={e.quantity} />
        <div className="space-y-1">
          <label htmlFor="f-category" className="block text-sm font-medium">Aisle</label>
          <select id="f-category" name="category" defaultValue={item.category} className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-base">
            {SHOPPING_CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>
      <Field label="Note (optional)" name="note" maxLength={120} defaultValue={item.note} error={e.note} />
      <SubmitButton>Save item</SubmitButton>
    </form>
  );
}
