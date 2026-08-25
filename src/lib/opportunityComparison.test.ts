import { beforeEach, describe, expect, it } from "vitest";

import {
  addComparisonId,
  comparisonHref,
  readStoredComparisonIds,
  writeStoredComparisonIds,
} from "./opportunityComparison";

const IDS = [
  "11111111-1111-4111-8111-111111111111",
  "22222222-2222-4222-8222-222222222222",
  "33333333-3333-4333-8333-333333333333",
  "44444444-4444-4444-8444-444444444444",
];

describe("opportunity comparison persistence", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("persists catalog selections for the compare page", () => {
    const first = writeStoredComparisonIds(addComparisonId([], IDS[0]));
    const second = writeStoredComparisonIds(addComparisonId(first, IDS[1]));

    expect(second).toEqual([IDS[0], IDS[1]]);
    expect(readStoredComparisonIds()).toEqual([IDS[0], IDS[1]]);
    expect(comparisonHref(readStoredComparisonIds())).toContain("/oportunidades/comparar?ids=");
  });

  it("keeps the comparison limited to three unique offers", () => {
    let selected: string[] = [];
    for (const id of IDS) selected = addComparisonId(selected, id);

    expect(selected).toEqual(IDS.slice(0, 3));
    expect(writeStoredComparisonIds([...selected, IDS[3]])).toEqual(IDS.slice(0, 3));
  });
});
