"use client";

import Link from "next/link";
import { useOptimistic, useTransition } from "react";
import { setDriverAction } from "@/app/actions/activities";

export type Member = { id: string; displayName: string; color: string };

export type EventView = {
  id: string;
  when: string;
  kid: string;
  activity: string;
  kind: "PRACTICE" | "GAME" | "OTHER";
  title: string | null;
  location: string | null;
  notes: string | null;
  bring: string[];
  cancelled: boolean;
  dropOffId: string | null;
  pickUpId: string | null;
  past: boolean;
};

const KIND = {
  PRACTICE: { label: "Practice", cls: "bg-line/60 text-foreground" },
  GAME: { label: "Game", cls: "bg-honey/25 text-foreground" },
  OTHER: { label: "Event", cls: "bg-line/60 text-foreground" },
} as const;

function DriverSelect({
  eventId,
  role,
  value,
  members,
  label,
  disabled,
}: {
  eventId: string;
  role: "dropOff" | "pickUp";
  value: string | null;
  members: Member[];
  label: string;
  disabled: boolean;
}) {
  const [pending, start] = useTransition();
  const [current, setCurrent] = useOptimistic(value);
  const person = members.find((m) => m.id === current);
  return (
    <label className="flex min-w-0 flex-1 flex-col gap-1 text-xs text-muted">
      {label}
      <select
        value={current ?? "none"}
        disabled={pending || disabled}
        onChange={(e) => {
          const v = e.target.value === "none" ? null : e.target.value;
          start(async () => {
            setCurrent(v);
            await setDriverAction(eventId, role, v);
          });
        }}
        className={`w-full rounded-lg border px-2 py-1.5 text-sm font-medium ${
          person ? "border-line bg-surface text-foreground" : "border-danger/50 bg-danger/5 text-danger"
        }`}
        style={person ? { boxShadow: `inset 4px 0 0 ${person.color}` } : undefined}
      >
        <option value="none">Needs a driver</option>
        {members.map((m) => (
          <option key={m.id} value={m.id}>
            {m.displayName}
          </option>
        ))}
      </select>
    </label>
  );
}

export function EventCard({ e, members, back }: { e: EventView; members: Member[]; back: string }) {
  const kind = KIND[e.kind];
  return (
    <li className={`space-y-2 px-3 py-3 ${e.cancelled || e.past ? "opacity-60" : ""}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm text-muted">{e.when}</p>
          <Link href={`/activities/events/${e.id}?back=${encodeURIComponent(back)}`} className="block font-semibold hover:underline">
            <span className={e.cancelled ? "line-through" : ""}>
              {e.kid}: {e.title ?? e.activity}
            </span>
          </Link>
          {e.title && <p className="text-sm text-muted">{e.activity}</p>}
          {e.location && <p className="truncate text-sm text-muted">{e.location}</p>}
        </div>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${e.cancelled ? "bg-danger/15 text-danger" : kind.cls}`}>
          {e.cancelled ? "Cancelled" : kind.label}
        </span>
      </div>
      {!e.cancelled && (
        <div className="flex gap-2">
          <DriverSelect eventId={e.id} role="dropOff" value={e.dropOffId} members={members} label="Drop-off" disabled={e.past} />
          <DriverSelect eventId={e.id} role="pickUp" value={e.pickUpId} members={members} label="Pick-up" disabled={e.past} />
        </div>
      )}
      {!e.cancelled && (e.bring.length > 0 || e.notes) && (
        <p className="text-sm">
          {e.bring.length > 0 && (
            <>
              <span className="font-medium">Bring:</span> {e.bring.join(", ")}
            </>
          )}
          {e.bring.length > 0 && e.notes && <br />}
          {e.notes && <span className="text-muted">{e.notes}</span>}
        </p>
      )}
    </li>
  );
}
