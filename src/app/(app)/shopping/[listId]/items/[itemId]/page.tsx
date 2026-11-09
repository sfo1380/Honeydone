import Link from "next/link";
import { notFound } from "next/navigation";
import { Card } from "@/components/card";
import { EditItemForm } from "@/components/shopping/edit-item-form";
import { db } from "@/lib/db";
import { requireHousehold } from "@/lib/dal";

export default async function EditItemPage({ params }: PageProps<"/shopping/[listId]/items/[itemId]">) {
  const { listId, itemId } = await params;
  const { household } = await requireHousehold();
  const item = await db.shoppingItem.findFirst({
    where: { id: itemId, listId, householdId: household.id, clearedAt: null },
    include: { list: { select: { name: true } } },
  });
  if (!item) notFound();

  return (
    <div className="space-y-4">
      <Link href={`/shopping/${listId}`} className="text-sm text-muted hover:text-foreground">← {item.list.name}</Link>
      <h1 className="text-2xl font-bold">Edit item</h1>
      <Card>
        <EditItemForm
          key={item.updatedAt.toISOString()}
          itemId={item.id}
          listId={listId}
          item={{ name: item.name, quantity: item.quantity ?? "", note: item.note ?? "", category: item.category }}
        />
      </Card>
    </div>
  );
}
