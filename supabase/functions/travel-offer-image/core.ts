export const OFFER_IMAGE_BUCKET = "offer-images-cache";
export const OFFER_IMAGE_VARIANTS = {
  card: { width: 720, height: 405, quality: 72 },
} as const;

export type OfferImageVariant = keyof typeof OFFER_IMAGE_VARIANTS;

const PUBLIC_OFFER_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ALLOWED_IMAGE_HOSTS = new Set([
  "viajandocomdesconto.com",
  "www.viajandocomdesconto.com",
]);

export class OfferImageError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(message: string, code = "invalid_request", status = 400) {
    super(message);
    this.name = "OfferImageError";
    this.code = code;
    this.status = status;
  }
}

export function parseOfferImageRequest(url: URL) {
  const id = url.searchParams.get("id")?.trim() ?? "";
  if (!PUBLIC_OFFER_ID.test(id)) {
    throw new OfferImageError("Identificador da oferta inválido.", "invalid_uuid", 400);
  }
  const variant = (url.searchParams.get("variant")?.trim() || "card") as OfferImageVariant;
  if (!(variant in OFFER_IMAGE_VARIANTS)) {
    throw new OfferImageError("Variação de imagem inválida.", "invalid_variant", 400);
  }
  return { id, variant };
}

export function sourceImageUrl(rawData: unknown) {
  if (!rawData || typeof rawData !== "object" || Array.isArray(rawData)) return null;
  const record = rawData as Record<string, unknown>;
  const candidate = [record.capa, record.src].find((value) => typeof value === "string" && value.trim()) as string | undefined;
  if (!candidate) return null;
  try {
    const url = new URL(candidate.trim());
    if (url.protocol !== "https:" || url.username || url.password || url.hash) return null;
    if (!ALLOWED_IMAGE_HOSTS.has(url.hostname.toLowerCase())) return null;
    if (!/\.(?:png|jpe?g|webp)$/i.test(url.pathname)) return null;
    return url.toString();
  } catch {
    return null;
  }
}

export async function sourceFingerprint(sourceUrl: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(sourceUrl));
  return [...new Uint8Array(digest)].slice(0, 8).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function offerImageCachePath(offerId: string, sourceUrl: string, variant: OfferImageVariant) {
  const fingerprint = await sourceFingerprint(sourceUrl);
  return `${offerId}/${fingerprint}-${variant}`;
}

export function transformedPublicUrl(
  supabaseUrl: string,
  storagePath: string,
  variant: OfferImageVariant,
) {
  const { width, height, quality } = OFFER_IMAGE_VARIANTS[variant];
  const encodedPath = storagePath.split("/").map(encodeURIComponent).join("/");
  const base = supabaseUrl.replace(/\/$/, "");
  const params = new URLSearchParams({
    width: String(width),
    height: String(height),
    resize: "cover",
    quality: String(quality),
  });
  return `${base}/storage/v1/render/image/public/${OFFER_IMAGE_BUCKET}/${encodedPath}?${params}`;
}

export function originalPublicUrl(supabaseUrl: string, storagePath: string) {
  const encodedPath = storagePath.split("/").map(encodeURIComponent).join("/");
  return `${supabaseUrl.replace(/\/$/, "")}/storage/v1/object/public/${OFFER_IMAGE_BUCKET}/${encodedPath}`;
}
