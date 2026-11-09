import Link from "next/link";
import { AutoRefresh } from "@/components/auto-refresh";
import { Card } from "@/components/card";
import { EventCard } from "@/components/activities/event-card";
import { db } from "@/lib/db";
import { requireHousehold } from "@/lib/dal";
import { eventsBetween, needsDriver } from "@/lib/activities";
import { addDays, friendlyDate, isDateStr, todayIn, toDateStr } from "@/lib/dates";
import { toEventView } from "@/lib/event-view";

const VIEWS = [
  { key: "week", label: "This week" },
  { key: "kids", label: "By kid" },
  { key: "manage", label: "Activities" },
] as const;

export default async function ActivitiesPage({ searchParams }: PageProps<"/activities">) {
  const sp = await searchParams;
  const view = VIEWS.some((v) => v.key === sp.view) ? (sp.view as (typeof VIEWS)[number]["key"]) : "week";
  const { household } = await requireHousehold();
  const today = todayIn(household.timeZone);

  return (
    <div className="space-y-5">
      <AutoRefresh />
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Kids&apos; activities</h1>
        {household.kids.length > 0 && (
          <Link href="/activities/new" className="rounded-lg bg-honey px-3 py-2 text-sm font-semibold text-honey-ink">
            Add activity
          </Link>
        )}
      </div>
      {household.kids.length === 0 ? (
        <Card>
          <div className="space-y-3 text-center">
            <p className="text-lg font-semibold">Add your kids first</p>
            <p className="text-muted">Activities belong to a kid, so add their names in Settings.</p>
            <Link href="/settings" className="inline-block rounded-lg bg-honey px-4 py-2 font-semibold text-honey-ink">
              Go to Settings
            </Link>
          </div>
        </Card>
      ) : (
        <>
          <nav className="flex gap-1 rounded-xl bg-line/50 p-1" aria-label="Activity views">
            {VIEWS.map((v) => (
              <Link
                key={v.key}
                href={`/activities?view=${v.key}`}
                aria-current={view === v.key ? "page" : undefined}
                className={`flex-1 rounded-lg px-3 py-1.5 text-center text-sm font-medium ${view === v.key ? "bg-surface shadow-sm" : "text-muted"}`}
              >
                {v.label}
              </Link>
            ))}
          </nav>
          {view === "week" && (
            <WeekView
              householdId={household.id}
              today={today}
              start={typeof sp.start === "string" && isDateStr(sp.start) ? sp.start : today}
              members={household.members}
            />
          )}
          {view === "kids" && <KidsView householdId={household.id} today={today} kids={household.kids} members={household.members} />}
          {view === "manage" && <ManageView householdId={household.id} today={today} />}
        </>
      )}
    </div>
  );
}

type Member = { id: string; displayName: string; color: string };

async function WeekView({ householdId, today, start, members }: { householdId: string; today: string; start: string; members: Member[] }) {
  const end = addDays(start, 6);
  const events = await eventsBetween(householdId, start, end);
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  const missing = events.filter((e) => toDateStr(e.date) >= today && needsDriver(e)).length;
  const back = `/activities?view=week&start=${start}`;
  const any = await db.activity.count({ where: { householdId } });

  if (!any) return <EmptyActivities />;
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm">
        <Link href={`/activities?view=week&start=${addDays(start, -7)}`} className="rounded-lg px-2 py-1 text-muted hover:text-foreground">
          ← Earlier
        </Link>
        <span className="font-medium">{start === today ? "Next 7 days" : `${friendlyDate(start, today)} to ${friendlyDate(end, today)}`}</span>
        <Link href={`/activities?view=week&start=${addDays(start, 7)}`} className="rounded-lg px-2 py-1 text-muted hover:text-foreground">
          Later →
        </Link>
      </div>
      {missing > 0 && (
        <p role="status" className="rounded-lg bg-danger/10 px-3 py-2 text-sm font-medium text-danger">
          {missing === 1 ? "1 event needs a driver" : `${missing} events need a driver`} this week.
        </p>
      )}
      {days.map((d) => {
        const list = events.filter((e) => toDateStr(e.date) === d);
        return (
          <section key={d} className="rounded-2xl border border-line bg-surface">
            <h2 className="border-b border-line px-3 py-2 text-sm font-semibold uppercase tracking-wide text-muted">{friendlyDate(d, today)}</h2>
            {list.length === 0 ? (
              <p className="px-3 py-3 text-sm text-muted">Nothing scheduled.</p>
            ) : (
              <ul className="divide-y divide-line">
                {list.map((e) => (
                  <EventCard key={e.id} e={toEventView(e, today)} members={members} back={back} />
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}

async function KidsView({
  householdId,
  today,
  kids,
  members,
}: {
  householdId: string;
  today: string;
  kids: { id: string; name: string }[];
  members: Member[];
}) {
  const events = await eventsBetween(householdId, today, addDays(today, 13));
  if (!(await db.activity.count({ where: { householdId } }))) return <EmptyActivities />;
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">The next two weeks for each kid.</p>
      {kids.map((k) => {
        const list = events.filter((e) => e.activity.kidId === k.id);
        return (
          <section key={k.id} className="rounded-2xl border border-line bg-surface">
            <h2 className="border-b border-line px-3 py-2 font-semibold">{k.name}</h2>
            {list.length === 0 ? (
              <p className="px-3 py-3 text-sm text-muted">Nothing in the next two weeks.</p>
            ) : (
              <ul className="divide-y divide-line">
                {list.map((e) => (
                  <EventCard key={e.id} e={toEventView(e, today, { withDate: true })} members={members} back="/activities?view=kids" />
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}

async function ManageView({ householdId, today }: { householdId: string; today: string }) {
  const activities = await db.activity.findMany({
    where: { householdId },
    include: { kid: true, _count: { select: { events: { where: { date: { gte: new Date(`${today}T00:00:00Z`) }, cancelled: false } } } } },
    orderBy: [{ kid: { name: "asc" } }, { seasonStart: "desc" }],
  });
  if (!activities.length) return <EmptyActivities />;
  return (
    <Card className="p-0">
      <ul className="divide-y divide-line">
        {activities.map((a) => {
          const ended = toDateStr(a.seasonEnd) < today;
          return (
            <li key={a.id}>
              <Link href={`/activities/${a.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-line/30">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">
                    {a.kid.name}: {a.name}
                  </p>
                  <p className="text-sm text-muted">
                    {a.team ? `${a.team} · ` : ""}
                    {ended ? "Season over" : `${a._count.events} upcoming`}
                  </p>
                </div>
                <span aria-hidden className="text-muted">›</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

function EmptyActivities() {
  return (
    <Card>
      <div className="space-y-3 text-center">
        <p className="text-lg font-semibold">No activities yet</p>
        <p className="text-muted">Add a sport or program, then its weekly practice times. Games and one-off events can be added too.</p>
        <Link href="/activities/new" className="inline-block rounded-lg bg-honey px-4 py-2 font-semibold text-honey-ink">
          Add an activity
        </Link>
      </div>
    </Card>
  );
}
