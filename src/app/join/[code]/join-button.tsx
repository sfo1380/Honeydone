"use client";

import { useActionState } from "react";
import { joinHouseholdAction } from "@/app/actions/household";
import { FormMessage, SubmitButton } from "@/components/ui";

export function JoinButton({ code }: { code: string }) {
  const [state, action] = useActionState(() => joinHouseholdAction(code), undefined);
  return (
    <form action={action} className="space-y-3">
      <FormMessage error={state?.message} />
      <SubmitButton pendingText="Joining…">Join household</SubmitButton>
    </form>
  );
}
