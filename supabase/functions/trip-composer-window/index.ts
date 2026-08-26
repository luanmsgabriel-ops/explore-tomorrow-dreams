import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
});

async function invoke(name: string, body: unknown) {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      apikey: SERVICE_ROLE_KEY,
    },
    body: JSON.stringify(body),
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new Error(`${name}:${response.status}`);
  return payload;
}

const normalizeTypes = (types: unknown) => Array.isArray(types)
  ? types.filter((value): value is string => typeof value === "string").slice(0, 12)
  : [];

const deriveCategories = (types: string[]) => types.map(type => type.toLowerCase().replace(/_/g, " "));

serve(async req => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) return json({ error: "orchestrator_unconfigured" }, 503);

  try {
    const body = await req.json();
    const destination = String(body.destination || "").trim();
    const search = String(body.search || "").trim();
    const date = String(body.date || "").trim();
    const availableMinutes = Math.min(Math.max(Number(body.available_minutes) || 180, 30), 720);
    if (!destination || !search || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return json({ error: "destination_search_date_required" }, 400);
    }

    const discovery = await invoke("trip-composer-discovery", {
      action: "search",
      query: `${search} em ${destination}`,
      language_code: "pt-BR",
      region_code: body.region_code || "BR",
      max_results: 8,
      location_bias: body.location_bias || undefined,
    });

    const places = Array.isArray(discovery?.places) ? discovery.places : [];
    if (!places.length) return json({ ok: true, mode: "no_candidates", recommendations: [], weather: null });

    const weatherLat = Number(body.weather_lat ?? body.origin_lat ?? places[0]?.location?.latitude);
    const weatherLng = Number(body.weather_lng ?? body.origin_lng ?? places[0]?.location?.longitude);
    let weather = null;
    if (Number.isFinite(weatherLat) && Number.isFinite(weatherLng)) {
      weather = await invoke("trip-composer-weather", { latitude: weatherLat, longitude: weatherLng, date }).catch(() => null);
    }

    const weatherSignal = weather?.mode === "forecast" ? weather?.planning_signal || null : null;
    const candidates = places.map((place: any, index: number) => {
      const types = normalizeTypes(place.types);
      return {
        id: String(place.place_id || `candidate-${index}`),
        title: String(place.name || "Experiência"),
        categories: deriveCategories(types),
        latitude: Number(place.location?.latitude),
        longitude: Number(place.location?.longitude),
        duration_minutes: Number(body.duration_overrides?.[place.place_id]) || Number(body.default_duration_minutes) || 120,
        opening_status: place.business_status || null,
        rating: Number.isFinite(Number(place.rating)) ? Number(place.rating) : null,
        price_level: place.price_level || null,
        outdoor_sensitivity: types.some(type => ["park", "tourist_attraction", "beach", "hiking_area", "national_park"].includes(type)) ? "high" : "low",
        source: "GOOGLE_PLACE",
        source_reference: place.place_id,
        factual_snapshot: {
          formatted_address: place.formatted_address || null,
          types,
          rating: place.rating ?? null,
          user_rating_count: place.user_rating_count ?? null,
        },
        media: Array.isArray(place.photos) ? place.photos.slice(0, 6) : [],
      };
    }).filter((candidate: any) => Number.isFinite(candidate.latitude) && Number.isFinite(candidate.longitude));

    const planner = await invoke("trip-composer-planner", {
      available_minutes: availableMinutes,
      origin: Number.isFinite(Number(body.origin_lat)) && Number.isFinite(Number(body.origin_lng))
        ? { latitude: Number(body.origin_lat), longitude: Number(body.origin_lng) }
        : null,
      candidates,
      preferences: Array.isArray(body.preferences) ? body.preferences : [],
      rejected_categories: Array.isArray(body.rejected_categories) ? body.rejected_categories : [],
      passenger_context: body.passenger_context || {},
      weather: weatherSignal ? {
        precipitation_probability: weatherSignal.precipitation_probability ?? weather?.forecast?.precipitation_probability ?? null,
        temperature_c: weather?.forecast?.temperature_c ?? null,
        signal: weatherSignal.signal || null,
      } : null,
      max_results: 3,
    });

    const recommendations = Array.isArray(planner?.recommendations) ? planner.recommendations : [];
    const enriched = recommendations.map((recommendation: any) => {
      const candidate = candidates.find((item: any) => item.id === recommendation.id);
      return { ...recommendation, candidate: candidate || null };
    });

    return json({
      ok: true,
      mode: weather?.mode === "forecast" ? "forecast" : "seasonal_or_unknown",
      weather,
      recommendations: enriched,
      source_count: candidates.length,
      route_context_applied: Boolean(planner?.route_context_applied),
    });
  } catch (error) {
    console.error("[TRIP_COMPOSER_WINDOW_ERROR]", error instanceof Error ? error.message : error);
    return json({ error: "internal_error" }, 500);
  }
});