import { useCallback, useRef, useState } from "react";

import type { TripComposerDay, TripComposerExperience } from "@/components/opportunities/live/TripComposerPanel";
import {
  createTripComposerSession,
  loadTripComposerSession,
  mutateTripComposerSession,
  planTripComposerWindow,
  tripComposerExcludedIds,
  type TripComposerRecommendation,
  type TripComposerSnapshot,
} from "@/lib/tripComposerApi";
import {
  isTripComposerTool,
  parseTripComposerTool,
  recommendationsToExperiences,
  snapshotToDays,
} from "@/lib/tripComposerRealtime";
import type { RealtimeFunctionCall } from "@/lib/realtimeVoice";

export type TripComposerRuntimeState = {
  active: boolean;
  activeDay: number;
  days: TripComposerDay[];
  candidates: TripComposerExperience[];
  selectedCandidateId: string | null;
  focusedCandidateId: string | null;
};

const initialState: TripComposerRuntimeState = {
  active: false,
  activeDay: 1,
  days: [],
  candidates: [],
  selectedCandidateId: null,
  focusedCandidateId: null,
};

function asSnapshot(value: unknown): TripComposerSnapshot {
  return value as TripComposerSnapshot;
}

export function useTripComposerRuntime() {
  const [state, setState] = useState(initialState);
  const recommendationsRef = useRef(new Map<string, TripComposerRecommendation>());
  const shownCandidateIdsRef = useRef(new Set<string>());

  const applySnapshot = useCallback((snapshot: TripComposerSnapshot, activeDay?: number) => {
    const days = snapshotToDays(snapshot);
    setState((current) => ({
      ...current,
      active: days.length > 0,
      activeDay: activeDay ?? current.activeDay ?? 1,
      days,
    }));
  }, []);

  const ensureSession = useCallback(async (request: {
    destination: string;
    total_days?: number;
    start_date?: string;
    end_date?: string;
    day_number: number;
  }) => {
    const existing = await loadTripComposerSession().catch(() => null);
    if (existing) {
      applySnapshot(existing, request.day_number);
      return existing;
    }
    const created = await createTripComposerSession({
      destination_name: request.destination,
      total_days: request.total_days ?? Math.max(request.day_number, 1),
      start_date: request.start_date,
      end_date: request.end_date,
    });
    applySnapshot(created, request.day_number);
    return created;
  }, [applySnapshot]);

  const selectCandidate = useCallback(async (candidateId: string, dayNumber?: number, startsAt?: string, endsAt?: string) => {
    const recommendation = recommendationsRef.current.get(candidateId);
    const candidate = recommendation?.candidate;
    if (!candidate) throw new Error("candidate_not_in_current_trip_window");
    const targetDay = dayNumber ?? state.activeDay;
    const snapshot = asSnapshot(await mutateTripComposerSession("add_item", {
      day_number: targetDay,
      item: {
        item_type: "EXPERIENCE",
        starts_at: startsAt,
        ends_at: endsAt,
        title: candidate.title,
        description: recommendation?.reasons?.join(" • ") ?? null,
        external_place_id: candidate.id,
        latitude: candidate.latitude,
        longitude: candidate.longitude,
        source_kind: candidate.source_kind || "GOOGLE_PLACE",
        source_reference: candidate.source_reference ?? null,
        factual_snapshot: candidate.factual_snapshot ?? null,
        planning_metadata: { score: recommendation?.score ?? null },
      },
    }));
    applySnapshot(snapshot, targetDay);
    setState((current) => ({ ...current, selectedCandidateId: candidateId, focusedCandidateId: candidateId }));
    return snapshot;
  }, [applySnapshot, state.activeDay]);

  const executeTool = useCallback(async (call: RealtimeFunctionCall) => {
    if (!isTripComposerTool(call)) return null;
    const parsed = parseTripComposerTool(call);

    if (parsed.name === "plan_trip_window") {
      const snapshot = await ensureSession(parsed.request);
      const excludedIds = tripComposerExcludedIds(snapshot, shownCandidateIdsRef.current);
      const result = await planTripComposerWindow({
        destination: parsed.request.destination,
        search: parsed.request.search,
        date: parsed.request.date,
        available_minutes: parsed.request.available_minutes,
        preferences: parsed.request.preferences,
        rejected_categories: parsed.request.rejected_categories,
        excluded_ids: excludedIds,
      });
      recommendationsRef.current.clear();
      result.recommendations.forEach((recommendation) => {
        const id = recommendation.candidate?.id ?? recommendation.id;
        recommendationsRef.current.set(id, recommendation);
        if (id) shownCandidateIdsRef.current.add(id);
      });
      if (shownCandidateIdsRef.current.size > 120) {
        shownCandidateIdsRef.current = new Set([...shownCandidateIdsRef.current].slice(-120));
      }
      const candidates = recommendationsToExperiences(result.recommendations);
      setState((current) => ({
        ...current,
        active: true,
        activeDay: parsed.request.day_number,
        candidates,
        selectedCandidateId: null,
        focusedCandidateId: candidates[0]?.id ?? null,
      }));
      return {
        ok: true,
        mode: result.mode,
        day_number: parsed.request.day_number,
        candidates: candidates.map((candidate) => ({
          id: candidate.id,
          title: candidate.title,
          summary: candidate.summary,
          duration_minutes: candidate.durationMinutes,
          category: candidate.category,
        })),
      };
    }

    if (parsed.name === "select_trip_experience") {
      await selectCandidate(parsed.request.candidate_id, parsed.request.day_number, parsed.request.starts_at, parsed.request.ends_at);
      return { ok: true, candidate_id: parsed.request.candidate_id, day_number: parsed.request.day_number };
    }

    if (parsed.name === "set_trip_preference") {
      const snapshot = asSnapshot(await mutateTripComposerSession("record_preference", {
        preference: { key: parsed.request.key, value: parsed.request.value, source: "EXPLICIT", weight: 1 },
      }));
      applySnapshot(snapshot);
      return { ok: true, preference_key: parsed.request.key };
    }

    const action = parsed.name === "complete_trip_day" ? "complete_day" : "reopen_day";
    const snapshot = asSnapshot(await mutateTripComposerSession(action, { day_number: parsed.request.day_number }));
    applySnapshot(snapshot, parsed.request.day_number);
    return { ok: true, day_number: parsed.request.day_number, status: parsed.name === "complete_trip_day" ? "planned" : "planning" };
  }, [applySnapshot, ensureSession, selectCandidate]);

  const setActiveDay = useCallback((activeDay: number) => {
    setState((current) => ({ ...current, activeDay }));
  }, []);

  const setFocusedCandidate = useCallback((focusedCandidateId: string) => {
    setState((current) => ({ ...current, focusedCandidateId }));
  }, []);

  const reset = useCallback(() => {
    recommendationsRef.current.clear();
    shownCandidateIdsRef.current.clear();
    setState(initialState);
  }, []);

  return {
    ...state,
    executeTool,
    selectCandidate,
    setActiveDay,
    setFocusedCandidate,
    reset,
  };
}