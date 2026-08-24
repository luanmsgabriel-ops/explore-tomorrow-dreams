import { pathToFileURL } from "node:url";

const DEFAULT_BASE_URL = "https://tomorrowtravelbr.com.br";
const REQUIRED_ROUTES = [
  "/oportunidades/catalogo",
  "/oportunidades/calendario",
  "/oportunidades/live",
];
const FORBIDDEN_PUBLIC_KEYS = new Set(["raw_data", "source_url", "service_role", "service_role_key"]);

export function normalizeBaseUrl(value = DEFAULT_BASE_URL) {
  return String(value).trim().replace(/\/+$/, "");
}

export function findForbiddenPublicKeys(value, path = "$") {
  const findings = [];
  if (Array.isArray(value)) {
    value.forEach((item, index) => findings.push(...findForbiddenPublicKeys(item, `${path}[${index}]`)));
    return findings;
  }
  if (!value || typeof value !== "object") return findings;
  for (const [key, child] of Object.entries(value)) {
    const keyPath = `${path}.${key}`;
    if (FORBIDDEN_PUBLIC_KEYS.has(key.toLowerCase())) findings.push(keyPath);
    findings.push(...findForbiddenPublicKeys(child, keyPath));
  }
  return findings;
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 15_000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

async function assertRoute(baseUrl, route) {
  const response = await fetchWithTimeout(`${baseUrl}${route}`, { redirect: "follow" });
  const contentType = response.headers.get("content-type") ?? "";
  if (!response.ok || !contentType.includes("text/html")) {
    throw new Error(`${route}: esperado HTML 2xx, recebido ${response.status} ${contentType || "sem content-type"}`);
  }
  return { route, status: response.status };
}

async function invokePublicInventory(supabaseUrl, publishableKey, body) {
  const response = await fetchWithTimeout(`${supabaseUrl}/functions/v1/travel-offers-public`, {
    method: "POST",
    headers: {
      apikey: publishableKey,
      Authorization: `Bearer ${publishableKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload || typeof payload !== "object") {
    throw new Error(`travel-offers-public: resposta inválida (${response.status})`);
  }
  const forbidden = findForbiddenPublicKeys(payload);
  if (forbidden.length) throw new Error(`travel-offers-public expôs campo interno: ${forbidden.join(", ")}`);
  return payload;
}

async function assertOfferImage(supabaseUrl, publishableKey, offerId) {
  const url = new URL(`${supabaseUrl}/functions/v1/travel-offer-image`);
  url.searchParams.set("id", offerId);
  url.searchParams.set("variant", "card");
  const response = await fetchWithTimeout(url, {
    method: "GET",
    redirect: "manual",
    headers: { apikey: publishableKey, Authorization: `Bearer ${publishableKey}` },
  });
  const location = response.headers.get("location") ?? "";
  if (![301, 302, 303, 307, 308].includes(response.status)) {
    throw new Error(`travel-offer-image: esperado redirect, recebido ${response.status}`);
  }
  if (!location.includes("/storage/v1/render/image/public/offer-images-cache/")) {
    throw new Error("travel-offer-image: redirect não aponta para thumbnail do cache público");
  }
  return { status: response.status, location };
}

export async function runStage11Smoke(env = process.env) {
  const baseUrl = normalizeBaseUrl(env.STAGE11_BASE_URL || DEFAULT_BASE_URL);
  const supabaseUrl = normalizeBaseUrl(env.VITE_SUPABASE_URL || env.SUPABASE_URL || "");
  const publishableKey = env.VITE_SUPABASE_PUBLISHABLE_KEY || env.SUPABASE_PUBLISHABLE_KEY || "";

  const routes = [];
  for (const route of REQUIRED_ROUTES) routes.push(await assertRoute(baseUrl, route));

  if (!supabaseUrl || !publishableKey) {
    return { baseUrl, routes, inventory: "skipped", image: "skipped" };
  }

  const catalog = await invokePublicInventory(supabaseUrl, publishableKey, {
    action: "catalog",
    params: { offer_type: "pacote", sort: "editorial", page: 1, per_page: 1 },
  });
  if (!Array.isArray(catalog.items) || catalog.items.length < 1) {
    throw new Error("travel-offers-public: catálogo de pacotes não retornou item para o smoke test");
  }
  const offerId = catalog.items[0]?.id;
  if (typeof offerId !== "string") throw new Error("travel-offers-public: item sem UUID público");

  const image = await assertOfferImage(supabaseUrl, publishableKey, offerId);
  return { baseUrl, routes, inventory: { total: catalog.total ?? null, offerId }, image };
}

async function main() {
  try {
    const result = await runStage11Smoke();
    console.log(JSON.stringify({ ok: true, ...result }, null, 2));
  } catch (error) {
    console.error(JSON.stringify({ ok: false, error: error instanceof Error ? error.message : String(error) }, null, 2));
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
