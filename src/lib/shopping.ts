import "server-only";
import { Prisma } from "@prisma/client";
import { db } from "./db";
import { guessCategory, normalizeItemName, SHOPPING_CATEGORIES } from "./shopping-catalog";

export const DEFAULT_LIST = "Groceries";

/** Every household starts with a Groceries list. */
export async function listsFor(householdId: string) {
  const query = () =>
    db.shoppingList.findMany({
      where: { householdId },
      orderBy: { createdAt: "asc" },
      include: { _count: { select: { items: { where: { clearedAt: null, checkedAt: null } } } } },
    });
  const lists = await query();
  if (lists.length) return lists;
  await ensureDefaultList(householdId);
  return query();
}

/**
 * Creates the Groceries list if the household has no lists. Locks the household row so two
 * page loads at the same moment can't both create one.
 */
async function ensureDefaultList(householdId: string) {
  await db.$transaction(async (tx) => {
    await tx.$queryRaw(Prisma.sql`SELECT id FROM "Household" WHERE id = ${householdId} FOR UPDATE`);
    if ((await tx.shoppingList.count({ where: { householdId } })) === 0) {
      await tx.shoppingList.create({ data: { householdId, name: DEFAULT_LIST } });
    }
  });
}

export async function getList(householdId: string, listId: string) {
  return db.shoppingList.findFirst({ where: { id: listId, householdId } });
}

export async function createList(householdId: string, name: string) {
  return db.shoppingList.create({ data: { householdId, name } });
}

export async function renameList(householdId: string, listId: string, name: string) {
  await db.shoppingList.updateMany({ where: { id: listId, householdId }, data: { name } });
}

export async function deleteList(householdId: string, listId: string) {
  await db.shoppingList.deleteMany({ where: { id: listId, householdId } });
}

/** The section this household last used for an item, or a guess from its name. */
async function categoryFor(householdId: string, name: string) {
  const last = await db.shoppingItem.findFirst({
    where: { householdId, name: { equals: name, mode: "insensitive" } },
    orderBy: { createdAt: "desc" },
    select: { category: true },
  });
  return last?.category ?? guessCategory(name);
}

export type AddItemInput = { name: string; quantity: string | null; note: string | null; category: string | null };

/**
 * Adds an item, or reuses the one already on the list with the same name (unchecking it if it was in the cart).
 * Returns null if the list isn't in this household.
 */
export async function addItem(householdId: string, listId: string, userId: string, input: AddItemInput) {
  const list = await getList(householdId, listId);
  if (!list) return null;
  const name = input.name.trim().replace(/\s+/g, " ");
  const existing = await db.shoppingItem.findFirst({
    where: { listId, clearedAt: null, name: { equals: name, mode: "insensitive" } },
  });
  const category =
    input.category && (SHOPPING_CATEGORIES as readonly string[]).includes(input.category)
      ? input.category
      : await categoryFor(householdId, name);

  if (existing) {
    return db.shoppingItem.update({
      where: { id: existing.id },
      data: {
        checkedAt: null,
        quantity: input.quantity ?? existing.quantity,
        note: input.note ?? existing.note,
        ...(input.category ? { category } : {}),
      },
    });
  }
  return db.shoppingItem.create({
    data: { listId, householdId, name, quantity: input.quantity, note: input.note, category, addedById: userId },
  });
}

export async function setChecked(householdId: string, itemId: string, checked: boolean) {
  await db.shoppingItem.updateMany({
    where: { id: itemId, householdId, clearedAt: null },
    data: { checkedAt: checked ? new Date() : null },
  });
}

export async function updateItem(
  householdId: string,
  itemId: string,
  data: { name: string; quantity: string | null; note: string | null; category: string },
) {
  const { count } = await db.shoppingItem.updateMany({ where: { id: itemId, householdId }, data });
  return count > 0;
}

export async function removeItem(householdId: string, itemId: string) {
  await db.shoppingItem.deleteMany({ where: { id: itemId, householdId } });
}

/** Takes checked items off the list. They're kept (cleared) so they can be suggested again. */
export async function clearChecked(householdId: string, listId: string) {
  const { count } = await db.shoppingItem.updateMany({
    where: { listId, householdId, clearedAt: null, checkedAt: { not: null } },
    data: { clearedAt: new Date() },
  });
  return count;
}

export async function itemsOn(householdId: string, listId: string) {
  return db.shoppingItem.findMany({
    where: { listId, householdId, clearedAt: null },
    orderBy: [{ checkedAt: "asc" }, { createdAt: "asc" }],
  });
}

/** The household's most-bought items that aren't already on this list. */
export async function frequentItems(householdId: string, listId: string, limit = 8) {
  const [rows, current] = await Promise.all([
    db.shoppingItem.groupBy({
      by: ["name"],
      where: { householdId },
      _count: { _all: true },
      orderBy: { _count: { name: "desc" } },
      take: 60,
    }),
    db.shoppingItem.findMany({ where: { listId, clearedAt: null }, select: { name: true } }),
  ]);
  const onList = new Set(current.map((i) => normalizeItemName(i.name)));
  const seen = new Set<string>();
  const out: string[] = [];
  for (const r of rows) {
    const key = normalizeItemName(r.name);
    if (onList.has(key) || seen.has(key)) continue;
    seen.add(key);
    out.push(r.name);
    if (out.length >= limit) break;
  }
  return out;
}

/** Past item names for the add box's autocomplete. */
export async function pastItemNames(householdId: string, limit = 200) {
  const rows = await db.shoppingItem.groupBy({
    by: ["name"],
    where: { householdId },
    orderBy: { _max: { createdAt: "desc" } },
    _max: { createdAt: true },
    take: limit,
  });
  return rows.map((r) => r.name);
}
