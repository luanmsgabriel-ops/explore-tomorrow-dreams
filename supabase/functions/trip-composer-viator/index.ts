import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  chooseDestination,
  extractLocationRefs,
  normalizeViatorProduct,
  semanticViatorTerms,
  type ViatorLocation,
} from "../_shared/trip-composer-viator.ts";

const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const VIATOR_API_KEY = Deno.env.get("VIATOR_API_KEY") || "";
const VIATOR_API_BASE_URL = (Deno.env.get("VIATOR_API_BASE_URL") || "https://api.sandbox.viator.com/partner").replace(/\/$/, "");
const GOOGLE_MAPS_API_KEY = Deno.env.get("GOOGLE_MAPS_API_KEY") || "";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
});

function isInternalRequest(req: Request) {
  if (!SERVICE_ROLE_KEY) return false;
  return req.headers.get("authorization") === `Bearer ${SERVICE_ROLE_KEY}`;
}

async function viator(path: string, init: RequestInit = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    const response = await fetch(`${VIATOR_API_BASE_URL}${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json;version=2.0",
        "Accept-Language": "pt-BR",
        "exp-api-key": VIATOR_API_KEY,
        ...(init.headers || {}),
      },
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      const code = typeof payload?.code === "string" ? payload.code : `HTTP_${response.status}`;
      throw new Error(`viator:${response.status}:${code}`);
    }
    return payload;
  } finally {
    clearTimeout(timeout);
  }
}

function dateRange(date: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return undefined;
  const today = new Date().toISOString().slice(0, 10);
  if (date < today) return undefined;
  return { from: date, to: date };
}

async function resolveDestination(destination: string) {
  const result = await viator("/search/freetext", {
    method: "POST",
    body: JSON.stringify({
      searchTerm: destination,
      searchTypes: [{ searchType: "DESTINATIONS", pagination: { start: 1, count: 8 } }],
      currency: "BRL",
    }),
  });
  const destinations = Array.isArray(result?.destinations?.results) ? result.destinations.results : [];
  return chooseDestination(destinations, destination);
}

async function searchProducts(input: {
  destinationId: string;
  search: string;
  preferences: unknown[];
  date: string;
  availableMinutes: number;
}) {
  const merged = new Map<string, any>();
  for (const term of semanticViatorTerms(input.search, input.preferences)) {
    const filtering: Record<string, unknown> = {
      destination: input.destinationId,
      includeAutomaticTranslations: true,
      durationInMinutes: { from: 30, to: Math.min(Math.max(input.availableMinutes || 720, 60), 720) },
    };
    const range = dateRange(input.date);
    if (range) filtering.dateRange = range;
    const result = await viator("/search/freetext", {
      method: "POST",
      body: JSON.stringify({
        searchTerm: term,
        productFiltering: filtering,
        productSorting: { sort: "TRAVELER_RATING", order: "DESCENDING" },
        searchTypes: [{ searchType: "PRODUCTS", pagination: { start: 1, count: 12 } }],
        currency: "BRL",
      }),
    });
    const products = Array.isArray(result?.products?.results) ? result.products.results : [];
    for (const product of products) {
      const code = String(product?.productCode || "").trim();
      if (!code || merged.has(code) || String(product?.itineraryType || "") === "MULTI_DAY_TOUR") continue;
      merged.set(code, product);
    }
    if (merged.size >= 8) break;
  }
  return [...merged.values()].slice(0, 8);
}

async function productDetails(products: any[]) {
  const entries = await Promise.all(products.slice(0, 6).map(async summary => {
    const code = String(summary?.productCode || "").trim();
    if (!code) return [code, null] as const;
    try {
      const detail = await viator(`/products/${encodeURIComponent(code)}`, { method: "GET" });
      return [code, detail] as const;
    } catch {
      return [code, null] as const;
    }
  }));
  return new Map(entries.filter(([code]) => Boolean(code)));
}

async function resolveLocations(details: Map<string, any>) {
  const refs = [...new Set([...details.values()].flatMap(detail => detail ? extractLocationRefs(detail, 8) : []))].slice(0, 40);
  if (!refs.length) return new Map<string, ViatorLocation>();
  const payload = await viator("/locations/bulk", {
    method: "POST",
    body: JSON.stringify({ locations: refs }),
  }).catch(() => ({ locations: [] }));
  const locations = Array.isArray(payload?.locations) ? payload.locations as ViatorLocation[] : [];
  const map = new Map<string, ViatorLocation>();
  for (const location of locations) {
    if (typeof location?.reference === "string") map.set(location.reference, location);
  }

  if (GOOGLE_MAPS_API_KEY) {
    const googleOnly = locations.filter(location =>
      location?.provider === "GOOGLE" && location?.reference && location?.providerReference &&
      (!Number.isFinite(Number(location?.center?.latitude)) || !Number.isFinite(Number(location?.center?.longitude)))
    ).slice(0, 8);
    await Promise.all(googleOnly.map(async location => {
      try {
        const response = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(String(location.providerReference))}`, {
          headers: {
            "X-Goog-Api-Key": GOOGLE_MAPS_API_KEY,
            "X-Goog-FieldMask": "id,displayName,formattedAddress,location",
            "Accept-Language": "pt-BR",
          },
        });
        if (!response.ok) return;
        const place = await response.json();
        if (!Number.isFinite(Number(place?.location?.latitude)) || !Number.isFinite(Number(place?.location?.longitude))) return;
        map.set(String(location.reference), {
          ...location,
          name: place?.displayName?.text || location.name || null,
          address: place?.formattedAddress ? { street: place.formattedAddress } : location.address,
          center: { latitude: Number(place.location.latitude), longitude: Number(place.location.longitude) },
        });
      } catch {
        // Keep the Viator location unresolved; product will be discarded if no other geocoded ref exists.
      }
    }));
  }
  return map;
}

serve(async req => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  if (!isInternalRequest(req)) return json({ error: "unauthorized" }, 401);
  if (!VIATOR_API_KEY) return json({ error: "viator_unconfigured" }, 503);

  try {
    const body = await req.json();
    const destination = String(body.destination || "").trim();
    const search = String(body.search || "").trim();
    const date = String(body.date || "").trim();
    const availableMinutes = Math.min(Math.max(Number(body.available_minutes) || 720, 60), 720);
    const preferences = Array.isArray(body.preferences) ? body.preferences : [];
    const excludedIds = new Set((Array.isArray(body.excluded_ids) ? body.excluded_ids : []).map((value: unknown) => String(value)));
    if (!destination || !search) return json({ error: "destination_search_required" }, 400);

    const resolved = await resolveDestination(destination);
    if (!resolved?.id) return json({ ok: true, places: [], source_count: 0, destination: null });

    const summaries = (await searchProducts({
      destinationId: String(resolved.id),
      search,
      preferences,
      date,
      availableMinutes,
    })).filter(product => !excludedIds.has(`viator:${String(product?.productCode || "")}`) && !excludedIds.has(String(product?.productCode || "")));

    const details = await productDetails(summaries);
    const locations = await resolveLocations(details);
    const places = summaries
      .map(summary => normalizeViatorProduct(summary, details.get(String(summary?.productCode || "")) ?? null, locations))
      .filter(Boolean)
      .slice(0, 12);

    return json({
      ok: true,
      places,
      source_count: summaries.length,
      destination: { id: String(resolved.id), name: resolved.name || destination },
      environment: VIATOR_API_BASE_URL.includes("sandbox") ? "sandbox" : "production",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[TRIP_COMPOSER_VIATOR_ERROR]", message);
    if (message.startsWith("viator:401") || message.startsWith("viator:403")) return json({ error: "viator_auth_failed" }, 502);
    if (message.startsWith("viator:429")) return json({ error: "viator_rate_limited" }, 503);
    if (message.includes("AbortError")) return json({ error: "viator_timeout" }, 504);
    return json({ error: "viator_unavailable" }, 502);
  }
});
