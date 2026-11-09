"use client";

import { useActionState } from "react";
import { Field, FormMessage, SubmitButton } from "@/components/ui";
import type { FormState } from "@/lib/form-state";

export type ActivityDefaults = {
  kidId: string;
  name: string;
  team: string;
  coachName: string;
  coachContact: string;
  location: string;
  seasonStart: string;
  seasonEnd: string;
  bringList: string;
  notes: string;
};

export function ActivityForm({
  action,
  kids,
  defaults,
  submitLabel,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  kids: { id: string; name: string }[];
  defaults: ActivityDefaults;
  submitLabel: string;
}) {
  const [state, formAction] = useActionState(action, undefined);
  const e = state?.errors ?? {};
  return (
    <form action={formAction} className="space-y-4">
      <FormMessage error={e.form} message={state?.message} />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor="f-kidId" className="block text-sm font-medium">Kid</label>
          <select id="f-kidId" name="kidId" defaultValue={defaults.kidId} className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-base">
            {kids.map((k) => (
              <option key={k.id} value={k.id}>{k.name}</option>
            ))}
          </select>
          {e.kidId && <p className="text-sm text-danger">{e.kidId}</p>}
        </div>
        <Field label="Activity" name="name" required maxLength={60} placeholder="Spring soccer" defaultValue={defaults.name} error={e.name} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Season starts" name="seasonStart" type="date" required defaultValue={defaults.seasonStart} error={e.seasonStart} />
        <Field label="Season ends" name="seasonEnd" type="date" required defaultValue={defaults.seasonEnd} error={e.seasonEnd} />
      </div>
      <Field label="Usual location (optional)" name="location" maxLength={120} placeholder="Riverside Park, field 3" defaultValue={defaults.location} error={e.location} />
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Team (optional)" name="team" maxLength={60} placeholder="Blue Sharks" defaultValue={defaults.team} error={e.team} />
        <Field label="Coach (optional)" name="coachName" maxLength={60} defaultValue={defaults.coachName} error={e.coachName} />
        <Field label="Coach phone or email" name="coachContact" maxLength={80} defaultValue={defaults.coachContact} error={e.coachContact} />
      </div>
      <div className="space-y-1">
        <label htmlFor="f-bringList" className="block text-sm font-medium">What to bring (one per line)</label>
        <textarea
          id="f-bringList"
          name="bringList"
          rows={3}
          defaultValue={defaults.bringList}
          placeholder={"Cleats\nShin guards\nWater bottle"}
          className="w-full rounded-lg border border-line bg-surface px-3 py-2"
        />
      </div>
      <div className="space-y-1">
        <label htmlFor="f-notes" className="block text-sm font-medium">Notes (optional)</label>
        <textarea id="f-notes" name="notes" rows={2} maxLength={500} defaultValue={defaults.notes} className="w-full rounded-lg border border-line bg-surface px-3 py-2" />
      </div>
      <SubmitButton>{submitLabel}</SubmitButton>
    </form>
  );
}
