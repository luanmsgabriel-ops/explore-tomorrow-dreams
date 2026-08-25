import {
  TRAVEL_OFFERS_NOTICE,
  type CatalogParams,
} from "@/lib/travelOffersPublic";

export const TOMORROW_WHATSAPP_NUMBER = "5515991833448";
export const TOMORROW_PUBLIC_ORIGIN = "https://tomorrowtravelbr.com.br";

export interface TravelHandoffContext {
  origin?: string;
  destination?: string;
  start_date?: string;
  end_date?: string;
  passengers?: number;
  offer_type?: "bloqueio_aereo" | "pacote";
}

export interface OfferWhatsAppOptions {
  context?: TravelHandoffContext | null;
  origin?: string;
  phone?: string;
}

export interface OfferHandoffItem {
  id: string;
  kind: "air_block" | "package" | "guided_group";
  name?: string | null;
  category?: string | null;
  airline?: string | null;
  origin: string | null;
  origin_iata: string | null;
  destination: string | null;
  destination_iata: string | null;
  departure_date: string | null;
  return_date: string | null;
  price_per_person: number;
  currency: string | null;
}

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

export function offerHandoffTitle(item: OfferHandoffItem) {
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

export function travelHandoffContextFromCatalogParams(params: CatalogParams): TravelHandoffContext {
  const context: TravelHandoffContext = {};
  if (params.origin) context.origin = params.origin;
  if (params.destination) context.destination = params.destination;
  if (params.start_date) context.start_date = params.start_date;
  if (params.end_date) context.end_date = params.end_date;
  if (params.passengers) context.passengers = params.passengers;
  if (params.offer_type) context.offer_type = params.offer_type;
  return context;
}

function appendHandoffContext(lines: string[], context?: TravelHandoffContext | null) {
  if (!context || Object.keys(context).length === 0) return;
  const details: string[] = [];
  if (context.origin) details.push(`Origem desejada: ${context.origin}`);
  if (context.destination) details.push(`Destino desejado: ${context.destination}`);

  const startDate = dateLabel(context.start_date ?? null);
  const endDate = dateLabel(context.end_date ?? null);
  if (startDate && endDate) details.push(`Período desejado: ${startDate} a ${endDate}`);
  else if (startDate) details.push(`Data inicial desejada: ${startDate}`);
  else if (endDate) details.push(`Data final desejada: ${endDate}`);

  if (context.passengers) {
    details.push(`${context.passengers} ${context.passengers === 1 ? "passageiro" : "passageiros"}`);
  }
  if (context.offer_type) {
    details.push(`Tipo procurado: ${context.offer_type === "pacote" ? "Pacote" : "Bloqueio aéreo"}`);
  }
  if (details.length > 0) lines.push("", "Preferências informadas no Tomorrow Live:", ...details);
}

export function buildOfferWhatsAppMessage(
  item: OfferHandoffItem,
  offerUrl: string,
  context?: TravelHandoffContext | null,
) {
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
  appendHandoffContext(lines, context);
  lines.push("", TRAVEL_OFFERS_NOTICE);
  return lines.join("\n");
}

export function buildOfferWhatsAppUrl(
  item: OfferHandoffItem,
  options: OfferWhatsAppOptions = {},
) {
  const origin = options.origin ?? TOMORROW_PUBLIC_ORIGIN;
  const phone = options.phone ?? TOMORROW_WHATSAPP_NUMBER;
  const offerUrl = buildOfferDetailUrl(item.id, origin);
  const message = buildOfferWhatsAppMessage(item, offerUrl, options.context);
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
