import "server-only";
import { headers } from "next/headers";

/** Absolute invite link for the current deployment (works on localhost and Render). */
export async function inviteUrl(code: string) {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}/join/${code}`;
}
