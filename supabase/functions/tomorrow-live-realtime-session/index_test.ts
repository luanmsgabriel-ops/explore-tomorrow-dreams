import { assertEquals, assertMatch } from "https://deno.land/std@0.224.0/assert/mod.ts";

import { createRealtimeSessionConfig, createRealtimeSessionHandler, REALTIME_VOICES } from "./core.ts";

const envValues = new Map<string, string>([
  ["OPENAI_API_KEY", "server-key"],
  ["SUPABASE_URL", "https://example.supabase.co"],
]);
const env = { get: (name: string) => envValues.get(name) };
const origin = "https://tomorrowtravelbr.com.br";

Deno.test("cria configuração GA sem expor a chave principal", () => {
  const config = createRealtimeSessionConfig(env);
  assertEquals(config.session.type, "realtime");
  assertEquals(config.session.model, "gpt-realtime-2.1");
  assertEquals((config.session.audio as Record<string, unknown>).output, { voice: "cedar", speed: 1 });
  const instructions = String(config.session.instructions);
  assertEquals(instructions.includes("português brasileiro (pt-BR)"), true);
  assertEquals(instructions.includes("sotaque deve ser brasileiro neutro"), true);
  assertEquals(instructions.includes("português de Portugal"), true);
  assertEquals(instructions.includes("primeira fala deve começar obrigatoriamente com 'Olá'"), true);
  assertEquals(instructions.includes("Nunca inicie com 'Oi'"), true);
  assertEquals(instructions.includes("como posso te chamar"), true);
  assertEquals(instructions.includes("memorize o primeiro nome"), true);
  assertEquals(instructions.includes("sofisticado mas caloroso"), true);
  assertEquals(instructions.includes("padrão brasileiro dia-mês-ano"), true);
  assertEquals(instructions.includes("2 de setembro de 2026"), true);
  assertEquals(instructions.includes("present_offer_actions"), true);
  assertEquals(instructions.includes("confirme a origem de saída"), true);
  assertEquals(instructions.includes("confirme o período de viagem"), true);
  assertEquals(instructions.includes("todo o inventário"), true);
  assertEquals(instructions.includes("Itapetininga"), true);
  assertEquals(instructions.includes("Viracopos (VCP)"), true);
  assertEquals(instructions.includes("um card por destino"), true);
  assertEquals(instructions.includes("menor preço"), true);
  assertEquals(instructions.includes("até nove oportunidades"), false);
  const tools = config.session.tools as Array<Record<string, unknown>>;
  assertEquals(tools.length, 2);
  assertEquals(tools[0].name, "search_travel_offers");
  assertEquals(tools[0].type, "function");
  const searchParameters = tools[0].parameters as Record<string, unknown>;
  assertEquals(searchParameters.required, ["origin"]);
  assertEquals(tools[1].name, "present_offer_actions");
  assertEquals(tools[1].type, "function");
  assertEquals(config.session.tool_choice, "auto");
  assertEquals(JSON.stringify(config).includes("server-key"), false);
});

Deno.test("mantém os guardrails locais mesmo com prompt versionado configurado", () => {
  const promptEnv = {
    get: (name: string) => name === "OPENAI_REALTIME_PROMPT_ID"
      ? "pmpt_teo_live"
      : env.get(name),
  };
  const config = createRealtimeSessionConfig(promptEnv);
  assertEquals(config.session.prompt, { id: "pmpt_teo_live" });
  const instructions = String(config.session.instructions);
  assertEquals(instructions.includes("Olá"), true);
  assertEquals(instructions.includes("sotaque deve ser brasileiro neutro"), true);
  assertEquals(instructions.includes("português de Portugal"), true);
  assertEquals(instructions.includes("confirme a origem de saída"), true);
  assertEquals(instructions.includes("um card por destino"), true);
});

Deno.test("aceita somente vozes temporárias conhecidas", () => {
  assertEquals(REALTIME_VOICES.includes("marin"), true);
  assertEquals(REALTIME_VOICES.includes("cedar"), true);
  const config = createRealtimeSessionConfig(env, "marin");
  assertEquals((config.session.audio as Record<string, unknown>).output, { voice: "marin", speed: 1 });
});

Deno.test("rejeita origem não autorizada", async () => {
  const handler = createRealtimeSessionHandler({ env });
  const response = await handler(new Request("https://edge.test", {
    method: "POST",
    headers: { "content-type": "application/json", origin: "https://invalid.example" },
    body: "{}",
  }));
  assertEquals(response.status, 403);
});

Deno.test("rejeita voz fora da allowlist", async () => {
  const handler = createRealtimeSessionHandler({ env });
  const response = await handler(new Request("https://edge.test", {
    method: "POST",
    headers: { "content-type": "application/json", origin },
    body: JSON.stringify({ voice: "voz-inventada" }),
  }));
  const body = await response.json();
  assertEquals(response.status, 400);
  assertEquals(body.error.code, "invalid_voice");
});

Deno.test("retorna somente client secret efêmero e expiração", async () => {
  let authorization = "";
  let safetyIdentifier = "";
  let upstreamBody = "";
  const handler = createRealtimeSessionHandler({
    env,
    fetchFn: async (_url, init) => {
      const headers = new Headers(init?.headers);
      authorization = headers.get("authorization") ?? "";
      safetyIdentifier = headers.get("openai-safety-identifier") ?? "";
      upstreamBody = String(init?.body ?? "{}");
      return Response.json({ value: "ek_test_ephemeral", expires_at: 12345, session: { internal: true } });
    },
  });
  const response = await handler(new Request("https://edge.test", {
    method: "POST",
    headers: { "content-type": "application/json", origin, "x-forwarded-for": "203.0.113.8" },
    body: JSON.stringify({ voice: "marin" }),
  }));
  const body = await response.json();

  assertEquals(response.status, 200);
  assertEquals(body, { value: "ek_test_ephemeral", expires_at: 12345 });
  assertEquals(authorization, "Bearer server-key");
  assertMatch(safetyIdentifier, /^[a-f0-9]{64}$/);
  const parsedUpstream = JSON.parse(upstreamBody) as Record<string, unknown>;
  const session = parsedUpstream.session as Record<string, unknown>;
  assertEquals((session.audio as Record<string, unknown>).output, { voice: "marin", speed: 1 });
});

Deno.test("trata ausência de chave sem chamar a OpenAI", async () => {
  const handler = createRealtimeSessionHandler({
    env: { get: () => undefined },
    fetchFn: () => Promise.reject(new Error("não deveria chamar")),
  });
  const response = await handler(new Request("https://edge.test", {
    method: "POST",
    headers: { "content-type": "application/json", origin },
    body: "{}",
  }));
  assertEquals(response.status, 503);
});