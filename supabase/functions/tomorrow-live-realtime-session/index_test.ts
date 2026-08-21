import { assertEquals, assertMatch } from "https://deno.land/std@0.224.0/assert/mod.ts";

import { createRealtimeSessionConfig, createRealtimeSessionHandler } from "./core.ts";

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
  assertEquals(config.session.tools, []);
  assertEquals(config.session.tool_choice, "none");
  assertEquals(JSON.stringify(config).includes("server-key"), false);
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

Deno.test("retorna somente client secret efêmero e expiração", async () => {
  let authorization = "";
  let safetyIdentifier = "";
  const handler = createRealtimeSessionHandler({
    env,
    fetchFn: async (_url, init) => {
      const headers = new Headers(init?.headers);
      authorization = headers.get("authorization") ?? "";
      safetyIdentifier = headers.get("openai-safety-identifier") ?? "";
      return Response.json({ value: "ek_test_ephemeral", expires_at: 12345, session: { internal: true } });
    },
  });
  const response = await handler(new Request("https://edge.test", {
    method: "POST",
    headers: { "content-type": "application/json", origin, "x-forwarded-for": "203.0.113.8" },
    body: "{}",
  }));
  const body = await response.json();

  assertEquals(response.status, 200);
  assertEquals(body, { value: "ek_test_ephemeral", expires_at: 12345 });
  assertEquals(authorization, "Bearer server-key");
  assertMatch(safetyIdentifier, /^[a-f0-9]{64}$/);
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
