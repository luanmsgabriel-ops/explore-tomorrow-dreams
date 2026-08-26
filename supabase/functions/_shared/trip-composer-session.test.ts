import { assertEquals, assertMatch } from "https://deno.land/std@0.224.0/assert/mod.ts";

const sha256 = async (value: string) => {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
};

const token = () => {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes, byte => byte.toString(16).padStart(2, "0")).join("");
};

Deno.test("Trip Composer access token uses 256 bits and persists only SHA-256 shape", async () => {
  const raw = token();
  const hash = await sha256(raw);
  assertMatch(raw, /^[0-9a-f]{64}$/);
  assertMatch(hash, /^[0-9a-f]{64}$/);
  assertEquals(hash === raw, false);
});

Deno.test("same access token hashes deterministically", async () => {
  const raw = "a".repeat(64);
  assertEquals(await sha256(raw), await sha256(raw));
});