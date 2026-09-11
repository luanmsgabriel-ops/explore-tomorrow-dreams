import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
});

const statuses = new Set(["active", "paused", "archived"]);
const offerTypes = new Set(["bloqueio_aereo", "pacote"]);
const offerSubtypes = new Set(["bloqueio", "nacional", "internacional", "evento", "grupo_guiado"]);
const sources = new Set(["manual", "catalog"]);

const text = (value: unknown, max: number) => {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string") throw new Error("invalid_text");
  const normalized = value.trim();
  if (!normalized || normalized.length > max) throw new Error("invalid_text");
  return normalized;
};

const int = (value: unknown, min: number, max: number) => {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) throw new Error("invalid_integer");
  return parsed;
};

const money = (value: unknown) => {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 1_000_000) throw new Error("invalid_money");
  return parsed;
};

const date = (value: unknown) => {
  const normalized = text(value, 10);
  if (!normalized) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized) || Number.isNaN(Date.parse(`${normalized}T00:00:00Z`))) throw new Error("invalid_date");
  return normalized;
};

const enumValue = (value: unknown, allowed: Set<string>, max = 40) => {
  const normalized = text(value, max);
  if (!normalized) return null;
  if (!allowed.has(normalized)) throw new Error("invalid_enum");
  return normalized;
};

function sanitizeSourceFilters(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const source = value as Record<string, unknown>;
  const allowed = ["search","origin","destination","offerType","subtype","category","startDate","endDate","passengers","minPrice","maxPrice","onlyWithSeats"];
  const result: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in source) result[key] = source[key];
  }
  return Object.keys(result).length ? result : null;
}

function normalizeInput(input: unknown, partial = false) {
  const value = input && typeof input === "object" ? input as Record<string, unknown> : {};
  const output: Record<string, unknown> = {};
  const assign = (key: string, parser: () => unknown) => {
    if (partial && !(key in value)) return;
    output[key] = parser();
  };

  assign("name", () => text(value.name, 120));
  assign("trip_session_id", () => text(value.trip_session_id, 36));
  assign("origin", () => text(value.origin, 100));
  assign("destination", () => text(value.destination, 120));
  assign("start_date", () => date(value.start_date));
  assign("end_date", () => date(value.end_date));
  assign("flexibility_days", () => int(value.flexibility_days ?? 0, 0, 60));
  assign("min_nights", () => int(value.min_nights, 1, 60));
  assign("max_nights", () => int(value.max_nights, 1, 60));
  assign("passengers", () => int(value.passengers, 1, 20));
  assign("budget_min", () => money(value.budget_min));
  assign("budget_max", () => money(value.budget_max));
  assign("budget_currency", () => (text(value.budget_currency, 3) ?? "BRL").toUpperCase());
  assign("offer_type", () => enumValue(value.offer_type, offerTypes));
  assign("offer_subtype", () => enumValue(value.offer_subtype, offerSubtypes));
  assign("category", () => text(value.category, 80));
  assign("source", () => enumValue(value.source ?? "manual", sources) ?? "manual");
  assign("source_filters", () => sanitizeSourceFilters(value.source_filters));

  if (!partial && !output.name) throw new Error("name_required");
  const start = output.start_date as string | null | undefined;
  const end = output.end_date as string | null | undefined;
  if (start && end && start > end) throw new Error("invalid_date_range");
  const minNights = output.min_nights as number | null | undefined;
  const maxNights = output.max_nights as number | null | undefined;
  if (minNights !== null && minNights !== undefined && maxNights !== null && maxNights !== undefined && minNights > maxNights) throw new Error("invalid_nights_range");
  const minBudget = output.budget_min as number | null | undefined;
  const maxBudget = output.budget_max as number | null | undefined;
  if (minBudget !== null && minBudget !== undefined && maxBudget !== null && maxBudget !== undefined && minBudget > maxBudget) throw new Error("invalid_budget_range");
  return output;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
  if (req.method !== "POST") return json({ ok: false, error: "method_not_allowed" }, 405);

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return json({ ok: false, error: "authentication_required" }, 401);

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  if (!supabaseUrl || !anonKey) return json({ ok: false, error: "radar_unconfigured" }, 503);

  const client = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  });
  const { data: { user }, error: userError } = await client.auth.getUser();
  if (userError || !user) return json({ ok: false, error: "authentication_required" }, 401);

  try {
    const body = await req.json().catch(() => ({}));
    const action = String(body?.action || "list");

    if (action === "list") {
      const { data, error } = await client.from("travel_radars").select("*").is("deleted_at", null).order("updated_at", { ascending: false });
      if (error) throw error;
      return json({ ok: true, radars: data ?? [] });
    }

    if (action === "get") {
      const radarId = text(body?.radarId, 36);
      if (!radarId) return json({ ok: false, error: "radar_id_required" }, 400);
      const { data, error } = await client.from("travel_radars").select("*").eq("id", radarId).is("deleted_at", null).maybeSingle();
      if (error) throw error;
      if (!data) return json({ ok: false, error: "radar_not_found" }, 404);
      return json({ ok: true, radar: data });
    }

    if (action === "create") {
      const input = normalizeInput(body?.input);
      const { data, error } = await client.from("travel_radars").insert({ user_id: user.id, status: "active", ...input }).select("*").single();
      if (error) throw error;
      return json({ ok: true, radar: data }, 201);
    }

    if (action === "update") {
      const radarId = text(body?.radarId, 36);
      if (!radarId) return json({ ok: false, error: "radar_id_required" }, 400);
      const input = normalizeInput(body?.input, true);
      const { data, error } = await client.from("travel_radars").update({ ...input, updated_at: new Date().toISOString() }).eq("id", radarId).is("deleted_at", null).select("*").maybeSingle();
      if (error) throw error;
      if (!data) return json({ ok: false, error: "radar_not_found" }, 404);
      return json({ ok: true, radar: data });
    }

    if (["pause", "resume", "archive"].includes(action)) {
      const radarId = text(body?.radarId, 36);
      if (!radarId) return json({ ok: false, error: "radar_id_required" }, 400);
      const status = action === "pause" ? "paused" : action === "resume" ? "active" : "archived";
      if (!statuses.has(status)) return json({ ok: false, error: "invalid_status" }, 400);
      const { data, error } = await client.from("travel_radars").update({ status, updated_at: new Date().toISOString() }).eq("id", radarId).is("deleted_at", null).select("*").maybeSingle();
      if (error) throw error;
      if (!data) return json({ ok: false, error: "radar_not_found" }, 404);
      return json({ ok: true, radar: data });
    }

    if (action === "delete") {
      const radarId = text(body?.radarId, 36);
      if (!radarId) return json({ ok: false, error: "radar_id_required" }, 400);
      const now = new Date().toISOString();
      const { data, error } = await client.from("travel_radars").update({ deleted_at: now, status: "archived", updated_at: now }).eq("id", radarId).is("deleted_at", null).select("id").maybeSingle();
      if (error) throw error;
      if (!data) return json({ ok: false, error: "radar_not_found" }, 404);
      return json({ ok: true });
    }

    return json({ ok: false, error: "unsupported_action" }, 400);
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown_error";
    const badRequest = ["invalid_text","invalid_integer","invalid_money","invalid_date","invalid_enum","name_required","invalid_date_range","invalid_nights_range","invalid_budget_range"].includes(message);
    console.error("[MY_TOMORROW_RADARS_ERROR]", badRequest ? message : "request_failed");
    return json({ ok: false, error: badRequest ? message : "radar_request_failed" }, badRequest ? 400 : 500);
  }
});
