type RuntimeEnv = {
  get(name: string): string | undefined;
};

type RealtimeSessionDependencies = {
  env: RuntimeEnv;
  fetchFn?: typeof fetch;
  now?: () => number;
};

type JsonRecord = Record<string, unknown>;

const REQUEST_LIMIT = 1_024;
const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60_000;
const DEFAULT_MODEL = "gpt-realtime-2.1";
const DEFAULT_TRANSCRIPTION_MODEL = "gpt-live-transcribe";
const DEFAULT_VOICE = "cedar";

const defaultOrigins = [
  "https://tomorrowtravelbr.com.br",
  "https://www.tomorrowtravelbr.com.br",
  "https://explore-tomorrow-dreams.lovable.app",
  "http://localhost:5173",
  "http://localhost:8080",
];

const FOUNDATION_INSTRUCTIONS = [
  "Você é o Téo na fundação de voz do Tomorrow Live.",
  "Fale exclusivamente em português brasileiro (pt-BR), com respostas breves, naturais e acolhedoras.",
  "Use pronúncia, ritmo, entonação e vocabulário naturais do Brasil, com sotaque brasileiro neutro.",
  "Não use pronúncia, cadência, vocabulário ou construções do português europeu.",
  "Esta sessão ainda não possui ferramentas de inventário, cotação ou WhatsApp.",
  "Nunca invente preço, data, voo, hotel, aeroporto, disponibilidade, taxa ou inclusão.",
  "Quando pedirem informação comercial específica, explique que a consulta por voz ainda não está conectada e indique o catálogo ou o modo texto.",
].join(" ");

const isRecord = (value: unknown): value is JsonRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const allowedOrigins = (env: RuntimeEnv) => {
  const configured = env.get("TOMORROW_LIVE_ALLOWED_ORIGINS")
    ?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean) ?? [];
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

const jsonResponse = (body: unknown, status: number, origin: string | null, env: RuntimeEnv) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store, private",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
      ...corsHeaders(origin, env),
    },
  });

const readBody = async (request: Request) => {
  const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";
  if (!contentType.startsWith("application/json")) throw new Error("invalid_content_type");
  const text = await request.text();
  if (new TextEncoder().encode(text).byteLength > REQUEST_LIMIT) throw new Error("request_too_large");
  const body = text ? JSON.parse(text) : {};
  if (!isRecord(body) || Object.keys(body).length > 0) throw new Error("invalid_request");
};

const sha256 = async (value: string) => {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
};

const safetyIdentifier = async (request: Request, env: RuntimeEnv) => {
  const ip = request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-real-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "anonymous";
  const userAgent = request.headers.get("user-agent") ?? "unknown";
  const salt = env.get("REALTIME_SAFETY_SALT") ?? env.get("SUPABASE_URL") ?? "tomorrow-live";
  return sha256(`${salt}|${ip}|${userAgent}`);
};

export function createRealtimeSessionConfig(env: RuntimeEnv) {
  const promptId = env.get("OPENAI_REALTIME_PROMPT_ID")?.trim();
  const session: JsonRecord = {
    type: "realtime",
    model: env.get("OPENAI_REALTIME_MODEL")?.trim() || DEFAULT_MODEL,
    output_modalities: ["audio"],
    audio: {
      input: {
        noise_reduction: { type: "near_field" },
        transcription: {
          model: env.get("OPENAI_REALTIME_TRANSCRIPTION_MODEL")?.trim() || DEFAULT_TRANSCRIPTION_MODEL,
          language: "pt",
        },
        turn_detection: {
          type: "server_vad",
          threshold: 0.5,
          prefix_padding_ms: 300,
          silence_duration_ms: 650,
          create_response: true,
          interrupt_response: true,
        },
      },
      output: {
        voice: env.get("OPENAI_REALTIME_VOICE")?.trim() || DEFAULT_VOICE,
        speed: 1,
      },
    },
    max_output_tokens: 512,
    tools: [],
    tool_choice: "none",
    parallel_tool_calls: false,
  };

  if (promptId) session.prompt = { id: promptId };
  else session.instructions = FOUNDATION_INSTRUCTIONS;

  return {
    expires_after: { anchor: "created_at", seconds: 60 },
    session,
  };
}

export function createRealtimeSessionHandler({ env, fetchFn = fetch, now = Date.now }: RealtimeSessionDependencies) {
  const rateBuckets = new Map<string, { start: number; count: number }>();

  const checkRateLimit = (request: Request) => {
    const ip = request.headers.get("cf-connecting-ip") ??
      request.headers.get("x-real-ip") ??
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      "unknown";
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

    if (origin && !allowedOrigins(env).has(origin)) {
      return jsonResponse({ error: { code: "origin_not_allowed", message: "Origem não permitida." }, request_id: requestId }, 403, null, env);
    }
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(origin, env) });
    }
    if (request.method !== "POST") {
      return jsonResponse({ error: { code: "method_not_allowed", message: "Método não permitido." }, request_id: requestId }, 405, origin, env);
    }

    try {
      await readBody(request);
      checkRateLimit(request);
    } catch (error) {
      const code = error instanceof Error ? error.message : "invalid_request";
      const status = code === "request_too_large" ? 413 : code === "rate_limited" ? 429 : 400;
      const message = code === "rate_limited"
        ? "Muitas tentativas. Aguarde um instante antes de iniciar outra conversa."
        : "Solicitação inválida.";
      return jsonResponse({ error: { code, message }, request_id: requestId }, status, origin, env);
    }

    const apiKey = env.get("OPENAI_API_KEY");
    if (!apiKey) {
      return jsonResponse({ error: { code: "realtime_unavailable", message: "A voz em tempo real ainda não está configurada." }, request_id: requestId }, 503, origin, env);
    }

    try {
      const openAiResponse = await fetchFn("https://api.openai.com/v1/realtime/client_secrets", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "OpenAI-Safety-Identifier": await safetyIdentifier(request, env),
        },
        body: JSON.stringify(createRealtimeSessionConfig(env)),
      });

      if (!openAiResponse.ok) {
        return jsonResponse({ error: { code: "realtime_upstream_error", message: "Não foi possível abrir a conversa por voz agora." }, request_id: requestId }, 502, origin, env);
      }

      const payload = await openAiResponse.json();
      const value = isRecord(payload) && typeof payload.value === "string" ? payload.value : null;
      if (!value || !value.startsWith("ek_")) {
        return jsonResponse({ error: { code: "invalid_upstream_response", message: "A sessão de voz retornou uma resposta inválida." }, request_id: requestId }, 502, origin, env);
      }

      return jsonResponse({
        value,
        expires_at: typeof payload.expires_at === "number" ? payload.expires_at : null,
      }, 200, origin, env);
    } catch {
      return jsonResponse({ error: { code: "realtime_connection_error", message: "Não foi possível conectar à voz em tempo real." }, request_id: requestId }, 502, origin, env);
    }
  };
}
