import { validateCalendarFacetsRequest, validateCatalogFacetsRequest } from "./index.ts";

const assert = (condition: unknown, message: string) => {
  if (!condition) throw new Error(message);
};

Deno.test("calendar_facets aceita origem canônica e tipo permitido", () => {
  const result = validateCalendarFacetsRequest({
    action: "calendar_facets",
    params: { origin: "São Paulo", offer_type: "pacote" },
  });
  assert(result.origin === "São Paulo", "origem não preservada");
  assert(result.destination === null, "destino deveria ser nulo");
  assert(result.offer_type === "pacote", "tipo não preservado");
});

Deno.test("calendar_facets rejeita parâmetros fora do contrato", () => {
  let failed = false;
  try {
    validateCalendarFacetsRequest({
      action: "calendar_facets",
      params: { origin: "São Paulo", raw_data: true },
    });
  } catch {
    failed = true;
  }
  assert(failed, "raw_data não pode ser aceito no contrato público");
});

Deno.test("catalog_facets aceita filtros contextuais do catálogo", () => {
  const result = validateCatalogFacetsRequest({
    action: "catalog_facets",
    params: {
      offer_type: "pacote",
      subtype: "grupo_guiado",
      origin: "São Paulo",
      destination: "Buenos Aires",
      category: "Grupo guiado",
    },
  });
  assert(result.offer_type === "pacote", "tipo não preservado");
  assert(result.subtype === "grupo_guiado", "subtipo não preservado");
  assert(result.origin === "São Paulo", "origem não preservada");
  assert(result.destination === "Buenos Aires", "destino não preservado");
  assert(result.category === "Grupo guiado", "categoria não preservada");
});

Deno.test("catalog_facets rejeita subtipo incompatível com bloqueio aéreo", () => {
  let failed = false;
  try {
    validateCatalogFacetsRequest({
      action: "catalog_facets",
      params: { offer_type: "bloqueio_aereo", subtype: "nacional" },
    });
  } catch {
    failed = true;
  }
  assert(failed, "subtipo incompatível deveria falhar");
});
