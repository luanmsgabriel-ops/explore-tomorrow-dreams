declare const Deno: {
  env: { get(name: string): string | undefined };
  serve(handler: (request: Request) => Response | Promise<Response>): void;
};

export * from "./core.ts";

import { handler as coreHandler, PUBLIC_NOTICE } from "./core.ts";

type JsonRecord = Record<string, unknown>;
type OfferType = "bloqueio_aereo" | "pacote";
type OfferSubtype = "bloqueio" | "nacional" | "internacional" | "evento" | "grupo_guiado";
type CalendarFacetsParams = {
  origin: string | null;
  destination: string | null;
  offer_type: OfferType | null;
};
type CatalogFacetsParams = CalendarFacetsParams & {
  subtype: OfferSubtype | null;
  category: string | null;
};
type FacetAction = "calendar_facets" | "catalog_facets";

const REQUEST_LIMIT = 12_000;
const RATE_LIMIT = 60;
const OFFER_TYPES = new Set<OfferType>(["bloqueio_aereo", "pacote"]);
const OFFER_SUBTYPES = new Set<OfferSubtype>(["bloqueio", "nacional", "internacional", "evento", "grupo_guiado"]);
const defaultOrigins = [
  "https://tomorrowtravelbr.com.br",
  "https://www.tomorrowtravelbr.com.br",
  "https://explore-tomorrow-dreams.lovable.app",
  "http://localhost:5173",
];

const isRecord = (value: unknown): value is JsonRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const allowedOrigins = () => {
  const configured = Deno.env.get("TRAVEL_OFFERS_ALLOWED_ORIGINS")
    ?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean) ?? [];
  return new Set([...defaultOrigins, ...configured]);
};

const corsHeaders = (origin: string | null) => {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
  if (origin && allowedOrigins().has(origin)) headers["Access-Control-Allow-Origin"] = origin;
  return headers;
};

const response = (body: unknown, status: number, origin: string | null) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
      ...corsHeaders(origin),
    },
  });

const nullableString = (value: unknown, field: string, maxLength: number) => {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string") throw new Error(`${field} deve ser texto.`);
  const normalized = value.trim();
  if (!normalized || normalized.length > maxLength) throw new Error(`${field} possui tamanho inválido.`);
  return normalized;
};

const offerType = (value: unknown) => {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string" || !OFFER_TYPES.has(value as OfferType)) {
    throw new Error("offer_type possui valor não permitido.");
  }
  return value as OfferType;
};

const subtype = (value: unknown) => {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string" || !OFFER_SUBTYPES.has(value as OfferSubtype)) {
    throw new Error("subtype possui valor não permitido.");
  }
  return value as OfferSubtype;
};

const validateEnvelope = (body: unknown, action: FacetAction) => {
  if (!isRecord(body) || body.action !== action) throw new Error("Ação inválida.");
  const topKeys = Object.keys(body);
  if (topKeys.some((key) => key !== "action" && key !== "params")) throw new Error("Parâmetro não permitido.");
  const params = body.params ?? {};
  if (!isRecord(params)) throw new Error("params deve ser um objeto.");
  return params;
};

export function validateCalendarFacetsRequest(body: unknown): CalendarFacetsParams {
  const params = validateEnvelope(body, "calendar_facets");
  const allowed = new Set(["origin", "destination", "offer_type"]);
  const unexpected = Object.keys(params).find((key) => !allowed.has(key));
  if (unexpected) throw new Error(`Parâmetro não permitido: ${unexpected}.`);
  return {
    origin: nullableString(params.origin, "origin", 100),
    destination: nullableString(params.destination, "destination", 120),
    offer_type: offerType(params.offer_type),
  };
}

export function validateCatalogFacetsRequest(body: unknown): CatalogFacetsParams {
  const params = validateEnvelope(body, "catalog_facets");
  const allowed = new Set(["origin", "destination", "offer_type", "subtype", "category"]);
  const unexpected = Object.keys(params).find((key) => !allowed.has(key));
  if (unexpected) throw new Error(`Parâmetro não permitido: ${unexpected}.`);
  const parsedOfferType = offerType(params.offer_type);
  const parsedSubtype = subtype(params.subtype);
  if (parsedOfferType === "bloqueio_aereo" && parsedSubtype && parsedSubtype !== "bloqueio") {
    throw new Error("subtype não é compatível com bloqueio aéreo.");
  }
  if (parsedOfferType === "pacote" && parsedSubtype === "bloqueio") {
    throw new Error("subtype não é compatível com pacote.");
  }
  return {
    origin: nullableString(params.origin, "origin", 100),
    destination: nullableString(params.destination, "destination", 120),
    offer_type: parsedOfferType,
    subtype: parsedSubtype,
    category: nullableString(params.category, "category", 80),
  };
}

const cleanFacetList = (value: unknown) => {
  if (!Array.isArray(value)) throw new Error("Resposta inválida de facetas.");
  return value.map((item) => {
    if (!isRecord(item) || typeof item.value !== "string") throw new Error("Resposta inválida de facetas.");
    const count = Number(item.count);
    if (!Number.isFinite(count) || count < 0) throw new Error("Resposta inválida de facetas.");
    return { value: item.value, count };
  });
};

const cleanFacetPayload = (data: unknown, includeCategories: boolean) => {
  if (!isRecord(data) || !isRecord(data.date_range) || !Array.isArray(data.price_ranges)) {
    throw new Error("Resposta inválida de facetas.");
  }
  const min = typeof data.date_range.min === "string" ? data.date_range.min : null;
  const max = typeof data.date_range.max === "string" ? data.date_range.max : null;
  const priceRanges = data.price_ranges.map((range) => {
    if (!isRecord(range)) throw new Error("Resposta inválida de facetas.");
    const minPrice = Number(range.min);
    const maxPrice = Number(range.max);
    if (!Number.isFinite(minPrice) || !Number.isFinite(maxPrice)) throw new Error("Resposta inválida de facetas.");
    return {
      currency: typeof range.currency === "string" ? range.currency : null,
      min: minPrice,
      max: maxPrice,
    };
  });
  return {
    origins: cleanFacetList(data.origins),
    destinations: cleanFacetList(data.destinations),
    ...(includeCategories ? { categories: cleanFacetList(data.categories) } : {}),
    date_range: { min, max },
    price_ranges: priceRanges,
    updated_at: typeof data.updated_at === "string" ? data.updated_at : new Date().toISOString(),
    notice: PUBLIC_NOTICE,
  };
};

const rateBuckets = new Map<string, { start: number; count: number }>();
const checkRateLimit = (request: Request) => {
  const ip = request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-real-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown";
  const now = Date.now();
  const current = rateBuckets.get(ip);
  if (!current || now - current.start >= 60_000) {
    rateBuckets.set(ip, { start: now, count: 2 });
    return;
  }
  current.count += 2;
  if (current.count > RATE_LIMIT) throw new Error("Muitas consultas. Tente novamente em instantes.");
};

const getSupabaseClient = async () => {
  const url = Deno.env.get("SUPABASE_URL");
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceRole) throw new Error("Missing server configuration");
  // @ts-ignore Deno Edge Runtime resolves pinned npm specifiers.
  const { createClient } = await import("npm:@supabase/supabase-js@2.90.1");
  return createClient(url, serviceRole, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
};

async function facetActionFromRequest(request: Request): Promise<FacetAction | null> {
  if (request.method !== "POST") return null;
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().startsWith("application/json")) return null;
  try {
    const text = await request.clone().text();
    if (new TextEncoder().encode(text).byteLength > REQUEST_LIMIT) return null;
    const body = JSON.parse(text);
    if (!isRecord(body)) return null;
    return body.action === "calendar_facets" || body.action === "catalog_facets" ? body.action : null;
  } catch {
    return null;
  }
}

export const handler = async (request: Request): Promise<Response> => {
  const facetAction = await facetActionFromRequest(request);
  if (!facetAction) return coreHandler(request);

  const requestId = crypto.randomUUID();
  const origin = request.headers.get("origin");
  try {
    if (origin && !allowedOrigins().has(origin)) {
      return response({ error: { code: "origin_not_allowed", message: "Origem não permitida." }, request_id: requestId }, 403, null);
    }
    const text = await request.text();
    if (new TextEncoder().encode(text).byteLength > REQUEST_LIMIT) {
      return response({ error: { code: "request_too_large", message: "Corpo da requisição excede o limite." }, request_id: requestId }, 413, origin);
    }
    const body = JSON.parse(text);
    checkRateLimit(request);
    const client = await getSupabaseClient();

    if (facetAction === "calendar_facets") {
      const params = validateCalendarFacetsRequest(body);
      const result = await client.rpc("get_travel_calendar_facets", {
        p_origin: params.origin,
        p_destination: params.destination,
        p_offer_type: params.offer_type,
      });
      if (result.error) throw new Error(result.error.message ?? "Falha ao consultar facetas do calendário.");
      return response(cleanFacetPayload(result.data, false), 200, origin);
    }

    const params = validateCatalogFacetsRequest(body);
    const result = await client.rpc("get_travel_catalog_facets", {
      p_origin: params.origin,
      p_destination: params.destination,
      p_offer_type: params.offer_type,
      p_subtype: params.subtype,
      p_category: params.category,
    });
    if (result.error) throw new Error(result.error.message ?? "Falha ao consultar facetas do catálogo.");
    return response(cleanFacetPayload(result.data, true), 200, origin);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível concluir a consulta.";
    const validation = /inválid|permitido|deve|tamanho|Parâmetro|compatível/.test(message);
    const rateLimited = message.startsWith("Muitas consultas");
    if (!validation && !rateLimited) {
      console.error(`[travel-offers-public] ${facetAction} failed`, { request_id: requestId, error: message });
    }
    return response(
      { error: { code: rateLimited ? "rate_limited" : validation ? "invalid_request" : "internal_error", message: rateLimited || validation ? message : "Não foi possível concluir a consulta." }, request_id: requestId },
      rateLimited ? 429 : validation ? 400 : 500,
      origin,
    );
  }
};

if ((import.meta as ImportMeta & { main?: boolean }).main) Deno.serve(handler);
