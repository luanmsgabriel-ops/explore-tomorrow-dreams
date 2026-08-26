import { assertEquals, assertThrows } from "jsr:@std/assert@1";

import {
  DEFAULT_SELECTION_TITLE,
  MAX_SELECTION_OFFERS,
  createPublicToken,
  validateCreateSelection,
  validateGetSelection,
} from "./core.ts";

const OFFER_A = "0191a5f2-ccaa-7f03-8f00-1234567890ab";
const OFFER_B = "0191a5f2-ccaa-7f03-8f00-1234567890ac";

Deno.test("creates a normalized selection request", () => {
  assertEquals(validateCreateSelection({ action: "create", offer_ids: [OFFER_A, OFFER_A, OFFER_B] }), {
    title: DEFAULT_SELECTION_TITLE,
    description: null,
    offerIds: [OFFER_A, OFFER_B],
  });

  assertEquals(validateCreateSelection({
    action: "create",
    title: " Orlando em família ",
    description: " Opções para comparar. ",
    offer_ids: [OFFER_A],
  }), {
    title: "Orlando em família",
    description: "Opções para comparar.",
    offerIds: [OFFER_A],
  });
});

Deno.test("rejects empty, oversized and invalid selections", () => {
  assertThrows(() => validateCreateSelection({ action: "create", offer_ids: [] }));
  assertThrows(() => validateCreateSelection({ action: "create", offer_ids: Array.from({ length: MAX_SELECTION_OFFERS + 1 }, (_, index) => `0191a5f2-ccaa-7f03-8f00-${String(index).padStart(12, "0")}`) }));
  assertThrows(() => validateCreateSelection({ action: "create", offer_ids: ["invalid"] }));
  assertThrows(() => validateCreateSelection({ action: "create", offer_ids: [OFFER_A], raw_data: true }));
});

Deno.test("generates and validates opaque public tokens", () => {
  const token = createPublicToken();
  assertEquals(validateGetSelection({ action: "get", token }), token);
  assertThrows(() => validateGetSelection({ action: "get", token: "orlando" }));
});
