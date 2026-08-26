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

export type RealtimeVoice = typeof REALTIME_VOICES[number];

const defaultOrigins = [
  "https://tomorrowtravelbr.com.br",
  "https://www.tomorrowtravelbr.com.br",
  "https://explore-tomorrow-dreams.lovable.app",
  "http://localhost:5173",
  "http://localhost:8080",
];

const FOUNDATION_INSTRUCTIONS = [
  "Você é o Téo, concierge da Tomorrow Travel, conversando por voz no Tomorrow Live.",
  "Sua identidade é a mesma do Téo dos demais canais da Tomorrow Travel: sofisticado mas caloroso, preciso mas empático, assertivo mas aberto, com postura de especialista e cuidado de um concierge pessoal.",
  "Não fale como chatbot genérico. Não use gírias como bora, top, show, partiu, beleza, mano ou galera. Evite entusiasmo exagerado, frases mecânicas e elogios vazios.",
  "Fale exclusivamente em português brasileiro (pt-BR), com respostas breves, naturais e adequadas a uma conversa por voz.",
  "O sotaque deve ser brasileiro neutro. Use pronúncia, ritmo, entonação, vocabulário e construções naturais do Brasil.",
  "É proibido usar pronúncia, cadência, vocabulário ou construções características do português de Portugal. Prefira, por exemplo, 'você', 'ônibus', 'celular', 'equipe' e construções correntes no Brasil quando esses termos forem necessários.",
  "Na abertura de toda nova sessão, a primeira fala deve começar obrigatoriamente com 'Olá'. Nunca inicie com 'Oi'. Apresente-se como Téo, da Tomorrow Travel, e pergunte como a pessoa se chama.",
  "Uma abertura adequada é: 'Olá. Sou o Téo, da Tomorrow Travel. Antes de começarmos, como posso te chamar?'. Não repita essa apresentação depois que a conversa já começou.",
  "Quando a pessoa disser o nome, memorize o primeiro nome no contexto desta sessão e passe a usá-lo de forma natural e discreta. Não use o nome em toda frase e não pergunte novamente durante a mesma sessão.",
  "Depois de saber o nome, conduza a conversa de forma consultiva: entenda intenção, período, origem, perfil e prioridades antes de recomendar quando essas informações forem necessárias.",
  "Ao falar datas, interprete e verbalize sempre no padrão brasileiro dia-mês-ano; nunca use a ordem mês-dia dos Estados Unidos. Prefira datas por extenso, por exemplo: 2026-09-02 deve ser falado como '2 de setembro de 2026'.",
  "Esta sessão possui uma ferramenta somente de leitura para buscar oportunidades reais no inventário público da Tomorrow Travel.",
  "Use a ferramenta search_travel_offers quando o cliente pedir ofertas, preços, datas ou disponibilidade.",
  "Se o cliente pedir comparação entre vários destinos, faça uma busca separada por destino quando necessário e compare os resultados obtidos. A interface pode manter até nove oportunidades da mesma rodada de comparação.",
  "Apresente somente os campos devolvidos pela ferramenta e informe claramente quando nenhum resultado for encontrado.",
  "Quando o cliente escolher uma oportunidade encontrada ou pedir a página, mais informações ou contato pelo WhatsApp, use present_offer_actions com o offer_id exato devolvido pela busca.",
  "Se houver mais de uma oportunidade e a escolha não estiver clara, pergunte qual delas o cliente prefere antes de chamar present_offer_actions.",
  "Depois de present_offer_actions, informe que os acessos foram apresentados na tela e que o cliente precisa tocar na opção desejada; nunca afirme que uma página ou o WhatsApp já foi aberto.",
  "Esta sessão não possui ferramenta de cotação, reserva, pagamento ou envio automático de mensagens.",
  "Nunca invente preço, data, voo, hotel, aeroporto, disponibilidade, taxa ou inclusão.",
].join(" ");

const TRAVEL_OFFERS_TOOL = {
  type: "function",
  name: "search_travel_offers",
  description: [
    "Busca até três oportunidades reais e atuais no inventário público da Tomorrow Travel por chamada.",
    "Use quando o cliente pedir ofertas, preços, datas ou disponibilidade.",
    "Para comparar vários destinos na mesma fala do cliente, faça chamadas separadas por destino; a interface acumula os resultados dessa mesma rodada para comparação visual.",
    "Não presuma filtros que o cliente não informou; faça uma pergunta antes quando um dado for indispensável.",
    "Apresente somente os dados devolvidos e, se a lista vier vazia, informe que nenhuma oportunidade compatível foi encontrada.",
  ].join(" "),
  parameters: {
    type: "object",
    additionalProperties: false,
    properties: {
      search: { type: "string", description: "Termo geral citado pelo cliente, como destino, cidade, evento ou estilo de viagem." },
      origin: { type: "string", description: "Cidade de origem informada pelo cliente." },
      destination: { type: "string", description: "Cidade ou destino informado pelo cliente." },
      start_date: { type: "string", description: "Data inicial de saída no formato YYYY-MM-DD." },
      end_date: { type: "string", description: "Data final de saída no formato YYYY-MM-DD." },
      passengers: { type: "integer", minimum: 1, maximum: 20, description: "Quantidade total de passageiros informada pelo cliente." },
      offer_type: { type: "string", enum: ["bloqueio_aereo", "pacote"], description: "Tipo de oportunidade quando o cliente distinguir aéreo de pacote." },
    },
  },
} as const;

const OFFER_ACTIONS_TOOL = {
  type: "function",
  name: "present_offer_actions",
  description: [
    "Apresenta na interface as ações públicas para uma oportunidade real já devolvida por search_travel_offers.",
    "Use quando o cliente escolher uma oportunidade ou pedir a página, mais informações ou contato pelo WhatsApp.",
    "Use somente o offer_id exato de um resultado da busca atual. Se a escolha estiver ambígua, pergunte qual oportunidade ele prefere.",
    "A ferramenta não abre páginas nem envia mensagens automaticamente; depois da chamada, diga ao cliente para tocar na opção apresentada.",
  ].join(" "),
  parameters: {
    type: "object",
    additionalProperties: false,
    required: ["offer_id", "requested_channel"],
    properties: {
      offer_id: { type: "string", description: "Identificador UUID exato da oportunidade retornada por search_travel_offers." },
      requested_channel: { type: "string", enum: ["details", "whatsapp", "options"], description: "Canal pedido pelo cliente; use options quando ele pedir mais informações sem escolher um canal." },
    },
  },
} as const;

const PLAN_TRIP_WINDOW_TOOL = {
  type: "function",
  name: "plan_trip_window",
  description: "Busca e ranqueia até três experiências reais para uma janela de um dia do roteiro. Use para construir roteiro por conversa, não para ofertas comerciais.",
  parameters: {
    type: "object",
    additionalProperties: false,
    required: ["destination", "search", "date", "available_minutes", "day_number"],
    properties: {
      destination: { type: "string", description: "Destino/cidade do roteiro." },
      search: { type: "string", description: "Experiência ou categoria desejada, como museu, praia, vinícola ou gastronomia." },
      date: { type: "string", description: "Data do dia no formato YYYY-MM-DD." },
      available_minutes: { type: "integer", minimum: 1, maximum: 1440 },
      day_number: { type: "integer", minimum: 1, maximum: 60 },
      total_days: { type: "integer", minimum: 1, maximum: 60 },
      start_date: { type: "string", description: "Data inicial da viagem no formato YYYY-MM-DD." },
      end_date: { type: "string", description: "Data final da viagem no formato YYYY-MM-DD." },
      preferences: { type: "array", items: { type: "string" }, maxItems: 12 },
      rejected_categories: { type: "array", items: { type: "string" }, maxItems: 12 },
    },
  },
} as const;

const SELECT_TRIP_EXPERIENCE_TOOL = {
  type: "function",
  name: "select_trip_experience",
  description: "Confirma no roteiro uma experiência que foi devolvida por plan_trip_window. Use somente candidate_id exato da rodada atual.",
  parameters: {
    type: "object",
    additionalProperties: false,
    required: ["candidate_id", "day_number"],
    properties: {
      candidate_id: { type: "string" },
      day_number: { type: "integer", minimum: 1, maximum: 60 },
      starts_at: { type: "string" },
      ends_at: { type: "string" },
    },
  },
} as const;

const SET_TRIP_PREFERENCE_TOOL = {
  type: "function",
  name: "set_trip_preference",
  description: "Registra uma preferência explícita do cliente para o roteiro em construção.",
  parameters: {
    type: "object",
    additionalProperties: false,
    required: ["key", "value"],
    properties: {
      key: { type: "string" },
      value: { anyOf: [{ type: "string" }, { type: "number" }, { type: "boolean" }, { type: "array", items: { type: "string" } }] },
    },
  },
} as const;

const COMPLETE_TRIP_DAY_TOOL = {
  type: "function",
  name: "complete_trip_day",
  description: "Marca um dia do roteiro como concluído quando o cliente confirmar que aquele dia está fechado.",
  parameters: { type: "object", additionalProperties: false, required: ["day_number"], properties: { day_number: { type: "integer", minimum: 1, maximum: 60 } } },
} as const;

const REOPEN_TRIP_DAY_TOOL = {
  type: "function",
  name: "reopen_trip_day",
  description: "Reabre um dia já fechado quando o cliente pedir alteração.",
  parameters: { type: "object", additionalProperties: false, required: ["day_number"], properties: { day_number: { type: "integer", minimum: 1, maximum: 60 } } },
} as const;

const isRecord = (value: unknown): value is JsonRecord => typeof value === "object" && value !== null && !Array.isArray(value);
const isRealtimeVoice = (value: unknown): value is RealtimeVoice => typeof value === "string" && (REALTIME_VOICES as readonly string[]).includes(value);

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

export function createRealtimeSessionConfig(env: RuntimeEnv, requestedVoice: RealtimeVoice | null = null) {
  const promptId = env.get("OPENAI_REALTIME_PROMPT_ID")?.trim();
  const session: JsonRecord = {
    type: "realtime",
    model: env.get("OPENAI_REALTIME_MODEL")?.trim() || DEFAULT_MODEL,
    output_modalities: ["audio"],
    instructions: FOUNDATION_INSTRUCTIONS,
    audio: {
      input: {
        noise_reduction: { type: "near_field" },
        transcription: { model: env.get("OPENAI_REALTIME_TRANSCRIPTION_MODEL")?.trim() || DEFAULT_TRANSCRIPTION_MODEL, language: "pt" },
        turn_detection: { type: "server_vad", threshold: 0.5, prefix_padding_ms: 300, silence_duration_ms: 650, create_response: true, interrupt_response: true },
      },
      output: { voice: requestedVoice ?? (env.get("OPENAI_REALTIME_VOICE")?.trim() || DEFAULT_VOICE), speed: 1 },
    },
    max_output_tokens: 512,
    tools: [
      TRAVEL_OFFERS_TOOL,
      OFFER_ACTIONS_TOOL,
      PLAN_TRIP_WINDOW_TOOL,
      SELECT_TRIP_EXPERIENCE_TOOL,
      SET_TRIP_PREFERENCE_TOOL,
      COMPLETE_TRIP_DAY_TOOL,
      REOPEN_TRIP_DAY_TOOL,
    ],
    tool_choice: "auto",
    parallel_tool_calls: false,
  };
  if (promptId) session.prompt = { id: promptId };
  return { expires_after: { anchor: "created_at", seconds: 60 }, session };
}

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
