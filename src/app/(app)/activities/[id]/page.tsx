import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteActivityAction, removeScheduleAction, updateActivityAction } from "@/app/actions/activities";
import { Card } from "@/components/card";
import { ActivityForm } from "@/components/activities/activity-form";
import { EventCard } from "@/components/activities/event-card";
import { ScheduleForm } from "@/components/activities/schedule-form";
import { db } from "@/lib/db";
import { requireHousehold } from "@/lib/dal";
import { friendlyTime, fromDateStr, todayIn, toDateStr } from "@/lib/dates";
import { toEventView } from "@/lib/event-view";
import { timeRange } from "@/lib/season";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const KIND = { PRACTICE: "Practice", GAME: "Game", OTHER: "Event" } as const;

export default async function ActivityPage({ params, searchParams }: PageProps<"/activities/[id]">) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const { household } = await requireHousehold();
  const today = todayIn(household.timeZone);
  const activity = await db.activity.findFirst({
    where: { id, householdId: household.id },
    include: {
      kid: true,
      schedules: { orderBy: { createdAt: "asc" } },
      events: {
        where: { date: { gte: fromDateStr(today) } },
        orderBy: [{ date: "asc" }, { startTime: "asc" }],
        take: 8,
        include: { activity: { include: { kid: true } } },
      },
    },
  });
  if (!activity) notFound();
  const name = (uid: string | null) => household.members.find((m) => m.id === uid)?.displayName;
  const back = `/activities/${activity.id}`;

  return (
    <div className="space-y-5">
      <Link href="/activities?view=manage" className="text-sm text-muted hover:text-foreground">← Activities</Link>
      <div>
        <h1 className="text-2xl font-bold">
          {activity.kid.name}: {activity.name}
        </h1>
        <p className="text-muted">
          {[activity.team, activity.coachName && `Coach ${activity.coachName}`, activity.coachContact].filter(Boolean).join(" · ")}
        </p>
      </div>

      {sp.added === "1" && activity.schedules.length === 0 && (
        <p role="status" className="rounded-lg bg-success/10 px-3 py-2 text-sm text-success">
          Activity added. Now add its weekly practice times, and they&apos;ll fill the calendar for the whole season.
        </p>
      )}

      <Card title="Weekly times">
        {activity.schedules.length > 0 && (
          <ul className="mb-5 divide-y divide-line rounded-lg border border-line">
            {activity.schedules.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-3 px-3 py-2">
                <div className="min-w-0 text-sm">
                  <p className="font-medium">
                    {KIND[s.kind]} · {s.weekdays.map((d) => DAYS[d]).join(", ")} · {timeRange(s.startTime, s.endTime, friendlyTime)}
                  </p>
                  <p className="text-muted">
                    Drop-off {name(s.defaultDropOffId) ?? "decided each time"} · pick-up {name(s.defaultPickUpId) ?? "decided each time"}
                  </p>
                </div>
                <form action={removeScheduleAction.bind(null, s.id)}>
                  <button type="submit" className="text-sm text-muted underline hover:text-danger" aria-label={`Remove ${KIND[s.kind]} on ${s.weekdays.map((d) => DAYS[d]).join(", ")}`}>
                    Remove
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
        <ScheduleForm activityId={activity.id} members={household.members} />
      </Card>

      <Card className="p-0">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <h2 className="text-lg font-semibold">Coming up</h2>
          <Link href={`/activities/${activity.id}/events/new`} className="text-sm font-semibold underline">
            Add a game or event
          </Link>
        </div>
        {activity.events.length === 0 ? (
          <p className="px-4 py-4 text-sm text-muted">Nothing coming up.</p>
        ) : (
          <ul className="divide-y divide-line">
            {activity.events.map((e) => (
              <EventCard key={e.id} e={toEventView(e, today, { withDate: true })} members={household.members} back={back} />
            ))}
          </ul>
        )}
      </Card>

      <details className="rounded-2xl border border-line bg-surface p-5">
        <summary className="cursor-pointer font-medium">Edit activity details</summary>
        <div className="mt-4">
          <ActivityForm
            key={activity.updatedAt.toISOString()}
            action={updateActivityAction.bind(null, activity.id)}
            kids={household.kids}
            submitLabel="Save details"
            defaults={{
              kidId: activity.kidId,
              name: activity.name,
              team: activity.team ?? "",
              coachName: activity.coachName ?? "",
              coachContact: activity.coachContact ?? "",
              location: activity.location ?? "",
              seasonStart: toDateStr(activity.seasonStart),
              seasonEnd: toDateStr(activity.seasonEnd),
              bringList: activity.bringList.join("\n"),
              notes: activity.notes ?? "",
            }}
          />
        </div>
      </details>

      <form action={deleteActivityAction.bind(null, activity.id)}>
        <button type="submit" className="text-sm text-danger underline">
          Delete this activity and all its events
        </button>
      </form>
    </div>
  );
}
