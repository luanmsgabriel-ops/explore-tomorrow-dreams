import { isPublicOfferId } from "./travelOffersPublic";

export function parseComparisonIds(value: string | null) {
  if (!value) return { ids: [] as string[], error: null as "invalid" | "too_many" | null };
  const requested = value.split(",").map((id) => id.trim()).filter(Boolean);
  if (requested.some((id) => !isPublicOfferId(id))) return { ids: [] as string[], error: "invalid" as const };
  const ids = [...new Set(requested)];
  if (ids.length > 3) return { ids: [] as string[], error: "too_many" as const };
  return { ids, error: null };
}

export function comparisonHref(ids: string[]) {
  return ids.length ? `/oportunidades/comparar?ids=${encodeURIComponent(ids.join(","))}` : "/oportunidades/comparar";
}
