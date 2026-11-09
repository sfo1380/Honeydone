import { createHash, randomBytes } from "node:crypto";

/** A URL-safe random token with `bytes` bytes of entropy. */
export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

/** SHA-256 hex digest, used so raw session tokens never touch the database. */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
