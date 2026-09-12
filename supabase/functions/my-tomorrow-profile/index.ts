import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } });
const allowedResponses = new Set(["want", "like", "neutral", "not_for_me"]);
const allowedDirectFlight = new Set(["prefer_direct", "neutral", "accept_connections"]);
const allowedRefinementStages = new Set(["style", "comfort", "rhythm", "advanced"]);
const allowedRefinementChoices = new Set(["left", "right", "neutral"]);
const allowedPreferenceKeys = new Set(["praia", "neve", "parques", "cidade", "natureza", "gastronomia", "compras", "aventura", "resort", "all_inclusive", "cruzeiro", "eventos", "cultura", "vida_noturna", "familia", "casal"]);
function cleanText(value: unknown, max = 120) { if (typeof value !== "string") return null; const text = value.trim(); return text ? text.slice(0, max) : null; }
function cleanProfile(input: unknown) {
  const value = input && typeof input === "object" ? input as Record<string, unknown> : {};
  const homeOriginIata = cleanText(value.homeOriginIata, 3)?.toUpperCase() ?? null;
  const budgetMin = typeof value.budgetMin === "number" && Number.isFinite(value.budgetMin) ? value.budgetMin : null;
  const budgetMax = typeof value.budgetMax === "number" && Number.isFinite(value.budgetMax) ? value.budgetMax : null;
  const directFlightPreference = typeof value.directFlightPreference === "string" && allowedDirectFlight.has(value.directFlightPreference) ? value.directFlightPreference : "neutral";
  const lodgingPreferences = Array.isArray(value.lodgingPreferences) ? value.lodgingPreferences.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean).slice(0, 12) : [];
  const typicalParty = value.typicalParty && typeof value.typicalParty === "object" ? value.typicalParty : {};
  if (homeOriginIata && !/^[A-Z]{3}$/.test(homeOriginIata)) throw new Error("invalid_home_origin_iata");
  if (budgetMin !== null && budgetMin < 0 || budgetMax !== null && budgetMax < 0 || budgetMin !== null && budgetMax !== null && budgetMin > budgetMax) throw new Error("invalid_budget_range");
  return { home_origin_name: cleanText(value.homeOriginName), home_origin_iata: homeOriginIata, typical_party: typicalParty, budget_min: budgetMin, budget_max: budgetMax, budget_currency: cleanText(value.budgetCurrency, 3)?.toUpperCase() ?? "BRL", direct_flight_preference: directFlightPreference, lodging_preferences: lodgingPreferences, onboarding_completed_at: value.onboardingCompleted === true ? new Date().toISOString() : null, updated_at: new Date().toISOString() };
}
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
  if (req.method !== "POST") return json({ ok: false, error: "method_not_allowed" }, 405);
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return json({ ok: false, error: "authentication_required" }, 401);
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? ""; const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  if (!supabaseUrl || !anonKey) return json({ ok: false, error: "travel_profile_unconfigured" }, 503);
  const client = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } }, auth: { persistSession: false } });
  const { data: { user }, error: userError } = await client.auth.getUser();
  if (userError || !user) return json({ ok: false, error: "authentication_required" }, 401);
  try {
    const body = await req.json().catch(() => ({})); const action = String(body?.action || "get");
    if (action === "get") {
      const [profileResult, affinitiesResult, eventsResult, refinementsResult] = await Promise.all([
        client.from("traveler_profile_settings").select("*").eq("user_id", user.id).maybeSingle(),
        client.from("traveler_affinities").select("preference_key,affinity_score,evidence_count,want_count,like_count,neutral_count,not_for_me_count,recalculated_at").eq("user_id", user.id).order("affinity_score", { ascending: false }),
        client.from("traveler_preference_events").select("preference_key,response,created_at").eq("user_id", user.id).is("revoked_at", null).order("created_at", { ascending: false }),
        client.from("traveler_profile_refinements").select("question_key,choice,answered_at").eq("user_id", user.id).is("revoked_at", null).order("answered_at", { ascending: false }),
      ]);
      if (profileResult.error) throw profileResult.error; if (affinitiesResult.error) throw affinitiesResult.error; if (eventsResult.error) throw eventsResult.error; if (refinementsResult.error) throw refinementsResult.error;
      const latestAnswers: Record<string, string> = {}; for (const event of eventsResult.data ?? []) if (!latestAnswers[event.preference_key]) latestAnswers[event.preference_key] = event.response;
      const refinements: Record<string, string> = {}; for (const item of refinementsResult.data ?? []) if (!refinements[item.question_key]) refinements[item.question_key] = item.choice;
      return json({ ok: true, profile: profileResult.data ?? null, affinities: affinitiesResult.data ?? [], latestAnswers, refinements });
    }
    if (action === "update_profile") {
      const profile = cleanProfile(body?.profile); const { data, error } = await client.from("traveler_profile_settings").upsert({ user_id: user.id, ...profile }, { onConflict: "user_id" }).select("*").single(); if (error) throw error; return json({ ok: true, profile: data });
    }
    if (action === "answer") {
      const preferenceKey = cleanText(body?.preferenceKey, 80) ?? ""; const response = cleanText(body?.response, 30) ?? "";
      if (!allowedPreferenceKeys.has(preferenceKey) || !allowedResponses.has(response)) return json({ ok: false, error: "invalid_preference_answer" }, 400);
      const { error } = await client.rpc("record_my_travel_preference", { p_preference_key: preferenceKey, p_response: response, p_source: "onboarding", p_evidence: { ui: "travel_match_progressive" } }); if (error) throw error; return json({ ok: true });
    }
    if (action === "refine") {
      const questionKey = cleanText(body?.questionKey, 80) ?? ""; const stage = cleanText(body?.stage, 20) ?? ""; const choice = cleanText(body?.choice, 20) ?? "";
      if (!allowedRefinementStages.has(stage) || !allowedRefinementChoices.has(choice) || !questionKey) return json({ ok: false, error: "invalid_profile_refinement" }, 400);
      const { error } = await client.rpc("record_my_profile_refinement", { p_question_key: questionKey, p_stage: stage, p_choice: choice }); if (error) throw error; return json({ ok: true });
    }
    if (action === "reset_preferences") { const { error } = await client.rpc("reset_my_travel_preferences"); if (error) throw error; return json({ ok: true }); }
    return json({ ok: false, error: "unsupported_action" }, 400);
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown_error"; if (["invalid_home_origin_iata", "invalid_budget_range"].includes(message)) return json({ ok: false, error: message }, 400); console.error("[MY_TOMORROW_PROFILE_ERROR]", message); return json({ ok: false, error: "travel_profile_request_failed" }, 500);
  }
});
