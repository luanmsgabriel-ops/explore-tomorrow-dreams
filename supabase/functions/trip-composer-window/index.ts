import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  buildCandidates,
  buildDiscoveryQueries,
  buildPlannerRequest,
  detectExperienceIntent,
  excludedIdSet,
  finiteNumber,
  mergeExperiencePlaces,
  normalizePlannerRecommendations,
} from "../_shared/trip-composer-window.ts";
import { shouldPreferViator } from "../_shared/trip-composer-viator.ts";

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
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${SERVICE_ROLE_KEY}`, apikey: SERVICE_ROLE_KEY },
    body: JSON.stringify(body),
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const code = payload?.error ? `:${String(payload.error)}` : "";
    throw new Error(`${name}:${response.status}${code}`);
  }
  return payload;
}

function photoAttribution(media: any) {
  const authors = Array.isArray(media?.author_attributions) ? media.author_attributions : [];
  const names = authors.map((author: any) => typeof author?.displayName === "string" ? author.displayName : typeof author?.display_name === "string" ? author.display_name : null).filter(Boolean);
  return names.length ? names.join(", ") : null;
}

async function resolveRecommendationMedia(recommendations: any[]) {
  return Promise.all(recommendations.map(async recommendation => {
    const candidate = recommendation?.candidate;
    if (!candidate || !Array.isArray(candidate.media)) return recommendation;
    const resolved = await Promise.all(candidate.media.slice(0, 6).map(async (media: any) => {
      if (typeof media?.url === "string" && media.url) return media;
      if (!media?.name) return null;
      try {
        const photo = await invoke("trip-composer-discovery", { action: "photo", photo_name: media.name, max_width_px: 1200 });
        return typeof photo?.photo_uri === "string" && photo.photo_uri ? { ...media, url: photo.photo_uri, attribution: photoAttribution(media) } : null;
      } catch { return null; }
    }));
    return { ...recommendation, candidate: { ...candidate, media: resolved.filter(Boolean) } };
  }));
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
    if (!destination || !search || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return json({ error: "destination_search_date_required" }, 400);

    const preferences = Array.isArray(body.preferences) ? body.preferences : [];
    const intent = detectExperienceIntent(search, preferences);
    const excludedIds = excludedIdSet(body.excluded_ids);
    const preferViator = shouldPreferViator(search, preferences);

    let viatorPlaces: any[] = [];
    let viatorSourceCount = 0;
    if (preferViator) {
      const viator = await invoke("trip-composer-viator", {
        destination,
        search,
        date,
        available_minutes: body.available_minutes,
        preferences,
        excluded_ids: [...excludedIds],
      }).catch(error => {
        console.error("[TRIP_COMPOSER_VIATOR_FALLBACK]", error instanceof Error ? error.message : String(error));
        return { places: [], source_count: 0 };
      });
      viatorPlaces = Array.isArray(viator?.places) ? viator.places : [];
      viatorSourceCount = Number(viator?.source_count) || 0;
    }

    const discoveryQueries = buildDiscoveryQueries(search, destination, preferences);
    const discoveryResults = await Promise.all(discoveryQueries.map(query => invoke("trip-composer-discovery", {
      action: "search", query, max_results: 10,
      latitude: finiteNumber(body.location_bias?.latitude ?? body.origin_lat) ?? undefined,
      longitude: finiteNumber(body.location_bias?.longitude ?? body.origin_lng) ?? undefined,
      radius_meters: finiteNumber(body.location_bias?.radius_meters) ?? undefined,
    }).catch(() => ({ places: [] }))));
    const placesGroups = discoveryResults.map(result => Array.isArray(result?.places) ? result.places : []);
    const placeSourceCount = placesGroups.flat().length;

    const viatorPrimary = preferViator && viatorPlaces.length >= 3;
    const candidateGroups = viatorPrimary ? [viatorPlaces] : preferViator ? [viatorPlaces, ...placesGroups] : placesGroups;
    const sourceMode = viatorPrimary ? "viator_primary" : preferViator && viatorPlaces.length ? "mixed_fallback" : "places_fallback";
    const places = mergeExperiencePlaces(candidateGroups, 20, intent, excludedIds);
    if (!places.length) {
      return json({ ok: true, mode: "no_candidates", recommendations: [], weather: null, source_count: 0, sources: { viator: viatorSourceCount, places: placeSourceCount, mode: sourceMode }, route_context_applied: false });
    }

    const weatherLat = Number(body.weather_lat ?? body.origin_lat ?? places[0]?.location?.latitude);
    const weatherLng = Number(body.weather_lng ?? body.origin_lng ?? places[0]?.location?.longitude);
    let weather = null;
    if (Number.isFinite(weatherLat) && Number.isFinite(weatherLng)) {
      weather = await invoke("trip-composer-weather", { latitude: weatherLat, longitude: weatherLng, target_date: date }).catch(() => null);
    }

    const { plannerCandidates, visualCandidates } = buildCandidates(places, body);
    if (!plannerCandidates.length) {
      return json({ ok: true, mode: "no_candidates", recommendations: [], weather, source_count: 0, sources: { viator: viatorSourceCount, places: placeSourceCount, mode: sourceMode }, route_context_applied: false });
    }

    const planner = await invoke("trip-composer-planner", buildPlannerRequest(body, plannerCandidates, weather));
    const recommendations = await resolveRecommendationMedia(normalizePlannerRecommendations(planner, visualCandidates));
    return json({
      ok: true,
      mode: weather?.mode === "forecast" ? "forecast" : "seasonal_or_unknown",
      weather,
      recommendations,
      source_count: plannerCandidates.length,
      sources: { viator: viatorSourceCount, places: placeSourceCount, mode: sourceMode },
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
