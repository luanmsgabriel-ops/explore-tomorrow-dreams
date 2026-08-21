import { validateCalendarFacetsRequest } from "./index.ts";

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
