import { FunctionsHttpError } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";

export const TRAVEL_OFFERS_NOTICE =
  "Preços e disponibilidade estão sujeitos à confirmação no momento da reserva.";

export type PublicOfferType = "bloqueio_aereo" | "pacote";
export type PublicOfferSubtype = "bloqueio" | "nacional" | "internacional" | "evento" | "grupo_guiado";
export type CatalogSort = "price_asc" | "price_desc" | "date_asc" | "date_desc" | "updated_desc";

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
  action: "facets" | "catalog",
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

export const fetchTravelOfferFacets = (signal?: AbortSignal) =>
  invokeTravelOffers<TravelOffersFacets>("facets", {}, signal);

export const fetchTravelOfferCatalog = (params: CatalogParams, signal?: AbortSignal) =>
  invokeTravelOffers<TravelOffersCatalog>("catalog", params, signal);
