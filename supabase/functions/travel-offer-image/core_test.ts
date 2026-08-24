import {
  OFFER_IMAGE_BUCKET,
  offerImageCachePath,
  parseOfferImageRequest,
  sourceImageUrl,
  transformedPublicUrl,
} from "./core.ts";

const assert = (condition: unknown, message: string) => {
  if (!condition) throw new Error(message);
};

Deno.test("aceita somente UUID público e preset conhecido", () => {
  const parsed = parseOfferImageRequest(new URL(
    "https://example.test/functions/v1/travel-offer-image?id=0191a5f2-ccaa-7f03-8f00-1234567890ab&variant=card",
  ));
  assert(parsed.id === "0191a5f2-ccaa-7f03-8f00-1234567890ab", "UUID deveria ser preservado");
  assert(parsed.variant === "card", "preset card deveria ser preservado");

  let rejected = false;
  try {
    parseOfferImageRequest(new URL("https://example.test/functions/v1/travel-offer-image?id=raw_data"));
  } catch {
    rejected = true;
  }
  assert(rejected, "identificador arbitrário deve ser rejeitado");
});

Deno.test("não transforma endpoint em proxy arbitrário", () => {
  assert(sourceImageUrl({ capa: "https://example.com/image.png" }) === null, "host externo deve ser rejeitado");
  assert(sourceImageUrl({ capa: "http://viajandocomdesconto.com/img/test.png" }) === null, "HTTP deve ser rejeitado");
  assert(sourceImageUrl({ capa: "https://viajandocomdesconto.com/file.pdf" }) === null, "arquivo não-imagem deve ser rejeitado");
  assert(
    sourceImageUrl({ capa: "https://viajandocomdesconto.com/img/test.png" }) === "https://viajandocomdesconto.com/img/test.png",
    "imagem HTTPS do host permitido deve ser aceita",
  );
});

Deno.test("cache usa impressão da origem e URL transformada fixa", async () => {
  const id = "0191a5f2-ccaa-7f03-8f00-1234567890ab";
  const sourceA = "https://viajandocomdesconto.com/img/a.png";
  const sourceB = "https://viajandocomdesconto.com/img/b.png";
  const pathA = await offerImageCachePath(id, sourceA, "card");
  const pathB = await offerImageCachePath(id, sourceB, "card");
  assert(pathA !== pathB, "mudança de imagem deve invalidar o cache por caminho");
  assert(pathA.startsWith(`${id}/`), "cache deve ficar isolado pelo UUID da oferta");

  const url = transformedPublicUrl("https://project.supabase.co/", pathA, "card");
  assert(url.includes(`/storage/v1/render/image/public/${OFFER_IMAGE_BUCKET}/`), "deve usar render público do Storage");
  assert(url.includes("width=720"), "thumbnail deve limitar largura");
  assert(url.includes("height=405"), "thumbnail deve limitar altura");
  assert(url.includes("quality=72"), "thumbnail deve reduzir peso por qualidade controlada");
});
