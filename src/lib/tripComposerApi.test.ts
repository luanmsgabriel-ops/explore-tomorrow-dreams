import { describe, expect, it } from "vitest";
import { tripComposerExcludedIds, type TripComposerSnapshot } from "@/lib/tripComposerApi";

const snapshot: TripComposerSnapshot = {
  session: {},
  days: [],
  preferences: [],
  items: [
    { external_place_id: "viator:TOUR-1", status: "SELECTED" },
    { external_place_id: "google-place-2", status: "CONFIRMED" },
    { external_place_id: "removed-place", status: "REMOVED" },
  ],
};

describe("tripComposerExcludedIds", () => {
  it("excludes selected itinerary items and previously displayed candidates", () => {
    expect(tripComposerExcludedIds(snapshot, ["viator:TOUR-3", "google-place-2"])).toEqual([
      "viator:TOUR-1",
      "google-place-2",
      "viator:TOUR-3",
    ]);
  });
});
