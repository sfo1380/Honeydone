import Link from "next/link";
import { redirect } from "next/navigation";
import { createActivityAction } from "@/app/actions/activities";
import { Card } from "@/components/card";
import { ActivityForm } from "@/components/activities/activity-form";
import { requireHousehold } from "@/lib/dal";
import { addDays, todayIn } from "@/lib/dates";

export default async function NewActivityPage() {
  const { household } = await requireHousehold();
  if (!household.kids.length) redirect("/activities");
  const today = todayIn(household.timeZone);
  return (
    <div className="space-y-4">
      <Link href="/activities?view=manage" className="text-sm text-muted hover:text-foreground">← Activities</Link>
      <h1 className="text-2xl font-bold">Add an activity</h1>
      <Card>
        <ActivityForm
          action={createActivityAction}
          kids={household.kids}
          submitLabel="Next: add practice times"
          defaults={{
            kidId: household.kids[0].id,
            name: "",
            team: "",
            coachName: "",
            coachContact: "",
            location: "",
            seasonStart: today,
            seasonEnd: addDays(today, 7 * 12),
            bringList: "",
            notes: "",
          }}
        />
      </Card>
    </div>
  );
}
