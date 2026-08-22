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
  assertEquals(instructions.includes("sotaque brasileiro neutro"), true);
  assertEquals(instructions.includes("português europeu"), true);
  assertEquals(instructions.includes("present_offer_actions"), true);
  const tools = config.session.tools as Array<Record<string, unknown>>;
  assertEquals(tools.length, 2);
  assertEquals(tools[0].name, "search_travel_offers");
  assertEquals(tools[0].type, "function");
  assertEquals(tools[1].name, "present_offer_actions");
  assertEquals(tools[1].type, "function");
  assertEquals(config.session.tool_choice, "auto");
  assertEquals(JSON.stringify(config).includes("server-key"), false);
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
  let upstreamBody: Record<string, unknown> | null = null;
  const handler = createRealtimeSessionHandler({
    env,
    fetchFn: async (_url, init) => {
      const headers = new Headers(init?.headers);
      authorization = headers.get("authorization") ?? "";
      safetyIdentifier = headers.get("openai-safety-identifier") ?? "";
      upstreamBody = JSON.parse(String(init?.body ?? "{}"));
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
  const session = upstreamBody?.session as Record<string, unknown>;
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