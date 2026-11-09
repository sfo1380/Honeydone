import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteEventAction, updateEventAction } from "@/app/actions/activities";
import { Card } from "@/components/card";
import { EventForm } from "@/components/activities/event-form";
import { db } from "@/lib/db";
import { requireHousehold } from "@/lib/dal";
import { toDateStr } from "@/lib/dates";

export default async function EditEventPage({ params, searchParams }: PageProps<"/activities/events/[eventId]">) {
  const [{ eventId }, sp] = await Promise.all([params, searchParams]);
  const { household } = await requireHousehold();
  const event = await db.activityEvent.findFirst({
    where: { id: eventId, householdId: household.id },
    include: { activity: { include: { kid: true } } },
  });
  if (!event) notFound();
  const back = typeof sp.back === "string" && sp.back.startsWith("/activities") ? sp.back : "/activities";

  return (
    <div className="space-y-4">
      <Link href={back} className="text-sm text-muted hover:text-foreground">← Back</Link>
      <div>
        <h1 className="text-2xl font-bold">Edit event</h1>
        <p className="text-muted">
          <Link href={`/activities/${event.activityId}`} className="underline">
            {event.activity.kid.name}: {event.activity.name}
          </Link>
          {event.scheduleId ? " · repeats weekly; this changes only this date" : ""}
        </p>
      </div>
      {event.activity.bringList.length > 0 && (
        <p className="text-sm">
          <span className="font-medium">Bring:</span> {event.activity.bringList.join(", ")}
        </p>
      )}
      <Card>
        <EventForm
          key={event.updatedAt.toISOString()}
          isEdit
          action={updateEventAction.bind(null, event.id, back)}
          members={household.members}
          submitLabel="Save event"
          defaults={{
            kind: event.kind,
            title: event.title ?? "",
            date: toDateStr(event.date),
            startTime: event.startTime,
            endTime: event.endTime ?? "",
            location: event.location ?? "",
            notes: event.notes ?? "",
            dropOffId: event.dropOffId ?? "",
            pickUpId: event.pickUpId ?? "",
            cancelled: event.cancelled,
          }}
        />
      </Card>
      <form action={deleteEventAction.bind(null, event.id)}>
        <button type="submit" className="text-sm text-danger underline">Delete this event</button>
      </form>
    </div>
  );
}
