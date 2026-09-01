import { createRealtimeSessionConfig, REALTIME_VOICES, type RealtimeVoice } from "../_shared/realtimeSession.ts";

type RuntimeEnv = {
  get(name: string): string | undefined;
};

type Dependencies = {
  env: RuntimeEnv;
  fetchFn?: typeof fetch;
};

const MAX_SDP_BYTES = 64 * 1024;
const OPENAI_REALTIME_CALLS_URL = "https://api.openai.com/v1/realtime/calls";

const defaultOrigins = [
  "https://tomorrowtravelbr.com.br",
  "https://www.tomorrowtravelbr.com.br",
  "https://explore-tomorrow-dreams.lovable.app",
  "http://localhost:5173",
  "http://localhost:8080",
];

const allowedOrigins = (env: RuntimeEnv) => {
  const configured = env.get("TOMORROW_LIVE_ALLOWED_ORIGINS")?.split(",").map((origin) => origin.trim()).filter(Boolean) ?? [];
  return new Set([...defaultOrigins, ...configured]);
};

const corsHeaders = (origin: string | null, env: RuntimeEnv) => {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info, x-tomorrow-voice",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
  if (origin && allowedOrigins(env).has(origin)) headers["Access-Control-Allow-Origin"] = origin;
  return headers;
};

const jsonResponse = (body: unknown, status: number, origin: string | null, env: RuntimeEnv) => new Response(JSON.stringify(body), {
  status,
  headers: {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store, private",
    "X-Content-Type-Options": "nosniff",
    ...corsHeaders(origin, env),
  },
});

const sha256 = async (value: string) => {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
};

const safetyIdentifier = async (request: Request, env: RuntimeEnv) => {
  const ip = request.headers.get("cf-connecting-ip") ?? request.headers.get("x-real-ip") ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anonymous";
  const userAgent = request.headers.get("user-agent") ?? "unknown";
  const salt = env.get("REALTIME_SAFETY_SALT") ?? env.get("SUPABASE_URL") ?? "tomorrow-live";
  return sha256(`${salt}|${ip}|${userAgent}`);
};

const requestedVoice = (request: Request): RealtimeVoice | null => {
  const value = request.headers.get("x-tomorrow-voice")?.trim();
  if (!value) return null;
  return (REALTIME_VOICES as readonly string[]).includes(value) ? value as RealtimeVoice : null;
};

export function createRealtimeCallHandler({ env, fetchFn = fetch }: Dependencies) {
  return async (request: Request): Promise<Response> => {
    const requestId = crypto.randomUUID();
    const origin = request.headers.get("origin");

    if (origin && !allowedOrigins(env).has(origin)) {
      return jsonResponse({ error: { code: "origin_not_allowed", message: "Origem não permitida." }, request_id: requestId }, 403, null, env);
    }
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(origin, env) });
    if (request.method !== "POST") return jsonResponse({ error: { code: "method_not_allowed", message: "Método não permitido." }, request_id: requestId }, 405, origin, env);
    if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/sdp")) {
      return jsonResponse({ error: { code: "invalid_content_type", message: "Formato da sessão de voz inválido." }, request_id: requestId }, 415, origin, env);
    }

    const voiceHeader = request.headers.get("x-tomorrow-voice")?.trim();
    const voice = requestedVoice(request);
    if (voiceHeader && !voice) {
      return jsonResponse({ error: { code: "invalid_voice", message: "A voz selecionada não é permitida." }, request_id: requestId }, 400, origin, env);
    }

    const sdp = await request.text();
    if (!sdp || !sdp.startsWith("v=0") || new TextEncoder().encode(sdp).byteLength > MAX_SDP_BYTES) {
      return jsonResponse({ error: { code: "invalid_sdp", message: "Não foi possível preparar a conexão de voz." }, request_id: requestId }, 400, origin, env);
    }

    const apiKey = env.get("OPENAI_API_KEY");
    if (!apiKey) {
      return jsonResponse({ error: { code: "realtime_unavailable", message: "A voz em tempo real ainda não está configurada." }, request_id: requestId }, 503, origin, env);
    }

    try {
      const form = new FormData();
      form.set("sdp", sdp);
      form.set("session", JSON.stringify(createRealtimeSessionConfig(env, voice).session));

      const upstream = await fetchFn(OPENAI_REALTIME_CALLS_URL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "OpenAI-Safety-Identifier": await safetyIdentifier(request, env),
        },
        body: form,
      });

      if (!upstream.ok) {
        const diagnostic = (await upstream.text().catch(() => "")).slice(0, 600);
        console.error("[TOMORROW_LIVE_REALTIME_CALL_UPSTREAM]", upstream.status, diagnostic);
        return jsonResponse({ error: { code: "realtime_upstream_error", message: "Não foi possível abrir a conversa por voz agora." }, request_id: requestId }, 502, origin, env);
      }

      const answer = await upstream.text();
      if (!answer.startsWith("v=0")) {
        console.error("[TOMORROW_LIVE_REALTIME_CALL_INVALID_SDP]", requestId);
        return jsonResponse({ error: { code: "invalid_upstream_response", message: "A conexão de voz retornou uma resposta inválida." }, request_id: requestId }, 502, origin, env);
      }

      const headers: Record<string, string> = {
        "Content-Type": "application/sdp",
        "Cache-Control": "no-store, private",
        "X-Content-Type-Options": "nosniff",
        ...corsHeaders(origin, env),
      };
      const location = upstream.headers.get("location");
      if (location) headers["X-Realtime-Call-Location"] = location;
      return new Response(answer, { status: 200, headers });
    } catch (error) {
      console.error("[TOMORROW_LIVE_REALTIME_CALL_ERROR]", error instanceof Error ? error.message : String(error));
      return jsonResponse({ error: { code: "realtime_connection_error", message: "Não foi possível conectar à voz em tempo real." }, request_id: requestId }, 502, origin, env);
    }
  };
}
