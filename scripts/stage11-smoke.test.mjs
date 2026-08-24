import assert from "node:assert/strict";
import test from "node:test";

import { findForbiddenPublicKeys, normalizeBaseUrl } from "./stage11-smoke.mjs";

test("normalizeBaseUrl removes trailing slashes", () => {
  assert.equal(normalizeBaseUrl("https://example.com///"), "https://example.com");
});

test("findForbiddenPublicKeys rejects internal fields recursively", () => {
  assert.deepEqual(
    findForbiddenPublicKeys({ item: { raw_data: {}, nested: [{ source_url: "x" }] } }),
    ["$.item.raw_data", "$.item.nested[0].source_url"],
  );
});

test("findForbiddenPublicKeys allows public DTO fields", () => {
  assert.deepEqual(
    findForbiddenPublicKeys({ items: [{ id: "id", image_url: "https://example.com/image.webp", destination: "Recife" }] }),
    [],
  );
});
