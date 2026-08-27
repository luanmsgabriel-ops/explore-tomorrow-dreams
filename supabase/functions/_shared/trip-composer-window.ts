export type WindowPlace = {
  place_id?: string | null;
  name?: string | null;
  address?: string | null;
  location?: { latitude?: number; longitude?: number } | null;
  types?: unknown;
  rating?: number | null;
  user_rating_count?: number | null;
  price_level?: string | null;
  opening_hours?: unknown;
  google_maps_uri?: string | null;
  website_uri?: string | null;
  photos?: unknown[];
};

export type WindowBody = {
  available_minutes?: number;
  default_duration_minutes?: number;
  duration_overrides?: Record<string, number>;
  preferences?: unknown[];
  rejected_categories?: unknown[];
  passenger_context?: Record<string, unknown>;
  origin_lat?: number;
  origin_lng?: number;
};

export const normalizeTypes = (types: unknown) => Array.isArray(types)
  ? types.filter((value): value is string => typeof value === "string").slice(0, 12)
  : [];

export const deriveCategories = (types: string[]) => types.map(type => type.toLowerCase().replace(/_/g, " "));
export const isOutdoor = (types: string[]) => types.some(type => ["park", "tourist_attraction", "beach", "hiking_area", "national_park"].includes(type));
export const finiteNumber = (value: unknown) => Number.isFinite(Number(value)) ? Number(value) : null;

export function buildCandidates(places: WindowPlace[], body: WindowBody) {
  const visualCandidates: any[] = [];
  const plannerCandidates = places.map((place, index) => {
    const types = normalizeTypes(place.types);
    const categories = deriveCategories(types);
    const outdoor = isOutdoor(types);
    const id = String(place.place_id || `candidate-${index}`);
    const name = String(place.name || "Experiência");
    const latitude = Number(place.location?.latitude);
    const longitude = Number(place.location?.longitude);
    const durationMinutes = Number(body.duration_overrides?.[String(place.place_id)]) || Number(body.default_duration_minutes) || 120;

    visualCandidates.push({
      id,
      title: name,
      categories,
      latitude,
      longitude,
      duration_minutes: durationMinutes,
      source_reference: place.place_id || null,
      factual_snapshot: {
        address: place.address || null,
        types,
        rating: place.rating ?? null,
        user_rating_count: place.user_rating_count ?? null,
        price_level: place.price_level ?? null,
        opening_hours: place.opening_hours ?? null,
        google_maps_uri: place.google_maps_uri ?? null,
        website_uri: place.website_uri ?? null,
      },
      media: Array.isArray(place.photos) ? place.photos.slice(0, 6) : [],
    });

    return {
      id,
      name,
      latitude,
      longitude,
      category: categories[0] || null,
      tags: categories,
      duration_minutes: durationMinutes,
      rating: finiteNumber(place.rating),
      user_rating_count: finiteNumber(place.user_rating_count),
      rain_sensitivity: outdoor ? 90 : 20,
    };
  }).filter(candidate => Number.isFinite(candidate.latitude) && Number.isFinite(candidate.longitude));

  const validIds = new Set(plannerCandidates.map(candidate => candidate.id));
  return {
    plannerCandidates,
    visualCandidates: visualCandidates.filter(candidate => validIds.has(candidate.id)),
  };
}

export function buildPlannerRequest(body: WindowBody, plannerCandidates: any[], weather: any) {
  const availableMinutes = Math.min(Math.max(Number(body.available_minutes) || 180, 30), 720);
  const preferences = Array.isArray(body.preferences) ? body.preferences.filter((value): value is string => typeof value === "string") : [];
  const rejectedCategories = Array.isArray(body.rejected_categories)
    ? body.rejected_categories.filter((value): value is string => typeof value === "string")
    : [];
  const passengerContext = body.passenger_context && typeof body.passenger_context === "object" ? body.passenger_context : {};

  return {
    context: {
      available_minutes: availableMinutes,
      preferred_categories: preferences,
      preferred_tags: preferences,
      rejected_categories: rejectedCategories,
      passengers: {
        adults: finiteNumber(passengerContext.adults) ?? undefined,
        children: finiteNumber(passengerContext.children) ?? undefined,
      },
      weather: weather?.mode === "forecast"
        ? { precipitation_probability: finiteNumber(weather.precipitation_probability) }
        : undefined,
    },
    origin: Number.isFinite(Number(body.origin_lat)) && Number.isFinite(Number(body.origin_lng))
      ? { latitude: Number(body.origin_lat), longitude: Number(body.origin_lng) }
      : null,
    candidates: plannerCandidates,
  };
}

export function normalizePlannerRecommendations(planner: any, visualCandidates: any[]) {
  const ranked = Array.isArray(planner?.candidates) ? planner.candidates : [];
  return ranked.slice(0, 3).map((item: any) => {
    const candidate = visualCandidates.find(visual => visual.id === item.id) || null;
    return {
      id: String(item.id || candidate?.id || ""),
      score: Number(item.planner?.score) || 0,
      reasons: Array.isArray(item.planner?.reasons) ? item.planner.reasons : [],
      warnings: Array.isArray(item.planner?.warnings) ? item.planner.warnings : [],
      estimated_activity_minutes: item.planner?.estimated_activity_minutes ?? null,
      estimated_travel_minutes: item.planner?.estimated_travel_minutes ?? null,
      estimated_distance_meters: item.planner?.estimated_distance_meters ?? null,
      candidate,
    };
  });
}
