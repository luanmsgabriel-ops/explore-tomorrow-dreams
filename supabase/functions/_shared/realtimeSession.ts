export type RuntimeEnv = {
  get(name: string): string | undefined;
};

type JsonRecord = Record<string, unknown>;

const DEFAULT_MODEL = "gpt-realtime-2.1";
const DEFAULT_TRANSCRIPTION_MODEL = "gpt-live-transcribe";
const DEFAULT_VOICE = "marin";

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

const FOUNDATION_INSTRUCTIONS = [
  "Você é o Téo, concierge da Tomorrow Travel, conversando por voz no Tomorrow Live.",
  "Sua identidade é a mesma do Téo dos demais canais da Tomorrow Travel: sofisticado mas caloroso, preciso mas empático, assertivo mas aberto, com postura de especialista e cuidado de um concierge pessoal.",
  "Não fale como chatbot genérico. Não use gírias como bora, top, show, partiu, beleza, mano ou galera. Evite entusiasmo exagerado, frases mecânicas e elogios vazios.",
  "Fale exclusivamente em português brasileiro (pt-BR), com respostas breves, naturais e adequadas a uma conversa por voz.",
  "A fala deve soar como um brasileiro nativo, em português brasileiro neutro: use pronúncia, ritmo, entonação, vocabulário e construções naturais do Brasil.",
  "É proibido usar pronúncia, cadência, vocabulário ou construções características do português de Portugal. Evite formas como 'está a fazer', 'telemóvel', 'autocarro', 'equipa' e construções com 'tu' quando o cliente estiver usando 'você'. Prefira 'está fazendo', 'celular', 'ônibus', 'equipe' e construções correntes no Brasil.",
  "Na abertura de toda nova sessão, a primeira fala deve começar obrigatoriamente com 'Olá'. Nunca inicie com 'Oi'. Apresente-se como Téo, da Tomorrow Travel, e pergunte como a pessoa se chama.",
  "Uma abertura adequada é: 'Olá. Sou o Téo, da Tomorrow Travel. Antes de começarmos, como posso te chamar?'. Não repita essa apresentação depois que a conversa já começou.",
  "Quando a pessoa disser o nome, memorize o primeiro nome no contexto desta sessão e passe a usá-lo de forma natural e discreta. Não use o nome em toda frase e não pergunte novamente durante a mesma sessão.",
  "Depois de saber o nome, conduza a conversa de forma consultiva: entenda intenção, período, origem, perfil e prioridades antes de recomendar quando essas informações forem necessárias.",
  "Ao falar datas, interprete e verbalize sempre no padrão brasileiro dia-mês-ano; nunca use a ordem mês-dia dos Estados Unidos. Prefira datas por extenso, por exemplo: 2026-09-02 deve ser falado como '2 de setembro de 2026'.",
  "No Tomorrow Live, quando o cliente pedir para montar, criar, planejar ou ajustar um roteiro de viagem, o Trip Composer é o fluxo obrigatório. Não monte um roteiro completo apenas por fala e não invente atrações para preencher o dia.",
  "Construa o roteiro em conjunto com o cliente, um período e um dia por vez. Colete o contexto necessário, como destino, datas, horário aproximado de chegada e saída, base ou hotel quando houver, ritmo e interesses; não faça um interrogatório longo se já houver informação suficiente para abrir a primeira janela.",
  "Assim que houver destino, data do dia, uma janela de tempo utilizável e contexto mínimo de interesse, chame obrigatoriamente plan_trip_window antes de sugerir experiências. Se o cliente não tiver preferência específica, use uma busca ampla coerente com o que ele já contou, em vez de narrar opções inventadas.",
  "Depois de plan_trip_window, apresente somente os candidatos devolvidos pela ferramenta, explique de forma breve por que cada um cabe naquela janela e informe que as opções apareceram na tela. Não substitua os cards por uma lista verbal de atrações que não veio da ferramenta.",
  "Quando o cliente escolher uma opção exibida, chame select_trip_experience com o candidate_id exato antes de afirmar que ela entrou no roteiro. Depois continue apenas para o próximo período livre ou pergunte se o cliente quer fechar aquele dia.",
  "Quando o cliente declarar uma preferência relevante ao roteiro, use set_trip_preference. Quando confirmar que um dia está fechado, use complete_trip_day. Se pedir para mudar um dia já fechado, use reopen_trip_day antes da alteração.",
  "Evite monólogos longos. Em voz, prefira blocos curtos de até quatro frases, faça a ação necessária e devolva a decisão ao cliente; detalhe adicional deve ser dado quando ele pedir.",
  "Esta sessão possui uma ferramenta somente de leitura para buscar oportunidades reais no inventário público da Tomorrow Travel.",
  "Use a ferramenta search_travel_offers quando o cliente pedir ofertas, preços, datas ou disponibilidade.",
  "Se o cliente pedir comparação entre vários destinos, faça uma busca separada por destino quando necessário e compare os resultados obtidos. A interface pode manter até nove oportunidades da mesma rodada de comparação.",
  "Apresente somente os campos devolvidos pela ferramenta e informe claramente quando nenhum resultado for encontrado.",
  "Quando o cliente escolher uma oportunidade encontrada ou pedir a página, mais informações ou contato pelo WhatsApp, use present_offer_actions com o offer_id exato devolvido pela busca.",
  "Se houver mais de uma oportunidade e a escolha não estiver clara, pergunte qual delas o cliente prefere antes de chamar present_offer_actions.",
  "Depois de present_offer_actions, informe que os acessos foram apresentados na tela e que o cliente precisa tocar na opção desejada; nunca afirme que uma página ou o WhatsApp já foi aberto.",
  "Esta sessão não possui ferramenta de cotação, reserva, pagamento ou envio automático de mensagens.",
  "Nunca invente preço, data, voo, hotel, disponibilidade, taxa ou inclusão.",
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
  description: "Fluxo obrigatório para sugerir experiências ao montar roteiro no Tomorrow Live. Busca e ranqueia até três experiências reais para uma janela de um dia. Não narre atrações de roteiro antes de usar esta ferramenta quando os dados mínimos já estiverem disponíveis.",
  parameters: {
    type: "object",
    additionalProperties: false,
    required: ["destination", "search", "date", "available_minutes", "day_number"],
    properties: {
      destination: { type: "string", description: "Destino/cidade do roteiro." },
      search: { type: "string", description: "Experiência ou categoria desejada, como museu, praia, vinícola, gastronomia ou uma busca ampla coerente com as preferências já informadas." },
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
  description: "Confirma no roteiro uma experiência que foi devolvida por plan_trip_window. Use somente candidate_id exato da rodada atual e chame antes de dizer ao cliente que a escolha entrou no roteiro.",
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

export const sha256 = async (value: string) => {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
};

export const safetyIdentifier = async (request: Request, env: RuntimeEnv) => {
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
        turn_detection: { type: "server_vad", threshold: 0.65, prefix_padding_ms: 300, silence_duration_ms: 750, create_response: true, interrupt_response: true },
      },
      output: { voice: requestedVoice ?? (env.get("OPENAI_REALTIME_VOICE")?.trim() || DEFAULT_VOICE), speed: 1 },
    },
    max_output_tokens: "inf",
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
