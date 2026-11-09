"use client";

import { useFormStatus } from "react-dom";
import type { ComponentProps, ReactNode } from "react";

export function Field({
  label,
  name,
  error,
  hint,
  ...input
}: { label: string; name: string; error?: string; hint?: string } & ComponentProps<"input">) {
  const id = `f-${name}`;
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        name={name}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-err` : undefined}
        className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-base outline-none focus:border-honey focus:ring-2 focus:ring-honey/30"
        {...input}
      />
      {hint && !error && <p className="text-sm text-muted">{hint}</p>}
      {error && (
        <p id={`${id}-err`} className="text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

export function SubmitButton({ children, pendingText }: { children: ReactNode; pendingText?: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-lg bg-honey px-4 py-2.5 font-semibold text-honey-ink transition hover:brightness-95 disabled:opacity-60"
    >
      {pending ? (pendingText ?? "Saving…") : children}
    </button>
  );
}

export function FormMessage({ error, message }: { error?: string; message?: string }) {
  if (error) return <p role="alert" className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>;
  if (message) return <p role="status" className="rounded-lg bg-success/10 px-3 py-2 text-sm text-success">{message}</p>;
  return null;
}
