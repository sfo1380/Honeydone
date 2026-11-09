"use client";

import { useActionState } from "react";
import { addStarterChoresAction } from "@/app/actions/chores";
import { FormMessage, SubmitButton } from "@/components/ui";

export function StarterForm({
  groups,
}: {
  groups: { category: string; chores: { key: string; title: string; schedule: string; added: boolean }[] }[];
}) {
  const [state, action] = useActionState(addStarterChoresAction, undefined);
  return (
    <form action={action} className="space-y-5">
      <FormMessage error={state?.errors?.form} />
      {groups.map((g) => (
        <fieldset key={g.category} className="rounded-2xl border border-line bg-surface">
          <legend className="sr-only">{g.category}</legend>
          <p aria-hidden className="border-b border-line px-4 py-2 text-sm font-semibold uppercase tracking-wide text-muted">
            {g.category}
          </p>
          <ul className="divide-y divide-line">
            {g.chores.map((c) => (
              <li key={c.key}>
                <label className={`flex items-center gap-3 px-4 py-3 ${c.added ? "opacity-50" : "cursor-pointer"}`}>
                  <input type="checkbox" name="chores" value={c.key} disabled={c.added} className="h-5 w-5 accent-[var(--honey)]" />
                  <span className="flex-1">
                    <span className="block font-medium">{c.title}</span>
                    <span className="block text-sm text-muted">{c.added ? "Already on your list" : c.schedule}</span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </fieldset>
      ))}
      <p className="text-sm text-muted">
        They start as &quot;either of us&quot;. You can assign each one, change its days or set up taking turns afterwards.
      </p>
      <div className="sticky bottom-4">
        <SubmitButton pendingText="Adding…">Add selected chores</SubmitButton>
      </div>
    </form>
  );
}
