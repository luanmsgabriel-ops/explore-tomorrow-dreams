import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  buildCandidates,
  buildDiscoveryQueries,
  buildPlannerRequest,
  detectExperienceIntent,
  mergeExperiencePlaces,
  normalizePlannerRecommendations,
} from "./trip-composer-window.ts";

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

Deno.test("adventure intent expands discovery beyond a generic provider search", () => {
  const queries = buildDiscoveryQueries("aventura dia inteiro", "Santiago, Chile", ["aventura"]);
  assertEquals(queries.length, 3);
  assert(queries.some(query => query.includes("trilhas")));
  assert(queries.some(query => query.includes("rafting")));
});

Deno.test("beach and drink intent prioritizes beaches and beachfront venues", () => {
  const intent = detectExperienceIntent("quero uma praia para beber alguma coisa", []);
  assertEquals(intent.beach, true);
  assertEquals(intent.drink, true);
  const queries = buildDiscoveryQueries("praia para beber", "Natal, RN", []);
  assert(queries[0].startsWith("praias em"));
  assert(queries.some(query => query.includes("beira-mar") || query.includes("beach bars")));
});

Deno.test("mergeExperiencePlaces removes travel agencies and deduplicates real places", () => {
  const places = mergeExperiencePlaces([[{ place_id: "agency", name: "Adventure Tours", types: ["travel_agency"], location: { latitude: 1, longitude: 1 } }, { place_id: "park", name: "Parque Natural", types: ["park", "tourist_attraction"], location: { latitude: 2, longitude: 2 } }],[{ place_id: "park", name: "Parque Natural", types: ["park"], location: { latitude: 2, longitude: 2 } }, { place_id: "trail", name: "Trilha Andina", types: ["hiking_area"], location: { latitude: 3, longitude: 3 } }]]);
  assertEquals(places.map(place => place.place_id), ["park", "trail"]);
});

Deno.test("beach intent rejects Praia Shopping and inland bars but keeps beach and nearby beachfront bar", () => {
  const intent = detectExperienceIntent("praia para beber uma caipirinha", []);
  const places = mergeExperiencePlaces([[{ place_id: "beach", name: "Praia de Ponta Negra", types: ["beach", "tourist_attraction"], location: { latitude: -5.8802, longitude: -35.1714 } }, { place_id: "mall", name: "Praia Shopping", types: ["shopping_mall", "establishment"], location: { latitude: -5.8700, longitude: -35.1800 } }],[{ place_id: "near-bar", name: "Bar da Orla", types: ["bar", "restaurant"], location: { latitude: -5.8810, longitude: -35.1708 } }, { place_id: "far-bar", name: "Bar do Centro", types: ["bar"], location: { latitude: -5.7950, longitude: -35.2100 } }]], 16, intent);
  assertEquals(places.map(place => place.place_id), ["beach", "near-bar"]);
});

Deno.test("buildCandidates maps discovery output to planner and visual contracts", () => {
  const { plannerCandidates, visualCandidates } = buildCandidates([{ place_id: "place-1", name: "Parque Bicentenário", address: "Vitacura, Santiago", location: { latitude: -33.399, longitude: -70.601 }, types: ["park", "tourist_attraction"], rating: 4.7, user_rating_count: 1200, photos: [{ name: "places/place-1/photos/1" }] }], { default_duration_minutes: 90 });
  assertEquals(plannerCandidates.length, 1);
  assertEquals(plannerCandidates[0].name, "Parque Bicentenário");
  assertEquals(plannerCandidates[0].category, "park");
  assertEquals(plannerCandidates[0].tags, ["park", "tourist attraction"]);
  assertEquals(plannerCandidates[0].duration_minutes, 90);
  assertEquals(plannerCandidates[0].rain_sensitivity, 90);
  assertEquals(visualCandidates[0].title, "Parque Bicentenário");
  assertEquals(visualCandidates[0].duration_minutes, 90);
  assertEquals(visualCandidates[0].source_reference, "place-1");
  assertEquals(visualCandidates[0].factual_snapshot.address, "Vitacura, Santiago");
  assertEquals(visualCandidates[0].media.length, 1);
});

Deno.test("visual duration stays absent when the source does not provide a curated duration", () => {
  const { plannerCandidates, visualCandidates } = buildCandidates([{ place_id: "place-2", name: "Mirante", location: { latitude: -33.4, longitude: -70.6 }, types: ["tourist_attraction"] }], {});
  assertEquals(visualCandidates[0].duration_minutes, null);
  assertEquals(plannerCandidates[0].duration_minutes, 120);
});

Deno.test("buildPlannerRequest sends context shape required by planner", () => {
  const request = buildPlannerRequest({ available_minutes: 180, preferences: ["park", "gastronomia"], rejected_categories: ["shopping mall"], passenger_context: { adults: 2, children: 1 }, origin_lat: -33.45, origin_lng: -70.66 }, [{ id: "place-1", name: "Parque", latitude: -33.4, longitude: -70.6 }], { mode: "forecast", precipitation_probability: 70 });
  assertEquals(request.context.available_minutes, 180);
  assertEquals(request.context.preferred_categories, ["park", "gastronomia"]);
  assertEquals(request.context.rejected_categories, ["shopping mall"]);
  assertEquals(request.context.passengers, { adults: 2, children: 1 });
  assertEquals(request.context.weather, { precipitation_probability: 70 });
  assertEquals(request.origin, { latitude: -33.45, longitude: -70.66 });
  assertEquals(request.candidates[0].name, "Parque");
});

Deno.test("normalizePlannerRecommendations consumes planner candidates response and preserves visual data", () => {
  const recommendations = normalizePlannerRecommendations({ candidates: [{ id: "place-1", name: "Parque", planner: { score: 88, reasons: ["cabe_na_janela"], warnings: [], estimated_activity_minutes: 120, estimated_travel_minutes: 18, estimated_distance_meters: 5200 } }], route_context_applied: true }, [{ id: "place-1", title: "Parque", categories: ["park"], media: [{ name: "photo-1" }] }]);
  assertEquals(recommendations.length, 1);
  assertEquals(recommendations[0].score, 88);
  assertEquals(recommendations[0].candidate.title, "Parque");
  assertEquals(recommendations[0].estimated_travel_minutes, 18);
  assertEquals(recommendations[0].estimated_distance_meters, 5200);
  assert(recommendations[0].candidate.media.length === 1);
});
