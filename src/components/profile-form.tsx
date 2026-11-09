"use client";

import { useActionState } from "react";
import { updateProfileAction } from "@/app/actions/household";
import { Field, FormMessage, SubmitButton } from "@/components/ui";
import { PARTNER_COLORS } from "@/lib/constants";

export function ProfileForm({ displayName, color }: { displayName: string; color: string }) {
  const [state, action] = useActionState(updateProfileAction, undefined);
  return (
    <form action={action} className="space-y-4">
      <FormMessage error={state?.errors?.form} message={state?.message} />
      <Field label="Your name" name="displayName" required defaultValue={displayName} error={state?.errors?.displayName} />
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Your color</legend>
        <p className="text-sm text-muted">Anything assigned to you shows in this color.</p>
        <div className="flex flex-wrap gap-3">
          {PARTNER_COLORS.map((c) => (
            <label key={c.value} className="cursor-pointer">
              <input type="radio" name="color" value={c.value} defaultChecked={c.value === color} className="peer sr-only" />
              <span
                title={c.name}
                className="block h-9 w-9 rounded-full ring-offset-2 ring-offset-surface peer-checked:ring-2 peer-checked:ring-foreground peer-focus-visible:ring-2 peer-focus-visible:ring-honey"
                style={{ backgroundColor: c.value }}
              />
              <span className="sr-only">{c.name}</span>
            </label>
          ))}
        </div>
        {state?.errors?.color && <p className="text-sm text-danger">{state.errors.color}</p>}
      </fieldset>
      <SubmitButton>Save profile</SubmitButton>
    </form>
  );
}
