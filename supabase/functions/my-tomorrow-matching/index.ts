declare const Deno: { env: { get(name: string): string | undefined }; serve(handler: (request: Request) => Response | Promise<Response>): void };

import { MATCH_ALGORITHM_VERSION, evaluateRadarMatch, sanitizeOfferSnapshot, type Affinity, type PublicOfferForMatching, type RadarForMatching } from "./matcher.ts";

const ALLOWED_ORIGINS = new Set(["https://tomorrowtravelbr.com.br", "https://www.tomorrowtravelbr.com.br", "https://explore-tomorrow-dreams.lovable.app", "http://localhost:5173"]);
const cors = (origin: string | null) => ({
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  ...(origin && ALLOWED_ORIGINS.has(origin) ? { "Access-Control-Allow-Origin": origin } : {}),
});
const json = (body: unknown, status = 200, origin: string | null = null) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...cors(origin) } });
const uuid = (value: unknown) => typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value) ? value : null;
const day = 86_400_000;
const shift = (value: string | null, days: number) => value ? new Date(new Date(`${value}T00:00:00Z`).getTime() + days * day).toISOString().slice(0, 10) : null;

async function clients(token: string) {
  const url = Deno.env.get("SUPABASE_URL");
  const anon = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !anon || !serviceRole) throw new Error("server_configuration_missing");
  const { createClient } = await import("npm:@supabase/supabase-js@2.90.1");
  const auth = createClient(url, anon, { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false } });
  const service = createClient(url, serviceRole, { auth: { persistSession: false } });
  const { data: { user }, error } = await auth.auth.getUser(token);
  if (error || !user) throw new Error("authentication_required");
  return { url, anon, service, user };
}

function publicParams(radar: RadarForMatching, page: number, discovery: boolean) {
  const flex = Math.max(0, radar.flexibility_days || 0);
  const params: Record<string, unknown> = { sort: "price_asc", page, per_page: 50 };
  if (radar.origin) params.origin = radar.origin;
  if (!discovery && radar.destination) params.destination = radar.destination;
  if (radar.offer_type) params.offer_type = radar.offer_type;
  if (radar.offer_subtype) params.subtype = radar.offer_subtype;
  if (radar.start_date) params.start_date = shift(radar.start_date, -flex);
  if (radar.end_date) params.end_date = shift(radar.end_date, flex);
  if (radar.passengers) params.passengers = radar.passengers;
  if (radar.budget_min !== null) params.min_price = radar.budget_min;
  if (radar.budget_max !== null) params.max_price = radar.budget_max;
  return params;
}

async function fetchCatalog(url: string, anon: string, radar: RadarForMatching, discovery: boolean, maxPages: number) {
  const items: PublicOfferForMatching[] = [];
  const seen = new Set<string>();
  for (let page = 1; page <= maxPages; page += 1) {
    const response = await fetch(`${url}/functions/v1/travel-offers-public`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: anon, Authorization: `Bearer ${anon}` },
      body: JSON.stringify({ action: "catalog", params: publicParams(radar, page, discovery) }),
    });
    const payload = await response.json().catch(() => null) as { items?: PublicOfferForMatching[]; total_pages?: number; error?: { message?: string } } | null;
    if (!response.ok || !payload) throw new Error(payload?.error?.message || `public_inventory_${response.status}`);
    for (const item of payload.items ?? []) if (item?.id && !seen.has(item.id)) { seen.add(item.id); items.push(item); }
    if (!payload.total_pages || page >= payload.total_pages) break;
  }
  return items;
}

async function runMatching(token: string, radarId: string) {
  const { url, anon, service, user } = await clients(token);
  const { data: radar, error: radarError } = await service.from("travel_radars").select("*").eq("id", radarId).eq("user_id", user.id).is("deleted_at", null).maybeSingle();
  if (radarError) throw radarError;
  if (!radar) throw new Error("radar_not_found");
  if (radar.status !== "active") throw new Error("radar_not_active");

  const r = radar as RadarForMatching;
  const meaningful = Boolean(r.origin || r.destination || r.offer_type || r.start_date || r.end_date || r.budget_max !== null || r.budget_min !== null);
  if (!meaningful) throw new Error("radar_too_broad");

  const { data: affinityRows, error: affinityError } = await service.from("traveler_affinities").select("preference_key, affinity_score").eq("user_id", user.id);
  if (affinityError) throw affinityError;
  const affinities: Affinity[] = (affinityRows ?? []).map((row: { preference_key: string; affinity_score: number | string }) => ({ preference_key: row.preference_key, score: Number(row.affinity_score) }));

  const primary = await fetchCatalog(url, anon, r, false, 4);
  const discovery = r.destination && affinities.some((item) => item.score > 0) ? await fetchCatalog(url, anon, r, true, 2) : [];
  const candidates = new Map<string, PublicOfferForMatching>();
  for (const offer of [...primary, ...discovery]) candidates.set(offer.id, offer);

  const matches = [...candidates.values()].map((offer) => {
    const evaluated = evaluateRadarMatch(r, offer, affinities);
    return evaluated ? { offer, evaluated } : null;
  }).filter((item): item is NonNullable<typeof item> => Boolean(item));

  const now = new Date().toISOString();
  const currentOfferIds = matches.map(({ offer }) => offer.id);
  for (const { offer, evaluated } of matches) {
    const row = {
      radar_id: r.id,
      user_id: user.id,
      offer_id: offer.id,
      match_class: evaluated.matchClass,
      algorithm_version: MATCH_ALGORITHM_VERSION,
      score: evaluated.score,
      matched_factors: evaluated.matchedFactors,
      unmatched_factors: evaluated.unmatchedFactors,
      offer_snapshot: sanitizeOfferSnapshot(offer),
      offer_updated_at: offer.updated_at,
      last_matched_at: now,
      expired_at: null,
      updated_at: now,
    };
    const { error } = await service.from("travel_radar_matches").upsert(row, { onConflict: "radar_id,offer_id,algorithm_version" });
    if (error) throw error;
  }

  let expireQuery = service.from("travel_radar_matches").update({ expired_at: now, updated_at: now }).eq("radar_id", r.id).eq("algorithm_version", MATCH_ALGORITHM_VERSION).is("expired_at", null);
  if (currentOfferIds.length) expireQuery = expireQuery.not("offer_id", "in", `(${currentOfferIds.join(",")})`);
  const { error: expireError } = await expireQuery;
  if (expireError) throw expireError;

  const { error: checkedError } = await service.from("travel_radars").update({ last_checked_at: now, updated_at: now }).eq("id", r.id).eq("user_id", user.id);
  if (checkedError) throw checkedError;

  return {
    radar_id: r.id,
    algorithm_version: MATCH_ALGORITHM_VERSION,
    evaluated_candidates: candidates.size,
    matches: matches.length,
    exact: matches.filter((item) => item.evaluated.matchClass === "exact").length,
    flexible: matches.filter((item) => item.evaluated.matchClass === "flexible").length,
    discovery: matches.filter((item) => item.evaluated.matchClass === "discovery").length,
    checked_at: now,
  };
}

async function listMatches(token: string, radarId: string) {
  const { service, user } = await clients(token);
  const { data: radar } = await service.from("travel_radars").select("id").eq("id", radarId).eq("user_id", user.id).is("deleted_at", null).maybeSingle();
  if (!radar) throw new Error("radar_not_found");
  const { data, error } = await service.from("travel_radar_matches")
    .select("id,radar_id,offer_id,match_class,algorithm_version,score,matched_factors,unmatched_factors,offer_snapshot,offer_updated_at,first_matched_at,last_matched_at")
    .eq("radar_id", radarId).is("expired_at", null).order("score", { ascending: false }).order("last_matched_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export const handler = async (request: Request) => {
  const origin = request.headers.get("origin");
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(origin) });
  if (request.method !== "POST") return json({ ok: false, error: "method_not_allowed" }, 405, origin);
  if (origin && !ALLOWED_ORIGINS.has(origin)) return json({ ok: false, error: "origin_not_allowed" }, 403, null);
  const authorization = request.headers.get("authorization") || "";
  const token = authorization.replace(/^Bearer\s+/i, "").trim();
  if (!token) return json({ ok: false, error: "authentication_required" }, 401, origin);
  try {
    const body = await request.json() as { action?: string; radarId?: unknown };
    const radarId = uuid(body.radarId);
    if (!radarId) return json({ ok: false, error: "invalid_radar_id" }, 400, origin);
    if (body.action === "run") return json({ ok: true, result: await runMatching(token, radarId) }, 200, origin);
    if (body.action === "list") return json({ ok: true, matches: await listMatches(token, radarId) }, 200, origin);
    return json({ ok: false, error: "invalid_action" }, 400, origin);
  } catch (error) {
    const message = error instanceof Error ? error.message : "matching_failed";
    const status = message === "authentication_required" ? 401 : message === "radar_not_found" ? 404 : ["radar_not_active", "radar_too_broad"].includes(message) ? 409 : 500;
    if (status === 500) console.error("[my-tomorrow-matching]", message);
    return json({ ok: false, error: status === 500 ? "matching_failed" : message }, status, origin);
  }
};

if ((import.meta as ImportMeta & { main?: boolean }).main) Deno.serve(handler);
