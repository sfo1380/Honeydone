"use client";

import { useActionState, useEffect, useRef } from "react";
import { addScheduleAction } from "@/app/actions/activities";
import { Field, FormMessage, SubmitButton } from "@/components/ui";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const select = "w-full rounded-lg border border-line bg-surface px-3 py-2 text-base";

export function ScheduleForm({ activityId, members }: { activityId: string; members: { id: string; displayName: string }[] }) {
  const [state, action] = useActionState(addScheduleAction.bind(null, activityId), undefined);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.message) ref.current?.reset();
  }, [state]);
  const e = state?.errors ?? {};
  return (
    <form ref={ref} action={action} className="space-y-4">
      <FormMessage error={e.form} message={state?.message} />
      <div className="space-y-1">
        <label htmlFor="s-kind" className="block text-sm font-medium">Type</label>
        <select id="s-kind" name="kind" defaultValue="PRACTICE" className={select}>
          <option value="PRACTICE">Practice</option>
          <option value="GAME">Game</option>
          <option value="OTHER">Other</option>
        </select>
      </div>
      <fieldset>
        <legend className="mb-2 text-sm font-medium">Every week on</legend>
        <div className="flex flex-wrap gap-1.5">
          {DAYS.map((d, i) => (
            <label key={d} className="cursor-pointer">
              <input type="checkbox" name="weekdays" value={i} className="peer sr-only" />
              <span className="block w-11 rounded-lg border border-line py-1.5 text-center text-sm peer-checked:border-honey peer-checked:bg-honey/20 peer-checked:font-semibold peer-focus-visible:ring-2 peer-focus-visible:ring-honey">
                {d}
              </span>
            </label>
          ))}
        </div>
        {e.weekdays && <p className="mt-1 text-sm text-danger">{e.weekdays}</p>}
      </fieldset>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Starts" name="startTime" type="time" required error={e.startTime} />
        <Field label="Ends (optional)" name="endTime" type="time" error={e.endTime} />
      </div>
      <Field label="Location (if different)" name="location" maxLength={120} error={e.location} />
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label htmlFor="s-drop" className="block text-sm font-medium">Usual drop-off</label>
          <select id="s-drop" name="defaultDropOffId" defaultValue="none" className={select}>
            <option value="none">Decide each time</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>{m.displayName}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label htmlFor="s-pick" className="block text-sm font-medium">Usual pick-up</label>
          <select id="s-pick" name="defaultPickUpId" defaultValue="none" className={select}>
            <option value="none">Decide each time</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>{m.displayName}</option>
            ))}
          </select>
        </div>
      </div>
      <SubmitButton pendingText="Adding to calendar…">Add weekly time</SubmitButton>
    </form>
  );
}
