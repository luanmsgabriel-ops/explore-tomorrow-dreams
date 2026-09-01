import { supabase } from "@/integrations/supabase/client";

const ACCESS_TOKEN_KEY = "tomorrow_trip_composer_access_token";

export type TripComposerSnapshot = {
  session: Record<string, unknown>;
  days: Array<Record<string, unknown>>;
  items: Array<Record<string, unknown>>;
  preferences: Array<Record<string, unknown>>;
};

export type TripComposerRecommendation = {
  id: string;
  score: number;
  reasons?: string[];
  warnings?: string[];
  estimated_activity_minutes?: number | null;
  estimated_travel_minutes?: number | null;
  estimated_distance_meters?: number | null;
  candidate?: {
    id: string;
    title: string;
    summary?: string | null;
    categories: string[];
    latitude: number;
    longitude: number;
    duration_minutes: number | null;
    source_kind?: string | null;
    source_reference?: string | null;
    factual_snapshot?: Record<string, unknown> | null;
    media?: Array<Record<string, unknown>>;
  } | null;
};

const invoke = async <T>(name: string, body: Record<string, unknown>): Promise<T> => {
  const { data, error } = await supabase.functions.invoke(name, { body });
  if (error) throw error;
  if (data?.error) throw new Error(String(data.error));
  return data as T;
};

export const getTripComposerAccessToken = () => sessionStorage.getItem(ACCESS_TOKEN_KEY);
export const clearTripComposerAccessToken = () => sessionStorage.removeItem(ACCESS_TOKEN_KEY);

export function tripComposerExcludedIds(snapshot: TripComposerSnapshot | null, previouslyShown: Iterable<string> = []) {
  const ids = new Set<string>();
  for (const item of snapshot?.items ?? []) {
    if (String(item.status || "").toUpperCase() === "REMOVED") continue;
    const id = typeof item.external_place_id === "string" ? item.external_place_id.trim() : "";
    if (id) ids.add(id);
  }
  for (const id of previouslyShown) {
    if (typeof id === "string" && id.trim()) ids.add(id.trim());
  }
  return [...ids].slice(0, 120);
}

export async function createTripComposerSession(input: {
  destination_name?: string;
  start_date?: string;
  end_date?: string;
  total_days: number;
  passenger_composition?: Record<string, unknown>;
  pace?: "RELAXED" | "BALANCED" | "INTENSE";
}) {
  const data = await invoke<TripComposerSnapshot & { access_token: string }>("trip-composer-session", {
    action: "create",
    ...input,
  });
  sessionStorage.setItem(ACCESS_TOKEN_KEY, data.access_token);
  return data;
}

export async function loadTripComposerSession() {
  const accessToken = getTripComposerAccessToken();
  if (!accessToken) return null;
  return invoke<TripComposerSnapshot>("trip-composer-session", { action: "load", access_token: accessToken });
}

export async function mutateTripComposerSession(action: string, payload: Record<string, unknown> = {}) {
  const accessToken = getTripComposerAccessToken();
  if (!accessToken) throw new Error("trip_composer_session_missing");
  return invoke<TripComposerSnapshot>("trip-composer-session", { action, access_token: accessToken, ...payload });
}

export async function planTripComposerWindow(input: {
  destination: string;
  search: string;
  date: string;
  available_minutes: number;
  origin_lat?: number;
  origin_lng?: number;
  weather_lat?: number;
  weather_lng?: number;
  preferences?: string[];
  rejected_categories?: string[];
  excluded_ids?: string[];
  passenger_context?: Record<string, unknown>;
  default_duration_minutes?: number;
}) {
  return invoke<{
    ok: boolean;
    mode: "forecast" | "seasonal_or_unknown" | "no_candidates";
    weather: Record<string, unknown> | null;
    recommendations: TripComposerRecommendation[];
    source_count?: number;
    sources?: { viator?: number; places?: number };
    route_context_applied?: boolean;
  }>("trip-composer-window", input);
}