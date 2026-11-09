export const CHORE_CATEGORIES = [
  "Kitchen",
  "Bathrooms",
  "Laundry",
  "Bedrooms",
  "Living areas",
  "Outdoor",
  "Pets",
  "Kids",
  "Errands",
  "Other",
] as const;

export const EFFORTS = [
  { value: "SMALL", label: "Small", hint: "a few minutes" },
  { value: "MEDIUM", label: "Medium", hint: "15 to 30 minutes" },
  { value: "LARGE", label: "Large", hint: "an hour or more" },
] as const;

export type StarterChore = {
  key: string;
  title: string;
  category: (typeof CHORE_CATEGORIES)[number];
  effort: "SMALL" | "MEDIUM" | "LARGE";
  repeat: "DAILY" | "WEEKLY" | "MONTHLY";
  interval?: number;
  /** 0 = Sunday ... 6 = Saturday */
  weekdays?: number[];
};

/** Common chores couples can add in one go instead of typing them in. */
export const STARTER_CHORES: StarterChore[] = [
  { key: "dishes", title: "Do the dishes", category: "Kitchen", effort: "SMALL", repeat: "DAILY" },
  { key: "dishwasher", title: "Unload the dishwasher", category: "Kitchen", effort: "SMALL", repeat: "DAILY" },
  { key: "counters", title: "Wipe kitchen counters", category: "Kitchen", effort: "SMALL", repeat: "DAILY" },
  { key: "dinner", title: "Cook dinner", category: "Kitchen", effort: "MEDIUM", repeat: "DAILY" },
  { key: "fridge", title: "Clean out the fridge", category: "Kitchen", effort: "MEDIUM", repeat: "WEEKLY", weekdays: [6] },
  { key: "trash", title: "Take out trash and recycling", category: "Outdoor", effort: "SMALL", repeat: "WEEKLY", weekdays: [2] },
  { key: "bathrooms", title: "Clean bathrooms", category: "Bathrooms", effort: "LARGE", repeat: "WEEKLY", weekdays: [6] },
  { key: "towels", title: "Change towels", category: "Bathrooms", effort: "SMALL", repeat: "WEEKLY", weekdays: [0] },
  { key: "laundry", title: "Do laundry", category: "Laundry", effort: "MEDIUM", repeat: "WEEKLY", weekdays: [1, 4] },
  { key: "fold", title: "Fold and put away laundry", category: "Laundry", effort: "MEDIUM", repeat: "WEEKLY", weekdays: [2, 5] },
  { key: "sheets", title: "Change bed sheets", category: "Bedrooms", effort: "MEDIUM", repeat: "WEEKLY", interval: 2, weekdays: [0] },
  { key: "vacuum", title: "Vacuum", category: "Living areas", effort: "MEDIUM", repeat: "WEEKLY", weekdays: [6] },
  { key: "mop", title: "Mop floors", category: "Living areas", effort: "MEDIUM", repeat: "WEEKLY", interval: 2, weekdays: [6] },
  { key: "dust", title: "Dust", category: "Living areas", effort: "SMALL", repeat: "WEEKLY", weekdays: [3] },
  { key: "tidy", title: "Ten-minute tidy-up", category: "Living areas", effort: "SMALL", repeat: "DAILY" },
  { key: "lawn", title: "Mow the lawn", category: "Outdoor", effort: "LARGE", repeat: "WEEKLY", weekdays: [6] },
  { key: "plants", title: "Water the plants", category: "Outdoor", effort: "SMALL", repeat: "WEEKLY", weekdays: [3, 6] },
  { key: "pets", title: "Feed the pets", category: "Pets", effort: "SMALL", repeat: "DAILY" },
  { key: "groceries", title: "Grocery run", category: "Errands", effort: "MEDIUM", repeat: "WEEKLY", weekdays: [0] },
  { key: "bills", title: "Pay the bills", category: "Errands", effort: "SMALL", repeat: "MONTHLY" },
  { key: "lunches", title: "Pack the kids' lunches", category: "Kids", effort: "SMALL", repeat: "WEEKLY", weekdays: [1, 2, 3, 4, 5] },
];
