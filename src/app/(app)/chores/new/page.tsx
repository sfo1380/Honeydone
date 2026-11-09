import Link from "next/link";
import { createChoreAction } from "@/app/actions/chores";
import { Card } from "@/components/card";
import { ChoreForm } from "@/components/chores/chore-form";
import { requireHousehold } from "@/lib/dal";
import { todayIn } from "@/lib/dates";

export default async function NewChorePage() {
  const { user, household } = await requireHousehold();
  return (
    <div className="space-y-4">
      <Link href="/chores" className="text-sm text-muted hover:text-foreground">← Chores</Link>
      <h1 className="text-2xl font-bold">Add a chore</h1>
      <Card>
        <ChoreForm
          action={createChoreAction}
          members={household.members}
          submitLabel="Add chore"
          defaults={{
            title: "",
            notes: "",
            category: "Other",
            effort: "MEDIUM",
            owner: user.id,
            rotate: false,
            repeat: "WEEKLY",
            interval: 1,
            weekdays: [],
            startDate: todayIn(household.timeZone),
            dueTime: "",
          }}
        />
      </Card>
    </div>
  );
}
