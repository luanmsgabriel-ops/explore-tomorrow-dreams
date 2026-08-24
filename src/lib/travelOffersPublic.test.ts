import { beforeEach, describe, expect, it, vi } from "vitest";

const invoke = vi.hoisted(() => vi.fn());

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { functions: { invoke } },
}));

import {
  fetchTravelCalendarFacets,
  fetchTravelCatalogFacets,
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

  it("consulta calendar_facets sem acessar a tabela no frontend", async () => {
    const response = {
      origins: [{ value: "São Paulo", count: 10 }],
      destinations: [{ value: "Recife", count: 4 }],
      date_range: { min: "2026-09-10", max: "2027-01-10" },
      price_ranges: [{ currency: "BRL", min: 999, max: 3999 }],
      updated_at: "2026-08-21T02:00:00Z",
      notice: "Confirmação necessária",
    };
    invoke.mockResolvedValue({ data: response, error: null });

    await expect(fetchTravelCalendarFacets({
      origin: "São Paulo",
      offer_type: "pacote",
    })).resolves.toBe(response);

    expect(invoke).toHaveBeenCalledWith("travel-offers-public", {
      body: {
        action: "calendar_facets",
        params: { origin: "São Paulo", offer_type: "pacote" },
      },
      signal: undefined,
      timeout: 15_000,
    });
  });

  it("consulta catalog_facets com filtros contextuais e preserva grupos guiados", async () => {
    const response = {
      origins: [{ value: "São Paulo", count: 3 }],
      destinations: [{ value: "Buenos Aires", count: 2 }],
      categories: [{ value: "Grupo guiado", count: 2 }],
      date_range: { min: "2026-10-01", max: "2026-12-01" },
      price_ranges: [{ currency: "BRL", min: 4000, max: 8000 }],
      updated_at: "2026-08-24T02:00:00Z",
      notice: "Confirmação necessária",
    };
    invoke.mockResolvedValue({ data: response, error: null });

    await expect(fetchTravelCatalogFacets({
      offer_type: "pacote",
      subtype: "grupo_guiado",
      origin: "São Paulo",
    })).resolves.toBe(response);

    expect(invoke).toHaveBeenCalledWith("travel-offers-public", {
      body: {
        action: "catalog_facets",
        params: { offer_type: "pacote", subtype: "grupo_guiado", origin: "São Paulo" },
      },
      signal: undefined,
      timeout: 15_000,
    });
  });

  it("troca o rótulo turístico pelo destino aeroportuário em bloqueios", async () => {
    const response = {
      origins: [{ value: "São Paulo", count: 10 }],
      destinations: [{ value: "Porto de Galinhas", count: 4 }],
      categories: [{ value: "Bloqueio aéreo", count: 4 }],
      date_range: { min: "2026-09-10", max: "2027-01-10" },
      price_ranges: [{ currency: "BRL", min: 999, max: 3999 }],
      updated_at: "2026-08-24T02:00:00Z",
      notice: "Confirmação necessária",
    };
    invoke.mockResolvedValue({ data: response, error: null });

    await expect(fetchTravelCatalogFacets({ offer_type: "bloqueio_aereo" })).resolves.toMatchObject({
      destinations: [{ value: "Recife", count: 4 }],
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

  it("consulta detail por UUID, corrige REC e rejeita identificador inválido antes da rede", async () => {
    const id = "b1652000-0000-4000-8000-000000000001";
    const response = {
      item: {
        id,
        kind: "air_block",
        destination: "Porto de Galinhas",
        destination_iata: "REC",
      },
      notice: "Confirmação necessária",
    };
    invoke.mockResolvedValue({ data: response, error: null });

    expect(isPublicOfferId(id)).toBe(true);
    await expect(fetchTravelOfferDetail(id)).resolves.toMatchObject({
      item: { id, kind: "air_block", destination: "Recife", destination_iata: "REC" },
    });
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
