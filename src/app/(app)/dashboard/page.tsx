import Link from "next/link";
import { AutoRefresh } from "@/components/auto-refresh";
import { Card } from "@/components/card";
import { tasksForToday } from "@/lib/chores";
import { todayIn } from "@/lib/dates";
import { InvitePanel } from "@/components/invite-panel";
import { requireHousehold } from "@/lib/dal";
import { inviteUrl } from "@/lib/invite-url";

const AREAS = [
  { name: "Shopping", blurb: "Shared lists that update as you shop.", icon: "🛒" },
  { name: "Kids' activities", blurb: "Practices, games and who's driving.", icon: "⚽" },
  { name: "Budget", blurb: "Your monthly plan and spending.", icon: "💵" },
] as const;

export default async function DashboardPage() {
  const { user, household, partner } = await requireHousehold();
  const url = household.inviteCode ? await inviteUrl(household.inviteCode) : null;
  const { open, done } = await tasksForToday(household.id, todayIn(household.timeZone));
  const myOpen = open.filter((t) => t.assigneeId === user.id || t.assigneeId === null).length;
  const overdue = open.filter((t) => t.dueDate < new Date(`${todayIn(household.timeZone)}T00:00:00Z`)).length;

  return (
    <div className="space-y-6">
      <AutoRefresh />
      <div>
        <h1 className="text-2xl font-bold">Hi {user.displayName}</h1>
        <p className="text-muted">
          {partner ? (
            <>
              You and <span className="font-semibold" style={{ color: partner.color }}>{partner.displayName}</span> share{" "}
              {household.name}.
            </>
          ) : (
            <>Your partner hasn&apos;t joined {household.name} yet.</>
          )}
        </p>
      </div>

      {!partner && url && (
        <Card title="Invite your partner">
          <InvitePanel url={url} />
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/chores"
          className="rounded-2xl border border-honey bg-surface p-5 shadow-sm transition hover:shadow-md sm:col-span-2"
        >
          <div className="mb-3 flex items-center justify-between">
            <span aria-hidden className="text-2xl">🧹</span>
            {overdue > 0 && (
              <span className="rounded-full bg-danger/15 px-2 py-0.5 text-xs font-semibold text-danger">{overdue} overdue</span>
            )}
          </div>
          <h2 className="font-semibold">Chores</h2>
          <p className="text-sm text-muted">
            {open.length + done.length === 0
              ? "Nothing due today. Tap to add or plan chores."
              : myOpen === 0
                ? `You're all caught up. ${done.length} done today between you.`
                : `${myOpen} left for you today · ${done.length} done between you`}
          </p>
        </Link>
        {AREAS.map((a) => (
          <div key={a.name} className="rounded-2xl border border-line bg-surface p-5">
            <div className="mb-3 flex items-center justify-between">
              <span aria-hidden className="text-2xl">{a.icon}</span>
              <span className="rounded-full bg-honey/20 px-2 py-0.5 text-xs font-semibold">Coming soon</span>
            </div>
            <h2 className="font-semibold">{a.name}</h2>
            <p className="text-sm text-muted">{a.blurb}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
