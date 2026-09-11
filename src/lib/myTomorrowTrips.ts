import { supabase } from "@/integrations/supabase/client";

export type MyTomorrowStage =
  | "dreaming"
  | "researching"
  | "planning"
  | "monitoring"
  | "ready_to_buy"
  | "booked"
  | "traveling"
  | "completed"
  | "cancelled";

export type PlanningTrip = {
  id: string;
  kind: "planning";
  destinationName: string | null;
  originName: string | null;
  originIata: string | null;
  startDate: string | null;
  endDate: string | null;
  stage: MyTomorrowStage;
  passengers: Record<string, unknown>;
  budgetMin: number | null;
  budgetMax: number | null;
  budgetCurrency: string;
  linkedClientTripId: string | null;
  updatedAt: string;
};

export type BookedTrip = {
  id: string;
  kind: "booked";
  destinationName: string;
  startDate: string;
  endDate: string;
  stage: MyTomorrowStage;
  tripStatus: string;
  hotelName: string | null;
  flightNumber: string | null;
  updatedAt: string;
};

export type MyTomorrowTrip = PlanningTrip | BookedTrip;

export type PlanningTripInput = {
  destinationName?: string;
  originName?: string;
  originIata?: string;
  startDate?: string;
  endDate?: string;
  stage: Extract<MyTomorrowStage, "dreaming" | "researching" | "planning">;
  passengerComposition?: Record<string, unknown>;
  budgetMin?: number | null;
  budgetMax?: number | null;
  budgetCurrency?: string;
};

function normalizeBookedStage(status: string, startDate: string, endDate: string): MyTomorrowStage {
  const normalized = status.toLowerCase();
  if (normalized === "cancelled") return "cancelled";
  if (normalized === "completed") return "completed";
  const today = new Date();
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T23:59:59`);
  if (today > end) return "completed";
  if (today >= start && today <= end) return "traveling";
  return "booked";
}

export async function listMyTomorrowTrips(userId: string): Promise<MyTomorrowTrip[]> {
  const [{ data: planning, error: planningError }, { data: sharedAccess }, directBooked] = await Promise.all([
    supabase
      .from("trip_sessions")
      .select("id,destination_name,origin_name,origin_iata,start_date,end_date,lifecycle_stage,passenger_composition,budget_min,budget_max,budget_currency,linked_client_trip_id,updated_at")
      .eq("owner_user_id", userId)
      .order("updated_at", { ascending: false }),
    supabase
      .from("account_shared_access")
      .select("primary_user_id")
      .eq("shared_user_id", userId)
      .maybeSingle(),
    supabase
      .from("client_trips")
      .select("id,destination_name,departure_date,return_date,trip_status,hotel_name,flight_number,updated_at")
      .eq("user_id", userId)
      .order("departure_date", { ascending: true }),
  ]);

  if (planningError) throw planningError;
  if (directBooked.error) throw directBooked.error;

  let bookedRows = directBooked.data ?? [];
  if (sharedAccess?.primary_user_id) {
    const { data, error } = await supabase
      .from("client_trips")
      .select("id,destination_name,departure_date,return_date,trip_status,hotel_name,flight_number,updated_at")
      .eq("user_id", sharedAccess.primary_user_id)
      .order("departure_date", { ascending: true });
    if (error) throw error;
    bookedRows = data ?? [];
  }

  const planningTrips: PlanningTrip[] = (planning ?? []).map((row) => ({
    id: row.id,
    kind: "planning",
    destinationName: row.destination_name,
    originName: row.origin_name,
    originIata: row.origin_iata,
    startDate: row.start_date,
    endDate: row.end_date,
    stage: row.lifecycle_stage as MyTomorrowStage,
    passengers: (row.passenger_composition ?? {}) as Record<string, unknown>,
    budgetMin: row.budget_min === null ? null : Number(row.budget_min),
    budgetMax: row.budget_max === null ? null : Number(row.budget_max),
    budgetCurrency: row.budget_currency ?? "BRL",
    linkedClientTripId: row.linked_client_trip_id,
    updatedAt: row.updated_at,
  }));

  const bookedTrips: BookedTrip[] = bookedRows.map((row) => ({
    id: row.id,
    kind: "booked",
    destinationName: row.destination_name,
    startDate: row.departure_date,
    endDate: row.return_date,
    stage: normalizeBookedStage(row.trip_status, row.departure_date, row.return_date),
    tripStatus: row.trip_status,
    hotelName: row.hotel_name,
    flightNumber: row.flight_number,
    updatedAt: row.updated_at,
  }));

  return [...planningTrips, ...bookedTrips];
}

export async function createPlanningTrip(userId: string, input: PlanningTripInput) {
  const { data, error } = await supabase
    .from("trip_sessions")
    .insert({
      owner_user_id: userId,
      destination_name: input.destinationName?.trim() || null,
      origin_name: input.originName?.trim() || null,
      origin_iata: input.originIata?.trim().toUpperCase() || null,
      start_date: input.startDate || null,
      end_date: input.endDate || null,
      lifecycle_stage: input.stage,
      passenger_composition: input.passengerComposition ?? {},
      budget_min: input.budgetMin ?? null,
      budget_max: input.budgetMax ?? null,
      budget_currency: input.budgetCurrency ?? "BRL",
      status: "PLANNING",
    })
    .select("id")
    .single();
  if (error) throw error;
  return data;
}

export async function updatePlanningTrip(tripId: string, input: Partial<PlanningTripInput>) {
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString(), last_activity_at: new Date().toISOString() };
  if (input.destinationName !== undefined) patch.destination_name = input.destinationName.trim() || null;
  if (input.originName !== undefined) patch.origin_name = input.originName.trim() || null;
  if (input.originIata !== undefined) patch.origin_iata = input.originIata.trim().toUpperCase() || null;
  if (input.startDate !== undefined) patch.start_date = input.startDate || null;
  if (input.endDate !== undefined) patch.end_date = input.endDate || null;
  if (input.stage !== undefined) patch.lifecycle_stage = input.stage;
  if (input.passengerComposition !== undefined) patch.passenger_composition = input.passengerComposition;
  if (input.budgetMin !== undefined) patch.budget_min = input.budgetMin;
  if (input.budgetMax !== undefined) patch.budget_max = input.budgetMax;
  if (input.budgetCurrency !== undefined) patch.budget_currency = input.budgetCurrency;

  const { error } = await supabase.from("trip_sessions").update(patch).eq("id", tripId);
  if (error) throw error;
}
