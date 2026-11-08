/** A Honeydone household is always a couple. */
export const MAX_PARTNERS = 2;

export const SESSION_COOKIE = "hd_session";
export const SESSION_DAYS = 30;

export const PARTNER_COLORS = [
  { name: "Rose", value: "#e11d48" },
  { name: "Ocean", value: "#0284c7" },
  { name: "Forest", value: "#16a34a" },
  { name: "Plum", value: "#9333ea" },
  { name: "Tangerine", value: "#ea580c" },
  { name: "Teal", value: "#0d9488" },
] as const;

export const TIME_ZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Phoenix",
  "America/Los_Angeles",
  "America/Anchorage",
  "Pacific/Honolulu",
] as const;
