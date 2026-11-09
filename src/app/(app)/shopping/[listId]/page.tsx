import Link from "next/link";
import { notFound } from "next/navigation";
import { clearCheckedAction, deleteListAction } from "@/app/actions/shopping";
import { AutoRefresh } from "@/components/auto-refresh";
import { RenameListForm } from "@/components/shopping/list-forms";
import { AddItemForm, FrequentItems } from "@/components/shopping/add-item-form";
import { ItemRow, type ItemView } from "@/components/shopping/item-row";
import { requireHousehold } from "@/lib/dal";
import { frequentItems, getList, itemsOn, pastItemNames } from "@/lib/shopping";
import { SHOPPING_CATEGORIES } from "@/lib/shopping-catalog";

export default async function ListPage({ params }: PageProps<"/shopping/[listId]">) {
  const { listId } = await params;
  const { household } = await requireHousehold();
  const list = await getList(household.id, listId);
  if (!list) notFound();
  const [items, frequent, pastNames] = await Promise.all([
    itemsOn(household.id, list.id),
    frequentItems(household.id, list.id),
    pastItemNames(household.id),
  ]);

  const view = (i: (typeof items)[number]): ItemView => {
    const m = household.members.find((x) => x.id === i.addedById);
    return {
      id: i.id,
      listId: list.id,
      name: i.name,
      quantity: i.quantity,
      note: i.note,
      checked: !!i.checkedAt,
      addedBy: m ? { name: m.displayName, color: m.color } : null,
    };
  };
  const open = items.filter((i) => !i.checkedAt);
  const inCart = items.filter((i) => i.checkedAt);
  const order = (c: string) => {
    const idx = (SHOPPING_CATEGORIES as readonly string[]).indexOf(c);
    return idx === -1 ? SHOPPING_CATEGORIES.length : idx;
  };
  const sections = [...new Set(open.map((i) => i.category))].sort((a, b) => order(a) - order(b));

  return (
    <div className="space-y-5">
      <AutoRefresh />
      <Link href="/shopping" className="text-sm text-muted hover:text-foreground">← All lists</Link>
      <div className="flex items-baseline justify-between gap-3">
        <h1 className="text-2xl font-bold">{list.name}</h1>
        <span className="text-sm text-muted">{open.length} to get</span>
      </div>

      <AddItemForm listId={list.id} pastNames={pastNames} />
      <FrequentItems listId={list.id} names={frequent} />

      {items.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line px-4 py-8 text-center text-muted">
          This list is empty. Add something above.
        </p>
      ) : (
        <div className="space-y-4">
          {sections.map((cat) => (
            <section key={cat} className="rounded-2xl border border-line bg-surface">
              <h2 className="border-b border-line px-3 py-2 text-sm font-semibold uppercase tracking-wide text-muted">{cat}</h2>
              <ul className="divide-y divide-line">
                {open.filter((i) => i.category === cat).map((i) => (
                  <ItemRow key={i.id} item={view(i)} />
                ))}
              </ul>
            </section>
          ))}
          {inCart.length > 0 && (
            <section className="rounded-2xl border border-line bg-surface">
              <div className="flex items-center justify-between border-b border-line px-3 py-2">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">In the cart ({inCart.length})</h2>
                <form action={clearCheckedAction.bind(null, list.id)}>
                  <button type="submit" className="text-sm font-semibold underline">Clear checked</button>
                </form>
              </div>
              <ul className="divide-y divide-line">
                {inCart.map((i) => (
                  <ItemRow key={i.id} item={view(i)} />
                ))}
              </ul>
            </section>
          )}
        </div>
      )}

      <details className="rounded-2xl border border-line bg-surface p-4">
        <summary className="cursor-pointer font-medium">List settings</summary>
        <div className="mt-4 space-y-4">
          <RenameListForm listId={list.id} name={list.name} />
          <form action={deleteListAction.bind(null, list.id)}>
            <button type="submit" className="text-sm text-danger underline">Delete this list and its items</button>
          </form>
        </div>
      </details>
    </div>
  );
}
