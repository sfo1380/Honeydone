import { describe, expect, it } from "vitest";
import { safeNext } from "@/lib/safe-next";
import { hashToken, randomToken } from "@/lib/tokens";
import { fieldErrors, profileSchema, signUpSchema } from "@/lib/validation";

describe("safeNext", () => {
  it("allows our own invite pages", () => {
    expect(safeNext("/join/abc_DEF-123")).toBe("/join/abc_DEF-123");
  });
  it.each(["https://evil.example", "//evil.example", "/dashboard", "/join/../x", "", null, undefined])(
    "rejects %s",
    (value) => expect(safeNext(value)).toBeUndefined(),
  );
});

describe("tokens", () => {
  it("are random and URL-safe", () => {
    const a = randomToken();
    expect(a).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(randomToken()).not.toBe(a);
  });
  it("hash deterministically", () => {
    expect(hashToken("x")).toBe(hashToken("x"));
    expect(hashToken("x")).not.toBe("x");
  });
});

describe("validation", () => {
  it("normalizes email and trims names", () => {
    const r = signUpSchema.parse({ displayName: "  Sam ", email: " Sam@Example.COM ", password: "longenough" });
    expect(r).toEqual({ displayName: "Sam", email: "sam@example.com", password: "longenough" });
  });
  it("reports one message per field", () => {
    const r = signUpSchema.safeParse({ displayName: "", email: "nope", password: "short" });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(Object.keys(fieldErrors(r.error)).sort()).toEqual(["displayName", "email", "password"]);
    }
  });
  it("only accepts palette colors", () => {
    expect(profileSchema.safeParse({ displayName: "Sam", color: "#e11d48" }).success).toBe(true);
    expect(profileSchema.safeParse({ displayName: "Sam", color: "red" }).success).toBe(false);
  });
});
