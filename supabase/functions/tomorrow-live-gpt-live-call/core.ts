type RuntimeEnv = {
  get(name: string): string | undefined;
};

type Dependencies = {
  env: RuntimeEnv;
  fetchFn?: typeof fetch;
};

type JsonRecord = Record<string, unknown>;

const OPENAI_LIVE_SESSIONS_URL = "https://api.openai.com/v1/live/sessions";
const MODEL = "gpt-live-1";
const MAX_REQUEST_BYTES = 96 * 1024;

const VOICES = [
  "alloy", "ash", "ballad", "beacon", "bossa", "cedar", "cinder", "coral", "delta", "echo", "gleam",
  "marin", "meridian", "quartz", "ripple", "sage", "shimmer", "stone", "tempo", "verse", "vesper", "willow",
] as const;

type Voice = typeof VOICES[number];

const ACCENT_INSTRUCTIONS: Record<string, string> = {
  pt_br_neutral: "Use pronúncia brasileira nativa neutra, sem marca regional forte e nunca use cadência de português europeu.",
  pt_br_sao_paulo: "Use um sotaque brasileiro paulistano leve e natural, com traços sutis de São Paulo e sem caricatura.",
  pt_br_rio: "Use um sotaque brasileiro carioca leve e natural, com traços sutis do Rio de Janeiro e sem caricatura.",
  pt_br_minas: "Use um sotaque brasileiro mineiro leve e natural, com traços sutis de Minas Gerais e sem caricatura.",
  pt_br_nordeste: "Use um sotaque brasileiro nordestino leve e natural, sem imitar uma pessoa específica e sem caricatura.",
  pt_br_sul: "Use um sotaque brasileiro sulista leve e natural, sem imitar uma pessoa específica e sem caricatura.",
};

const PACE_INSTRUCTIONS: Record<string, string> = {
  calm: "Fale em ritmo calmo, com pausas discretas e dicção limpa.",
  natural: "Fale em ritmo natural de conversa brasileira, claro e fluido.",
  agile: "Fale de forma ágil e objetiva, sem atropelar palavras ou perder clareza.",
};

const STYLE_INSTRUCTIONS: Record<string, string> = {
  concierge: "Use presença de concierge premium, mas humana: sofisticado, acolhedor, consultivo, próximo e sem formalidade artificial.",
  conversational: "Use estilo conversacional espontâneo e próximo, com leveza, humor sutil, precisão e profissionalismo.",
  executive: "Use estilo executivo: direto, seguro, conciso e profissional, sem soar robótico ou engessado.",
};

const TEO_VOICE_PERSONA = [
  "PERSONALIDADE DO TÉO: seja entusiasta e acolhedor, demonstrando paixão genuína por viagens.",
  "Seja engraçado e descontraído: use humor leve, observações espontâneas e referências divertidas sobre viagens quando couber, sem forçar piadas.",
  "Seja consultivo: aconselhe e converse com curiosidade genuína em vez de apenas vender ou recitar informações.",
  "Seja eficiente: vá direto ao ponto com bom humor, sem repetir o que a pessoa acabou de dizer.",
  "Seja humano e natural em português brasileiro: use contrações, interjeições curtas e respostas que soem faladas, não texto lido.",
].join(" ");

const HUMAN_VOICE_BEHAVIOR = [
  "EXPRESSIVIDADE VOCAL HUMANA: substitua o papel que emojis teriam no WhatsApp por reações vocais naturais e discretas.",
  "Quando fizer sentido, use uma risada curta e genuína, um sorriso audível na voz, um 'hmm', 'ah', 'boa', 'entendi' ou uma micro-pausa antes de responder.",
  "Pode haver respiração audível muito discreta entre ideias, sem exagero e sem transformar a fala em atuação.",
  "Muito raramente, se surgir de forma natural, faça uma breve limpeza de garganta ou tosse leve e em seguida diga 'desculpa' de modo casual; não repita isso com frequência e não simule doença, falta de ar ou desconforto.",
  "Não verbalize descrições de efeitos como 'risos', '[risada]', '[tosse]' ou '[respira]'; a reação deve soar como comportamento vocal, não como legenda.",
  "Não use uma reação humana em toda resposta. Varie de forma imprevisível e sutil; a maior parte das falas deve permanecer limpa e natural.",
  "Evite voz de locutor, call center, propaganda ou assistente formal. Soe como uma pessoa inteligente, bem-humorada e presente em uma conversa real.",
].join(" ");

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
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
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

const isRecord = (value: unknown): value is JsonRecord => typeof value === "object" && value !== null && !Array.isArray(value);
const allowedVoice = (value: unknown): value is Voice => typeof value === "string" && (VOICES as readonly string[]).includes(value);

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

const buildInstructions = (accent: string, pace: string, style: string) => [
  "Você é o Téo, concierge da Tomorrow Travel, em uma sessão experimental dedicada exclusivamente à avaliação da nova voz GPT-Live-1.",
  "Fale exclusivamente em português brasileiro natural. Nunca use pronúncia, cadência ou vocabulário característicos de Portugal.",
  TEO_VOICE_PERSONA,
  HUMAN_VOICE_BEHAVIOR,
  "Mantenha respostas curtas e adequadas a uma conversa por voz. Se a pessoa fizer uma pergunta, responda primeiro; não force um roteiro de coleta.",
  "Esta sessão de laboratório não possui ferramentas de busca, cotação, reserva, pagamento ou WhatsApp. Se pedirem dados reais de viagem, diga brevemente que o laboratório está avaliando a voz e não invente informações.",
  "Na primeira fala, comece obrigatoriamente com 'Olá', apresente-se como Téo da Tomorrow Travel e pergunte como a pessoa se chama.",
  ACCENT_INSTRUCTIONS[accent],
  PACE_INSTRUCTIONS[pace],
  STYLE_INSTRUCTIONS[style],
].join(" ");

const parseBody = async (request: Request) => {
  const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";
  if (!contentType.startsWith("application/json")) throw new Error("invalid_content_type");
  const text = await request.text();
  if (new TextEncoder().encode(text).byteLength > MAX_REQUEST_BYTES) throw new Error("request_too_large");
  let body: unknown;
  try { body = JSON.parse(text); } catch { throw new Error("invalid_json"); }
  if (!isRecord(body)) throw new Error("invalid_request");
  const allowedKeys = new Set(["sdp", "voice", "accent", "pace", "style"]);
  if (Object.keys(body).some((key) => !allowedKeys.has(key))) throw new Error("invalid_request");
  if (typeof body.sdp !== "string" || !body.sdp.startsWith("v=0") || body.sdp.length > 80_000) throw new Error("invalid_sdp");
  if (!allowedVoice(body.voice)) throw new Error("invalid_voice");
  if (typeof body.accent !== "string" || !ACCENT_INSTRUCTIONS[body.accent]) throw new Error("invalid_accent");
  if (typeof body.pace !== "string" || !PACE_INSTRUCTIONS[body.pace]) throw new Error("invalid_pace");
  if (typeof body.style !== "string" || !STYLE_INSTRUCTIONS[body.style]) throw new Error("invalid_style");
  return { sdp: body.sdp, voice: body.voice, accent: body.accent, pace: body.pace, style: body.style };
};

export function createGptLiveCallHandler({ env, fetchFn = fetch }: Dependencies) {
  return async (request: Request): Promise<Response> => {
    const requestId = crypto.randomUUID();
    const origin = request.headers.get("origin");
    if (origin && !allowedOrigins(env).has(origin)) {
      return jsonResponse({ error: { code: "origin_not_allowed", message: "Origem não permitida." }, request_id: requestId }, 403, null, env);
    }
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(origin, env) });
    if (request.method !== "POST") return jsonResponse({ error: { code: "method_not_allowed", message: "Método não permitido." }, request_id: requestId }, 405, origin, env);

    let input: Awaited<ReturnType<typeof parseBody>>;
    try {
      input = await parseBody(request);
    } catch (error) {
      const code = error instanceof Error ? error.message : "invalid_request";
      const status = code === "request_too_large" ? 413 : code === "invalid_content_type" ? 415 : 400;
      return jsonResponse({ error: { code, message: "Configuração do laboratório de voz inválida." }, request_id: requestId }, status, origin, env);
    }

    const apiKey = env.get("OPENAI_API_KEY");
    if (!apiKey) return jsonResponse({ error: { code: "live_unavailable", message: "O laboratório GPT-Live-1 ainda não está configurado." }, request_id: requestId }, 503, origin, env);

    try {
      const upstream = await fetchFn(OPENAI_LIVE_SESSIONS_URL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "OpenAI-Safety-Identifier": await safetyIdentifier(request, env),
        },
        body: JSON.stringify({
          session: {
            model: MODEL,
            instructions: buildInstructions(input.accent, input.pace, input.style),
            audio: { output: { voice: input.voice } },
          },
          transport: { type: "webrtc", sdp: input.sdp },
        }),
      });

      if (!upstream.ok) {
        const diagnostic = (await upstream.text().catch(() => "")).slice(0, 600);
        console.error("[TOMORROW_LIVE_GPT_LIVE_UPSTREAM]", upstream.status, diagnostic);
        return jsonResponse({ error: { code: "live_upstream_error", message: "Não foi possível abrir o teste GPT-Live-1 agora." }, request_id: requestId }, 502, origin, env);
      }

      const payload = await upstream.json() as unknown;
      if (!isRecord(payload) || !isRecord(payload.transport) || payload.transport.type !== "webrtc" || typeof payload.transport.sdp !== "string" || !payload.transport.sdp.startsWith("v=0")) {
        console.error("[TOMORROW_LIVE_GPT_LIVE_INVALID_RESPONSE]", requestId);
        return jsonResponse({ error: { code: "invalid_upstream_response", message: "A sessão GPT-Live-1 retornou uma resposta inválida." }, request_id: requestId }, 502, origin, env);
      }
      const sessionId = isRecord(payload.session) && typeof payload.session.id === "string" ? payload.session.id : null;
      return jsonResponse({ session_id: sessionId, sdp: payload.transport.sdp, model: MODEL, voice: input.voice }, 200, origin, env);
    } catch (error) {
      console.error("[TOMORROW_LIVE_GPT_LIVE_ERROR]", error instanceof Error ? error.message : String(error));
      return jsonResponse({ error: { code: "live_connection_error", message: "Não foi possível conectar ao GPT-Live-1." }, request_id: requestId }, 502, origin, env);
    }
  };
}
