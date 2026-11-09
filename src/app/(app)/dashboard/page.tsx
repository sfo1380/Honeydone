import { Card } from "@/components/card";
import { InvitePanel } from "@/components/invite-panel";
import { requireHousehold } from "@/lib/dal";
import { inviteUrl } from "@/lib/invite-url";

const AREAS = [
  { name: "Chores", blurb: "Who's doing what, and when.", icon: "🧹" },
  { name: "Shopping", blurb: "Shared lists that update as you shop.", icon: "🛒" },
  { name: "Kids' activities", blurb: "Practices, games and who's driving.", icon: "⚽" },
  { name: "Budget", blurb: "Your monthly plan and spending.", icon: "💵" },
] as const;

export default async function DashboardPage() {
  const { user, household, partner } = await requireHousehold();
  const url = household.inviteCode ? await inviteUrl(household.inviteCode) : null;

  return (
    <div className="space-y-6">
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
