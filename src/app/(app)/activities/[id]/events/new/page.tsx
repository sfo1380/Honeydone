import Link from "next/link";
import { notFound } from "next/navigation";
import { addEventAction } from "@/app/actions/activities";
import { Card } from "@/components/card";
import { EventForm } from "@/components/activities/event-form";
import { db } from "@/lib/db";
import { requireHousehold } from "@/lib/dal";
import { todayIn } from "@/lib/dates";

export default async function NewEventPage({ params }: PageProps<"/activities/[id]/events/new">) {
  const { id } = await params;
  const { household } = await requireHousehold();
  const activity = await db.activity.findFirst({ where: { id, householdId: household.id }, include: { kid: true } });
  if (!activity) notFound();
  return (
    <div className="space-y-4">
      <Link href={`/activities/${activity.id}`} className="text-sm text-muted hover:text-foreground">
        ← {activity.kid.name}: {activity.name}
      </Link>
      <h1 className="text-2xl font-bold">Add a game or event</h1>
      <Card>
        <EventForm
          action={addEventAction.bind(null, activity.id)}
          members={household.members}
          submitLabel="Add to calendar"
          defaults={{
            kind: "GAME",
            title: "",
            date: todayIn(household.timeZone),
            startTime: "",
            endTime: "",
            location: activity.location ?? "",
            notes: "",
            dropOffId: "",
            pickUpId: "",
            cancelled: false,
          }}
        />
      </Card>
    </div>
  );
}
