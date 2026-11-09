import { AutoRefresh } from "@/components/auto-refresh";
import { Card } from "@/components/card";
import { CouponBook } from "@/components/rewards/coupon-book";
import { RewardSettingsForm } from "@/components/rewards/settings-form";
import { chooseCouponAction, markCouponUsedAction } from "@/app/actions/rewards";
import { requireHousehold } from "@/lib/dal";
import { addDays, friendlyDate, toDateStr } from "@/lib/dates";
import { db } from "@/lib/db";
import { BASE_POINTS, fairShare, GRAB_BONUS, metGoal, streak } from "@/lib/points";
import { ensureStarterCoupons, rewardsOverview } from "@/lib/rewards";

type Member = { id: string; displayName: string; color: string };

export default async function RewardsPage() {
  const { user, household, partner } = await requireHousehold();

  if (!partner) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Rewards</h1>
        <Card>
          <p>Rewards start once your partner joins. Then you&apos;ll share a weekly team goal, streaks and a coupon book.</p>
        </Card>
      </div>
    );
  }

  await Promise.all([ensureStarterCoupons(household.id, user.id), ensureStarterCoupons(household.id, partner.id)]);
  const { today, tasks, thisWeek, lastWeek, mine } = await rewardsOverview(household, household.members);
  const [awards, coupons] = await Promise.all([
    db.award.findMany({ where: { householdId: household.id, usedAt: null }, orderBy: { weekStart: "asc" } }),
    db.coupon.findMany({ where: { householdId: household.id, archived: false }, orderBy: { createdAt: "asc" } }),
  ]);
  const myCoupons = coupons.filter((c) => c.giverId === user.id);
  const partnerCoupons = coupons.filter((c) => c.giverId === partner.id);
  const toPick = awards.filter((a) => a.winnerId === user.id && !a.couponTitle);
  const ready = awards.filter((a) => a.couponTitle);

  const team = streak(tasks, today);
  const people: Member[] = [user, partner];
  const share = fairShare(tasks, addDays(today, -27), today, [user.id, partner.id]);
  const lopsided = Math.max(...Object.values(share)) > 65;
  const goal = household.teamGoal;
  const rate = thisWeek.rate ?? 0;

  return (
    <div className="space-y-6">
      <AutoRefresh />
      <div>
        <h1 className="text-2xl font-bold">Rewards</h1>
        <p className="text-muted">Finish chores on time together and you both win coupons.</p>
      </div>

      {toPick.length > 0 && (
        <Card title={toPick.length === 1 ? "You won a coupon!" : `You won ${toPick.length} coupons!`} className="border-honey">
          <ul className="space-y-4">
            {toPick.map((a) => (
              <li key={a.id} className="space-y-2">
                <p className="text-sm text-muted">
                  {a.reason === "CROWN" ? "👑 Honey Crown" : "🤝 Team goal"} · week of {friendlyDate(toDateStr(a.weekStart), today)}
                </p>
                {partnerCoupons.length ? (
                  <form action={chooseCouponAction.bind(null, a.id)} className="flex flex-wrap gap-2">
                    <label htmlFor={`pick-${a.id}`} className="sr-only">
                      Pick a coupon from {partner.displayName}
                    </label>
                    <select
                      id={`pick-${a.id}`}
                      name="couponId"
                      className="min-w-0 flex-1 rounded-lg border border-line bg-surface px-3 py-2"
                    >
                      {partnerCoupons.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.title}
                        </option>
                      ))}
                    </select>
                    <button type="submit" className="rounded-lg bg-honey px-4 py-2 font-semibold text-honey-ink">
                      Pick it
                    </button>
                  </form>
                ) : (
                  <p className="text-sm">{partner.displayName}&apos;s coupon book is empty. Ask them to add a few.</p>
                )}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card title="This week's team goal">
        {thisWeek.due === 0 ? (
          <p className="text-muted">Nothing has come due yet this week.</p>
        ) : (
          <div className="space-y-2">
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-bold">{rate}%</span>
              <span className="text-sm text-muted">goal {goal}%</span>
            </div>
            <div
              className="relative h-3 overflow-hidden rounded-full bg-line"
              role="progressbar"
              aria-label="Chores done on time this week"
              aria-valuenow={rate}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div className={`h-full ${metGoal(thisWeek, goal) ? "bg-success" : "bg-honey"}`} style={{ width: `${rate}%` }} />
              <div aria-hidden className="absolute inset-y-0 w-0.5 bg-foreground/60" style={{ left: `${goal}%` }} />
            </div>
            <p className="text-sm text-muted">
              {thisWeek.onTime} of {thisWeek.due} chores done on time.{" "}
              {metGoal(thisWeek, goal) ? "You're on track for a coupon each on Sunday." : "Keep going: the week ends Saturday night."}
            </p>
          </div>
        )}
        {lastWeek.due > 0 && (
          <p className="mt-3 border-t border-line pt-3 text-sm text-muted">
            Last week: {lastWeek.rate}% on time{metGoal(lastWeek, goal) ? ", goal met 🎉" : ""}.
          </p>
        )}
      </Card>

      <Card title="Streaks">
        <div className="grid gap-3 sm:grid-cols-3">
          <StreakTile label="Team" days={team.days} highlight />
          {people.map((p) => (
            <StreakTile key={p.id} label={p.id === user.id ? "You" : p.displayName} days={streak(mine(p.id), today).days} color={p.color} />
          ))}
        </div>
        <p className="mt-3 text-sm text-muted">
          A streak counts days when every chore due was done on time. One missed day a week is forgiven
          {team.shieldUsed ? ", and the team has used this week's" : ""}.
        </p>
      </Card>

      {household.competition && (
        <Card title="👑 Honey Crown race">
          <ul className="space-y-2">
            {people
              .map((p) => ({ ...p, points: thisWeek.points[p.id] ?? 0 }))
              .sort((a, b) => b.points - a.points)
              .map((p) => (
                <li key={p.id} className="flex items-center justify-between">
                  <span className="font-semibold" style={{ color: p.color }}>
                    {p.id === user.id ? "You" : p.displayName}
                  </span>
                  <span className="text-xl font-bold">{p.points} pts</span>
                </li>
              ))}
          </ul>
          <p className="mt-3 text-sm text-muted">
            Points: small {BASE_POINTS.SMALL}, medium {BASE_POINTS.MEDIUM}, big {BASE_POINTS.LARGE}. A day early earns 20% more, an
            unassigned chore +{GRAB_BONUS}, and late still earns something. Most points by Saturday night wins a bonus coupon.
          </p>
        </Card>
      )}

      {ready.length > 0 && (
        <Card title="Coupons ready to use">
          <ul className="divide-y divide-line">
            {ready.map((a) => {
              const mineToUse = a.winnerId === user.id;
              return (
                <li key={a.id} className="flex items-center justify-between gap-3 py-2">
                  <span>
                    🎟️ {a.couponTitle}
                    <span className="block text-sm text-muted">
                      {mineToUse ? `From ${partner.displayName} to you` : `You owe ${partner.displayName}`}
                    </span>
                  </span>
                  <form action={markCouponUsedAction.bind(null, a.id)}>
                    <button type="submit" className="rounded-lg border border-line px-3 py-1.5 text-sm font-semibold">
                      Mark used
                    </button>
                  </form>
                </li>
              );
            })}
          </ul>
        </Card>
      )}

      <Card title="Fair share, last 4 weeks">
        <div className="flex h-3 overflow-hidden rounded-full bg-line" aria-hidden>
          {people.map((p) => (
            <div key={p.id} style={{ width: `${share[p.id]}%`, backgroundColor: p.color }} />
          ))}
        </div>
        <p className="mt-2 text-sm text-muted">
          {people.map((p) => `${p.id === user.id ? "You" : p.displayName} ${share[p.id]}%`).join(" · ")}
          {lopsided ? ". One of you is carrying most of the load; try rebalancing who owns which chores." : ""}
        </p>
      </Card>

      <Card title="Your coupon book">
        <CouponBook coupons={myCoupons.map((c) => ({ id: c.id, title: c.title }))} partnerName={partner.displayName} />
      </Card>

      <Card title="Reward settings">
        <RewardSettingsForm competition={household.competition} teamGoal={household.teamGoal} />
      </Card>
    </div>
  );
}

function StreakTile({ label, days, color, highlight }: { label: string; days: number; color?: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl border p-3 ${highlight ? "border-honey" : "border-line"}`}>
      <p className="text-sm font-medium" style={color ? { color } : undefined}>
        {label}
      </p>
      <p className="text-2xl font-bold">
        {days} {days === 1 ? "day" : "days"} {days >= 3 ? "🔥" : ""}
      </p>
    </div>
  );
}
