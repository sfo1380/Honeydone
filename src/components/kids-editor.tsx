"use client";

import { useActionState, useRef, useEffect } from "react";
import { addKidAction, removeKidAction } from "@/app/actions/household";
import { FormMessage } from "@/components/ui";

export function KidsEditor({ kids }: { kids: { id: string; name: string }[] }) {
  const [state, action, pending] = useActionState(addKidAction, undefined);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.message) formRef.current?.reset();
  }, [state]);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">Used later for chores and the kids&apos; activities.</p>
      {kids.length > 0 && (
        <ul className="divide-y divide-line rounded-lg border border-line">
          {kids.map((k) => (
            <li key={k.id} className="flex items-center justify-between px-3 py-2">
              <span>{k.name}</span>
              <form action={removeKidAction.bind(null, k.id)}>
                <button type="submit" className="text-sm text-muted underline hover:text-danger" aria-label={`Remove ${k.name}`}>
                  Remove
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
      <form ref={formRef} action={action} className="flex gap-2">
        <label htmlFor="kid-name" className="sr-only">
          Kid&apos;s name
        </label>
        <input
          id="kid-name"
          name="name"
          required
          placeholder="Kid's name"
          className="min-w-0 flex-1 rounded-lg border border-line bg-surface px-3 py-2"
        />
        <button type="submit" disabled={pending} className="rounded-lg border border-line px-4 py-2 font-semibold disabled:opacity-60">
          Add
        </button>
      </form>
      <FormMessage error={state?.errors?.name} />
    </div>
  );
}
