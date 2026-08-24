import { describe, expect, it } from "vitest";

import { DEFAULT_CATALOG_FILTERS, catalogParamsFromFilters } from "./catalogFilterState";

describe("catalogParamsFromFilters", () => {
  it("consulta Recife por REC quando o tipo é bloqueio aéreo", () => {
    expect(catalogParamsFromFilters({
      ...DEFAULT_CATALOG_FILTERS,
      offerType: "bloqueio_aereo",
      destination: "Recife",
    }, 1)).toMatchObject({
      offer_type: "bloqueio_aereo",
      destination_iata: "REC",
      page: 1,
      per_page: 18,
    });
  });

  it("preserva Porto de Galinhas como destino de pacote", () => {
    const params = catalogParamsFromFilters({
      ...DEFAULT_CATALOG_FILTERS,
      offerType: "pacote",
      destination: "Porto de Galinhas",
    }, 1);
    expect(params.destination).toBe("Porto de Galinhas");
    expect(params.destination_iata).toBeUndefined();
  });
});
