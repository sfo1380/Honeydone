"use client";

import { useActionState } from "react";
import { Field, FormMessage, SubmitButton } from "@/components/ui";
import type { FormState } from "@/lib/form-state";

export type EventDefaults = {
  kind: "PRACTICE" | "GAME" | "OTHER";
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  notes: string;
  dropOffId: string;
  pickUpId: string;
  cancelled: boolean;
};

const select = "w-full rounded-lg border border-line bg-surface px-3 py-2 text-base";

export function EventForm({
  action,
  defaults,
  members,
  submitLabel,
  isEdit,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  defaults: EventDefaults;
  members: { id: string; displayName: string }[];
  submitLabel: string;
  isEdit?: boolean;
}) {
  const [state, formAction] = useActionState(action, undefined);
  const e = state?.errors ?? {};
  return (
    <form action={formAction} className="space-y-4">
      <FormMessage error={e.form} />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor="e-kind" className="block text-sm font-medium">Type</label>
          <select id="e-kind" name="kind" defaultValue={defaults.kind} className={select}>
            <option value="GAME">Game</option>
            <option value="PRACTICE">Practice</option>
            <option value="OTHER">Other event</option>
          </select>
        </div>
        <Field label="Title (optional)" name="title" maxLength={60} placeholder="vs. Red Rockets" defaultValue={defaults.title} error={e.title} />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Field label="Date" name="date" type="date" required defaultValue={defaults.date} error={e.date} />
        <Field label="Starts" name="startTime" type="time" required defaultValue={defaults.startTime} error={e.startTime} />
        <Field label="Ends" name="endTime" type="time" defaultValue={defaults.endTime} error={e.endTime} />
      </div>
      <Field label="Location (optional)" name="location" maxLength={120} defaultValue={defaults.location} error={e.location} />
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label htmlFor="e-drop" className="block text-sm font-medium">Drop-off</label>
          <select id="e-drop" name="dropOffId" defaultValue={defaults.dropOffId || "none"} className={select}>
            <option value="none">Needs a driver</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>{m.displayName}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label htmlFor="e-pick" className="block text-sm font-medium">Pick-up</label>
          <select id="e-pick" name="pickUpId" defaultValue={defaults.pickUpId || "none"} className={select}>
            <option value="none">Needs a driver</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>{m.displayName}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="space-y-1">
        <label htmlFor="e-notes" className="block text-sm font-medium">Notes (snack duty, uniform color…)</label>
        <textarea id="e-notes" name="notes" rows={2} maxLength={300} defaultValue={defaults.notes} className="w-full rounded-lg border border-line bg-surface px-3 py-2" />
      </div>
      {isEdit && (
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="cancelled" defaultChecked={defaults.cancelled} className="h-4 w-4 accent-[var(--danger)]" />
          Cancelled
        </label>
      )}
      <SubmitButton>{submitLabel}</SubmitButton>
    </form>
  );
}
