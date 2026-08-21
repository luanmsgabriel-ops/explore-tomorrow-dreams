import { isPublicOfferId } from "./travelOffersPublic";

export const OPPORTUNITY_COMPARISON_STORAGE_KEY = "tomorrow-opportunity-comparison-v1";
export const MAX_COMPARISON_ITEMS = 3;

export function normalizeComparisonIds(ids: string[]) {
  return [...new Set(ids.filter((id) => isPublicOfferId(id)))].slice(0, MAX_COMPARISON_ITEMS);
}

export function mergeComparisonIds(...groups: string[][]) {
  return normalizeComparisonIds(groups.flat());
}

export function parseComparisonIds(value: string | null) {
  if (!value) return { ids: [] as string[], error: null as "invalid" | "too_many" | null };
  const requested = value.split(",").map((id) => id.trim()).filter(Boolean);
  if (requested.some((id) => !isPublicOfferId(id))) return { ids: [] as string[], error: "invalid" as const };
  const ids = [...new Set(requested)];
  if (ids.length > MAX_COMPARISON_ITEMS) return { ids: [] as string[], error: "too_many" as const };
  return { ids, error: null };
}

export function readStoredComparisonIds() {
  if (typeof window === "undefined") return [] as string[];

  try {
    const parsed = JSON.parse(window.localStorage.getItem(OPPORTUNITY_COMPARISON_STORAGE_KEY) ?? "[]");
    if (!Array.isArray(parsed)) return [] as string[];
    return normalizeComparisonIds(parsed.filter((value): value is string => typeof value === "string"));
  } catch {
    return [] as string[];
  }
}

export function writeStoredComparisonIds(ids: string[]) {
  const normalized = normalizeComparisonIds(ids);
  if (typeof window === "undefined") return normalized;

  try {
    window.localStorage.setItem(OPPORTUNITY_COMPARISON_STORAGE_KEY, JSON.stringify(normalized));
  } catch {
    // A comparação continua funcionando pela URL quando o armazenamento local estiver indisponível.
  }
  return normalized;
}

export function addComparisonId(ids: string[], id: string) {
  const normalized = normalizeComparisonIds(ids);
  if (!isPublicOfferId(id) || normalized.includes(id) || normalized.length >= MAX_COMPARISON_ITEMS) return normalized;
  return [...normalized, id];
}

export function comparisonHref(ids: string[]) {
  const normalized = normalizeComparisonIds(ids);
  return normalized.length
    ? `/oportunidades/comparar?ids=${encodeURIComponent(normalized.join(","))}`
    : "/oportunidades/comparar";
}
