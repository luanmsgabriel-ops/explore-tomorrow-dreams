import { createRealtimeSessionConfig, REALTIME_VOICES, safetyIdentifier, sha256, type RealtimeVoice, type RuntimeEnv } from "../_shared/realtimeSession.ts";

type RealtimeSessionDependencies = {
  env: RuntimeEnv;
  fetchFn?: typeof fetch;
  now?: () => number;
};

const REQUEST_LIMIT = 1_024;
const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60_000;

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
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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
    "Referrer-Policy": "no-referrer",
    ...corsHeaders(origin, env),
  },
});

type JsonRecord = Record<string, unknown>;
const isRecord = (value: unknown): value is JsonRecord => typeof value === "object" && value !== null && !Array.isArray(value);
const isRealtimeVoice = (value: unknown): value is RealtimeVoice => typeof value === "string" && (REALTIME_VOICES as readonly string[]).includes(value);

const readBody = async (request: Request): Promise<RealtimeVoice | null> => {
  const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";
  if (!contentType.startsWith("application/json")) throw new Error("invalid_content_type");
  const text = await request.text();
  if (new TextEncoder().encode(text).byteLength > REQUEST_LIMIT) throw new Error("request_too_large");
  const body = text ? JSON.parse(text) : {};
  if (!isRecord(body)) throw new Error("invalid_request");
  if (Object.keys(body).some((key) => key !== "voice")) throw new Error("invalid_request");
  if (body.voice === undefined || body.voice === null || body.voice === "") return null;
  if (!isRealtimeVoice(body.voice)) throw new Error("invalid_voice");
  return body.voice;
};

export function createRealtimeSessionHandler({ env, fetchFn = fetch, now = Date.now }: RealtimeSessionDependencies) {
  const rateBuckets = new Map<string, { start: number; count: number }>();
  const checkRateLimit = (request: Request) => {
    const ip = request.headers.get("cf-connecting-ip") ?? request.headers.get("x-real-ip") ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const currentTime = now();
    const current = rateBuckets.get(ip);
    if (!current || currentTime - current.start >= RATE_WINDOW_MS) {
      rateBuckets.set(ip, { start: currentTime, count: 1 });
      return;
    }
    current.count += 1;
    if (current.count > RATE_LIMIT) throw new Error("rate_limited");
  };

  return async (request: Request): Promise<Response> => {
    const requestId = crypto.randomUUID();
    const origin = request.headers.get("origin");
    if (origin && !allowedOrigins(env).has(origin)) return jsonResponse({ error: { code: "origin_not_allowed", message: "Origem não permitida." }, request_id: requestId }, 403, null, env);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(origin, env) });
    if (request.method !== "POST") return jsonResponse({ error: { code: "method_not_allowed", message: "Método não permitido." }, request_id: requestId }, 405, origin, env);

    let requestedVoice: RealtimeVoice | null = null;
    try {
      requestedVoice = await readBody(request);
      checkRateLimit(request);
    } catch (error) {
      const code = error instanceof Error ? error.message : "invalid_request";
      const status = code === "request_too_large" ? 413 : code === "rate_limited" ? 429 : 400;
      const message = code === "rate_limited" ? "Muitas tentativas. Aguarde um instante antes de iniciar outra conversa." : code === "invalid_voice" ? "A voz selecionada não é permitida." : "Solicitação inválida.";
      return jsonResponse({ error: { code, message }, request_id: requestId }, status, origin, env);
    }

    const apiKey = env.get("OPENAI_API_KEY");
    if (!apiKey) return jsonResponse({ error: { code: "realtime_unavailable", message: "A voz em tempo real ainda não está configurada." }, request_id: requestId }, 503, origin, env);

    try {
      const openAiResponse = await fetchFn("https://api.openai.com/v1/realtime/client_secrets", {
        method: "POST",
        headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json", "OpenAI-Safety-Identifier": await safetyIdentifier(request, env) },
        body: JSON.stringify(createRealtimeSessionConfig(env, requestedVoice)),
      });
      if (!openAiResponse.ok) return jsonResponse({ error: { code: "realtime_upstream_error", message: "Não foi possível abrir a conversa por voz agora." }, request_id: requestId }, 502, origin, env);
      const payload = await openAiResponse.json();
      const value = isRecord(payload) && typeof payload.value === "string" ? payload.value : null;
      if (!value || !value.startsWith("ek_")) return jsonResponse({ error: { code: "invalid_upstream_response", message: "A sessão de voz retornou uma resposta inválida." }, request_id: requestId }, 502, origin, env);
      return jsonResponse({ value, expires_at: typeof payload.expires_at === "number" ? payload.expires_at : null }, 200, origin, env);
    } catch {
      return jsonResponse({ error: { code: "realtime_connection_error", message: "Não foi possível conectar à voz em tempo real." }, request_id: requestId }, 502, origin, env);
    }
  };
}
