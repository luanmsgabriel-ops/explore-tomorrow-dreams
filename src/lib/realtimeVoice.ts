import { FunctionsHttpError } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";
import type { CatalogParams } from "@/lib/travelOffersPublic";

export type RealtimeVoiceStatus = "idle" | "connecting" | "listening" | "thinking" | "speaking" | "offers" | "error";
export type VoiceTranscriptRole = "user" | "assistant";

export const REALTIME_VOICES = [
  "alloy",
  "ash",
  "ballad",
  "coral",
  "echo",
  "sage",
  "shimmer",
  "verse",
  "marin",
  "cedar",
] as const;

export type RealtimeVoiceName = typeof REALTIME_VOICES[number];
export const DEFAULT_REALTIME_VOICE: RealtimeVoiceName = "cedar";
export const REALTIME_VOICE_STORAGE_KEY = "tomorrow-live-realtime-voice";

export function isRealtimeVoiceName(value: unknown): value is RealtimeVoiceName {
  return typeof value === "string" && (REALTIME_VOICES as readonly string[]).includes(value);
}

export function getSelectedRealtimeVoice(): RealtimeVoiceName {
  if (typeof window === "undefined") return DEFAULT_REALTIME_VOICE;
  const stored = window.localStorage.getItem(REALTIME_VOICE_STORAGE_KEY);
  return isRealtimeVoiceName(stored) ? stored : DEFAULT_REALTIME_VOICE;
}

export function setSelectedRealtimeVoice(voice: RealtimeVoiceName) {
  if (typeof window !== "undefined") window.localStorage.setItem(REALTIME_VOICE_STORAGE_KEY, voice);
}

export interface VoiceTranscriptEntry {
  id: string;
  role: VoiceTranscriptRole;
  text: string;
  final: boolean;
}

export interface RealtimeServerEvent {
  type: string;
  event_id?: string;
  item_id?: string;
  response_id?: string;
  delta?: string;
  transcript?: string;
  call_id?: string;
  name?: string;
  arguments?: string;
  item?: {
    type?: string;
    call_id?: string;
    name?: string;
    arguments?: string;
  };
  error?: { message?: string };
}

export interface RealtimeFunctionCall {
  callId: string;
  name: string;
  arguments: string;
}

export interface TravelOfferSearchArguments {
  search?: string;
  origin?: string;
  destination?: string;
  start_date?: string;
  end_date?: string;
  passengers?: number;
  offer_type?: "bloqueio_aereo" | "pacote";
}

export type OfferHandoffChannel = "details" | "whatsapp" | "options";

export interface OfferHandoffRequest {
  offerId: string;
  requestedChannel: OfferHandoffChannel;
}

type RealtimeSecretResponse = {
  value?: string;
  expires_at?: number | null;
  error?: { code?: string; message?: string };
  request_id?: string;
};

export class RealtimeVoiceError extends Error {
  readonly code: string;

  constructor(message: string, code = "realtime_error") {
    super(message);
    this.name = "RealtimeVoiceError";
    this.code = code;
  }
}

export const clampAudioLevel = (value: number) => Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));

export function analyserAudioLevel(analyser: AnalyserNode, samples: Uint8Array<ArrayBuffer>) {
  analyser.getByteTimeDomainData(samples);
  let sum = 0;
  for (const sample of samples) {
    const normalized = (sample - 128) / 128;
    sum += normalized * normalized;
  }
  return clampAudioLevel(Math.sqrt(sum / Math.max(1, samples.length)) * 3.4);
}

export function parseRealtimeEvent(data: unknown): RealtimeServerEvent | null {
  if (typeof data !== "string") return null;
  try {
    const event = JSON.parse(data) as Record<string, unknown>;
    if (!event || typeof event !== "object" || typeof event.type !== "string") return null;
    return event as unknown as RealtimeServerEvent;
  } catch {
    return null;
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export function functionCallFromRealtimeEvent(event: RealtimeServerEvent): RealtimeFunctionCall | null {
  if (event.type === "response.output_item.done" && event.item?.type === "function_call") {
    const { call_id: callId, name, arguments: argumentsJson } = event.item;
    return callId && name && typeof argumentsJson === "string"
      ? { callId, name, arguments: argumentsJson }
      : null;
  }
  if (event.type === "response.function_call_arguments.done") {
    return event.call_id && event.name && typeof event.arguments === "string"
      ? { callId: event.call_id, name: event.name, arguments: event.arguments }
      : null;
  }
  return null;
}

const validIsoDate = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
};

const normalizeSearchTerm = (value: string) => value
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, " ")
  .trim();

const isRedundantOfferTypeSearch = (
  search: string,
  offerType: NonNullable<TravelOfferSearchArguments["offer_type"]>,
) => {
  const normalized = normalizeSearchTerm(search);
  const redundantTerms = offerType === "bloqueio_aereo"
    ? new Set(["bloqueio", "bloqueios", "bloqueio aereo", "bloqueios aereos", "aereo", "aereos", "passagem aerea", "passagens aereas"])
    : new Set(["pacote", "pacotes"]);
  return redundantTerms.has(normalized);
};

export function catalogParamsFromRealtimeTool(call: RealtimeFunctionCall): CatalogParams {
  if (call.name !== "search_travel_offers") throw new RealtimeVoiceError("Ferramenta não permitida.", "unknown_tool");

  let parsed: unknown;
  try {
    parsed = JSON.parse(call.arguments || "{}");
  } catch {
    throw new RealtimeVoiceError("Os filtros da consulta são inválidos.", "invalid_tool_arguments");
  }
  if (!isRecord(parsed)) throw new RealtimeVoiceError("Os filtros da consulta são inválidos.", "invalid_tool_arguments");

  const allowed = new Set(["search", "origin", "destination", "start_date", "end_date", "passengers", "offer_type"]);
  if (Object.keys(parsed).some((key) => !allowed.has(key))) {
    throw new RealtimeVoiceError("A consulta contém filtros não permitidos.", "invalid_tool_arguments");
  }

  const args: TravelOfferSearchArguments = {};
  const text = (field: "search" | "origin" | "destination", maxLength: number) => {
    const value = parsed[field];
    if (value === undefined || value === null || value === "") return;
    if (typeof value !== "string" || !value.trim() || value.trim().length > maxLength) {
      throw new RealtimeVoiceError("Os filtros da consulta são inválidos.", "invalid_tool_arguments");
    }
    args[field] = value.trim();
  };
  text("search", 80);
  text("origin", 100);
  text("destination", 120);

  for (const field of ["start_date", "end_date"] as const) {
    const value = parsed[field];
    if (value === undefined || value === null || value === "") continue;
    if (typeof value !== "string" || !validIsoDate(value)) {
      throw new RealtimeVoiceError("As datas da consulta são inválidas.", "invalid_tool_arguments");
    }
    args[field] = value;
  }
  if (args.start_date && args.end_date && args.start_date > args.end_date) {
    throw new RealtimeVoiceError("O período da consulta é inválido.", "invalid_tool_arguments");
  }

  if (parsed.passengers !== undefined && parsed.passengers !== null) {
    if (!Number.isInteger(parsed.passengers) || (parsed.passengers as number) < 1 || (parsed.passengers as number) > 20) {
      throw new RealtimeVoiceError("A quantidade de passageiros é inválida.", "invalid_tool_arguments");
    }
    args.passengers = parsed.passengers as number;
  }
  if (parsed.offer_type !== undefined && parsed.offer_type !== null && parsed.offer_type !== "") {
    if (parsed.offer_type !== "bloqueio_aereo" && parsed.offer_type !== "pacote") {
      throw new RealtimeVoiceError("O tipo de oportunidade é inválido.", "invalid_tool_arguments");
    }
    args.offer_type = parsed.offer_type;
  }
  if (args.search && args.offer_type && isRedundantOfferTypeSearch(args.search, args.offer_type)) {
    delete args.search;
  }

  return {
    ...args,
    sort: "date_asc",
    page: 1,
    per_page: 3,
  };
}

export function offerHandoffFromRealtimeTool(call: RealtimeFunctionCall): OfferHandoffRequest {
  if (call.name !== "present_offer_actions") {
    throw new RealtimeVoiceError("Ferramenta não permitida.", "unknown_tool");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(call.arguments || "{}");
  } catch {
    throw new RealtimeVoiceError("A oferta selecionada é inválida.", "invalid_tool_arguments");
  }
  if (!isRecord(parsed)) {
    throw new RealtimeVoiceError("A oferta selecionada é inválida.", "invalid_tool_arguments");
  }
  const allowed = new Set(["offer_id", "requested_channel"]);
  if (Object.keys(parsed).some((key) => !allowed.has(key))) {
    throw new RealtimeVoiceError("A seleção contém campos não permitidos.", "invalid_tool_arguments");
  }

  const offerId = parsed.offer_id;
  const requestedChannel = parsed.requested_channel ?? "options";
  if (
    typeof offerId !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(offerId)
  ) {
    throw new RealtimeVoiceError("O identificador da oferta é inválido.", "invalid_tool_arguments");
  }
  if (requestedChannel !== "details" && requestedChannel !== "whatsapp" && requestedChannel !== "options") {
    throw new RealtimeVoiceError("O canal solicitado é inválido.", "invalid_tool_arguments");
  }

  return { offerId, requestedChannel };
}

export function realtimeToolContinuationEvents(callId: string, output: unknown) {
  return [
    {
      type: "conversation.item.create",
      item: {
        type: "function_call_output",
        call_id: callId,
        output: JSON.stringify(output),
      },
    },
    { type: "response.create" },
  ];
}

export function transcriptChangeFromEvent(event: RealtimeServerEvent) {
  const id = event.item_id ?? event.response_id ?? event.event_id;
  if (!id) return null;

  if (event.type === "conversation.item.input_audio_transcription.delta" && typeof event.delta === "string") {
    return { id, role: "user" as const, text: event.delta, append: true, final: false };
  }
  if (event.type === "conversation.item.input_audio_transcription.completed" && typeof event.transcript === "string") {
    return { id, role: "user" as const, text: event.transcript, append: false, final: true };
  }
  if (event.type === "response.output_audio_transcript.delta" && typeof event.delta === "string") {
    return { id, role: "assistant" as const, text: event.delta, append: true, final: false };
  }
  if (event.type === "response.output_audio_transcript.done" && typeof event.transcript === "string") {
    return { id, role: "assistant" as const, text: event.transcript, append: false, final: true };
  }
  return null;
}

export function applyTranscriptChange(
  entries: VoiceTranscriptEntry[],
  change: NonNullable<ReturnType<typeof transcriptChangeFromEvent>>,
) {
  const index = entries.findIndex((entry) => entry.id === change.id && entry.role === change.role);
  if (index === -1) {
    return [...entries, { id: change.id, role: change.role, text: change.text, final: change.final }].slice(-20);
  }
  const next = [...entries];
  const current = next[index];
  next[index] = {
    ...current,
    text: change.append ? `${current.text}${change.text}` : change.text,
    final: change.final,
  };
  return next;
}

async function functionError(error: unknown) {
  if (error instanceof FunctionsHttpError) {
    try {
      const body = await error.context.json() as RealtimeSecretResponse;
      return new RealtimeVoiceError(
        body.error?.message ?? "Não foi possível iniciar a conversa por voz.",
        body.error?.code ?? "session_request_failed",
      );
    } catch {
      return new RealtimeVoiceError("Não foi possível iniciar a conversa por voz.", "session_request_failed");
    }
  }
  return new RealtimeVoiceError("A conexão de voz está indisponível agora.", "session_request_failed");
}

export async function fetchRealtimeClientSecret(
  signal?: AbortSignal,
  voice: RealtimeVoiceName = getSelectedRealtimeVoice(),
) {
  const { data, error } = await supabase.functions.invoke<RealtimeSecretResponse>("tomorrow-live-realtime-session", {
    body: { voice },
    signal,
    timeout: 15_000,
  });

  if (error) throw await functionError(error);
  if (!data?.value || !data.value.startsWith("ek_")) {
    throw new RealtimeVoiceError("A sessão de voz retornou uma resposta inválida.", "invalid_session");
  }
  return data.value;
}

export function microphoneErrorMessage(error: unknown) {
  if (error instanceof RealtimeVoiceError) return error.message;
  if (error instanceof DOMException && error.name === "NotAllowedError") {
    return "Permissão do microfone negada. Autorize o acesso no navegador para iniciar a conversa.";
  }
  if (error instanceof DOMException && error.name === "NotFoundError") {
    return "Nenhum microfone foi encontrado neste dispositivo.";
  }
  if (error instanceof DOMException && error.name === "NotReadableError") {
    return "O microfone está sendo usado por outro aplicativo ou não pôde ser aberto.";
  }
  return "Não foi possível iniciar a conversa por voz. Você pode continuar pelo modo texto.";
}