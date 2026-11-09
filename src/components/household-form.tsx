"use client";

import { useActionState } from "react";
import { createHouseholdAction, updateHouseholdAction } from "@/app/actions/household";
import { Field, FormMessage, SubmitButton } from "@/components/ui";
import { TIME_ZONES } from "@/lib/constants";

const zoneLabel = (z: string) => z.replace("America/", "").replace("Pacific/", "").replace("_", " ");

export function HouseholdForm({
  mode,
  defaults,
}: {
  mode: "create" | "update";
  defaults?: { name: string; timeZone: string };
}) {
  const [state, action] = useActionState(mode === "create" ? createHouseholdAction : updateHouseholdAction, undefined);
  const guessedZone =
    typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : undefined;
  const zone = state?.values?.timeZone ?? defaults?.timeZone ?? (TIME_ZONES.includes(guessedZone as never) ? guessedZone : "America/New_York");

  return (
    <form action={action} className="space-y-4">
      <FormMessage error={state?.errors?.form} message={state?.message} />
      <Field
        label="Household name"
        name="name"
        required
        placeholder="The Smith house"
        defaultValue={state?.values?.name ?? defaults?.name}
        error={state?.errors?.name}
      />
      <div className="space-y-1">
        <label htmlFor="f-timeZone" className="block text-sm font-medium">
          Time zone
        </label>
        <select
          id="f-timeZone"
          name="timeZone"
          defaultValue={zone}
          suppressHydrationWarning
          className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-base"
        >
          {TIME_ZONES.map((z) => (
            <option key={z} value={z}>
              {zoneLabel(z)}
            </option>
          ))}
        </select>
        {state?.errors?.timeZone && <p className="text-sm text-danger">{state.errors.timeZone}</p>}
      </div>
      <SubmitButton pendingText="Saving…">{mode === "create" ? "Create household" : "Save household"}</SubmitButton>
    </form>
  );
}
