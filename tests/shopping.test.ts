/** Database tests for shopping lists. Run with TEST_DATABASE_URL set (see household.test.ts). */
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { execSync } from "node:child_process";

const url = process.env.TEST_DATABASE_URL;
if (url) process.env.DATABASE_URL = url;

describe.skipIf(!url)("shopping", async () => {
  const { db } = await import("@/lib/db");
  const { createHousehold } = await import("@/lib/household");
  const shop = await import("@/lib/shopping");

  let hh: string, user: string, listId: string;
  const add = (name: string, extra: Partial<{ quantity: string; note: string; category: string }> = {}) =>
    shop.addItem(hh, listId, user, { name, quantity: extra.quantity ?? null, note: extra.note ?? null, category: extra.category ?? null });

  beforeAll(() => {
    execSync("npx prisma migrate deploy", { env: { ...process.env, DATABASE_URL: url }, stdio: "ignore" });
  });

  beforeEach(async () => {
    await db.shoppingItem.deleteMany();
    await db.shoppingList.deleteMany();
    await db.choreTask.deleteMany();
    await db.chore.deleteMany();
    await db.session.deleteMany();
    await db.kid.deleteMany();
    await db.user.deleteMany();
    await db.household.deleteMany();
    const u = await db.user.create({ data: { displayName: "Alex", email: "a@t.dev", passwordHash: "x" } });
    user = u.id;
    hh = await createHousehold(u.id, "Home", "America/Chicago");
    listId = (await shop.listsFor(hh))[0].id;
  });

  it("starts every household with a Groceries list", async () => {
    const lists = await shop.listsFor(hh);
    expect(lists.map((l) => l.name)).toEqual(["Groceries"]);
  });

  it("creates only one Groceries list when pages load at the same moment", async () => {
    const u = await db.user.create({ data: { displayName: "Dana", email: "d@t.dev", passwordHash: "x" } });
    const fresh = await createHousehold(u.id, "Fresh", "America/Chicago");
    await Promise.all(Array.from({ length: 5 }, () => shop.listsFor(fresh)));
    expect(await db.shoppingList.count({ where: { householdId: fresh } })).toBe(1);
  });

  it("guesses the aisle, then remembers the household's own choice", async () => {
    expect((await add("Bananas"))!.category).toBe("Produce");
    const ice = await add("Ice", { category: "Frozen" });
    expect(ice!.category).toBe("Frozen");
    await shop.setChecked(hh, ice!.id, true);
    await shop.clearChecked(hh, listId);
    expect((await add("ice"))!.category).toBe("Frozen");
  });

  it("adding something already on the list reuses it and puts it back if it was in the cart", async () => {
    const a = await add("Milk", { quantity: "1 gal" });
    await shop.setChecked(hh, a!.id, true);
    const b = await add("  milk ");
    expect(b!.id).toBe(a!.id);
    expect(b!.checkedAt).toBeNull();
    expect(b!.quantity).toBe("1 gal");
    expect(await db.shoppingItem.count({ where: { listId } })).toBe(1);
  });

  it("clear checked keeps history for suggestions", async () => {
    const eggs = await add("Eggs");
    await add("Bread");
    await shop.setChecked(hh, eggs!.id, true);
    expect(await shop.clearChecked(hh, listId)).toBe(1);
    expect((await shop.itemsOn(hh, listId)).map((i) => i.name)).toEqual(["Bread"]);
    expect(await shop.frequentItems(hh, listId)).toEqual(["Eggs"]);
    expect(await shop.pastItemNames(hh)).toContain("Eggs");
  });

  it("frequent items are ranked by how often they're bought", async () => {
    for (let i = 0; i < 3; i++) {
      const m = await add("Milk");
      await shop.setChecked(hh, m!.id, true);
      await shop.clearChecked(hh, listId);
    }
    const e = await add("Eggs");
    await shop.setChecked(hh, e!.id, true);
    await shop.clearChecked(hh, listId);
    expect(await shop.frequentItems(hh, listId)).toEqual(["Milk", "Eggs"]);
  });

  it("other households can't see or change this list", async () => {
    const item = await add("Milk");
    const other = await db.user.create({ data: { displayName: "Casey", email: "c@t.dev", passwordHash: "x" } });
    const otherHh = await createHousehold(other.id, "Other", "America/Chicago");
    expect(await shop.addItem(otherHh, listId, other.id, { name: "x", quantity: null, note: null, category: null })).toBeNull();
    await shop.setChecked(otherHh, item!.id, true);
    await shop.removeItem(otherHh, item!.id);
    expect(await shop.updateItem(otherHh, item!.id, { name: "y", quantity: null, note: null, category: "Other" })).toBe(false);
    await shop.deleteList(otherHh, listId);
    const still = await db.shoppingItem.findUniqueOrThrow({ where: { id: item!.id } });
    expect(still.checkedAt).toBeNull();
    expect(still.name).toBe("Milk");
  });

  it("deleting a list removes its items", async () => {
    await add("Milk");
    await shop.deleteList(hh, listId);
    expect(await db.shoppingItem.count()).toBe(0);
  });
});
