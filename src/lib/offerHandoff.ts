import {
  TRAVEL_OFFERS_NOTICE,
  type TravelOfferCatalogItem,
} from "@/lib/travelOffersPublic";

export const TOMORROW_WHATSAPP_NUMBER = "5515991833448";
export const TOMORROW_PUBLIC_ORIGIN = "https://tomorrowtravelbr.com.br";

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "UTC",
});

const placeLabel = (city: string | null, iata: string | null) => {
  if (!city) return iata;
  return iata ? `${city} (${iata})` : city;
};

const dateLabel = (value: string | null) => {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? null : dateFormatter.format(date);
};

const currencyLabel = (value: number, currency: string | null) => {
  if (!Number.isFinite(value)) return null;
  const safeCurrency = currency && /^[A-Z]{3}$/.test(currency) ? currency : "BRL";
  try {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: safeCurrency }).format(value);
  } catch {
    return null;
  }
};

export function offerHandoffTitle(item: TravelOfferCatalogItem) {
  return item.name || item.destination || item.destination_iata ||
    (item.kind === "air_block" ? item.airline : item.category) ||
    "Oportunidade Tomorrow Travel";
}

export function buildOfferDetailPath(offerId: string) {
  return `/oportunidades/oferta/${encodeURIComponent(offerId)}`;
}

export function buildOfferDetailUrl(offerId: string, origin: string) {
  return new URL(buildOfferDetailPath(offerId), origin).toString();
}

export function buildOfferWhatsAppMessage(item: TravelOfferCatalogItem, offerUrl: string) {
  const lines = [
    "Olá! Conheci esta oportunidade no Tomorrow Live e gostaria de mais informações:",
    "",
    offerHandoffTitle(item),
  ];
  const origin = placeLabel(item.origin, item.origin_iata);
  const destination = placeLabel(item.destination, item.destination_iata);
  if (origin && destination) lines.push(`${origin} → ${destination}`);
  else if (destination) lines.push(destination);
  else if (origin) lines.push(`Origem: ${origin}`);

  const departure = dateLabel(item.departure_date);
  const returnDate = dateLabel(item.return_date);
  if (departure && returnDate) lines.push(`Período: ${departure} a ${returnDate}`);
  else if (departure) lines.push(`Saída: ${departure}`);
  else if (returnDate) lines.push(`Retorno: ${returnDate}`);

  const price = currencyLabel(item.price_per_person, item.currency);
  if (price) lines.push(`Valor por pessoa: ${price}`);
  lines.push(`Código da oferta: ${item.id}`);
  lines.push(`Ver oferta: ${offerUrl}`);
  lines.push("", TRAVEL_OFFERS_NOTICE);
  return lines.join("\n");
}

export function buildOfferWhatsAppUrl(
  item: TravelOfferCatalogItem,
  origin = TOMORROW_PUBLIC_ORIGIN,
  phone = TOMORROW_WHATSAPP_NUMBER,
) {
  const offerUrl = buildOfferDetailUrl(item.id, origin);
  const message = buildOfferWhatsAppMessage(item, offerUrl);
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
