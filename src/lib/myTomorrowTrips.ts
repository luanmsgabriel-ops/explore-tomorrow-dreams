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

type TripApiResponse = {
  ok: boolean;
  trips?: MyTomorrowTrip[];
  trip?: MyTomorrowTrip;
  error?: string;
};

async function invoke(body: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke<TripApiResponse>("my-tomorrow-trips", { body });
  if (error) throw error;
  if (!data?.ok) throw new Error(data?.error || "my_tomorrow_trip_request_failed");
  return data;
}

export async function listMyTomorrowTrips(): Promise<MyTomorrowTrip[]> {
  const data = await invoke({ action: "list" });
  return data.trips ?? [];
}

export async function createPlanningTrip(input: PlanningTripInput) {
  const data = await invoke({ action: "create", input });
  if (!data.trip) throw new Error("my_tomorrow_trip_missing");
  return data.trip;
}

export async function updatePlanningTrip(tripId: string, input: Partial<PlanningTripInput>) {
  const data = await invoke({ action: "update", tripId, input });
  if (!data.trip) throw new Error("my_tomorrow_trip_missing");
  return data.trip;
}
