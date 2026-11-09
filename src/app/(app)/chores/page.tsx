import Link from "next/link";
import { AutoRefresh } from "@/components/auto-refresh";
import { Card } from "@/components/card";
import { TaskList, type TaskView } from "@/components/chores/task-item";
import { openTasks, projectTasks, tasksForToday, type TaskWithChore } from "@/lib/chores";
import { CHORE_CATEGORIES } from "@/lib/chore-catalog";
import { db } from "@/lib/db";
import { requireHousehold } from "@/lib/dal";
import { addDays, friendlyDate, friendlyTime, toDateStr, todayIn, type DateStr } from "@/lib/dates";
import { describeRepeat } from "@/lib/repeat";

type Member = { id: string; displayName: string; color: string };

function toView(
  task: TaskWithChore,
  today: DateStr,
  members: Member[],
  opts: { date?: DateStr; assigneeId?: string | null; actionable?: boolean } = {},
): TaskView {
  const date = opts.date ?? toDateStr(task.dueDate);
  const assigneeId = opts.assigneeId === undefined ? task.assigneeId : opts.assigneeId;
  const owner = members.find((m) => m.id === assigneeId);
  const doneBy = members.find((m) => m.id === task.completedById);
  return {
    id: task.id,
    choreId: task.choreId,
    title: task.chore.title,
    dueLabel: date < today ? `Due ${friendlyDate(date, today).toLowerCase()}` : friendlyDate(date, today),
    overdue: !task.completedAt && date < today,
    time: task.chore.dueTime ? friendlyTime(task.chore.dueTime) : null,
    effort: task.chore.effort,
    done: !!task.completedAt,
    doneBy: doneBy?.displayName ?? null,
    late: task.onTime === false,
    owner: owner ? { name: owner.displayName, color: owner.color } : null,
    actionable: opts.actionable ?? true,
  };
}

const VIEWS = [
  { key: "today", label: "Today" },
  { key: "week", label: "This week" },
  { key: "all", label: "All chores" },
] as const;

export default async function ChoresPage({ searchParams }: PageProps<"/chores">) {
  const sp = await searchParams;
  const view = VIEWS.some((v) => v.key === sp.view) ? (sp.view as (typeof VIEWS)[number]["key"]) : "today";
  const { user, household, partner } = await requireHousehold();
  const today = todayIn(household.timeZone);
  const members = household.members;

  return (
    <div className="space-y-5">
      <AutoRefresh />
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Chores</h1>
        <Link href="/chores/new" className="rounded-lg bg-honey px-3 py-2 text-sm font-semibold text-honey-ink">
          Add chore
        </Link>
      </div>
      <nav className="flex gap-1 rounded-xl bg-line/50 p-1" aria-label="Chore views">
        {VIEWS.map((v) => (
          <Link
            key={v.key}
            href={`/chores?view=${v.key}`}
            aria-current={view === v.key ? "page" : undefined}
            className={`flex-1 rounded-lg px-3 py-1.5 text-center text-sm font-medium ${
              view === v.key ? "bg-surface shadow-sm" : "text-muted"
            }`}
          >
            {v.label}
          </Link>
        ))}
      </nav>

      {view === "today" && <TodayView householdId={household.id} today={today} me={user.id} partner={partner} members={members} />}
      {view === "week" && <WeekView householdId={household.id} today={today} members={members} />}
      {view === "all" && (
        <AllView
          householdId={household.id}
          today={today}
          members={members}
          owner={typeof sp.owner === "string" ? sp.owner : "all"}
          category={typeof sp.category === "string" ? sp.category : "all"}
        />
      )}
    </div>
  );
}

async function TodayView({
  householdId,
  today,
  me,
  partner,
  members,
}: {
  householdId: string;
  today: DateStr;
  me: string;
  partner: Member | null;
  members: Member[];
}) {
  const { open, done } = await tasksForToday(householdId, today);
  const all = [...open, ...done];
  if (!all.length) {
    const anyChores = await db.chore.count({ where: { householdId, archived: false } });
    return anyChores ? (
      <Card>
        <p className="text-center text-muted">Nothing due today. Enjoy it.</p>
      </Card>
    ) : (
      <EmptyChores />
    );
  }
  const group = (pred: (t: TaskWithChore) => boolean) => all.filter(pred).map((t) => toView(t, today, members));
  const mine = group((t) => t.assigneeId === me);
  const either = group((t) => t.assigneeId === null);
  const theirs = group((t) => !!t.assigneeId && t.assigneeId !== me);
  const left = open.filter((t) => t.assigneeId === me || t.assigneeId === null).length;

  return (
    <div className="space-y-4">
      <p className="text-muted">
        {left === 0 ? "You're all caught up for today." : `${left} left for you today, counting shared chores.`}
      </p>
      <Section title="Yours" tasks={mine} empty="Nothing assigned to you today." />
      {either.length > 0 && <Section title="Either of you" tasks={either} />}
      {partner && <Section title={`${partner.displayName}'s`} tasks={theirs} empty={`Nothing for ${partner.displayName} today.`} />}
    </div>
  );
}

async function WeekView({ householdId, today, members }: { householdId: string; today: DateStr; members: Member[] }) {
  const [tasks, { done }] = await Promise.all([openTasks(householdId), tasksForToday(householdId, today)]);
  if (!tasks.length && !done.length) return <EmptyChores />;
  const end = addDays(today, 6);
  const projected = projectTasks(tasks, today, end, members.map((m) => m.id));
  const overdue = projected.filter((p) => p.date < today);
  const days = Array.from({ length: 7 }, (_, i) => addDays(today, i));
  const view = (p: (typeof projected)[number]) =>
    toView(p.task, today, members, { date: p.date, assigneeId: p.assigneeId, actionable: p.actionable });

  return (
    <div className="space-y-4">
      {overdue.length > 0 && <Section title="Overdue" tasks={overdue.map(view)} />}
      {days.map((d) => (
        <Section
          key={d}
          title={friendlyDate(d, today)}
          tasks={[
            ...(d === today ? done.map((t) => toView(t, today, members)) : []),
            ...projected.filter((p) => p.date === d).map(view),
          ]}
          empty="Nothing due."
        />
      ))}
    </div>
  );
}

async function AllView({
  householdId,
  today,
  members,
  owner,
  category,
}: {
  householdId: string;
  today: DateStr;
  members: Member[];
  owner: string;
  category: string;
}) {
  const chores = await db.chore.findMany({
    where: {
      householdId,
      archived: false,
      ...(owner === "either" ? { ownerId: null } : owner !== "all" ? { ownerId: owner } : {}),
      ...(category !== "all" ? { category } : {}),
    },
    include: { tasks: { where: { completedAt: null }, orderBy: { dueDate: "asc" }, take: 1 } },
    orderBy: [{ category: "asc" }, { title: "asc" }],
  });
  const total = await db.chore.count({ where: { householdId, archived: false } });
  if (!total) return <EmptyChores />;

  const filterLink = (o: string, c: string) => `/chores?view=all&owner=${o}&category=${encodeURIComponent(c)}`;
  const chip = (active: boolean) =>
    `rounded-full border px-3 py-1 text-sm ${active ? "border-honey bg-honey/20 font-semibold" : "border-line text-muted"}`;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2" aria-label="Filter by owner">
          <Link className={chip(owner === "all")} href={filterLink("all", category)}>Everyone</Link>
          {members.map((m) => (
            <Link key={m.id} className={chip(owner === m.id)} href={filterLink(m.id, category)}>
              {m.displayName}
            </Link>
          ))}
          <Link className={chip(owner === "either")} href={filterLink("either", category)}>Either</Link>
        </div>
        <div className="flex flex-wrap gap-2" aria-label="Filter by category">
          <Link className={chip(category === "all")} href={filterLink(owner, "all")}>All rooms</Link>
          {CHORE_CATEGORIES.map((c) => (
            <Link key={c} className={chip(category === c)} href={filterLink(owner, c)}>
              {c}
            </Link>
          ))}
        </div>
      </div>
      <Card className="p-0">
        {chores.length === 0 ? (
          <p className="px-4 py-4 text-sm text-muted">No chores match these filters.</p>
        ) : (
          <ul className="divide-y divide-line">
            {chores.map((c) => {
              const ownerM = members.find((m) => m.id === c.ownerId);
              const next = c.tasks[0] ? toDateStr(c.tasks[0].dueDate) : null;
              return (
                <li key={c.id}>
                  <Link href={`/chores/${c.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-line/30">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{c.title}</p>
                      <p className="text-sm text-muted">
                        {describeRepeat(c)} · {c.category}
                        {next ? ` · next ${friendlyDate(next, today).toLowerCase()}` : ""}
                        {c.rotate ? " · takes turns" : ""}
                      </p>
                    </div>
                    <span className="shrink-0 text-sm" style={{ color: ownerM?.color }}>
                      {ownerM?.displayName ?? "Either"}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
      <p className="text-sm text-muted">
        Want more ideas? <Link href="/chores/starter" className="underline">Browse common chores</Link>.
      </p>
    </div>
  );
}

function Section({ title, tasks, empty }: { title: string; tasks: TaskView[]; empty?: string }) {
  return (
    <section className="rounded-2xl border border-line bg-surface">
      <h2 className="border-b border-line px-3 py-2 text-sm font-semibold uppercase tracking-wide text-muted">{title}</h2>
      <TaskList tasks={tasks} empty={empty} />
    </section>
  );
}

function EmptyChores() {
  return (
    <Card>
      <div className="space-y-3 text-center">
        <p className="text-lg font-semibold">No chores yet</p>
        <p className="text-muted">Start with common ones like dishes, laundry and trash night, or add your own.</p>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link href="/chores/starter" className="rounded-lg bg-honey px-4 py-2 font-semibold text-honey-ink">
            Pick from common chores
          </Link>
          <Link href="/chores/new" className="rounded-lg border border-line px-4 py-2 font-semibold">
            Add your own
          </Link>
        </div>
      </div>
    </Card>
  );
}
