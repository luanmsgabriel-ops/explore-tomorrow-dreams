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
  if (!response.ok) {
    const code = payload?.error ? `:${String(payload.error)}` : "";
    throw new Error(`${name}:${response.status}${code}`);
  }
  return payload;
}

const normalizeTypes = (types: unknown) => Array.isArray(types)
  ? types.filter((value): value is string => typeof value === "string").slice(0, 12)
  : [];

const deriveCategories = (types: string[]) => types.map(type => type.toLowerCase().replace(/_/g, " "));
const isOutdoor = (types: string[]) => types.some(type => ["park", "tourist_attraction", "beach", "hiking_area", "national_park"].includes(type));
const finiteNumber = (value: unknown) => Number.isFinite(Number(value)) ? Number(value) : null;

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
      max_results: 8,
      latitude: finiteNumber(body.location_bias?.latitude ?? body.origin_lat) ?? undefined,
      longitude: finiteNumber(body.location_bias?.longitude ?? body.origin_lng) ?? undefined,
      radius_meters: finiteNumber(body.location_bias?.radius_meters) ?? undefined,
    });

    const places = Array.isArray(discovery?.places) ? discovery.places : [];
    if (!places.length) return json({ ok: true, mode: "no_candidates", recommendations: [], weather: null, source_count: 0, route_context_applied: false });

    const weatherLat = Number(body.weather_lat ?? body.origin_lat ?? places[0]?.location?.latitude);
    const weatherLng = Number(body.weather_lng ?? body.origin_lng ?? places[0]?.location?.longitude);
    let weather = null;
    if (Number.isFinite(weatherLat) && Number.isFinite(weatherLng)) {
      weather = await invoke("trip-composer-weather", {
        latitude: weatherLat,
        longitude: weatherLng,
        target_date: date,
      }).catch(() => null);
    }

    const visualCandidates: any[] = [];
    const plannerCandidates = places.map((place: any, index: number) => {
      const types = normalizeTypes(place.types);
      const categories = deriveCategories(types);
      const outdoor = isOutdoor(types);
      const id = String(place.place_id || `candidate-${index}`);
      const name = String(place.name || "Experiência");
      const latitude = Number(place.location?.latitude);
      const longitude = Number(place.location?.longitude);
      const durationMinutes = Number(body.duration_overrides?.[place.place_id]) || Number(body.default_duration_minutes) || 120;

      visualCandidates.push({
        id,
        title: name,
        categories,
        latitude,
        longitude,
        duration_minutes: durationMinutes,
        source_reference: place.place_id || null,
        factual_snapshot: {
          address: place.address || null,
          types,
          rating: place.rating ?? null,
          user_rating_count: place.user_rating_count ?? null,
          price_level: place.price_level ?? null,
          opening_hours: place.opening_hours ?? null,
          google_maps_uri: place.google_maps_uri ?? null,
          website_uri: place.website_uri ?? null,
        },
        media: Array.isArray(place.photos) ? place.photos.slice(0, 6) : [],
      });

      return {
        id,
        name,
        latitude,
        longitude,
        category: categories[0] || null,
        tags: categories,
        duration_minutes: durationMinutes,
        rating: finiteNumber(place.rating),
        user_rating_count: finiteNumber(place.user_rating_count),
        rain_sensitivity: outdoor ? 90 : 20,
      };
    }).filter((candidate: any) => Number.isFinite(candidate.latitude) && Number.isFinite(candidate.longitude));

    if (!plannerCandidates.length) {
      return json({ ok: true, mode: "no_candidates", recommendations: [], weather, source_count: 0, route_context_applied: false });
    }

    const preferences = Array.isArray(body.preferences) ? body.preferences.filter((value: unknown): value is string => typeof value === "string") : [];
    const rejectedCategories = Array.isArray(body.rejected_categories)
      ? body.rejected_categories.filter((value: unknown): value is string => typeof value === "string")
      : [];
    const passengerContext = body.passenger_context && typeof body.passenger_context === "object" ? body.passenger_context : {};

    const planner = await invoke("trip-composer-planner", {
      context: {
        available_minutes: availableMinutes,
        preferred_categories: preferences,
        preferred_tags: preferences,
        rejected_categories: rejectedCategories,
        passengers: {
          adults: finiteNumber(passengerContext.adults) ?? undefined,
          children: finiteNumber(passengerContext.children) ?? undefined,
        },
        weather: weather?.mode === "forecast"
          ? { precipitation_probability: finiteNumber(weather.precipitation_probability) }
          : undefined,
      },
      origin: Number.isFinite(Number(body.origin_lat)) && Number.isFinite(Number(body.origin_lng))
        ? { latitude: Number(body.origin_lat), longitude: Number(body.origin_lng) }
        : null,
      candidates: plannerCandidates,
    });

    const ranked = Array.isArray(planner?.candidates) ? planner.candidates : [];
    const recommendations = ranked.slice(0, 3).map((item: any) => {
      const candidate = visualCandidates.find((visual: any) => visual.id === item.id) || null;
      return {
        id: String(item.id || candidate?.id || ""),
        score: Number(item.planner?.score) || 0,
        reasons: Array.isArray(item.planner?.reasons) ? item.planner.reasons : [],
        warnings: Array.isArray(item.planner?.warnings) ? item.planner.warnings : [],
        estimated_activity_minutes: item.planner?.estimated_activity_minutes ?? null,
        estimated_travel_minutes: item.planner?.estimated_travel_minutes ?? null,
        estimated_distance_meters: item.planner?.estimated_distance_meters ?? null,
        candidate,
      };
    });

    return json({
      ok: true,
      mode: weather?.mode === "forecast" ? "forecast" : "seasonal_or_unknown",
      weather,
      recommendations,
      source_count: plannerCandidates.length,
      route_context_applied: Boolean(planner?.route_context_applied),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[TRIP_COMPOSER_WINDOW_ERROR]", message);
    if (message.startsWith("trip-composer-discovery:")) return json({ error: "discovery_unavailable" }, 502);
    if (message.startsWith("trip-composer-planner:")) return json({ error: "planner_unavailable" }, 502);
    return json({ error: "internal_error" }, 500);
  }
});