export type ViatorDestination = {
  id?: number | string | null;
  name?: string | null;
  parentDestinationId?: number | string | null;
  parentDestinationName?: string | null;
};

export type ViatorLocation = {
  provider?: string | null;
  reference?: string | null;
  providerReference?: string | null;
  name?: string | null;
  address?: Record<string, unknown> | null;
  center?: { latitude?: number; longitude?: number } | null;
};

export type ViatorProduct = Record<string, any>;

const normalizeText = (value: unknown) => String(value ?? "")
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, " ")
  .trim();

const finite = (value: unknown) => Number.isFinite(Number(value)) ? Number(value) : null;

export function chooseDestination(results: ViatorDestination[], requested: string) {
  const needle = normalizeText(requested.split(",")[0]);
  if (!needle) return null;
  let best: { item: ViatorDestination; score: number } | null = null;
  for (const item of results) {
    const name = normalizeText(item.name);
    const parent = normalizeText(item.parentDestinationName);
    if (!name || item.id == null) continue;
    let score = 0;
    if (name === needle) score += 100;
    else if (name.startsWith(needle) || needle.startsWith(name)) score += 70;
    else if (name.includes(needle) || needle.includes(name)) score += 50;
    const requestedFull = normalizeText(requested);
    if (parent && requestedFull.includes(parent)) score += 10;
    if (!best || score > best.score) best = { item, score };
  }
  return best?.item ?? null;
}

function pushRef(result: string[], value: unknown) {
  if (typeof value !== "string" || !value.trim() || result.includes(value)) return;
  result.push(value);
}

export function extractLocationRefs(product: ViatorProduct, max = 12) {
  const refs: string[] = [];
  const add = (value: unknown) => {
    if (refs.length < max) pushRef(refs, value);
  };

  for (const point of Array.isArray(product?.logistics?.start) ? product.logistics.start : []) add(point?.location?.ref);
  for (const point of Array.isArray(product?.logistics?.end) ? product.logistics.end : []) add(point?.location?.ref);

  const itinerary = product?.itinerary ?? {};
  add(itinerary?.activityInfo?.location?.ref);
  for (const point of Array.isArray(itinerary?.pointsOfInterest) ? itinerary.pointsOfInterest : []) add(point?.ref ?? point?.location?.ref);
  for (const point of Array.isArray(itinerary?.pointOfInterestLocations) ? itinerary.pointOfInterestLocations : []) add(point?.location?.ref ?? point?.ref);
  for (const item of Array.isArray(itinerary?.itineraryItems) ? itinerary.itineraryItems : []) add(item?.pointOfInterestLocation?.location?.ref);
  for (const day of Array.isArray(itinerary?.days) ? itinerary.days : []) {
    for (const item of Array.isArray(day?.items) ? day.items : []) add(item?.pointOfInterestLocation?.location?.ref);
  }
  for (const route of Array.isArray(itinerary?.routes) ? itinerary.routes : []) {
    for (const stop of Array.isArray(route?.stops) ? route.stops : []) add(stop?.stopLocation?.ref);
    for (const point of Array.isArray(route?.pointsOfInterest) ? route.pointsOfInterest : []) add(point?.location?.ref ?? point?.ref);
  }
  return refs.slice(0, max);
}

export function productDurationMinutes(summary: ViatorProduct, detail?: ViatorProduct | null) {
  const duration = detail?.itinerary?.duration ?? detail?.duration ?? summary?.duration ?? {};
  return finite(duration?.fixedDurationInMinutes);
}

export function productRating(summary: ViatorProduct, detail?: ViatorProduct | null) {
  const reviews = detail?.reviews ?? summary?.reviews ?? {};
  return {
    rating: finite(reviews?.combinedAverageRating),
    count: finite(reviews?.totalReviews),
  };
}

export function bestProductImages(product: ViatorProduct, max = 6) {
  const result: Array<{ url: string; attribution: string }> = [];
  for (const image of Array.isArray(product?.images) ? product.images : []) {
    const variants = (Array.isArray(image?.variants) ? image.variants : [])
      .filter((variant: any) => typeof variant?.url === "string" && variant.url)
      .sort((a: any, b: any) => (Number(b?.width) || 0) * (Number(b?.height) || 0) - (Number(a?.width) || 0) * (Number(a?.height) || 0));
    const selected = variants.find((variant: any) => (Number(variant?.width) || 0) <= 1600) ?? variants[0];
    if (!selected?.url || result.some(item => item.url === selected.url)) continue;
    result.push({ url: selected.url, attribution: "Viator" });
    if (result.length >= max) break;
  }
  return result;
}

function addressLabel(location?: ViatorLocation | null) {
  if (!location?.address || typeof location.address !== "object") return location?.name ?? null;
  const address = location.address as Record<string, unknown>;
  return [
    address.street,
    address.administrativeArea,
    address.state,
    address.country,
  ].filter(value => typeof value === "string" && value.trim()).join(", ") || location.name || null;
}

export function normalizeViatorProduct(
  summary: ViatorProduct,
  detail: ViatorProduct | null,
  locations: Map<string, ViatorLocation>,
) {
  const product = detail ?? summary;
  const productCode = String(product?.productCode ?? summary?.productCode ?? "").trim();
  if (!productCode) return null;
  const refs = extractLocationRefs(product);
  const location = refs.map(ref => locations.get(ref)).find(item =>
    item && finite(item.center?.latitude) != null && finite(item.center?.longitude) != null
  ) ?? null;
  if (!location) return null;

  const latitude = finite(location.center?.latitude);
  const longitude = finite(location.center?.longitude);
  if (latitude == null || longitude == null) return null;

  const { rating, count } = productRating(summary, detail);
  const duration = productDurationMinutes(summary, detail);
  const itineraryType = String(product?.itinerary?.itineraryType ?? summary?.itineraryType ?? "").trim() || null;
  const confirmationType = String(product?.bookingConfirmationSettings?.confirmationType ?? summary?.confirmationType ?? "").trim() || null;
  const pricing = summary?.pricing && typeof summary.pricing === "object" ? summary.pricing : null;
  const tags = Array.isArray(summary?.tags) ? summary.tags.filter((tag: unknown) => Number.isFinite(Number(tag))).map(Number).slice(0, 20) : [];

  return {
    place_id: `viator:${productCode}`,
    name: String(product?.title ?? summary?.title ?? "Experiência").trim(),
    address: addressLabel(location),
    location: { latitude, longitude },
    types: ["tour", "experience", itineraryType ? itineraryType.toLowerCase() : null].filter(Boolean),
    rating,
    user_rating_count: count,
    photos: bestProductImages(product),
    source_kind: "VIATOR_PRODUCT",
    source_reference: productCode,
    summary: typeof product?.description === "string" ? product.description.slice(0, 1200) : null,
    duration_minutes: duration,
    factual_snapshot: {
      provider: "VIATOR",
      product_code: productCode,
      itinerary_type: itineraryType,
      confirmation_type: confirmationType,
      rating,
      total_reviews: count,
      tags,
      pricing: pricing ? {
        from_price: finite(pricing?.summary?.fromPrice),
        currency: typeof pricing?.currency === "string" ? pricing.currency : null,
      } : null,
      meeting_location: addressLabel(location),
    },
  };
}

export function semanticViatorTerms(search: string, preferences: unknown[] = []) {
  const context = normalizeText([search, ...preferences.filter(value => typeof value === "string")].join(" "));
  const terms = [String(search || "").trim()];
  if (/aventur|trilha|trek|rafting|montanha|esqui|ski|canyon|mergulho|snorkel/.test(context)) terms.push("adventure");
  else if (/gastronom|comida|culin|food|vinho|wine/.test(context)) terms.push("food tour");
  else if (/museu|historia|cultur|arte/.test(context)) terms.push("cultural tour");
  else if (/barco|boat|catamara|catamaran|cruzeiro|cruise/.test(context)) terms.push("boat tour");
  else if (/passeio|tour|experiencia|experience|o que fazer|roteiro/.test(context)) terms.push("tour");
  return [...new Set(terms.map(term => term.trim()).filter(Boolean))].slice(0, 2);
}

export function shouldPreferViator(search: string, preferences: unknown[] = []) {
  const context = normalizeText([search, ...preferences.filter(value => typeof value === "string")].join(" "));
  const localVenueOnly = /restaurante|jantar|almoco|cafe|bar\b/.test(context) && !/tour|passeio|experiencia/.test(context);
  const beachVenue = /praia|beach|orla|beira mar/.test(context) && /beber|drink|bar|restaurante|quiosque/.test(context);
  return !localVenueOnly && !beachVenue;
}
