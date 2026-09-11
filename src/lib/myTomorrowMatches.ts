import { supabase } from "@/integrations/supabase/client";

export type RadarMatchClass = "exact" | "flexible" | "discovery";

export interface RadarMatchFactor {
  key: string;
  label: string;
  matched: boolean;
  weight: number;
  detail?: string;
}

export interface RadarMatchOfferSnapshot {
  id: string;
  offer_type: "bloqueio_aereo" | "pacote";
  offer_subtype: "bloqueio" | "nacional" | "internacional" | "evento" | "grupo_guiado";
  name: string | null;
  category: string | null;
  origin: string | null;
  origin_iata: string | null;
  destination: string | null;
  destination_iata: string | null;
  departure_date: string | null;
  return_date: string | null;
  nights: number | null;
  price_per_person: number;
  tax_per_person: number | null;
  currency: string | null;
  available_seats: number | null;
  airfare_included: boolean;
  image_url: string | null;
  updated_at: string | null;
}

export interface RadarMatch {
  id: string;
  radar_id: string;
  offer_id: string;
  match_class: RadarMatchClass;
  algorithm_version: string;
  score: number;
  matched_factors: RadarMatchFactor[];
  unmatched_factors: RadarMatchFactor[];
  offer_snapshot: RadarMatchOfferSnapshot;
  offer_updated_at: string | null;
  first_matched_at: string;
  last_matched_at: string;
}

export interface RadarRunResult {
  radar_id: string;
  algorithm_version: string;
  evaluated_candidates: number;
  matches: number;
  exact: number;
  flexible: number;
  discovery: number;
  checked_at: string;
}

async function invoke<T>(body: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke<T>("my-tomorrow-matching", { body });
  if (error) throw error;
  const payload = data as T & { ok?: boolean; error?: string };
  if (!payload?.ok) throw new Error(payload?.error || "matching_request_failed");
  return payload;
}

export async function runMyRadarMatching(radarId: string) {
  const data = await invoke<{ ok: true; result: RadarRunResult }>({ action: "run", radarId });
  return data.result;
}

export async function listMyRadarMatches(radarId: string) {
  const data = await invoke<{ ok: true; matches: RadarMatch[] }>({ action: "list", radarId });
  return data.matches;
}
