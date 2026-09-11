export const MATCH_ALGORITHM_VERSION = "radar-v1.0.0";

export type MatchClass = "exact" | "flexible" | "discovery";

export type RadarForMatching = {
  id: string;
  user_id: string;
  status: "active" | "paused" | "archived";
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
  offer_type: "bloqueio_aereo" | "pacote" | null;
  offer_subtype: "bloqueio" | "nacional" | "internacional" | "evento" | "grupo_guiado" | null;
  category: string | null;
};

export type PublicOfferForMatching = {
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
};

export type Affinity = { preference_key: string; score: number };
export type MatchFactor = { key: string; label: string; matched: boolean; weight: number; detail?: string };
export type MatchResult = {
  matchClass: MatchClass;
  score: number;
  matchedFactors: MatchFactor[];
  unmatchedFactors: MatchFactor[];
};

const DAY = 86_400_000;
const norm = (value: string | null | undefined) => (value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const dateMs = (value: string | null | undefined) => value ? new Date(`${value}T00:00:00Z`).getTime() : null;
const shiftDate = (value: string | null, days: number) => {
  const ms = dateMs(value);
  return ms === null ? null : ms + days * DAY;
};
const textEqual = (a: string | null, b: string | null) => !a || norm(a) === norm(b);
const currencyEqual = (radar: RadarForMatching, offer: PublicOfferForMatching) => !offer.currency || offer.currency === radar.budget_currency;

function hardChecks(radar: RadarForMatching, offer: PublicOfferForMatching, flexibleDates: boolean) {
  const checks: Array<{ key: string; ok: boolean }> = [];
  checks.push({ key: "offer_type", ok: !radar.offer_type || offer.offer_type === radar.offer_type });
  checks.push({ key: "offer_subtype", ok: !radar.offer_subtype || offer.offer_subtype === radar.offer_subtype });
  checks.push({ key: "origin", ok: textEqual(radar.origin, offer.origin) });
  checks.push({ key: "destination", ok: textEqual(radar.destination, offer.destination) });
  checks.push({ key: "currency", ok: currencyEqual(radar, offer) });
  checks.push({ key: "budget_min", ok: radar.budget_min === null || offer.price_per_person >= radar.budget_min });
  checks.push({ key: "budget_max", ok: radar.budget_max === null || offer.price_per_person <= radar.budget_max });
  checks.push({ key: "passengers", ok: radar.passengers === null || offer.available_seats === null || offer.available_seats >= radar.passengers });

  const dep = dateMs(offer.departure_date);
  const ret = dateMs(offer.return_date);
  const flex = flexibleDates ? Math.max(0, radar.flexibility_days) : 0;
  const startMin = shiftDate(radar.start_date, -flex);
  const endMax = shiftDate(radar.end_date, flex);
  checks.push({ key: "start_date", ok: radar.start_date === null || (dep !== null && startMin !== null && dep >= startMin) });
  checks.push({ key: "end_date", ok: radar.end_date === null || ((ret ?? dep) !== null && endMax !== null && (ret ?? dep)! <= endMax) });
  return checks;
}

function factor(key: string, label: string, matched: boolean, weight: number, detail?: string): MatchFactor {
  return { key, label, matched, weight, ...(detail ? { detail } : {}) };
}

function scoreFactors(radar: RadarForMatching, offer: PublicOfferForMatching, affinities: Affinity[]) {
  const factors: MatchFactor[] = [];
  factors.push(factor("origin", "Origem compatível", !radar.origin || textEqual(radar.origin, offer.origin), 15));
  factors.push(factor("destination", "Destino exato", !radar.destination || textEqual(radar.destination, offer.destination), 20));

  const exactDates = hardChecks(radar, offer, false).filter((item) => item.key === "start_date" || item.key === "end_date").every((item) => item.ok);
  const flexibleDates = hardChecks(radar, offer, true).filter((item) => item.key === "start_date" || item.key === "end_date").every((item) => item.ok);
  factors.push(factor("dates", exactDates ? "Dentro do período" : "Dentro da flexibilidade de datas", exactDates || flexibleDates, 20));

  const budgetOk = currencyEqual(radar, offer)
    && (radar.budget_min === null || offer.price_per_person >= radar.budget_min)
    && (radar.budget_max === null || offer.price_per_person <= radar.budget_max);
  factors.push(factor("budget", "Dentro do orçamento", budgetOk, 15));

  const seatsOk = radar.passengers === null || offer.available_seats === null || offer.available_seats >= radar.passengers;
  factors.push(factor("seats", "Vagas compatíveis", seatsOk, 10, offer.available_seats === null ? "Disponibilidade não informada" : undefined));

  const nightsOk = (radar.min_nights === null || (offer.nights !== null && offer.nights >= radar.min_nights))
    && (radar.max_nights === null || (offer.nights !== null && offer.nights <= radar.max_nights));
  factors.push(factor("nights", "Duração compatível", nightsOk, 8));
  factors.push(factor("subtype", "Tipo de viagem compatível", !radar.offer_subtype || offer.offer_subtype === radar.offer_subtype, 5));
  factors.push(factor("category", "Categoria desejada", !radar.category || norm(radar.category) === norm(offer.category), 4));

  const offerCategory = norm(offer.category);
  const affinity = affinities.find((item) => norm(item.preference_key) === offerCategory && item.score > 0);
  factors.push(factor("profile_affinity", "Alinhada ao seu perfil", Boolean(affinity), 3, affinity ? `afinidade ${affinity.score.toFixed(2)}` : undefined));
  return factors;
}

export function evaluateRadarMatch(radar: RadarForMatching, offer: PublicOfferForMatching, affinities: Affinity[] = []): MatchResult | null {
  if (radar.status !== "active") return null;
  const exactHard = hardChecks(radar, offer, false);
  const flexibleHard = hardChecks(radar, offer, true);
  const exact = exactHard.every((item) => item.ok);
  const flexible = !exact && radar.flexibility_days > 0 && flexibleHard.every((item) => item.ok);

  let matchClass: MatchClass | null = exact ? "exact" : flexible ? "flexible" : null;
  if (!matchClass) {
    // Discovery may relax destination/category only. Origin, offer type, dates (including
    // explicit flexibility), budget/currency and passenger constraints remain mandatory.
    const discoveryRequired = flexibleHard
      .filter((item) => item.key !== "destination")
      .every((item) => item.ok);
    const categoryAffinity = affinities.some((item) => item.score > 0 && norm(item.preference_key) === norm(offer.category));
    if (discoveryRequired && categoryAffinity && radar.destination && !textEqual(radar.destination, offer.destination)) {
      matchClass = "discovery";
    }
  }
  if (!matchClass) return null;

  const factors = scoreFactors(radar, offer, affinities);
  const totalWeight = factors.reduce((sum, item) => sum + item.weight, 0);
  const earned = factors.filter((item) => item.matched).reduce((sum, item) => sum + item.weight, 0);
  const score = Number(((earned / totalWeight) * 100).toFixed(3));
  return {
    matchClass,
    score,
    matchedFactors: factors.filter((item) => item.matched),
    unmatchedFactors: factors.filter((item) => !item.matched),
  };
}

export function sanitizeOfferSnapshot(offer: PublicOfferForMatching) {
  return {
    id: offer.id,
    offer_type: offer.offer_type,
    offer_subtype: offer.offer_subtype,
    name: offer.name,
    category: offer.category,
    origin: offer.origin,
    origin_iata: offer.origin_iata,
    destination: offer.destination,
    destination_iata: offer.destination_iata,
    departure_date: offer.departure_date,
    return_date: offer.return_date,
    nights: offer.nights,
    price_per_person: offer.price_per_person,
    tax_per_person: offer.tax_per_person,
    currency: offer.currency,
    available_seats: offer.available_seats,
    airfare_included: offer.airfare_included,
    image_url: offer.image_url,
    updated_at: offer.updated_at,
  };
}
