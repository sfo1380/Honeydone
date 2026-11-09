/** Store sections, in roughly the order you walk a grocery store. */
export const SHOPPING_CATEGORIES = [
  "Produce",
  "Bakery",
  "Meat & seafood",
  "Dairy & eggs",
  "Pantry",
  "Frozen",
  "Snacks",
  "Drinks",
  "Household",
  "Personal care",
  "Baby & kids",
  "Pets",
  "Other",
] as const;

export type ShoppingCategory = (typeof SHOPPING_CATEGORIES)[number];

const KEYWORDS: [ShoppingCategory, string[]][] = [
  ["Produce", ["apple", "banana", "lettuce", "spinach", "tomato", "onion", "garlic", "potato", "carrot", "pepper", "avocado", "lemon", "lime", "berries", "berry", "strawberr", "blueberr", "grape", "orange", "broccoli", "cucumber", "celery", "mushroom", "herb", "cilantro", "basil", "fruit", "salad", "kale", "zucchini", "corn", "peach", "pear", "melon", "ginger"]],
  ["Bakery", ["bread", "bagel", "bun", "roll", "tortilla", "muffin", "croissant", "baguette", "pita", "cake"]],
  ["Meat & seafood", ["chicken", "beef", "pork", "turkey", "bacon", "sausage", "ham", "steak", "ground", "salmon", "shrimp", "fish", "tuna steak", "lamb", "hot dog"]],
  ["Dairy & eggs", ["milk", "cheese", "yogurt", "yoghurt", "butter", "cream", "egg", "sour cream", "cottage"]],
  ["Frozen", ["frozen", "ice cream", "pizza", "waffle", "popsicle"]],
  ["Snacks", ["chip", "cracker", "cookie", "pretzel", "popcorn", "candy", "chocolate", "granola bar", "nuts", "trail mix"]],
  ["Drinks", ["water", "juice", "soda", "coffee", "tea", "beer", "wine", "seltzer", "sparkling", "kombucha", "gatorade"]],
  ["Pantry", ["rice", "pasta", "noodle", "flour", "sugar", "oil", "vinegar", "sauce", "salt", "spice", "cereal", "oat", "bean", "soup", "broth", "peanut butter", "jam", "jelly", "honey", "syrup", "canned", "tuna", "ketchup", "mustard", "mayo", "salsa", "baking"]],
  ["Household", ["paper towel", "toilet paper", "trash bag", "detergent", "dish soap", "sponge", "foil", "plastic wrap", "ziploc", "bleach", "cleaner", "light bulb", "batter", "napkin", "dryer sheet"]],
  ["Personal care", ["shampoo", "conditioner", "soap", "toothpaste", "toothbrush", "deodorant", "razor", "lotion", "floss", "sunscreen", "tissue", "vitamin", "medicine", "bandage"]],
  ["Baby & kids", ["diaper", "wipes", "formula", "baby", "pacifier"]],
  ["Pets", ["dog food", "cat food", "litter", "treats", "pet"]],
];

/** Best guess at the store section for an item name. */
export function guessCategory(name: string): ShoppingCategory {
  const n = name.toLowerCase();
  // Longest keyword wins, so "dish soap" beats "soap" and "ice cream" beats "cream".
  let best: { cat: ShoppingCategory; len: number } | null = null;
  for (const [cat, words] of KEYWORDS) {
    for (const w of words) {
      if (n.includes(w) && (!best || w.length > best.len)) best = { cat, len: w.length };
    }
  }
  return best?.cat ?? "Other";
}

/** "eggs" and " Eggs " are the same item. */
export function normalizeItemName(name: string) {
  return name.trim().replace(/\s+/g, " ").toLowerCase();
}
