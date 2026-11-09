"use client";

import { useActionState, useState } from "react";
import { Field, FormMessage, SubmitButton } from "@/components/ui";
import { CHORE_CATEGORIES, EFFORTS } from "@/lib/chore-catalog";
import type { FormState } from "@/lib/form-state";

export type ChoreDefaults = {
  title: string;
  notes: string;
  category: string;
  effort: "SMALL" | "MEDIUM" | "LARGE";
  owner: string;
  rotate: boolean;
  repeat: "NONE" | "DAILY" | "WEEKLY" | "MONTHLY";
  interval: number;
  weekdays: number[];
  startDate: string;
  dueTime: string;
};

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const UNIT = { DAILY: "day", WEEKLY: "week", MONTHLY: "month", NONE: "" } as const;
const select = "w-full rounded-lg border border-line bg-surface px-3 py-2 text-base";

export function ChoreForm({
  action,
  defaults,
  members,
  submitLabel,
  isEdit,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  defaults: ChoreDefaults;
  members: { id: string; displayName: string }[];
  submitLabel: string;
  isEdit?: boolean;
}) {
  const [state, formAction] = useActionState(action, undefined);
  const [repeat, setRepeat] = useState(defaults.repeat);
  const [owner, setOwner] = useState(defaults.owner);
  const [interval, setIntervalValue] = useState(defaults.interval);
  const e = state?.errors ?? {};

  return (
    <form action={formAction} className="space-y-5">
      <FormMessage error={e.form} />
      <Field label="Chore" name="title" required maxLength={80} placeholder="Take out the trash" defaultValue={defaults.title} error={e.title} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor="f-owner" className="block text-sm font-medium">Who does it</label>
          <select id="f-owner" name="owner" className={select} value={owner} onChange={(ev) => setOwner(ev.target.value)}>
            {members.map((m) => (
              <option key={m.id} value={m.id}>{m.displayName}</option>
            ))}
            <option value="either">Either of us</option>
          </select>
          {e.owner && <p className="text-sm text-danger">{e.owner}</p>}
        </div>
        <div className="space-y-1">
          <label htmlFor="f-category" className="block text-sm font-medium">Room or area</label>
          <select id="f-category" name="category" defaultValue={defaults.category} className={select}>
            {CHORE_CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {members.length > 1 && owner !== "either" && (
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" name="rotate" defaultChecked={defaults.rotate} className="mt-0.5 h-4 w-4 accent-[var(--honey)]" />
          <span>
            <span className="font-medium">Take turns.</span>{" "}
            <span className="text-muted">Each time it repeats, it switches to the other partner.</span>
          </span>
        </label>
      )}
      {e.rotate && <p className="text-sm text-danger">{e.rotate}</p>}

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Size</legend>
        <div className="grid grid-cols-3 gap-2">
          {EFFORTS.map((ef) => (
            <label key={ef.value} className="cursor-pointer">
              <input type="radio" name="effort" value={ef.value} defaultChecked={defaults.effort === ef.value} className="peer sr-only" />
              <span className="block rounded-lg border border-line px-2 py-2 text-center peer-checked:border-honey peer-checked:bg-honey/15 peer-focus-visible:ring-2 peer-focus-visible:ring-honey">
                <span className="block font-medium">{ef.label}</span>
                <span className="block text-xs text-muted">{ef.hint}</span>
              </span>
            </label>
          ))}
        </div>
        {e.effort && <p className="text-sm text-danger">{e.effort}</p>}
      </fieldset>

      <div className="space-y-3 rounded-xl border border-line p-4">
        <div className="space-y-1">
          <label htmlFor="f-repeat" className="block text-sm font-medium">How often</label>
          <select id="f-repeat" name="repeat" className={select} value={repeat} onChange={(ev) => setRepeat(ev.target.value as ChoreDefaults["repeat"])}>
            <option value="NONE">Just once</option>
            <option value="DAILY">Daily</option>
            <option value="WEEKLY">Weekly</option>
            <option value="MONTHLY">Monthly</option>
          </select>
        </div>
        {repeat !== "NONE" && (
          <div className="flex items-center gap-2 text-sm">
            <label htmlFor="f-interval">Every</label>
            <input
              id="f-interval"
              name="interval"
              type="number"
              min={1}
              max={52}
              value={interval}
              onChange={(ev) => setIntervalValue(Number(ev.target.value) || 1)}
              className="w-16 rounded-lg border border-line bg-surface px-2 py-1.5"
            />
            <span>{UNIT[repeat]}{interval === 1 ? "" : "s"}</span>
            {e.interval && <span className="text-danger">{e.interval}</span>}
          </div>
        )}
        {repeat === "WEEKLY" && (
          <fieldset>
            <legend className="mb-2 text-sm">On</legend>
            <div className="flex flex-wrap gap-1.5">
              {DAYS.map((d, i) => (
                <label key={d} className="cursor-pointer">
                  <input type="checkbox" name="weekdays" value={i} defaultChecked={defaults.weekdays.includes(i)} className="peer sr-only" />
                  <span className="block w-11 rounded-lg border border-line py-1.5 text-center text-sm peer-checked:border-honey peer-checked:bg-honey/20 peer-checked:font-semibold peer-focus-visible:ring-2 peer-focus-visible:ring-honey">
                    {d}
                  </span>
                </label>
              ))}
            </div>
            {e.weekdays && <p className="mt-1 text-sm text-danger">{e.weekdays}</p>}
          </fieldset>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label={isEdit ? "Next due" : repeat === "NONE" ? "Due" : "Starting"}
            name="startDate"
            type="date"
            required
            defaultValue={defaults.startDate}
            error={e.startDate}
          />
          <Field label="Time (optional)" name="dueTime" type="time" defaultValue={defaults.dueTime} error={e.dueTime} />
        </div>
      </div>

      <div className="space-y-1">
        <label htmlFor="f-notes" className="block text-sm font-medium">Notes (optional)</label>
        <textarea
          id="f-notes"
          name="notes"
          rows={2}
          maxLength={500}
          defaultValue={defaults.notes}
          className="w-full rounded-lg border border-line bg-surface px-3 py-2"
        />
      </div>

      <SubmitButton>{submitLabel}</SubmitButton>
    </form>
  );
}
