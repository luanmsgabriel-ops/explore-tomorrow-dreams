import { assertEquals } from "https://deno.land/std@0.168.0/testing/asserts.ts";
import { isValidAccessToken, sha256 } from "./claimUtils.ts";

Deno.test("accepts only 64-char hexadecimal access tokens", () => {
  assertEquals(isValidAccessToken("a".repeat(64)), true);
  assertEquals(isValidAccessToken("A1".repeat(32)), true);
  assertEquals(isValidAccessToken("g".repeat(64)), false);
  assertEquals(isValidAccessToken("a".repeat(63)), false);
  assertEquals(isValidAccessToken(null), false);
});

Deno.test("hashes access tokens deterministically with sha256", async () => {
  const token = "a".repeat(64);
  const first = await sha256(token);
  const second = await sha256(token);
  assertEquals(first, second);
  assertEquals(first.length, 64);
});
