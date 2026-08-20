import { beforeEach, describe, expect, it, vi } from "vitest";

const invoke = vi.hoisted(() => vi.fn());

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { functions: { invoke } },
}));

import {
  fetchTravelOfferCatalog,
  fetchTravelOfferDetail,
  fetchTravelOfferFacets,
  isPublicOfferId,
} from "./travelOffersPublic";

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

  it("consulta detail por UUID e rejeita identificador inválido antes da rede", async () => {
    const id = "b1652000-0000-4000-8000-000000000001";
    const response = { item: { id, kind: "air_block" }, notice: "Confirmação necessária" };
    invoke.mockResolvedValue({ data: response, error: null });

    expect(isPublicOfferId(id)).toBe(true);
    await expect(fetchTravelOfferDetail(id)).resolves.toBe(response);
    expect(invoke).toHaveBeenCalledWith("travel-offers-public", {
      body: { action: "detail", params: { id } },
      signal: undefined,
      timeout: 15_000,
    });

    invoke.mockClear();
    await expect(fetchTravelOfferDetail("raw_data")).rejects.toMatchObject({ code: "invalid_uuid" });
    expect(invoke).not.toHaveBeenCalled();
  });
});
