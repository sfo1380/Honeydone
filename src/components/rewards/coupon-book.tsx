"use client";

import { useActionState, useEffect, useRef } from "react";
import { addCouponAction, removeCouponAction } from "@/app/actions/rewards";
import { FormMessage } from "@/components/ui";

export function CouponBook({ coupons, partnerName }: { coupons: { id: string; title: string }[]; partnerName: string }) {
  const [state, action, pending] = useActionState(addCouponAction, undefined);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.message) formRef.current?.reset();
  }, [state]);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        These are the coupons {partnerName} can win from you. Edit the list so they&apos;re worth winning.
      </p>
      {coupons.length > 0 ? (
        <ul className="divide-y divide-line rounded-lg border border-line">
          {coupons.map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-3 px-3 py-2">
              <span>🎟️ {c.title}</span>
              <form action={removeCouponAction.bind(null, c.id)}>
                <button type="submit" className="text-sm text-muted underline hover:text-danger" aria-label={`Remove "${c.title}"`}>
                  Remove
                </button>
              </form>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted">Your book is empty. Add at least one coupon so there&apos;s something to win.</p>
      )}
      <form ref={formRef} action={action} className="flex gap-2">
        <label htmlFor="coupon-title" className="sr-only">
          New coupon
        </label>
        <input
          id="coupon-title"
          name="title"
          required
          maxLength={80}
          placeholder="e.g. I do the school run Friday"
          className="min-w-0 flex-1 rounded-lg border border-line bg-surface px-3 py-2"
        />
        <button type="submit" disabled={pending} className="rounded-lg border border-line px-4 py-2 font-semibold disabled:opacity-60">
          Add
        </button>
      </form>
      <FormMessage error={state?.errors?.title} />
    </div>
  );
}
