"use client";

import { useActionState } from "react";
import { signIn } from "@/app/actions/auth";
import { Field, FormMessage, SubmitButton } from "@/components/ui";

export function SignInForm({ next }: { next?: string }) {
  const [state, action] = useActionState(signIn, undefined);
  return (
    <form action={action} className="space-y-4">
      {next && <input type="hidden" name="next" value={next} />}
      <FormMessage error={state?.errors?.form} />
      <Field label="Email" name="email" type="email" autoComplete="email" required defaultValue={state?.values?.email} error={state?.errors?.email} />
      <Field label="Password" name="password" type="password" autoComplete="current-password" required error={state?.errors?.password} />
      <SubmitButton pendingText="Signing in…">Sign in</SubmitButton>
    </form>
  );
}
