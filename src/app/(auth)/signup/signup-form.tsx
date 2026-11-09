"use client";

import { useActionState } from "react";
import { signUp } from "@/app/actions/auth";
import { Field, FormMessage, SubmitButton } from "@/components/ui";

export function SignUpForm({ next }: { next?: string }) {
  const [state, action] = useActionState(signUp, undefined);
  return (
    <form action={action} className="space-y-4">
      {next && <input type="hidden" name="next" value={next} />}
      <FormMessage error={state?.errors?.form} />
      <Field label="Your name" name="displayName" autoComplete="given-name" required defaultValue={state?.values?.displayName} error={state?.errors?.displayName} />
      <Field label="Email" name="email" type="email" autoComplete="email" required defaultValue={state?.values?.email} error={state?.errors?.email} />
      <Field label="Password" name="password" type="password" autoComplete="new-password" required minLength={8} hint="At least 8 characters." error={state?.errors?.password} />
      <SubmitButton pendingText="Creating account…">Create account</SubmitButton>
    </form>
  );
}
