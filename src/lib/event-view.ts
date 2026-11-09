import type { EventWithActivity } from "./activities";
import { friendlyDate, friendlyTime, toDateStr, type DateStr } from "./dates";
import { timeRange } from "./season";
import type { EventView } from "@/components/activities/event-card";

export function toEventView(e: EventWithActivity, today: DateStr, opts: { withDate?: boolean } = {}): EventView {
  const date = toDateStr(e.date);
  const time = timeRange(e.startTime, e.endTime, friendlyTime);
  return {
    id: e.id,
    when: opts.withDate ? `${friendlyDate(date, today)} · ${time}` : time,
    kid: e.activity.kid.name,
    activity: e.activity.name,
    kind: e.kind,
    title: e.title,
    location: e.location ?? e.activity.location,
    notes: e.notes,
    bring: e.activity.bringList,
    cancelled: e.cancelled,
    dropOffId: e.dropOffId,
    pickUpId: e.pickUpId,
    past: date < today,
  };
}
