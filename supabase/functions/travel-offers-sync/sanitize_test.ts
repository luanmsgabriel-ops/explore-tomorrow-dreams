import { assertEquals, assertFalse } from "https://deno.land/std@0.168.0/testing/asserts.ts";
import { sanitizeForPostgresJson } from "./sanitize.ts";

Deno.test("sanitizeForPostgresJson removes NUL characters recursively", () => {
  const input = {
    title: "Pacote\u0000 Recife",
    nested: {
      description: "Hotel\u0000 + aéreo",
      values: ["normal", "taxa\u0000", 42, true, null],
    },
  };

  const sanitized = sanitizeForPostgresJson(input);

  assertEquals(sanitized, {
    title: "Pacote Recife",
    nested: {
      description: "Hotel + aéreo",
      values: ["normal", "taxa", 42, true, null],
    },
  });
  assertFalse(JSON.stringify(sanitized).includes("\\u0000"));
});

Deno.test("sanitizeForPostgresJson preserves valid Unicode and literal escape text", () => {
  const input = {
    destination: "São Luís ✈️",
    literal: "texto \\u0000 documental",
  };

  assertEquals(sanitizeForPostgresJson(input), input);
});
