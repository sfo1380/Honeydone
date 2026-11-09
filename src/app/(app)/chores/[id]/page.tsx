import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteChoreAction, updateChoreAction } from "@/app/actions/chores";
import { Card } from "@/components/card";
import { ChoreForm } from "@/components/chores/chore-form";
import { db } from "@/lib/db";
import { requireHousehold } from "@/lib/dal";
import { friendlyDate, todayIn, toDateStr } from "@/lib/dates";

export default async function EditChorePage({ params }: PageProps<"/chores/[id]">) {
  const { id } = await params;
  const { household } = await requireHousehold();
  const chore = await db.chore.findFirst({
    where: { id, householdId: household.id, archived: false },
    include: {
      tasks: { orderBy: { dueDate: "desc" }, take: 6, include: { completedBy: { select: { displayName: true } } } },
    },
  });
  if (!chore) notFound();
  const today = todayIn(household.timeZone);
  const open = chore.tasks.find((t) => !t.completedAt);
  const history = chore.tasks.filter((t) => t.completedAt).slice(0, 5);

  return (
    <div className="space-y-4">
      <Link href="/chores?view=all" className="text-sm text-muted hover:text-foreground">← All chores</Link>
      <h1 className="text-2xl font-bold">Edit chore</h1>
      <Card>
        <ChoreForm
          // Remount after a save so the fields show the saved values, not the ones React reset to.
          key={chore.updatedAt.toISOString()}
          isEdit
          action={updateChoreAction.bind(null, chore.id)}
          members={household.members}
          submitLabel="Save changes"
          defaults={{
            title: chore.title,
            notes: chore.notes ?? "",
            category: chore.category,
            effort: chore.effort,
            owner: chore.ownerId ?? "either",
            rotate: chore.rotate,
            repeat: chore.repeat,
            interval: chore.interval,
            weekdays: chore.weekdays,
            startDate: open ? toDateStr(open.dueDate) : today,
            dueTime: chore.dueTime ?? "",
          }}
        />
      </Card>
      {history.length > 0 && (
        <Card title="Recently done">
          <ul className="space-y-1 text-sm">
            {history.map((t) => (
              <li key={t.id} className="flex justify-between gap-2">
                <span>{t.completedBy?.displayName ?? "Someone"} · due {friendlyDate(toDateStr(t.dueDate), today).toLowerCase()}</span>
                <span className={t.onTime ? "text-success" : "text-danger"}>{t.onTime ? "On time" : "Late"}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
      <form action={deleteChoreAction.bind(null, chore.id)}>
        <button type="submit" className="text-sm text-danger underline">
          Delete this chore
        </button>
      </form>
    </div>
  );
}
