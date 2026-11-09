import { describe, expect, it } from "vitest";
import { guessCategory, normalizeItemName } from "@/lib/shopping-catalog";

describe("guessCategory", () => {
  it.each([
    ["Bananas", "Produce"],
    ["2% milk", "Dairy & eggs"],
    ["Eggs", "Dairy & eggs"],
    ["Ice cream", "Frozen"],
    ["Dish soap", "Household"],
    ["Hand soap", "Personal care"],
    ["Paper towels", "Household"],
    ["Sourdough bread", "Bakery"],
    ["Ground beef", "Meat & seafood"],
    ["Peanut butter", "Pantry"],
    ["Dog food", "Pets"],
    ["Diapers", "Baby & kids"],
    ["Birthday card", "Other"],
  ])("%s → %s", (name, cat) => expect(guessCategory(name)).toBe(cat));
});

describe("normalizeItemName", () => {
  it("ignores case and extra spaces", () => {
    expect(normalizeItemName("  Greek   Yogurt ")).toBe("greek yogurt");
  });
});
