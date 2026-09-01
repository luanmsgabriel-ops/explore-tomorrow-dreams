import type { RealtimeFunctionCall } from "@/lib/realtimeVoice";
import type { TripComposerExperience, TripComposerDay } from "@/components/opportunities/live/TripComposerPanel";
import type { TripComposerRecommendation, TripComposerSnapshot } from "@/lib/tripComposerApi";

export const TRIP_COMPOSER_TOOL_NAMES = ["plan_trip_window", "select_trip_experience", "set_trip_preference", "complete_trip_day", "reopen_trip_day"] as const;
export type TripComposerToolName = typeof TRIP_COMPOSER_TOOL_NAMES[number];
export type PlanTripWindowRequest = { destination: string; search: string; date: string; available_minutes: number; day_number: number; total_days?: number; start_date?: string; end_date?: string; preferences?: string[]; rejected_categories?: string[]; };
export type SelectTripExperienceRequest = { candidate_id: string; day_number: number; starts_at?: string; ends_at?: string; };
export type SetTripPreferenceRequest = { key: string; value: string | number | boolean | string[]; };
export type TripDayRequest = { day_number: number };
const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);
const parseObject = (call: RealtimeFunctionCall) => { let parsed: unknown; try { parsed = JSON.parse(call.arguments || "{}"); } catch { throw new Error("invalid_trip_composer_tool_arguments"); } if (!isRecord(parsed)) throw new Error("invalid_trip_composer_tool_arguments"); return parsed; };
const requiredString = (input: Record<string, unknown>, key: string, max = 160) => { const value = input[key]; if (typeof value !== "string" || !value.trim() || value.trim().length > max) throw new Error("invalid_trip_composer_tool_arguments"); return value.trim(); };
const optionalString = (input: Record<string, unknown>, key: string, max = 160) => { const value = input[key]; if (value == null || value === "") return undefined; if (typeof value !== "string" || !value.trim() || value.trim().length > max) throw new Error("invalid_trip_composer_tool_arguments"); return value.trim(); };
const positiveInt = (input: Record<string, unknown>, key: string, max = 60) => { const value = input[key]; if (!Number.isInteger(value) || (value as number) < 1 || (value as number) > max) throw new Error("invalid_trip_composer_tool_arguments"); return value as number; };
export function isTripComposerTool(call: RealtimeFunctionCall): call is RealtimeFunctionCall & { name: TripComposerToolName } { return (TRIP_COMPOSER_TOOL_NAMES as readonly string[]).includes(call.name); }
export function parseTripComposerTool(call: RealtimeFunctionCall) {
  if (!isTripComposerTool(call)) throw new Error("unknown_trip_composer_tool");
  const input = parseObject(call);
  if (call.name === "plan_trip_window") {
    const request: PlanTripWindowRequest = { destination: requiredString(input, "destination", 120), search: requiredString(input, "search", 120), date: requiredString(input, "date", 10), available_minutes: positiveInt(input, "available_minutes", 1440), day_number: positiveInt(input, "day_number", 60) };
    if (input.total_days != null) request.total_days = positiveInt(input, "total_days", 60);
    request.start_date = optionalString(input, "start_date", 10); request.end_date = optionalString(input, "end_date", 10);
    if (input.preferences != null) { if (!Array.isArray(input.preferences) || input.preferences.some(item => typeof item !== "string")) throw new Error("invalid_trip_composer_tool_arguments"); request.preferences = input.preferences.slice(0, 12) as string[]; }
    if (input.rejected_categories != null) { if (!Array.isArray(input.rejected_categories) || input.rejected_categories.some(item => typeof item !== "string")) throw new Error("invalid_trip_composer_tool_arguments"); request.rejected_categories = input.rejected_categories.slice(0, 12) as string[]; }
    return { name: call.name, request } as const;
  }
  if (call.name === "select_trip_experience") return { name: call.name, request: { candidate_id: requiredString(input, "candidate_id", 200), day_number: positiveInt(input, "day_number", 60), starts_at: optionalString(input, "starts_at", 32), ends_at: optionalString(input, "ends_at", 32) } satisfies SelectTripExperienceRequest } as const;
  if (call.name === "set_trip_preference") { const key = requiredString(input, "key", 80); const value = input.value; const valid = typeof value === "string" || typeof value === "number" || typeof value === "boolean" || (Array.isArray(value) && value.every(item => typeof item === "string")); if (!valid) throw new Error("invalid_trip_composer_tool_arguments"); return { name: call.name, request: { key, value } satisfies SetTripPreferenceRequest } as const; }
  return { name: call.name, request: { day_number: positiveInt(input, "day_number", 60) } satisfies TripDayRequest } as const;
}
const record = (value: unknown) => isRecord(value) ? value : {};
export function recommendationsToExperiences(recommendations: TripComposerRecommendation[]): TripComposerExperience[] {
  return recommendations.flatMap(recommendation => {
    const candidate = recommendation.candidate; if (!candidate) return [];
    const snapshot = record(candidate.factual_snapshot), media = Array.isArray(candidate.media) ? candidate.media : [];
    return [{ id: candidate.id, title: candidate.title, summary: candidate.summary ?? (typeof snapshot.summary === "string" ? snapshot.summary : recommendation.reasons?.join(" • ") ?? null), durationMinutes: candidate.duration_minutes ?? null, travelMinutes: typeof recommendation.estimated_travel_minutes === "number" ? recommendation.estimated_travel_minutes : null, distanceMeters: typeof recommendation.estimated_distance_meters === "number" ? recommendation.estimated_distance_meters : null, category: candidate.categories?.[0] ?? null, photos: media.flatMap(entry => { const item = record(entry); const url = typeof item.url === "string" ? item.url : typeof item.photo_url === "string" ? item.photo_url : null; return url ? [{ url, attribution: typeof item.attribution === "string" ? item.attribution : null }] : []; }) }];
  }).slice(0, 3);
}
export function snapshotToDays(snapshot: TripComposerSnapshot): TripComposerDay[] {
  const dayNumberById = new Map<string, number>(); snapshot.days.forEach(raw => { const day = record(raw); if (typeof day.id === "string" && typeof day.day_number === "number") dayNumberById.set(day.id, day.day_number); });
  const itemsByDay = new Map<number, Array<Record<string, unknown>>>(); snapshot.items.forEach(raw => { const item = record(raw); const dayNumber = typeof item.day_number === "number" ? item.day_number : typeof item.trip_day_id === "string" ? dayNumberById.get(item.trip_day_id) ?? null : null; if (!dayNumber || item.status === "REMOVED") return; const list = itemsByDay.get(dayNumber) ?? []; list.push(item); itemsByDay.set(dayNumber, list); });
  return snapshot.days.flatMap(raw => { const day = record(raw); const dayNumber = typeof day.day_number === "number" ? day.day_number : null; if (!dayNumber) return []; const normalizedStatus = typeof day.status === "string" ? day.status.toUpperCase() : "OPEN"; return [{ dayNumber, dateLabel: typeof day.trip_date === "string" ? day.trip_date : null, status: normalizedStatus === "PLANNED" || normalizedStatus === "COMPLETED" ? "planned" as const : "planning" as const, items: (itemsByDay.get(dayNumber) ?? []).map((item, index) => ({ id: typeof item.id === "string" ? item.id : `${dayNumber}-${index}`, startsAt: typeof item.starts_at === "string" ? item.starts_at : null, endsAt: typeof item.ends_at === "string" ? item.ends_at : null, title: typeof item.title === "string" ? item.title : "Experiência selecionada", subtitle: typeof item.description === "string" ? item.description : null, kind: "experience" as const })) }]; }).sort((a, b) => a.dayNumber - b.dayNumber);
}
