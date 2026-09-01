import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  chooseDestination,
  extractLocationRefs,
  normalizeViatorProduct,
  semanticViatorTerms,
  shouldPreferViator,
} from "./trip-composer-viator.ts";

Deno.test("chooseDestination prefers exact normalized destination", () => {
  const result = chooseDestination([
    { id: 1, name: "Natal" },
    { id: 2, name: "Natal Province" },
  ], "Natal, RN, Brasil");
  assertEquals(result?.id, 1);
});

Deno.test("extractLocationRefs gathers logistics and itinerary refs without duplicates", () => {
  const refs = extractLocationRefs({
    logistics: { start: [{ location: { ref: "LOC-A" } }] },
    itinerary: {
      activityInfo: { location: { ref: "LOC-B" } },
      itineraryItems: [{ pointOfInterestLocation: { location: { ref: "LOC-A" } } }],
    },
  });
  assertEquals(refs, ["LOC-A", "LOC-B"]);
});

Deno.test("normalizeViatorProduct creates a geocoded tour candidate without supplier URL leakage", () => {
  const summary = {
    productCode: "123P1",
    title: "Passeio de buggy pelo litoral",
    description: "Experiência guiada pelo litoral.",
    duration: { fixedDurationInMinutes: 240 },
    itineraryType: "ACTIVITY",
    confirmationType: "INSTANT",
    reviews: { combinedAverageRating: 4.9, totalReviews: 500 },
    productUrl: "https://example.invalid/affiliate-secret-url",
    images: [{ variants: [{ width: 800, height: 600, url: "https://cdn.example/image.jpg" }] }],
    pricing: { summary: { fromPrice: 250 }, currency: "BRL" },
  };
  const detail = {
    ...summary,
    logistics: { start: [{ location: { ref: "LOC-A" } }] },
    itinerary: { itineraryType: "ACTIVITY", duration: { fixedDurationInMinutes: 240 } },
  };
  const locations = new Map([["LOC-A", {
    reference: "LOC-A",
    name: "Ponto de encontro",
    address: { administrativeArea: "Natal", country: "Brasil" },
    center: { latitude: -5.79, longitude: -35.2 },
  }]]);
  const result = normalizeViatorProduct(summary, detail, locations);
  assert(result);
  assertEquals(result.place_id, "viator:123P1");
  assertEquals(result.source_kind, "VIATOR_PRODUCT");
  assertEquals(result.duration_minutes, 240);
  assertEquals(result.photos[0].url, "https://cdn.example/image.jpg");
  assertEquals((result.factual_snapshot as Record<string, unknown>).product_code, "123P1");
  assertEquals("productUrl" in result.factual_snapshot, false);
});

Deno.test("semantic tour intent prefers Viator while local beach bar remains Places-led", () => {
  assert(semanticViatorTerms("quero um passeio de aventura", []).includes("adventure"));
  assertEquals(shouldPreferViator("quero os melhores passeios de Natal", []), true);
  assertEquals(shouldPreferViator("quero uma praia para beber em Ponta Negra", []), false);
  assertEquals(shouldPreferViator("quero um restaurante para jantar", []), false);
});
