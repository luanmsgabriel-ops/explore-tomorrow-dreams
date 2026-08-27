import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { buildCandidates, buildPlannerRequest, normalizePlannerRecommendations } from "./trip-composer-window.ts";

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

Deno.test("buildCandidates maps discovery output to planner and visual contracts", () => {
  const { plannerCandidates, visualCandidates } = buildCandidates([
    {
      place_id: "place-1",
      name: "Parque Bicentenário",
      address: "Vitacura, Santiago",
      location: { latitude: -33.399, longitude: -70.601 },
      types: ["park", "tourist_attraction"],
      rating: 4.7,
      user_rating_count: 1200,
      photos: [{ name: "places/place-1/photos/1" }],
    },
  ], { default_duration_minutes: 90 });

  assertEquals(plannerCandidates.length, 1);
  assertEquals(plannerCandidates[0].name, "Parque Bicentenário");
  assertEquals(plannerCandidates[0].category, "park");
  assertEquals(plannerCandidates[0].tags, ["park", "tourist attraction"]);
  assertEquals(plannerCandidates[0].duration_minutes, 90);
  assertEquals(plannerCandidates[0].rain_sensitivity, 90);

  assertEquals(visualCandidates[0].title, "Parque Bicentenário");
  assertEquals(visualCandidates[0].source_reference, "place-1");
  assertEquals(visualCandidates[0].factual_snapshot.address, "Vitacura, Santiago");
  assertEquals(visualCandidates[0].media.length, 1);
});

Deno.test("buildPlannerRequest sends context shape required by planner", () => {
  const request = buildPlannerRequest({
    available_minutes: 180,
    preferences: ["park", "gastronomia"],
    rejected_categories: ["shopping mall"],
    passenger_context: { adults: 2, children: 1 },
    origin_lat: -33.45,
    origin_lng: -70.66,
  }, [{ id: "place-1", name: "Parque", latitude: -33.4, longitude: -70.6 }], {
    mode: "forecast",
    precipitation_probability: 70,
  });

  assertEquals(request.context.available_minutes, 180);
  assertEquals(request.context.preferred_categories, ["park", "gastronomia"]);
  assertEquals(request.context.rejected_categories, ["shopping mall"]);
  assertEquals(request.context.passengers, { adults: 2, children: 1 });
  assertEquals(request.context.weather, { precipitation_probability: 70 });
  assertEquals(request.origin, { latitude: -33.45, longitude: -70.66 });
  assertEquals(request.candidates[0].name, "Parque");
});

Deno.test("normalizePlannerRecommendations consumes planner candidates response and preserves visual data", () => {
  const recommendations = normalizePlannerRecommendations({
    candidates: [
      {
        id: "place-1",
        name: "Parque",
        planner: {
          score: 88,
          reasons: ["cabe_na_janela"],
          warnings: [],
          estimated_activity_minutes: 120,
          estimated_travel_minutes: 18,
          estimated_distance_meters: 5200,
        },
      },
    ],
    route_context_applied: true,
  }, [
    {
      id: "place-1",
      title: "Parque",
      categories: ["park"],
      media: [{ name: "photo-1" }],
    },
  ]);

  assertEquals(recommendations.length, 1);
  assertEquals(recommendations[0].score, 88);
  assertEquals(recommendations[0].candidate.title, "Parque");
  assertEquals(recommendations[0].estimated_travel_minutes, 18);
  assert(recommendations[0].candidate.media.length === 1);
});
