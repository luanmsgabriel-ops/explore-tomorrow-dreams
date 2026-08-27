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

export type ExperienceIntent = {
  adventure: boolean;
  beach: boolean;
  drink: boolean;
  gastronomy: boolean;
  culture: boolean;
};

const PROVIDER_TYPES = new Set([
  "travel_agency",
  "tourist_information_center",
  "car_rental",
  "taxi_service",
  "transportation_service",
]);
const BEACH_EXCLUDED_TYPES = new Set([
  "shopping_mall",
  "store",
  "department_store",
  "clothing_store",
  "supermarket",
]);
const BEACHFRONT_VENUE_TYPES = new Set(["bar", "restaurant", "cafe", "coffee_shop", "food"]);

export const normalizeTypes = (types: unknown) => Array.isArray(types)
  ? types.filter((value): value is string => typeof value === "string").slice(0, 16)
  : [];

export const deriveCategories = (types: string[]) => types.map(type => type.toLowerCase().replace(/_/g, " "));
export const isOutdoor = (types: string[]) => types.some(type => ["park", "tourist_attraction", "beach", "hiking_area", "national_park", "ski_resort"].includes(type));
export const finiteNumber = (value: unknown) => Number.isFinite(Number(value)) ? Number(value) : null;

export function detectExperienceIntent(search: string, preferences: unknown[] = []): ExperienceIntent {
  const context = [search, ...preferences.filter((value): value is string => typeof value === "string")]
    .join(" ")
    .toLowerCase();
  return {
    adventure: /aventur|adventure|trilha|trek|rafting|montanha|mountain|esqui|ski|canyon|natureza/.test(context),
    beach: /praia|beach|orla|mar\b|beira[- ]?mar|litoral/.test(context),
    drink: /beber|bebida|drink|drinque|bar\b|cerveja|caipirinha|coquetel|cocktail/.test(context),
    gastronomy: /gastronom|comida|restaurante|culin|almoç|jantar/.test(context),
    culture: /museu|hist[oó]ria|cultur|arte/.test(context),
  };
}

export function isExperiencePlace(place: WindowPlace) {
  const types = normalizeTypes(place.types);
  return !types.some(type => PROVIDER_TYPES.has(type));
}

function hasAnyType(place: WindowPlace, set: Set<string>) {
  return normalizeTypes(place.types).some(type => set.has(type));
}

export function isBeachAnchor(place: WindowPlace) {
  const types = normalizeTypes(place.types);
  if (types.includes("beach")) return true;
  if (types.some(type => BEACH_EXCLUDED_TYPES.has(type)) || types.some(type => BEACHFRONT_VENUE_TYPES.has(type))) return false;
  const name = String(place.name || "").toLowerCase();
  return /\bpraia\b|\bbeach\b/.test(name) && types.some(type => ["tourist_attraction", "point_of_interest", "natural_feature", "establishment"].includes(type));
}

function radians(value: number) {
  return value * Math.PI / 180;
}

export function distanceMetersBetween(a: WindowPlace, b: WindowPlace) {
  const lat1 = finiteNumber(a.location?.latitude);
  const lon1 = finiteNumber(a.location?.longitude);
  const lat2 = finiteNumber(b.location?.latitude);
  const lon2 = finiteNumber(b.location?.longitude);
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return Number.POSITIVE_INFINITY;
  const earth = 6_371_000;
  const dLat = radians(lat2 - lat1);
  const dLon = radians(lon2 - lon1);
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(radians(lat1)) * Math.cos(radians(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * earth * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

export function buildDiscoveryQueries(search: string, destination: string, preferences: unknown[] = []) {
  const intent = detectExperienceIntent(search, preferences);
  if (intent.beach) {
    const queries = [
      `praias em ${destination}`,
      intent.drink
        ? `bares restaurantes quiosques à beira-mar em ${destination}`
        : `praias e orla em ${destination}`,
      intent.drink
        ? `beach bars restaurantes na praia em ${destination}`
        : `${search} pontos turísticos em ${destination}`,
    ];
    return [...new Set(queries.map(query => query.trim()).filter(Boolean))].slice(0, 3);
  }

  const queries = [`${search} atrações e experiências em ${destination}`];
  if (intent.adventure) {
    queries.push(
      `trilhas parques naturais montanhas aventura em ${destination}`,
      `rafting esportes de aventura natureza em ${destination}`,
    );
  } else if (intent.gastronomy) {
    queries.push(`experiências gastronômicas e restaurantes locais em ${destination}`);
  } else if (intent.culture) {
    queries.push(`museus atrações culturais e históricas em ${destination}`);
  } else {
    queries.push(`${search} pontos turísticos em ${destination}`);
  }
  return [...new Set(queries.map(query => query.trim()).filter(Boolean))].slice(0, 3);
}

export function mergeExperiencePlaces(groups: WindowPlace[][], max = 16, intent: ExperienceIntent = {
  adventure: false,
  beach: false,
  drink: false,
  gastronomy: false,
  culture: false,
}) {
  const flattened = groups.flat().filter(isExperiencePlace);
  const beachAnchors = intent.beach ? flattened.filter(isBeachAnchor) : [];
  const seen = new Set<string>();
  const result: WindowPlace[] = [];

  const accept = (place: WindowPlace) => {
    if (!intent.beach) return true;
    if (hasAnyType(place, BEACH_EXCLUDED_TYPES)) return false;
    if (isBeachAnchor(place)) return true;
    if (!intent.drink || !hasAnyType(place, BEACHFRONT_VENUE_TYPES) || !beachAnchors.length) return false;
    return beachAnchors.some(anchor => distanceMetersBetween(anchor, place) <= 1_500);
  };

  for (const place of flattened) {
    const id = String(place.place_id || "").trim();
    if (!id || seen.has(id) || !accept(place)) continue;
    seen.add(id);
    result.push(place);
    if (result.length >= max) return result;
  }
  return result;
}

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
    const explicitDuration = Number(body.duration_overrides?.[String(place.place_id)]) || Number(body.default_duration_minutes) || null;
    const plannerDuration = explicitDuration ?? 120;

    visualCandidates.push({
      id,
      title: name,
      categories,
      latitude,
      longitude,
      duration_minutes: explicitDuration,
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
      duration_minutes: plannerDuration,
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
