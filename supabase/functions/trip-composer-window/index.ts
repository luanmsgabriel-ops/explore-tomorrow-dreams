import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  buildCandidates,
  buildPlannerRequest,
  finiteNumber,
  normalizePlannerRecommendations,
} from "../_shared/trip-composer-window.ts";

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

serve(async req => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) return json({ error: "orchestrator_unconfigured" }, 503);

  try {
    const body = await req.json();
    const destination = String(body.destination || "").trim();
    const search = String(body.search || "").trim();
    const date = String(body.date || "").trim();
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
    if (!places.length) {
      return json({ ok: true, mode: "no_candidates", recommendations: [], weather: null, source_count: 0, route_context_applied: false });
    }

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

    const { plannerCandidates, visualCandidates } = buildCandidates(places, body);
    if (!plannerCandidates.length) {
      return json({ ok: true, mode: "no_candidates", recommendations: [], weather, source_count: 0, route_context_applied: false });
    }

    const planner = await invoke("trip-composer-planner", buildPlannerRequest(body, plannerCandidates, weather));
    const recommendations = normalizePlannerRecommendations(planner, visualCandidates);

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