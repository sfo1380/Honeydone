/** Only follow a `next` redirect to one of our own invite pages, never to another site. */
export function safeNext(value: unknown): string | undefined {
  return typeof value === "string" && /^\/join\/[A-Za-z0-9_-]+$/.test(value) ? value : undefined;
}
