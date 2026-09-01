import { assertEquals, assertMatch } from "https://deno.land/std@0.224.0/assert/mod.ts";

import { createRealtimeCallHandler } from "./core.ts";

const envValues = new Map<string, string>([
  ["OPENAI_API_KEY", "server-key"],
  ["SUPABASE_URL", "https://example.supabase.co"],
]);
const env = { get: (name: string) => envValues.get(name) };
const origin = "https://tomorrowtravelbr.com.br";
const sdpOffer = "v=0\r\no=- 1 1 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\n";
const sdpAnswer = "v=0\r\no=- 2 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\n";

Deno.test("negocia SDP pela interface unificada sem expor a chave", async () => {
  let authorization = "";
  let safetyIdentifier = "";
  let receivedSdp = "";
  let receivedSession: unknown = null;

  const handler = createRealtimeCallHandler({
    env,
    fetchFn: async (url, init) => {
      assertEquals(String(url), "https://api.openai.com/v1/realtime/calls");
      const headers = new Headers(init?.headers);
      authorization = headers.get("authorization") ?? "";
      safetyIdentifier = headers.get("openai-safety-identifier") ?? "";
      const form = init?.body as FormData;
      receivedSdp = String(form.get("sdp") ?? "");
      receivedSession = JSON.parse(String(form.get("session") ?? "{}"));
      return new Response(sdpAnswer, { status: 200, headers: { "content-type": "application/sdp", location: "/v1/realtime/calls/call_123" } });
    },
  });

  const response = await handler(new Request("https://edge.test", {
    method: "POST",
    headers: {
      origin,
      "content-type": "application/sdp",
      "x-tomorrow-voice": "marin",
      "x-forwarded-for": "203.0.113.8",
    },
    body: sdpOffer,
  }));

  const session = receivedSession as Record<string, unknown>;
  assertEquals(response.status, 200);
  assertEquals(response.headers.get("content-type"), "application/sdp");
  assertEquals(response.headers.get("access-control-allow-origin"), origin);
  assertEquals(await response.text(), sdpAnswer);
  assertEquals(authorization, "Bearer server-key");
  assertMatch(safetyIdentifier, /^[a-f0-9]{64}$/);
  assertEquals(receivedSdp, sdpOffer);
  assertEquals(session.type, "realtime");
  assertEquals(session.model, "gpt-realtime-2.1");
  const audio = session.audio as Record<string, unknown>;
  assertEquals(audio.output, { voice: "marin", speed: 1 });
  assertEquals(JSON.stringify(session).includes("server-key"), false);
});

Deno.test("rejeita origem não autorizada", async () => {
  const handler = createRealtimeCallHandler({ env });
  const response = await handler(new Request("https://edge.test", {
    method: "POST",
    headers: { origin: "https://invalid.example", "content-type": "application/sdp" },
    body: sdpOffer,
  }));
  assertEquals(response.status, 403);
});

Deno.test("rejeita voz fora da allowlist", async () => {
  const handler = createRealtimeCallHandler({ env });
  const response = await handler(new Request("https://edge.test", {
    method: "POST",
    headers: { origin, "content-type": "application/sdp", "x-tomorrow-voice": "inventada" },
    body: sdpOffer,
  }));
  const body = await response.json();
  assertEquals(response.status, 400);
  assertEquals(body.error.code, "invalid_voice");
});

Deno.test("rejeita payload que não é SDP", async () => {
  const handler = createRealtimeCallHandler({ env });
  const response = await handler(new Request("https://edge.test", {
    method: "POST",
    headers: { origin, "content-type": "application/sdp" },
    body: "not-sdp",
  }));
  const body = await response.json();
  assertEquals(response.status, 400);
  assertEquals(body.error.code, "invalid_sdp");
});

Deno.test("sanitiza erro upstream", async () => {
  const handler = createRealtimeCallHandler({
    env,
    fetchFn: async () => new Response(JSON.stringify({ error: { message: "sensitive upstream details" } }), { status: 400 }),
  });
  const response = await handler(new Request("https://edge.test", {
    method: "POST",
    headers: { origin, "content-type": "application/sdp" },
    body: sdpOffer,
  }));
  const body = await response.json();
  assertEquals(response.status, 502);
  assertEquals(body.error.code, "realtime_upstream_error");
  assertEquals(JSON.stringify(body).includes("sensitive upstream details"), false);
});
