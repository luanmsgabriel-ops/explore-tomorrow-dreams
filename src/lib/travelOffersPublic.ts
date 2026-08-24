import { FunctionsHttpError } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";
import {
  canonicalAirBlockDestination,
  canonicalAirBlockFacetDestination,
  sourceAirBlockDestinationForCity,
} from "@/lib/airportDestinations";

export const TRAVEL_OFFERS_NOTICE =
  "Preços e disponibilidade estão sujeitos à confirmação no momento da reserva.";

export type PublicOfferType = "bloqueio_aereo" | "pacote";
export type PublicOfferSubtype = "bloqueio" | "nacional" | "internacional" | "evento" | "grupo_guiado";
export type CatalogSort = "editorial" | "price_asc" | "price_desc" | "date_asc" | "date_desc" | "updated_desc";

export interface FacetValue {
  value: string;
  count: number;
}

export interface TravelOffersFacets {
  offer_types: FacetValue[];
  subtypes: FacetValue[];
  origins: FacetValue[];
  origin_airports: FacetValue[];
  destinations: FacetValue[];
  destination_airports: FacetValue[];
  categories: FacetValue[];
  date_range: { min: string | null; max: string | null };
  price_ranges: Array<{ currency: string | null; min: number; max: number }>;
  updated_at: string;
  notice: string;
}

export interface CalendarFacetParams {
  origin?: string;
  destination?: string;
  offer_type?: PublicOfferType;
}

export interface CatalogFacetParams extends CalendarFacetParams {
  subtype?: PublicOfferSubtype;
  category?: string;
}

export interface TravelCalendarFacets {
  origins: FacetValue[];
  destinations: FacetValue[];
  date_range: { min: string | null; max: string | null };
  price_ranges: Array<{ currency: string | null; min: number; max: number }>;
  updated_at: string;
  notice: string;
}

export interface TravelCatalogFacets extends TravelCalendarFacets {
  categories: FacetValue[];
}

export interface TravelOfferCatalogItem {
  kind: "air_block" | "package" | "guided_group";
  id: string;
  offer_type: PublicOfferType;
  offer_subtype: PublicOfferSubtype;
  name: string | null;
  category: string | null;
  origin: string | null;
  origin_iata: string | null;
  destination: string | null;
  destination_iata: string | null;
  departure_date: string | null;
  return_date: string | null;
  nights: number | null;
  airline: string | null;
  price_per_person: number;
  tax_per_person: number | null;
  currency: string | null;
  available_seats: number | null;
  airfare_included: boolean;
  image_url: string | null;
  featured: boolean;
  editorial_order: number;
  campaign_label: string | null;
  editorial_subtitle: string | null;
  updated_at: string | null;
}

export interface CatalogParams {
  search?: string;
  origin?: string;
  origin_iata?: string;
  destination?: string;
  destination_iata?: string;
  offer_type?: PublicOfferType;
  subtype?: PublicOfferSubtype;
  category?: string;
  start_date?: string;
  end_date?: string;
  passengers?: number;
  min_price?: number;
  max_price?: number;
  only_with_seats?: boolean;
  sort: CatalogSort;
  page: number;
  per_page: number;
}

export interface TravelOffersCatalog {
  items: TravelOfferCatalogItem[];
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
  applied_filters: Record<string, string | number | boolean>;
  updated_at: string;
  notice: string;
}

interface TravelOfferDetailBase {
  id: string;
  offer_type: PublicOfferType;
  offer_subtype: PublicOfferSubtype;
  origin: string | null;
  origin_iata: string | null;
  destination: string | null;
  destination_iata: string | null;
  departure_date: string | null;
  return_date: string | null;
  nights: number | null;
  currency: string | null;
  available_seats: number | null;
  featured: boolean;
  editorial_order: number;
  campaign_label: string | null;
  editorial_subtitle: string | null;
  updated_at: string | null;
  price_per_person: number;
  tax_per_person: number | null;
}

export interface TravelOfferAirBlockDetail extends TravelOfferDetailBase {
  kind: "air_block";
  airline: string | null;
  outbound_departure_time: string | null;
  outbound_arrival_time: string | null;
  return_departure_time: string | null;
  return_arrival_time: string | null;
  issue_deadline: string | null;
}

export interface TravelOfferHotelOption {
  name: string;
  meal_plan: string | null;
  promotion: string | null;
  installment: string | null;
  price_per_person: number | null;
  tax_per_person: number | null;
}

export interface TravelOfferTicketOption {
  category: string;
  price_per_person: number | null;
  installment: string | null;
}

export interface TravelOfferPackageDetail extends TravelOfferDetailBase {
  kind: "package";
  name: string | null;
  category: string | null;
  hotel: string | null;
  meal_plan: string | null;
  inclusions: string[];
  promotion: string | null;
  installment: string | null;
  other_accommodations: TravelOfferHotelOption[];
  airfare_included: boolean;
  airfare_price_per_person: number | null;
  event_specific: boolean;
  event_name: string | null;
  ticket_included: boolean;
  ticket_options: TravelOfferTicketOption[];
  image_url: string | null;
}

export interface TravelOfferGuidedHotel {
  city: string | null;
  name: string;
}

export interface TravelOfferGuidedPriceOption {
  label: string;
  total: string | null;
  installment: string | null;
  featured: boolean;
}

export interface TravelOfferGuidedGroupDetail extends TravelOfferDetailBase {
  kind: "guided_group";
  name: string | null;
  description: string | null;
  category: string | null;
  duration: string | null;
  cities: string[];
  hotels: TravelOfferGuidedHotel[];
  inclusions: string[];
  payment: string | null;
  transport: string | null;
  flight_notes: string[];
  price_options: TravelOfferGuidedPriceOption[];
  airfare_included: boolean;
  airfare_price_per_person: null;
  ticket_included: boolean;
  image_url: string | null;
}

export type TravelOfferDetailItem =
  | TravelOfferAirBlockDetail
  | TravelOfferPackageDetail
  | TravelOfferGuidedGroupDetail;

export interface TravelOfferDetail {
  item: TravelOfferDetailItem;
  updated_at: string;
  notice: string;
}

type FunctionErrorBody = {
  error?: { code?: string; message?: string };
  request_id?: string;
};

export class TravelOffersPublicError extends Error {
  readonly code: string;
  readonly requestId: string | null;

  constructor(message: string, code = "request_failed", requestId: string | null = null) {
    super(message);
    this.name = "TravelOffersPublicError";
    this.code = code;
    this.requestId = requestId;
  }
}

async function publicError(error: unknown) {
  if (error instanceof FunctionsHttpError) {
    try {
      const body = await error.context.json() as FunctionErrorBody;
      return new TravelOffersPublicError(
        body.error?.message ?? "Não foi possível concluir a consulta.",
        body.error?.code ?? "request_failed",
        body.request_id ?? null,
      );
    } catch {
      return new TravelOffersPublicError("Não foi possível concluir a consulta.");
    }
  }

  return new TravelOffersPublicError("Não foi possível consultar as oportunidades agora.");
}

async function invokeTravelOffers<T>(
  action: "facets" | "calendar_facets" | "catalog_facets" | "catalog" | "detail",
  params: object,
  signal?: AbortSignal,
): Promise<T> {
  const { data, error } = await supabase.functions.invoke<T>("travel-offers-public", {
    body: { action, params },
    signal,
    timeout: 15_000,
  });

  if (error) throw await publicError(error);
  if (!data || typeof data !== "object") {
    throw new TravelOffersPublicError("A consulta retornou uma resposta inválida.", "invalid_response");
  }

  return data;
}

function mergeFacetValues(values: FacetValue[], transform: (value: string) => string) {
  const merged = new Map<string, number>();
  for (const item of values) {
    const value = transform(item.value);
    merged.set(value, (merged.get(value) ?? 0) + item.count);
  }
  return [...merged.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => a.value.localeCompare(b.value, "pt-BR"));
}

function canonicalizeCatalogItem(item: TravelOfferCatalogItem): TravelOfferCatalogItem {
  if (item.kind !== "air_block") return item;
  return {
    ...item,
    destination: canonicalAirBlockDestination(item.destination_iata, item.destination),
  };
}

function canonicalizeDetailItem(item: TravelOfferDetailItem): TravelOfferDetailItem {
  if (item.kind !== "air_block") return item;
  return {
    ...item,
    destination: canonicalAirBlockDestination(item.destination_iata, item.destination),
  };
}

function sourceFacetParams<T extends CalendarFacetParams>(params: T): T {
  if (params.offer_type !== "bloqueio_aereo" || !params.destination) return params;
  return {
    ...params,
    destination: sourceAirBlockDestinationForCity(params.destination) ?? params.destination,
  };
}

function canonicalizeAirBlockFacets<T extends TravelCalendarFacets>(data: T, offerType?: PublicOfferType): T {
  if (offerType !== "bloqueio_aereo") return data;
  return {
    ...data,
    destinations: mergeFacetValues(data.destinations, canonicalAirBlockFacetDestination),
  };
}

export const fetchTravelOfferFacets = (signal?: AbortSignal) =>
  invokeTravelOffers<TravelOffersFacets>("facets", {}, signal);

export const fetchTravelCalendarFacets = async (params: CalendarFacetParams = {}, signal?: AbortSignal) => {
  const data = await invokeTravelOffers<TravelCalendarFacets>("calendar_facets", sourceFacetParams(params), signal);
  return canonicalizeAirBlockFacets(data, params.offer_type);
};

export const fetchTravelCatalogFacets = async (params: CatalogFacetParams = {}, signal?: AbortSignal) => {
  const data = await invokeTravelOffers<TravelCatalogFacets>("catalog_facets", sourceFacetParams(params), signal);
  return canonicalizeAirBlockFacets(data, params.offer_type);
};

export const fetchTravelOfferCatalog = async (params: CatalogParams, signal?: AbortSignal) => {
  const data = await invokeTravelOffers<TravelOffersCatalog>("catalog", params, signal);
  return {
    ...data,
    items: data.items.map(canonicalizeCatalogItem),
  };
};

const PUBLIC_OFFER_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const isPublicOfferId = (value: string) => PUBLIC_OFFER_ID.test(value);

export const fetchTravelOfferDetail = async (id: string, signal?: AbortSignal) => {
  if (!isPublicOfferId(id)) {
    throw new TravelOffersPublicError("Identificador da oportunidade inválido.", "invalid_uuid");
  }
  const data = await invokeTravelOffers<TravelOfferDetail>("detail", { id }, signal);
  return {
    ...data,
    item: canonicalizeDetailItem(data.item),
  };
};
