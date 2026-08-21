import { FunctionsHttpError } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";

export type RealtimeVoiceStatus = "idle" | "connecting" | "listening" | "thinking" | "speaking" | "error";
export type VoiceTranscriptRole = "user" | "assistant";

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
  error?: { message?: string };
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

export async function fetchRealtimeClientSecret(signal?: AbortSignal) {
  const { data, error } = await supabase.functions.invoke<RealtimeSecretResponse>("tomorrow-live-realtime-session", {
    body: {},
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
