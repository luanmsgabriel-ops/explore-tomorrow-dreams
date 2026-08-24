declare const Deno: {
  env: { get(name: string): string | undefined };
  serve(handler: (request: Request) => Response | Promise<Response>): void;
};

import {
  OFFER_IMAGE_BUCKET,
  OfferImageError,
  offerImageCachePath,
  originalPublicUrl,
  parseOfferImageRequest,
  sourceImageUrl,
  transformedPublicUrl,
} from "./core.ts";

const MAX_SOURCE_BYTES = 8 * 1024 * 1024;
const SOURCE_TIMEOUT_MS = 10_000;
const defaultOrigins = new Set([
  "https://tomorrowtravelbr.com.br",
  "https://www.tomorrowtravelbr.com.br",
  "https://explore-tomorrow-dreams.lovable.app",
  "http://localhost:5173",
]);

const responseHeaders = (origin: string | null) => {
  const headers: Record<string, string> = {
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer",
    "Cache-Control": "no-store",
  };
  if (origin && defaultOrigins.has(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers.Vary = "Origin";
  }
  return headers;
};

const jsonResponse = (body: unknown, status: number, origin: string | null) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...responseHeaders(origin) },
  });

const redirectResponse = (location: string, origin: string | null) =>
  new Response(null, {
    status: 302,
    headers: {
      ...responseHeaders(origin),
      Location: location,
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });

const getSupabaseClient = async () => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRole) throw new Error("Missing server configuration");
  const { createClient } = await import("npm:@supabase/supabase-js@2.90.1");
  return {
    supabaseUrl,
    client: createClient(supabaseUrl, serviceRole, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    }),
  };
};

const dateInSaoPaulo = () =>
  new Intl.DateTimeFormat("fr-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

async function fetchSource(sourceUrl: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SOURCE_TIMEOUT_MS);
  try {
    const source = await fetch(sourceUrl, {
      signal: controller.signal,
      redirect: "error",
      headers: { Accept: "image/avif,image/webp,image/png,image/jpeg,image/*;q=0.8" },
    });
    if (!source.ok) throw new OfferImageError("Imagem temporariamente indisponível.", "source_unavailable", 404);
    const contentType = (source.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
    if (!["image/png", "image/jpeg", "image/webp"].includes(contentType)) {
      throw new OfferImageError("Formato de imagem não suportado.", "unsupported_image", 415);
    }
    const declaredSize = Number(source.headers.get("content-length") ?? 0);
    if (declaredSize > MAX_SOURCE_BYTES) {
      throw new OfferImageError("Imagem acima do limite permitido.", "image_too_large", 413);
    }
    const bytes = new Uint8Array(await source.arrayBuffer());
    if (!bytes.length || bytes.byteLength > MAX_SOURCE_BYTES) {
      throw new OfferImageError("Imagem acima do limite permitido.", "image_too_large", 413);
    }
    return { bytes, contentType };
  } finally {
    clearTimeout(timeout);
  }
}

export const handler = async (request: Request): Promise<Response> => {
  const origin = request.headers.get("origin");
  try {
    if (origin && !defaultOrigins.has(origin)) {
      return jsonResponse({ error: { code: "origin_not_allowed", message: "Origem não permitida." } }, 403, null);
    }
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          ...responseHeaders(origin),
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "content-type",
          "Access-Control-Max-Age": "86400",
        },
      });
    }
    if (request.method !== "GET") {
      return jsonResponse({ error: { code: "method_not_allowed", message: "Método não permitido." } }, 405, origin);
    }

    const { id, variant } = parseOfferImageRequest(new URL(request.url));
    const { client, supabaseUrl } = await getSupabaseClient();
    const result = await client
      .from("travel_offers")
      .select("id,offer_type,active,departure_date,issue_deadline,price_per_person,raw_data")
      .eq("id", id)
      .eq("active", true)
      .maybeSingle();
    if (result.error) throw result.error;
    const offer = result.data;
    if (
      !offer ||
      offer.offer_type !== "pacote" ||
      !offer.departure_date ||
      offer.departure_date < dateInSaoPaulo() ||
      Number(offer.price_per_person) <= 0 ||
      (offer.issue_deadline && new Date(offer.issue_deadline).getTime() < Date.now())
    ) {
      throw new OfferImageError("Imagem da oferta não encontrada.", "not_found", 404);
    }

    const sourceUrl = sourceImageUrl(offer.raw_data);
    if (!sourceUrl) throw new OfferImageError("Imagem da oferta não encontrada.", "not_found", 404);
    const storagePath = await offerImageCachePath(id, sourceUrl, variant);
    const originalUrl = originalPublicUrl(supabaseUrl, storagePath);
    const optimizedUrl = transformedPublicUrl(supabaseUrl, storagePath, variant);

    const cached = await fetch(originalUrl, { method: "HEAD" });
    if (cached.ok) return redirectResponse(optimizedUrl, origin);

    const source = await fetchSource(sourceUrl);
    const upload = await client.storage.from(OFFER_IMAGE_BUCKET).upload(storagePath, source.bytes, {
      contentType: source.contentType,
      cacheControl: "31536000",
      upsert: false,
    });
    if (upload.error && !/already exists|duplicate/i.test(upload.error.message ?? "")) throw upload.error;

    return redirectResponse(optimizedUrl, origin);
  } catch (error) {
    if (error instanceof OfferImageError) {
      return jsonResponse({ error: { code: error.code, message: error.message } }, error.status, origin);
    }
    console.error("[travel-offer-image] request failed");
    return jsonResponse(
      { error: { code: "internal_error", message: "Não foi possível carregar a imagem agora." } },
      500,
      origin,
    );
  }
};

if ((import.meta as ImportMeta & { main?: boolean }).main) Deno.serve(handler);
