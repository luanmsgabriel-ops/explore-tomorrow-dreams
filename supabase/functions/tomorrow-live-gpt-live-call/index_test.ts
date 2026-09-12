import { assertEquals, assertMatch } from "https://deno.land/std@0.224.0/assert/mod.ts";

import { createGptLiveCallHandler } from "./core.ts";

const envValues = new Map<string, string>([
  ["OPENAI_API_KEY", "server-key"],
  ["SUPABASE_URL", "https://example.supabase.co"],
]);
const env = { get: (name: string) => envValues.get(name) };
const origin = "https://tomorrowtravelbr.com.br";
const sdpOffer = "v=0\r\no=- 1 1 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\n";
const sdpAnswer = "v=0\r\no=- 2 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\n";

const requestBody = (overrides: Record<string, unknown> = {}) => JSON.stringify({
  sdp: sdpOffer,
  voice: "tempo",
  accent: "pt_br_sao_paulo",
  pace: "agile",
  style: "conversational",
  ...overrides,
});

Deno.test("cria sessão GPT-Live-1 por WebRTC sem expor a chave", async () => {
  let authorization = "";
  let safetyIdentifier = "";
  let receivedBody: Record<string, unknown> = {};
  const handler = createGptLiveCallHandler({
    env,
    fetchFn: async (url, init) => {
      assertEquals(String(url), "https://api.openai.com/v1/live/sessions");
      const headers = new Headers(init?.headers);
      authorization = headers.get("authorization") ?? "";
      safetyIdentifier = headers.get("openai-safety-identifier") ?? "";
      receivedBody = JSON.parse(String(init?.body ?? "{}"));
      return new Response(JSON.stringify({ session: { id: "live_test" }, transport: { type: "webrtc", sdp: sdpAnswer } }), { status: 201, headers: { "content-type": "application/json" } });
    },
  });

  const response = await handler(new Request("https://edge.test", {
    method: "POST",
    headers: { origin, "content-type": "application/json", "x-forwarded-for": "203.0.113.8" },
    body: requestBody(),
  }));
  const body = await response.json();
  const session = receivedBody.session as Record<string, unknown>;
  const audio = session.audio as { output: { voice: string } };
  const transport = receivedBody.transport as Record<string, unknown>;
  const instructions = String(session.instructions);

  assertEquals(response.status, 200);
  assertEquals(body.sdp, sdpAnswer);
  assertEquals(body.model, "gpt-live-1");
  assertEquals(body.voice, "tempo");
  assertEquals(authorization, "Bearer server-key");
  assertMatch(safetyIdentifier, /^[a-f0-9]{64}$/);
  assertEquals(session.model, "gpt-live-1");
  assertEquals(audio.output.voice, "tempo");
  assertEquals(instructions.includes("PAULISTANO LEVE"), true);
  assertEquals(instructions.includes("EMPOLGAÇÃO DOBRADA"), true);
  assertEquals(instructions.includes("INFORMALIDADE ALTA, MAS NATURAL"), true);
  assertEquals(instructions.includes("Não use gíria em toda resposta"), true);
  assertEquals(instructions.includes("nunca comece com 'Eu'"), true);
  assertEquals(instructions.includes("HIPERESPONTÂNEO"), true);
  assertEquals(instructions.includes("HIPEREMPOLGADO"), true);
  assertEquals(instructions.includes("risada curta"), true);
  assertEquals(instructions.includes("limpeza de garganta ou tosse leve"), true);
  assertEquals(instructions.includes("Não verbalize descrições de efeitos"), true);
  assertEquals(transport, { type: "webrtc", sdp: sdpOffer });
  assertEquals(JSON.stringify(receivedBody).includes("server-key"), false);
});

Deno.test("aceita as novas vozes oficiais do GPT-Live-1", async () => {
  const handler = createGptLiveCallHandler({
    env,
    fetchFn: async () => new Response(JSON.stringify({ session: { id: "live_test" }, transport: { type: "webrtc", sdp: sdpAnswer } }), { status: 201 }),
  });
  for (const voice of ["beacon", "bossa", "gleam", "meridian", "quartz", "ripple", "stone", "tempo", "vesper", "willow"]) {
    const response = await handler(new Request("https://edge.test", { method: "POST", headers: { origin, "content-type": "application/json" }, body: requestBody({ voice }) }));
    assertEquals(response.status, 200);
  }
});

Deno.test("rejeita voz ou orientação não permitidas", async () => {
  const handler = createGptLiveCallHandler({ env });
  for (const overrides of [{ voice: "inventada" }, { accent: "caricatura" }, { pace: "2x" }, { style: "qualquer" }]) {
    const response = await handler(new Request("https://edge.test", { method: "POST", headers: { origin, "content-type": "application/json" }, body: requestBody(overrides) }));
    assertEquals(response.status, 400);
  }
});

Deno.test("sanitiza erro upstream", async () => {
  const handler = createGptLiveCallHandler({ env, fetchFn: async () => new Response("sensitive upstream details", { status: 400 }) });
  const response = await handler(new Request("https://edge.test", { method: "POST", headers: { origin, "content-type": "application/json" }, body: requestBody() }));
  const body = await response.json();
  assertEquals(response.status, 502);
  assertEquals(body.error.code, "live_upstream_error");
  assertEquals(JSON.stringify(body).includes("sensitive upstream details"), false);
});
