import { FunctionsHttpError } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";
import { isPublicOfferId } from "@/lib/travelOffersPublic";

export const OPPORTUNITY_SELECTION_STORAGE_KEY = "tomorrow-opportunity-selection-v1";
export const MAX_OPPORTUNITY_SELECTION = 12;

export type SharedOpportunitySelection = {
  token: string;
  title: string;
  description: string | null;
  offer_ids: string[];
  created_at: string;
  expires_at: string;
};

type FunctionErrorBody = {
  error?: { code?: string; message?: string };
  request_id?: string;
};

export class OpportunitySelectionError extends Error {
  code: string;
  requestId: string | null;

  constructor(message: string, code = "selection_unavailable", requestId: string | null = null) {
    super(message);
    this.name = "OpportunitySelectionError";
    this.code = code;
    this.requestId = requestId;
  }
}

function normalizeIds(ids: unknown) {
  if (!Array.isArray(ids)) return [];
  return [...new Set(ids.filter((id): id is string => typeof id === "string" && isPublicOfferId(id)))].slice(0, MAX_OPPORTUNITY_SELECTION);
}

export function readStoredSelectionIds() {
  if (typeof window === "undefined") return [];
  try {
    return normalizeIds(JSON.parse(window.localStorage.getItem(OPPORTUNITY_SELECTION_STORAGE_KEY) ?? "[]"));
  } catch {
    return [];
  }
}

export function writeStoredSelectionIds(ids: string[]) {
  const normalized = normalizeIds(ids);
  if (typeof window !== "undefined") {
    if (normalized.length) window.localStorage.setItem(OPPORTUNITY_SELECTION_STORAGE_KEY, JSON.stringify(normalized));
    else window.localStorage.removeItem(OPPORTUNITY_SELECTION_STORAGE_KEY);
  }
  return normalized;
}

export function addSelectionId(current: string[], id: string) {
  if (!isPublicOfferId(id)) return normalizeIds(current);
  if (current.includes(id)) return normalizeIds(current);
  return normalizeIds([...current, id]);
}

async function selectionError(error: unknown) {
  if (error instanceof FunctionsHttpError) {
    try {
      const body = await error.context.json() as FunctionErrorBody;
      return new OpportunitySelectionError(
        body.error?.message ?? "Não foi possível concluir a seleção.",
        body.error?.code ?? "selection_unavailable",
        body.request_id ?? null,
      );
    } catch {
      return new OpportunitySelectionError("Não foi possível concluir a seleção.");
    }
  }
  return new OpportunitySelectionError("Não foi possível concluir a seleção agora.");
}

async function invokeSelection(body: object, signal?: AbortSignal) {
  const { data, error } = await supabase.functions.invoke<SharedOpportunitySelection>("travel-offer-selection", {
    body,
    signal,
    timeout: 15_000,
  });
  if (error) throw await selectionError(error);
  if (!data || typeof data !== "object" || typeof data.token !== "string" || !Array.isArray(data.offer_ids)) {
    throw new OpportunitySelectionError("A seleção retornou uma resposta inválida.", "invalid_response");
  }
  return data;
}

export function createSharedOpportunitySelection(
  offerIds: string[],
  options: { title?: string; description?: string | null } = {},
  signal?: AbortSignal,
) {
  const normalized = normalizeIds(offerIds);
  if (!normalized.length) throw new OpportunitySelectionError("Adicione pelo menos uma oportunidade à seleção.", "empty_selection");
  return invokeSelection({
    action: "create",
    offer_ids: normalized,
    ...(options.title?.trim() ? { title: options.title.trim() } : {}),
    ...(options.description?.trim() ? { description: options.description.trim() } : {}),
  }, signal);
}

export function fetchSharedOpportunitySelection(token: string, signal?: AbortSignal) {
  return invokeSelection({ action: "get", token }, signal);
}

export function sharedSelectionPath(token: string) {
  return `/oportunidades/selecao/${encodeURIComponent(token)}`;
}

export function sharedSelectionAbsoluteUrl(token: string) {
  const base = typeof window !== "undefined" ? window.location.origin : "https://tomorrowtravelbr.com.br";
  return `${base}${sharedSelectionPath(token)}`;
}
