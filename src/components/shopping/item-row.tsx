"use client";

import Link from "next/link";
import { useOptimistic, useTransition } from "react";
import { removeItemAction, setCheckedAction } from "@/app/actions/shopping";

export type ItemView = {
  id: string;
  listId: string;
  name: string;
  quantity: string | null;
  note: string | null;
  checked: boolean;
  addedBy: { name: string; color: string } | null;
};

export function ItemRow({ item }: { item: ItemView }) {
  const [pending, start] = useTransition();
  const [checked, setChecked] = useOptimistic(item.checked);
  const [removed, setRemoved] = useOptimistic(false);
  if (removed) return null;

  return (
    <li className="flex items-center gap-3 px-3 py-2.5">
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        aria-label={checked ? `Put "${item.name}" back on the list` : `Check off "${item.name}"`}
        disabled={pending}
        onClick={() =>
          start(async () => {
            setChecked(!checked);
            await setCheckedAction(item.id, !checked);
          })
        }
        className={`grid h-7 w-7 shrink-0 place-items-center rounded-md border-2 transition ${
          checked ? "border-success bg-success text-white" : "border-line hover:border-honey"
        }`}
      >
        {checked && <span aria-hidden>✓</span>}
      </button>
      <Link href={`/shopping/${item.listId}/items/${item.id}`} className="min-w-0 flex-1">
        <span className={`block truncate ${checked ? "text-muted line-through" : "font-medium"}`}>
          {item.name}
          {item.quantity && <span className="font-normal text-muted"> · {item.quantity}</span>}
        </span>
        {item.note && <span className="block truncate text-sm text-muted">{item.note}</span>}
      </Link>
      {item.addedBy && (
        <span
          title={`Added by ${item.addedBy.name}`}
          className="h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: item.addedBy.color }}
        />
      )}
      <button
        type="button"
        aria-label={`Remove "${item.name}"`}
        disabled={pending}
        onClick={() =>
          start(async () => {
            setRemoved(true);
            await removeItemAction(item.id);
          })
        }
        className="shrink-0 rounded px-1.5 text-lg leading-none text-muted hover:text-danger"
      >
        ×
      </button>
    </li>
  );
}
