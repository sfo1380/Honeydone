"use client";

import { useActionState } from "react";
import { createListAction, renameListAction } from "@/app/actions/shopping";
import { FormMessage } from "@/components/ui";

const input = "min-w-0 flex-1 rounded-lg border border-line bg-surface px-3 py-2";
const button = "shrink-0 rounded-lg border border-line px-4 py-2 font-semibold disabled:opacity-60";

export function NewListForm() {
  const [state, action, pending] = useActionState(createListAction, undefined);
  return (
    <form action={action} className="space-y-2">
      <div className="flex gap-2">
        <label htmlFor="new-list" className="sr-only">List name</label>
        <input id="new-list" name="name" required maxLength={40} placeholder="Costco, Target, Hardware store…" className={input} />
        <button type="submit" disabled={pending} className={button}>Create</button>
      </div>
      <FormMessage error={state?.errors?.name} />
    </form>
  );
}

export function RenameListForm({ listId, name }: { listId: string; name: string }) {
  const [state, action, pending] = useActionState(renameListAction.bind(null, listId), undefined);
  return (
    <form action={action} className="space-y-2">
      <div className="flex gap-2">
        <label htmlFor="rename-list" className="sr-only">List name</label>
        <input id="rename-list" name="name" required maxLength={40} defaultValue={state?.values?.name ?? name} className={input} />
        <button type="submit" disabled={pending} className={button}>Rename</button>
      </div>
      <FormMessage error={state?.errors?.name} message={state?.message} />
    </form>
  );
}
