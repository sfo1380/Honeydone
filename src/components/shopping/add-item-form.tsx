"use client";

import { useActionState, useEffect, useRef, useTransition } from "react";
import { addItemAction, quickAddAction } from "@/app/actions/shopping";
import { FormMessage } from "@/components/ui";
import { SHOPPING_CATEGORIES } from "@/lib/shopping-catalog";

export function AddItemForm({ listId, pastNames }: { listId: string; pastNames: string[] }) {
  const [state, action, pending] = useActionState(addItemAction.bind(null, listId), undefined);
  const formRef = useRef<HTMLFormElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state?.message) {
      formRef.current?.reset();
      nameRef.current?.focus();
    }
  }, [state]);

  return (
    <form ref={formRef} action={action} className="space-y-2">
      <div className="flex gap-2">
        <label htmlFor="item-name" className="sr-only">Add an item</label>
        <input
          ref={nameRef}
          id="item-name"
          name="name"
          required
          maxLength={80}
          list="past-items"
          autoComplete="off"
          placeholder="Add an item"
          className="min-w-0 flex-1 rounded-lg border border-line bg-surface px-3 py-2.5 text-base"
        />
        <button type="submit" disabled={pending} className="shrink-0 rounded-lg bg-honey px-4 font-semibold text-honey-ink disabled:opacity-60">
          Add
        </button>
      </div>
      <datalist id="past-items">
        {pastNames.map((n) => (
          <option key={n} value={n} />
        ))}
      </datalist>
      <details className="text-sm">
        <summary className="cursor-pointer text-muted">Amount, note or aisle</summary>
        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          <input name="quantity" maxLength={20} placeholder="Amount (2 lbs)" aria-label="Amount" className="rounded-lg border border-line bg-surface px-3 py-2" />
          <input name="note" maxLength={120} placeholder="Note (the organic one)" aria-label="Note" className="rounded-lg border border-line bg-surface px-3 py-2" />
          <select name="category" defaultValue="auto" aria-label="Aisle" className="rounded-lg border border-line bg-surface px-3 py-2">
            <option value="auto">Aisle: pick for me</option>
            {SHOPPING_CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
      </details>
      <FormMessage error={state?.errors?.name ?? state?.errors?.form ?? state?.errors?.quantity ?? state?.errors?.note} />
    </form>
  );
}

export function FrequentItems({ listId, names }: { listId: string; names: string[] }) {
  const [pending, start] = useTransition();
  if (!names.length) return null;
  return (
    <div className="space-y-2">
      <p className="text-sm text-muted">You often buy</p>
      <div className="flex flex-wrap gap-2">
        {names.map((n) => (
          <button
            key={n}
            type="button"
            disabled={pending}
            onClick={() => start(() => quickAddAction(listId, n))}
            className="rounded-full border border-line bg-surface px-3 py-1 text-sm hover:border-honey disabled:opacity-60"
          >
            + {n}
          </button>
        ))}
      </div>
    </div>
  );
}
