import { assertEquals, assert } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { evaluateRadarMatch, sanitizeOfferSnapshot, type PublicOfferForMatching, type RadarForMatching } from "./matcher.ts";

const radar: RadarForMatching = {
  id: "00000000-0000-4000-8000-000000000001",
  user_id: "00000000-0000-4000-8000-000000000002",
  status: "active",
  origin: "São Paulo",
  destination: "Recife",
  start_date: "2026-10-10",
  end_date: "2026-10-15",
  flexibility_days: 3,
  min_nights: 4,
  max_nights: 6,
  passengers: 2,
  budget_min: null,
  budget_max: 3000,
  budget_currency: "BRL",
  offer_type: "pacote",
  offer_subtype: "nacional",
  category: "praia",
};

const baseOffer: PublicOfferForMatching = {
  id: "10000000-0000-4000-8000-000000000001",
  offer_type: "pacote",
  offer_subtype: "nacional",
  name: "Recife",
  category: "praia",
  origin: "São Paulo",
  origin_iata: "GRU",
  destination: "Recife",
  destination_iata: "REC",
  departure_date: "2026-10-10",
  return_date: "2026-10-15",
  nights: 5,
  price_per_person: 2500,
  tax_per_person: 100,
  currency: "BRL",
  available_seats: 4,
  airfare_included: true,
  image_url: "https://example.com/recife.webp",
  updated_at: "2026-09-11T18:00:00Z",
};

Deno.test("exact never violates hard filters", () => {
  const result = evaluateRadarMatch(radar, baseOffer, [{ preference_key: "praia", score: 1 }]);
  assert(result);
  assertEquals(result.matchClass, "exact");
  assert(result.score > 90);
  assertEquals(evaluateRadarMatch(radar, { ...baseOffer, price_per_person: 3500 }), null);
  assertEquals(evaluateRadarMatch(radar, { ...baseOffer, available_seats: 1 }), null);
});

Deno.test("flexible uses only explicit date flexibility", () => {
  const result = evaluateRadarMatch(radar, { ...baseOffer, departure_date: "2026-10-08", return_date: "2026-10-13" });
  assert(result);
  assertEquals(result.matchClass, "flexible");
  assertEquals(evaluateRadarMatch({ ...radar, flexibility_days: 0 }, { ...baseOffer, departure_date: "2026-10-08", return_date: "2026-10-13" }), null);
});

Deno.test("discovery is separate and requires positive explicit affinity", () => {
  const alternative = { ...baseOffer, id: "10000000-0000-4000-8000-000000000002", destination: "Maceió" };
  assertEquals(evaluateRadarMatch(radar, alternative), null);
  const result = evaluateRadarMatch(radar, alternative, [{ preference_key: "praia", score: 0.5 }]);
  assert(result);
  assertEquals(result.matchClass, "discovery");
  assert(result.unmatchedFactors.some((factor) => factor.key === "destination"));
});

Deno.test("paused radar never matches and snapshot stays public-minimal", () => {
  assertEquals(evaluateRadarMatch({ ...radar, status: "paused" }, baseOffer), null);
  const snapshot = sanitizeOfferSnapshot(baseOffer) as Record<string, unknown>;
  assertEquals(snapshot.id, baseOffer.id);
  assertEquals("raw_data" in snapshot, false);
  assertEquals("source_url" in snapshot, false);
});

Deno.test("air-block destination follows the same public canonicalization", () => {
  const airRadar = { ...radar, offer_type: "bloqueio_aereo" as const, offer_subtype: "bloqueio" as const, min_nights: null, max_nights: null };
  const rawAirOffer: PublicOfferForMatching = {
    ...baseOffer,
    id: "10000000-0000-4000-8000-000000000003",
    offer_type: "bloqueio_aereo",
    offer_subtype: "bloqueio",
    name: null,
    category: "Bloqueio aéreo",
    destination: "Porto de Galinhas",
    destination_iata: "REC",
    airfare_included: true,
  };
  const result = evaluateRadarMatch(airRadar, rawAirOffer);
  assert(result);
  assertEquals(result.matchClass, "exact");
  assertEquals((sanitizeOfferSnapshot(rawAirOffer) as Record<string, unknown>).destination, "Recife");
});
