import { supabase } from "@/integrations/supabase/client";
import type { ProfileStage, RefinementChoice } from "@/lib/progressiveTravelProfile";

export type PreferenceResponse = "want" | "like" | "neutral" | "not_for_me";
export type DirectFlightPreference = "prefer_direct" | "neutral" | "accept_connections";

export type TravelProfileSettings = {
  user_id?: string;
  home_origin_name: string | null;
  home_origin_iata: string | null;
  typical_party: Record<string, unknown>;
  budget_min: number | null;
  budget_max: number | null;
  budget_currency: string;
  direct_flight_preference: DirectFlightPreference;
  lodging_preferences: string[];
  onboarding_completed_at: string | null;
};

export type TravelerAffinity = {
  preference_key: string;
  affinity_score: number;
  evidence_count: number;
  want_count: number;
  like_count: number;
  neutral_count: number;
  not_for_me_count: number;
  recalculated_at: string;
};

export type TravelProfileState = {
  profile: TravelProfileSettings | null;
  affinities: TravelerAffinity[];
  latestAnswers: Record<string, PreferenceResponse>;
  refinements: Record<string, RefinementChoice>;
};

export type TravelProfileInput = {
  homeOriginName?: string;
  homeOriginIata?: string;
  typicalParty?: Record<string, unknown>;
  budgetMin?: number | null;
  budgetMax?: number | null;
  budgetCurrency?: string;
  directFlightPreference?: DirectFlightPreference;
  lodgingPreferences?: string[];
  onboardingCompleted?: boolean;
};

async function invokeProfile<T>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke("my-tomorrow-profile", { body });
  if (error) throw error;
  if (!data?.ok) throw new Error(data?.error || "travel_profile_request_failed");
  return data as T;
}

export async function getTravelProfile(): Promise<TravelProfileState> {
  const data = await invokeProfile<{ ok: true; profile: TravelProfileSettings | null; affinities: TravelerAffinity[]; latestAnswers: Record<string, PreferenceResponse>; refinements?: Record<string, RefinementChoice> }>({ action: "get" });
  return { profile: data.profile, affinities: data.affinities, latestAnswers: data.latestAnswers, refinements: data.refinements ?? {} };
}

export async function updateTravelProfile(profile: TravelProfileInput) {
  const data = await invokeProfile<{ ok: true; profile: TravelProfileSettings }>({ action: "update_profile", profile });
  return data.profile;
}

export async function answerTravelPreference(preferenceKey: string, response: PreferenceResponse) {
  await invokeProfile<{ ok: true }>({ action: "answer", preferenceKey, response });
}

export async function answerProfileRefinement(questionKey: string, stage: Exclude<ProfileStage, "interests">, choice: RefinementChoice) {
  await invokeProfile<{ ok: true }>({ action: "refine", questionKey, stage, choice });
}

export async function resetTravelPreferences() {
  await invokeProfile<{ ok: true }>({ action: "reset_preferences" });
}
