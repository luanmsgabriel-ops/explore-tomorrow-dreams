import { supabase } from "@/integrations/supabase/client";

export type RadarStatus = "active" | "paused" | "archived";
export type RadarOfferType = "bloqueio_aereo" | "pacote";
export type RadarOfferSubtype = "bloqueio" | "nacional" | "internacional" | "evento" | "grupo_guiado";

export interface TravelRadar {
  id: string;
  user_id: string;
  trip_session_id: string | null;
  name: string;
  status: RadarStatus;
  origin: string | null;
  destination: string | null;
  start_date: string | null;
  end_date: string | null;
  flexibility_days: number;
  min_nights: number | null;
  max_nights: number | null;
  passengers: number | null;
  budget_min: number | null;
  budget_max: number | null;
  budget_currency: string;
  offer_type: RadarOfferType | null;
  offer_subtype: RadarOfferSubtype | null;
  category: string | null;
  source: "manual" | "catalog";
  source_filters: Record<string, unknown> | null;
  last_checked_at: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export type RadarInput = Partial<Omit<TravelRadar, "id" | "user_id" | "status" | "last_checked_at" | "deleted_at" | "created_at" | "updated_at">> & { name: string };

async function invoke<T>(body: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke("my-tomorrow-radars", { body });
  if (error) throw error;
  if (!data?.ok) throw new Error(data?.error || "radar_request_failed");
  return data as T;
}

export async function listMyRadars() {
  const data = await invoke<{ ok: true; radars: TravelRadar[] }>({ action: "list" });
  return data.radars;
}

export async function getMyRadar(radarId: string) {
  const data = await invoke<{ ok: true; radar: TravelRadar }>({ action: "get", radarId });
  return data.radar;
}

export async function createMyRadar(input: RadarInput) {
  const data = await invoke<{ ok: true; radar: TravelRadar }>({ action: "create", input });
  return data.radar;
}

export async function updateMyRadar(radarId: string, input: Partial<RadarInput>) {
  const data = await invoke<{ ok: true; radar: TravelRadar }>({ action: "update", radarId, input });
  return data.radar;
}

export async function setMyRadarStatus(radarId: string, action: "pause" | "resume" | "archive") {
  const data = await invoke<{ ok: true; radar: TravelRadar }>({ action, radarId });
  return data.radar;
}

export async function deleteMyRadar(radarId: string) {
  await invoke<{ ok: true }>({ action: "delete", radarId });
}
