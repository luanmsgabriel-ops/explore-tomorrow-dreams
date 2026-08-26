declare const Deno: {
  env: { get(name: string): string | undefined };
  serve(handler: (request: Request) => Response | Promise<Response>): void;
};

import {
  createPublicToken,
  publicSelectionFromRow,
  validateCreateSelection,
  validateGetSelection,
} from "./core.ts";

const REQUEST_LIMIT = 10_000;
const CREATE_RATE_LIMIT = 12;
const READ_RATE_LIMIT = 90;
const RATE_WINDOW_MS = 60_000;
const defaultOrigins = [
  "https://tomorrowtravelbr.com.br",
  "https://www.tomorrowtravelbr.com.br",
  "https://explore-tomorrow-dreams.lovable.app",
  "http://localhost:5173",
  "http://localhost:8080",
];

const allowedOrigins = () => {
  const configured = Deno.env.get("TRAVEL_OFFERS_ALLOWED_ORIGINS")
    ?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean) ?? [];
  return new Set([...defaultOrigins, ...configured]);
};

const corsHeaders = (origin: string | null) => {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
  if (origin && allowedOrigins().has(origin)) headers["Access-Control-Allow-Origin"] = origin;
  return headers;
};

const response = (body: unknown, status: number, origin: string | null) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store, private",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
      ...corsHeaders(origin),
    },
  });

const rateBuckets = new Map<string, { start: number; creates: number; reads: number }>();
const checkRateLimit = (request: Request, action: "create" | "get") => {
  const ip = request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-real-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown";
  const now = Date.now();
  let bucket = rateBuckets.get(ip);
  if (!bucket || now - bucket.start >= RATE_WINDOW_MS) {
    bucket = { start: now, creates: 0, reads: 0 };
    rateBuckets.set(ip, bucket);
  }
  if (action === "create") {
    bucket.creates += 1;
    if (bucket.creates > CREATE_RATE_LIMIT) throw new Error("Muitas seleções criadas. Tente novamente em instantes.");
  } else {
    bucket.reads += 1;
    if (bucket.reads > READ_RATE_LIMIT) throw new Error("Muitas consultas. Tente novamente em instantes.");
  }
};

const getSupabaseClient = async () => {
  const url = Deno.env.get("SUPABASE_URL");
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceRole) throw new Error("Missing server configuration");
  // @ts-ignore Deno Edge Runtime resolves pinned npm specifiers.
  const { createClient } = await import("npm:@supabase/supabase-js@2.90.1");
  return createClient(url, serviceRole, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
};

export const handler = async (request: Request): Promise<Response> => {
  const requestId = crypto.randomUUID();
  const origin = request.headers.get("origin");

  if (origin && !allowedOrigins().has(origin)) {
    return response({ error: { code: "origin_not_allowed", message: "Origem não permitida." }, request_id: requestId }, 403, null);
  }
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(origin) });
  if (request.method !== "POST") {
    return response({ error: { code: "method_not_allowed", message: "Método não permitido." }, request_id: requestId }, 405, origin);
  }

  try {
    const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";
    if (!contentType.startsWith("application/json")) throw new Error("Conteúdo inválido.");
    const text = await request.text();
    if (new TextEncoder().encode(text).byteLength > REQUEST_LIMIT) {
      return response({ error: { code: "request_too_large", message: "Corpo da requisição excede o limite." }, request_id: requestId }, 413, origin);
    }
    const body = JSON.parse(text);
    const action = typeof body?.action === "string" ? body.action : "";
    if (action !== "create" && action !== "get") throw new Error("Ação inválida.");
    checkRateLimit(request, action);
    const client = await getSupabaseClient();

    if (action === "create") {
      const input = validateCreateSelection(body);
      let lastError = "Não foi possível criar a seleção.";
      for (let attempt = 0; attempt < 3; attempt += 1) {
        const token = createPublicToken();
        const result = await client
          .from("travel_offer_selections")
          .insert({
            public_token: token,
            title: input.title,
            description: input.description,
            offer_ids: input.offerIds,
          })
          .select("public_token,title,description,offer_ids,created_at,expires_at")
          .single();
        if (!result.error) return response(publicSelectionFromRow(result.data), 201, origin);
        lastError = result.error.message ?? lastError;
        if (result.error.code !== "23505") break;
      }
      throw new Error(lastError);
    }

    const token = validateGetSelection(body);
    const result = await client
      .from("travel_offer_selections")
      .select("public_token,title,description,offer_ids,created_at,expires_at")
      .eq("public_token", token)
      .eq("is_active", true)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();
    if (result.error) throw new Error(result.error.message ?? "Falha ao consultar a seleção.");
    if (!result.data) {
      return response({ error: { code: "selection_not_found", message: "Esta seleção não está disponível." }, request_id: requestId }, 404, origin);
    }
    return response(publicSelectionFromRow(result.data), 200, origin);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível concluir a solicitação.";
    const rateLimited = message.startsWith("Muitas ");
    const validation = /inválid|permitido|deve|tamanho|seleção deve conter|identificador/.test(message);
    if (!validation && !rateLimited) {
      console.error("[travel-offer-selection] request failed", { request_id: requestId, error: message });
    }
    return response({
      error: {
        code: rateLimited ? "rate_limited" : validation ? "invalid_request" : "selection_unavailable",
        message: rateLimited || validation ? message : "Não foi possível concluir a solicitação agora.",
      },
      request_id: requestId,
    }, rateLimited ? 429 : validation ? 400 : 500, origin);
  }
};

Deno.serve(handler);
