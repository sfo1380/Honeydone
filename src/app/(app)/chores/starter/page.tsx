import Link from "next/link";
import { STARTER_CHORES, CHORE_CATEGORIES } from "@/lib/chore-catalog";
import { db } from "@/lib/db";
import { requireHousehold } from "@/lib/dal";
import { describeRepeat } from "@/lib/repeat";
import { StarterForm } from "./starter-form";

export default async function StarterPage() {
  const { household } = await requireHousehold();
  const existing = new Set(
    (await db.chore.findMany({ where: { householdId: household.id, archived: false }, select: { title: true } })).map((c) => c.title),
  );
  const groups = CHORE_CATEGORIES.map((category) => ({
    category,
    chores: STARTER_CHORES.filter((c) => c.category === category).map((c) => ({
      key: c.key,
      title: c.title,
      schedule: describeRepeat({ repeat: c.repeat, interval: c.interval ?? 1, weekdays: c.weekdays ?? [] }),
      added: existing.has(c.title),
    })),
  })).filter((g) => g.chores.length);

  return (
    <div className="space-y-4">
      <Link href="/chores" className="text-sm text-muted hover:text-foreground">← Chores</Link>
      <div>
        <h1 className="text-2xl font-bold">Common chores</h1>
        <p className="text-muted">Tick the ones your household does.</p>
      </div>
      <StarterForm groups={groups} />
    </div>
  );
}
