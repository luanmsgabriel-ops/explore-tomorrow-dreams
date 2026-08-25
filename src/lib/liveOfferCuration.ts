import type { VoiceTranscriptEntry } from "@/lib/realtimeVoice";
import type { TravelOfferCatalogItem } from "@/lib/travelOffersPublic";

const MAX_COMPARISON_DESTINATIONS = 3;
const MAX_SINGLE_DESTINATION_OFFERS = 3;

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function latestFinalUserText(entries: VoiceTranscriptEntry[]) {
  return [...entries].reverse().find((entry) => entry.role === "user" && entry.final)?.text ?? "";
}

export function userRequestsDestinationComparison(entries: VoiceTranscriptEntry[]) {
  const text = normalize(latestFinalUserText(entries));
  return (
    text.includes("destinos diferentes") ||
    text.includes("tres destinos") ||
    text.includes("3 destinos") ||
    /compar(?:a|ar|e).{0,40}destinos?/.test(text)
  );
}

function destinationKey(item: TravelOfferCatalogItem) {
  const value = item.destination_iata || item.destination || item.name || item.id;
  return normalize(value);
}

function byPriceThenDate(a: TravelOfferCatalogItem, b: TravelOfferCatalogItem) {
  const priceDifference = a.price_per_person - b.price_per_person;
  if (priceDifference !== 0) return priceDifference;
  return (a.departure_date ?? "9999-12-31").localeCompare(b.departure_date ?? "9999-12-31");
}

export function cheapestOfferPerDestination(items: TravelOfferCatalogItem[]) {
  const order: string[] = [];
  const cheapest = new Map<string, TravelOfferCatalogItem>();

  for (const item of items) {
    const key = destinationKey(item);
    if (!cheapest.has(key)) order.push(key);
    const current = cheapest.get(key);
    if (!current || byPriceThenDate(item, current) < 0) cheapest.set(key, item);
  }

  return order
    .map((key) => cheapest.get(key))
    .filter((item): item is TravelOfferCatalogItem => Boolean(item))
    .slice(0, MAX_COMPARISON_DESTINATIONS);
}

export function curateLiveOfferBatch(
  current: TravelOfferCatalogItem[],
  incoming: TravelOfferCatalogItem[],
  comparisonRequested: boolean,
) {
  const merged = new Map<string, TravelOfferCatalogItem>();
  [...current, ...incoming].forEach((item) => merged.set(item.id, item));
  const uniqueItems = Array.from(merged.values());
  const distinctDestinations = new Set(uniqueItems.map(destinationKey)).size;

  if (comparisonRequested || distinctDestinations > 1) {
    return cheapestOfferPerDestination(uniqueItems);
  }

  return uniqueItems.sort(byPriceThenDate).slice(0, MAX_SINGLE_DESTINATION_OFFERS);
}
