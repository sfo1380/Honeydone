import Link from "next/link";
import { AutoRefresh } from "@/components/auto-refresh";
import { Card } from "@/components/card";
import { NewListForm } from "@/components/shopping/list-forms";
import { requireHousehold } from "@/lib/dal";
import { listsFor } from "@/lib/shopping";

export default async function ShoppingPage() {
  const { household } = await requireHousehold();
  const lists = await listsFor(household.id);

  return (
    <div className="space-y-5">
      <AutoRefresh />
      <h1 className="text-2xl font-bold">Shopping</h1>
      <Card className="p-0">
        <ul className="divide-y divide-line">
          {lists.map((l) => (
            <li key={l.id}>
              <Link href={`/shopping/${l.id}`} className="flex items-center justify-between gap-3 px-4 py-4 hover:bg-line/30">
                <span className="font-medium">{l.name}</span>
                <span className="text-sm text-muted">
                  {l._count.items === 0 ? "Empty" : `${l._count.items} item${l._count.items === 1 ? "" : "s"}`}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Card>
      <Card title="New list">
        <NewListForm />
      </Card>
    </div>
  );
}
