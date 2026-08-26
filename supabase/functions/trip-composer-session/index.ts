import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const db = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
});

const sha256 = async (value: string) => {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
};

const token = () => {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes, byte => byte.toString(16).padStart(2, "0")).join("");
};

async function sessionForAccess(accessToken: string) {
  if (!/^[0-9a-f]{64}$/i.test(accessToken)) return null;
  const hash = await sha256(accessToken);
  const { data, error } = await db.from("trip_sessions").select("*").eq("access_token_hash", hash).maybeSingle();
  if (error) throw error;
  return data;
}

async function snapshot(sessionId: string) {
  const { data: session, error: sessionError } = await db.from("trip_sessions").select("*").eq("id", sessionId).single();
  if (sessionError) throw sessionError;
  const { data: days, error: daysError } = await db.from("trip_days").select("*").eq("trip_session_id", sessionId).order("day_number");
  if (daysError) throw daysError;
  const dayIds = (days || []).map(day => day.id);
  const { data: items, error: itemsError } = dayIds.length
    ? await db.from("trip_day_items").select("*").in("trip_day_id", dayIds).order("sort_order")
    : { data: [], error: null };
  if (itemsError) throw itemsError;
  const { data: preferences, error: preferencesError } = await db.from("trip_preferences").select("*").eq("trip_session_id", sessionId).eq("is_active", true).order("created_at");
  if (preferencesError) throw preferencesError;
  return { session, days: days || [], items: items || [], preferences: preferences || [] };
}

async function createSession(body: any) {
  const totalDays = Math.min(Math.max(Number(body.total_days) || 1, 1), 60);
  const accessToken = token();
  const accessHash = await sha256(accessToken);
  const sessionPayload = {
    destination_name: typeof body.destination_name === "string" ? body.destination_name.slice(0, 200) : null,
    start_date: body.start_date || null,
    end_date: body.end_date || null,
    passenger_composition: body.passenger_composition && typeof body.passenger_composition === "object" ? body.passenger_composition : {},
    pace: ["RELAXED", "BALANCED", "INTENSE"].includes(body.pace) ? body.pace : null,
    current_day: 1,
    access_token_hash: accessHash,
  };
  const { data: session, error } = await db.from("trip_sessions").insert(sessionPayload).select("*").single();
  if (error) throw error;
  const start = body.start_date && /^\d{4}-\d{2}-\d{2}$/.test(body.start_date) ? new Date(`${body.start_date}T00:00:00Z`) : null;
  const rows = Array.from({ length: totalDays }, (_, index) => ({
    trip_session_id: session.id,
    day_number: index + 1,
    trip_date: start ? new Date(start.getTime() + index * 86400000).toISOString().slice(0, 10) : null,
  }));
  const { error: dayError } = await db.from("trip_days").insert(rows);
  if (dayError) {
    await db.from("trip_sessions").delete().eq("id", session.id);
    throw dayError;
  }
  return json({ ok: true, access_token: accessToken, ...(await snapshot(session.id)) }, 201);
}

async function mutate(body: any) {
  const session = await sessionForAccess(String(body.access_token || ""));
  if (!session) return json({ error: "session_not_found" }, 404);
  const action = body.action;

  if (action === "load") return json({ ok: true, ...(await snapshot(session.id)) });

  if (action === "update_session") {
    const allowed: Record<string, unknown> = {};
    for (const key of ["destination_name", "destination_external_id", "destination_lat", "destination_lng", "start_date", "end_date", "arrival_at", "departure_at", "base_name", "base_external_id", "base_lat", "base_lng", "passenger_composition", "pace", "experience_budget", "current_day", "current_slot", "status"]) {
      if (body.patch && Object.prototype.hasOwnProperty.call(body.patch, key)) allowed[key] = body.patch[key];
    }
    allowed.last_activity_at = new Date().toISOString();
    const { error } = await db.from("trip_sessions").update(allowed).eq("id", session.id);
    if (error) throw error;
  } else if (action === "add_item") {
    const dayNumber = Number(body.day_number);
    const { data: day, error: dayError } = await db.from("trip_days").select("id").eq("trip_session_id", session.id).eq("day_number", dayNumber).single();
    if (dayError) throw dayError;
    const item = body.item || {};
    const { error } = await db.from("trip_day_items").insert({
      trip_day_id: day.id,
      item_type: String(item.item_type || "EXPERIENCE").toUpperCase(),
      status: "SELECTED",
      sort_order: Number.isInteger(item.sort_order) ? item.sort_order : 0,
      starts_at: item.starts_at || null,
      ends_at: item.ends_at || null,
      title: String(item.title || "").slice(0, 240),
      description: typeof item.description === "string" ? item.description.slice(0, 4000) : null,
      external_place_id: item.external_place_id || null,
      latitude: Number.isFinite(item.latitude) ? item.latitude : null,
      longitude: Number.isFinite(item.longitude) ? item.longitude : null,
      source_kind: item.source_kind || "GOOGLE_PLACE",
      source_reference: item.source_reference || null,
      factual_snapshot: item.factual_snapshot || null,
      planning_metadata: item.planning_metadata || null,
    });
    if (error) throw error;
  } else if (action === "remove_item") {
    const itemId = String(body.item_id || "");
    const { data: owned, error: ownedError } = await db.from("trip_day_items").select("id,trip_days!inner(trip_session_id)").eq("id", itemId).eq("trip_days.trip_session_id", session.id).maybeSingle();
    if (ownedError) throw ownedError;
    if (!owned) return json({ error: "item_not_found" }, 404);
    const { error } = await db.from("trip_day_items").update({ status: "REMOVED" }).eq("id", itemId);
    if (error) throw error;
  } else if (action === "complete_day" || action === "reopen_day") {
    const dayNumber = Number(body.day_number);
    const status = action === "complete_day" ? "PLANNED" : "OPEN";
    const { error } = await db.from("trip_days").update({ status }).eq("trip_session_id", session.id).eq("day_number", dayNumber);
    if (error) throw error;
    if (action === "complete_day") await db.from("trip_sessions").update({ current_day: dayNumber + 1, last_activity_at: new Date().toISOString() }).eq("id", session.id);
  } else if (action === "record_preference") {
    const pref = body.preference || {};
    const source = ["EXPLICIT", "SELECTION", "REJECTION"].includes(pref.source) ? pref.source : "EXPLICIT";
    const { error } = await db.from("trip_preferences").insert({
      trip_session_id: session.id,
      preference_key: String(pref.key || "").toLowerCase().replace(/[^a-z0-9_]/g, "_").slice(0, 80),
      preference_value: pref.value,
      source,
      weight: Math.min(Math.max(Number(pref.weight) || 1, 0), 1),
      evidence: pref.evidence || null,
    });
    if (error) throw error;
  } else {
    return json({ error: "invalid_action" }, 400);
  }

  return json({ ok: true, ...(await snapshot(session.id)) });
}

serve(async req => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) return json({ error: "session_unconfigured" }, 503);
  try {
    const body = await req.json();
    if (body?.action === "create") return await createSession(body);
    return await mutate(body);
  } catch (error) {
    console.error("[TRIP_COMPOSER_SESSION_ERROR]", error instanceof Error ? error.message : error);
    return json({ error: "internal_error" }, 500);
  }
});