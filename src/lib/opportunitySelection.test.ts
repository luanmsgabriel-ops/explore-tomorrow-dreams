import { beforeEach, describe, expect, it } from "vitest";

import {
  MAX_OPPORTUNITY_SELECTION,
  OPPORTUNITY_SELECTION_STORAGE_KEY,
  addSelectionId,
  readStoredSelectionIds,
  writeStoredSelectionIds,
} from "./opportunitySelection";

const OFFER_A = "0191a5f2-ccaa-7f03-8f00-1234567890ab";
const OFFER_B = "0191a5f2-ccaa-7f03-8f00-1234567890ac";

describe("opportunity selection", () => {
  beforeEach(() => window.localStorage.clear());

  it("persists a valid selection and removes duplicates", () => {
    expect(writeStoredSelectionIds([OFFER_A, OFFER_A, OFFER_B])).toEqual([OFFER_A, OFFER_B]);
    expect(readStoredSelectionIds()).toEqual([OFFER_A, OFFER_B]);
    expect(JSON.parse(window.localStorage.getItem(OPPORTUNITY_SELECTION_STORAGE_KEY) || "[]")).toEqual([OFFER_A, OFFER_B]);
  });

  it("adds offers without exceeding the public selection limit", () => {
    let ids: string[] = [];
    for (let index = 0; index < MAX_OPPORTUNITY_SELECTION + 3; index += 1) {
      ids = addSelectionId(ids, `0191a5f2-ccaa-7f03-8f00-${String(index).padStart(12, "0")}`);
    }
    expect(ids).toHaveLength(MAX_OPPORTUNITY_SELECTION);
  });

  it("clears invalid local storage content safely", () => {
    window.localStorage.setItem(OPPORTUNITY_SELECTION_STORAGE_KEY, "not-json");
    expect(readStoredSelectionIds()).toEqual([]);
  });
});
