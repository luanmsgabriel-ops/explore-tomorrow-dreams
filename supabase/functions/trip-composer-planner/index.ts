import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { rankCandidates, type PlannerCandidate, type PlannerContext, type RouteFact } from "../_shared/trip-composer-planner.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const GOOGLE_MAPS_API_KEY = Deno.env.get("GOOGLE_MAPS_API_KEY") || "";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });
}

async function routeMatrix(origin: { latitude: number; longitude: number }, candidates: PlannerCandidate[]): Promise<Record<string, RouteFact>> {
  if (!GOOGLE_MAPS_API_KEY || candidates.length === 0) return {};
  const body = {
    origins: [{ waypoint: { location: { latLng: origin } } }],
    destinations: candidates.map(candidate => ({ waypoint: { location: { latLng: { latitude: candidate.latitude, longitude: candidate.longitude } } } })),
    travelMode: "DRIVE",
    routingPreference: "TRAFFIC_AWARE",
  };
  const res = await fetch("https://routes.googleapis.com/distanceMatrix/v2:computeRouteMatrix", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": GOOGLE_MAPS_API_KEY,
      "X-Goog-FieldMask": "originIndex,destinationIndex,duration,distanceMeters,condition",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    console.error("[TRIP_PLANNER_ROUTES_ERROR]", res.status, (await res.text()).slice(0, 500));
    return {};
  }
  const rows = await res.json();
  const result: Record<string, RouteFact> = {};
  for (const row of Array.isArray(rows) ? rows : []) {
    const candidate = candidates[row.destinationIndex];
    if (!candidate || row.condition === "ROUTE_NOT_FOUND") continue;
    const seconds = typeof row.duration === "string" ? Number(row.duration.replace("s", "")) : null;
    result[candidate.id] = {
      duration_minutes: Number.isFinite(seconds) ? Math.ceil(seconds / 60) : null,
      distance_meters: typeof row.distanceMeters === "number" ? row.distanceMeters : null,
    };
  }
  return result;
}

serve(async req => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  try {
    const body = await req.json();
    const candidates = Array.isArray(body.candidates) ? body.candidates.slice(0, 20) as PlannerCandidate[] : [];
    const context = body.context as PlannerContext | undefined;
    const origin = body.origin;
    if (!context || !Number.isFinite(context.available_minutes) || context.available_minutes < 30 || candidates.length === 0) {
      return json({ error: "invalid_planner_input" }, 400);
    }
    for (const candidate of candidates) {
      if (!candidate.id || !candidate.name || !Number.isFinite(candidate.latitude) || !Number.isFinite(candidate.longitude)) {
        return json({ error: "invalid_candidate" }, 400);
      }
    }
    let routes: Record<string, RouteFact> = {};
    if (origin && Number.isFinite(origin.latitude) && Number.isFinite(origin.longitude)) {
      routes = await routeMatrix({ latitude: Number(origin.latitude), longitude: Number(origin.longitude) }, candidates);
    }
    const ranked = rankCandidates(candidates, context, routes);
    return json({
      candidates: ranked.map(item => ({
        ...item.candidate,
        planner: {
          score: item.score,
          reasons: item.reasons,
          warnings: item.warnings,
          estimated_activity_minutes: item.estimated_activity_minutes,
          estimated_travel_minutes: item.estimated_travel_minutes,
          estimated_distance_meters: item.estimated_distance_meters,
        },
      })),
      route_context_applied: Object.keys(routes).length > 0,
    });
  } catch (error) {
    console.error("[TRIP_PLANNER_ERROR]", error);
    return json({ error: "invalid_request" }, 400);
  }
});
