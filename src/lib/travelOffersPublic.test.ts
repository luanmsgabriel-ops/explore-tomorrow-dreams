import { beforeEach, describe, expect, it, vi } from "vitest";

const invoke = vi.hoisted(() => vi.fn());

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { functions: { invoke } },
}));

import { fetchTravelOfferCatalog, fetchTravelOfferFacets } from "./travelOffersPublic";

describe("cliente público de ofertas", () => {
  beforeEach(() => invoke.mockReset());

  it("consulta facets somente pela Edge Function pública", async () => {
    const response = { offer_types: [], subtypes: [], notice: "Confirmação necessária" };
    invoke.mockResolvedValue({ data: response, error: null });
    const controller = new AbortController();

    await expect(fetchTravelOfferFacets(controller.signal)).resolves.toBe(response);
    expect(invoke).toHaveBeenCalledWith("travel-offers-public", {
      body: { action: "facets", params: {} },
      signal: controller.signal,
      timeout: 15_000,
    });
  });

  it("mantém paginação e ordenação no contrato catalog", async () => {
    const response = { items: [], page: 2, per_page: 18, total: 0, total_pages: 0 };
    invoke.mockResolvedValue({ data: response, error: null });

    await fetchTravelOfferCatalog({
      destination: "Recife",
      passengers: 2,
      sort: "price_asc",
      page: 2,
      per_page: 18,
    });

    expect(invoke).toHaveBeenCalledWith("travel-offers-public", {
      body: {
        action: "catalog",
        params: {
          destination: "Recife",
          passengers: 2,
          sort: "price_asc",
          page: 2,
          per_page: 18,
        },
      },
      signal: undefined,
      timeout: 15_000,
    });
  });
});
