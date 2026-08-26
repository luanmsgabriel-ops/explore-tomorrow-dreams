export type PlannerCandidate = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  category?: string | null;
  duration_minutes?: number | null;
  rating?: number | null;
  user_rating_count?: number | null;
  rain_sensitivity?: number | null;
  family_fit?: number | null;
  intensity?: number | null;
  tags?: string[];
};

export type PlannerContext = {
  available_minutes: number;
  preferred_categories?: string[];
  rejected_categories?: string[];
  preferred_tags?: string[];
  passengers?: { adults?: number; children?: number };
  desired_intensity?: number | null;
  weather?: { precipitation_probability?: number | null };
};

export type RouteFact = { duration_minutes: number | null; distance_meters: number | null };

export function scoreCandidate(candidate: PlannerCandidate, context: PlannerContext, route: RouteFact) {
  const reasons: string[] = [];
  const warnings: string[] = [];
  let score = 50;
  const duration = candidate.duration_minutes ?? 120;
  const travel = route.duration_minutes ?? 30;
  const total = duration + travel;

  if (total <= context.available_minutes) {
    score += 20;
    reasons.push("cabe_na_janela");
  } else {
    score -= 80;
    warnings.push("nao_cabe_na_janela");
  }

  if (travel <= 20) { score += 12; reasons.push("deslocamento_curto"); }
  else if (travel <= 40) { score += 5; }
  else { score -= 10; warnings.push("deslocamento_longo"); }

  const category = candidate.category?.toLowerCase();
  const preferredCategories = (context.preferred_categories || []).map(v => v.toLowerCase());
  const rejectedCategories = (context.rejected_categories || []).map(v => v.toLowerCase());
  if (category && preferredCategories.includes(category)) { score += 15; reasons.push("preferencia_categoria"); }
  if (category && rejectedCategories.includes(category)) { score -= 60; warnings.push("categoria_rejeitada"); }

  const preferredTags = new Set((context.preferred_tags || []).map(v => v.toLowerCase()));
  const tagMatches = (candidate.tags || []).filter(tag => preferredTags.has(tag.toLowerCase())).length;
  if (tagMatches > 0) { score += Math.min(tagMatches * 5, 15); reasons.push("preferencia_tags"); }

  if ((context.passengers?.children || 0) > 0 && candidate.family_fit != null) {
    score += Math.round((candidate.family_fit - 50) / 5);
    if (candidate.family_fit >= 70) reasons.push("bom_para_familia");
  }

  if (context.desired_intensity != null && candidate.intensity != null) {
    const delta = Math.abs(context.desired_intensity - candidate.intensity);
    score += Math.max(10 - Math.round(delta / 5), -10);
    if (delta <= 15) reasons.push("ritmo_compativel");
  }

  const rain = context.weather?.precipitation_probability ?? null;
  if (rain != null && rain >= 60 && candidate.rain_sensitivity != null) {
    const penalty = Math.round((candidate.rain_sensitivity / 100) * 30);
    score -= penalty;
    if (penalty >= 15) warnings.push("sensivel_a_chuva");
  }

  if (candidate.rating != null && candidate.user_rating_count != null) {
    const confidence = Math.min(candidate.user_rating_count / 500, 1);
    score += Math.round(Math.max(candidate.rating - 3.5, 0) * 8 * confidence);
  }

  return {
    score: Math.max(0, Math.min(100, Math.round(score))),
    reasons,
    warnings,
    estimated_activity_minutes: duration,
    estimated_travel_minutes: route.duration_minutes,
    estimated_distance_meters: route.distance_meters,
    viable: !warnings.includes("nao_cabe_na_janela") && !warnings.includes("categoria_rejeitada"),
  };
}

export function rankCandidates(candidates: PlannerCandidate[], context: PlannerContext, routeFacts: Record<string, RouteFact>) {
  return candidates
    .map(candidate => ({ candidate, ...scoreCandidate(candidate, context, routeFacts[candidate.id] || { duration_minutes: null, distance_meters: null }) }))
    .filter(item => item.viable)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}
