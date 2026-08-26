import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

const validDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value);
const clampWindow = (value: number) => Math.min(Math.max(value || 180, 30), 720);

Deno.test("Trip Composer window accepts canonical trip dates", () => {
  assertEquals(validDate("2026-09-02"), true);
  assertEquals(validDate("02-09-2026"), false);
});

Deno.test("Trip Composer window bounds planning horizon in minutes", () => {
  assertEquals(clampWindow(10), 30);
  assertEquals(clampWindow(180), 180);
  assertEquals(clampWindow(900), 720);
});