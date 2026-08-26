import { assertEquals, assert } from "https://deno.land/std@0.168.0/testing/asserts.ts";
import { rankCandidates } from "./trip-composer-planner.ts";

Deno.test("planner rejects candidates that do not fit the available window", () => {
  const ranked = rankCandidates([
    { id: "a", name: "Long activity", latitude: 0, longitude: 0, duration_minutes: 240, category: "culture" },
    { id: "b", name: "Short activity", latitude: 0, longitude: 0, duration_minutes: 60, category: "culture" },
  ], {
    available_minutes: 120,
    preferred_categories: ["culture"],
  }, {
    a: { duration_minutes: 20, distance_meters: 5000 },
    b: { duration_minutes: 10, distance_meters: 1500 },
  });

  assertEquals(ranked.length, 1);
  assertEquals(ranked[0].candidate.id, "b");
});

Deno.test("planner prefers matching category and short route", () => {
  const ranked = rankCandidates([
    { id: "a", name: "Museum", latitude: 0, longitude: 0, duration_minutes: 90, category: "culture" },
    { id: "b", name: "Mall", latitude: 0, longitude: 0, duration_minutes: 90, category: "shopping" },
  ], {
    available_minutes: 240,
    preferred_categories: ["culture"],
  }, {
    a: { duration_minutes: 10, distance_meters: 1000 },
    b: { duration_minutes: 30, distance_meters: 8000 },
  });

  assertEquals(ranked[0].candidate.id, "a");
  assert(ranked[0].score > ranked[1].score);
});

Deno.test("planner penalizes rain-sensitive candidate", () => {
  const ranked = rankCandidates([
    { id: "a", name: "Outdoor", latitude: 0, longitude: 0, duration_minutes: 60, rain_sensitivity: 100 },
    { id: "b", name: "Indoor", latitude: 0, longitude: 0, duration_minutes: 60, rain_sensitivity: 0 },
  ], {
    available_minutes: 180,
    weather: { precipitation_probability: 80 },
  }, {
    a: { duration_minutes: 10, distance_meters: 1000 },
    b: { duration_minutes: 10, distance_meters: 1000 },
  });

  assertEquals(ranked[0].candidate.id, "b");
});
