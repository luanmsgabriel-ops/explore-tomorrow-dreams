import type { TravelOfferDetailItem } from "@/lib/travelOffersPublic";

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

const dateTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Sao_Paulo",
});

export function formatOpportunityCurrency(value: number | null, currency?: string | null) {
  if (value === null || !Number.isFinite(value)) return null;
  const safeCurrency = currency && /^[A-Z]{3}$/.test(currency) ? currency : "BRL";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: safeCurrency }).format(value);
}

export function formatOpportunityDate(value: string | null) {
  if (!value) return null;
  const parsed = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(parsed.getTime()) ? null : dateFormatter.format(parsed);
}

export function formatOpportunityDateTime(value: string | null) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : dateTimeFormatter.format(parsed);
}

export function opportunityPlace(city: string | null, iata: string | null) {
  if (city && iata) return `${city} (${iata})`;
  return city || iata || null;
}

export function opportunityRoute(item: TravelOfferDetailItem) {
  const origin = opportunityPlace(item.origin, item.origin_iata);
  const destination = opportunityPlace(item.destination, item.destination_iata);
  if (origin && destination) return `${origin} → ${destination}`;
  return destination || origin || "Rota não informada";
}

export function opportunityTitle(item: TravelOfferDetailItem) {
  if (item.kind !== "air_block" && item.name) return item.name;
  if (item.kind === "air_block" && item.airline) return `${item.airline} · ${opportunityRoute(item)}`;
  return opportunityRoute(item);
}

export function opportunityTypeLabel(item: TravelOfferDetailItem) {
  if (item.kind === "air_block") return "Bloqueio aéreo";
  if (item.kind === "guided_group") return "Grupo guiado";
  if (item.offer_subtype === "evento") return "Pacote de evento";
  if (item.offer_subtype === "internacional") return "Pacote internacional";
  return "Pacote nacional";
}

export function opportunityTotalPerPerson(item: TravelOfferDetailItem) {
  if (item.tax_per_person === null) return null;
  const total = item.price_per_person + item.tax_per_person;
  return Number.isFinite(total) ? total : null;
}
