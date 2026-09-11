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

const allowedStages = new Set(["dreaming", "researching", "planning"]);

function normalizeBookedStage(status: string, startDate: string, endDate: string) {
  const normalized = String(status || "").toLowerCase();
  if (normalized === "cancelled") return "cancelled";
  if (normalized === "completed") return "completed";
  const now = Date.now();
  const start = new Date(`${startDate}T00:00:00`).getTime();
  const end = new Date(`${endDate}T23:59:59`).getTime();
  if (Number.isFinite(end) && now > end) return "completed";
  if (Number.isFinite(start) && Number.isFinite(end) && now >= start && now <= end) return "traveling";
  return "booked";
}

function planningTrip(row: Record<string, unknown>) {
  return {
    id: row.id,
    kind: "planning",
    destinationName: row.destination_name ?? null,
    originName: row.origin_name ?? null,
    originIata: row.origin_iata ?? null,
    startDate: row.start_date ?? null,
    endDate: row.end_date ?? null,
    stage: row.lifecycle_stage ?? "planning",
    passengers: row.passenger_composition ?? {},
    budgetMin: row.budget_min === null || row.budget_min === undefined ? null : Number(row.budget_min),
    budgetMax: row.budget_max === null || row.budget_max === undefined ? null : Number(row.budget_max),
    budgetCurrency: row.budget_currency ?? "BRL",
    linkedClientTripId: row.linked_client_trip_id ?? null,
    updatedAt: row.updated_at,
  };
}

function bookedTrip(row: Record<string, unknown>) {
  return {
    id: row.id,
    kind: "booked",
    destinationName: row.destination_name,
    startDate: row.departure_date,
    endDate: row.return_date,
    stage: normalizeBookedStage(String(row.trip_status || ""), String(row.departure_date || ""), String(row.return_date || "")),
    tripStatus: row.trip_status,
    hotelName: row.hotel_name ?? null,
    flightNumber: row.flight_number ?? null,
    updatedAt: row.updated_at,
  };
}

function cleanInput(value: unknown) {
  const input = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const stage = typeof input.stage === "string" && allowedStages.has(input.stage) ? input.stage : "planning";
  const text = (key: string) => typeof input[key] === "string" ? String(input[key]).trim() || null : null;
  const number = (key: string) => typeof input[key] === "number" && Number.isFinite(input[key]) ? input[key] : null;
  const passengers = input.passengerComposition && typeof input.passengerComposition === "object" ? input.passengerComposition : {};
  return {
    destination_name: text("destinationName"),
    origin_name: text("originName"),
    origin_iata: text("originIata")?.toUpperCase() ?? null,
    start_date: text("startDate"),
    end_date: text("endDate"),
    lifecycle_stage: stage,
    passenger_composition: passengers,
    budget_min: number("budgetMin"),
    budget_max: number("budgetMax"),
    budget_currency: text("budgetCurrency")?.toUpperCase() ?? "BRL",
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
  if (req.method !== "POST") return json({ ok: false, error: "method_not_allowed" }, 405);

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return json({ ok: false, error: "authentication_required" }, 401);

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  if (!supabaseUrl || !anonKey) return json({ ok: false, error: "my_tomorrow_unconfigured" }, 503);

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
      const [planningResult, bookedResult] = await Promise.all([
        client
          .from("trip_sessions")
          .select("id,destination_name,origin_name,origin_iata,start_date,end_date,lifecycle_stage,passenger_composition,budget_min,budget_max,budget_currency,linked_client_trip_id,updated_at")
          .eq("owner_user_id", user.id)
          .order("updated_at", { ascending: false }),
        client
          .from("client_trips")
          .select("id,destination_name,departure_date,return_date,trip_status,hotel_name,flight_number,updated_at")
          .order("departure_date", { ascending: true }),
      ]);
      if (planningResult.error) throw planningResult.error;
      if (bookedResult.error) throw bookedResult.error;
      return json({
        ok: true,
        trips: [
          ...(planningResult.data ?? []).map((row) => planningTrip(row)),
          ...(bookedResult.data ?? []).map((row) => bookedTrip(row)),
        ],
      });
    }

    if (action === "create") {
      const input = cleanInput(body?.input);
      if (input.start_date && input.end_date && input.start_date > input.end_date) {
        return json({ ok: false, error: "invalid_date_range" }, 400);
      }
      if (input.budget_min !== null && input.budget_max !== null && input.budget_min > input.budget_max) {
        return json({ ok: false, error: "invalid_budget_range" }, 400);
      }
      const { data, error } = await client
        .from("trip_sessions")
        .insert({ ...input, owner_user_id: user.id, status: "PLANNING" })
        .select("id,destination_name,origin_name,origin_iata,start_date,end_date,lifecycle_stage,passenger_composition,budget_min,budget_max,budget_currency,linked_client_trip_id,updated_at")
        .single();
      if (error) throw error;
      return json({ ok: true, trip: planningTrip(data) }, 201);
    }

    if (action === "update") {
      const tripId = typeof body?.tripId === "string" ? body.tripId : "";
      if (!tripId) return json({ ok: false, error: "trip_id_required" }, 400);
      const input = cleanInput(body?.input);
      if (input.start_date && input.end_date && input.start_date > input.end_date) {
        return json({ ok: false, error: "invalid_date_range" }, 400);
      }
      if (input.budget_min !== null && input.budget_max !== null && input.budget_min > input.budget_max) {
        return json({ ok: false, error: "invalid_budget_range" }, 400);
      }
      const { data, error } = await client
        .from("trip_sessions")
        .update({ ...input, updated_at: new Date().toISOString(), last_activity_at: new Date().toISOString() })
        .eq("id", tripId)
        .eq("owner_user_id", user.id)
        .select("id,destination_name,origin_name,origin_iata,start_date,end_date,lifecycle_stage,passenger_composition,budget_min,budget_max,budget_currency,linked_client_trip_id,updated_at")
        .maybeSingle();
      if (error) throw error;
      if (!data) return json({ ok: false, error: "trip_not_found" }, 404);
      return json({ ok: true, trip: planningTrip(data) });
    }

    return json({ ok: false, error: "unsupported_action" }, 400);
  } catch (error) {
    console.error("[MY_TOMORROW_TRIPS_ERROR]", error instanceof Error ? error.message : "unknown_error");
    return json({ ok: false, error: "my_tomorrow_trip_request_failed" }, 500);
  }
});
