import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const api = vi.hoisted(() => ({
  fetchFacets: vi.fn(),
  fetchCatalog: vi.fn(),
}));

vi.mock("@/lib/travelOffersPublic", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/travelOffersPublic")>();
  return {
    ...original,
    fetchTravelOfferFacets: api.fetchFacets,
    fetchTravelOfferCatalog: api.fetchCatalog,
  };
});

import { catalogParamsFromFilters, DEFAULT_CATALOG_FILTERS, validateCatalogFilters } from "@/components/opportunities";
import OpportunitiesCatalog from "./OpportunitiesCatalog";

const facets = {
  offer_types: [{ value: "bloqueio_aereo", count: 9209 }, { value: "pacote", count: 1045 }],
  subtypes: [
    { value: "bloqueio", count: 9209 },
    { value: "nacional", count: 766 },
    { value: "internacional", count: 215 },
    { value: "evento", count: 43 },
    { value: "grupo_guiado", count: 21 },
  ],
  origins: [{ value: "Belém", count: 120 }],
  origin_airports: [{ value: "BEL", count: 120 }],
  destinations: [{ value: "João Pessoa", count: 80 }, { value: "Porto Alegre", count: 40 }],
  destination_airports: [{ value: "JPA", count: 80 }, { value: "POA", count: 40 }],
  categories: [{ value: "Nacional", count: 766 }],
  date_range: { min: "2026-08-24", max: "2027-11-30" },
  price_ranges: [{ currency: "BRL", min: 499, max: 22000 }],
  updated_at: "2026-08-20T18:19:00.000Z",
  notice: "Preços e disponibilidade estão sujeitos à confirmação no momento da reserva.",
};

const catalog = {
  items: [
    {
      kind: "air_block" as const,
      id: "b1652000-0000-4000-8000-000000000001",
      offer_type: "bloqueio_aereo" as const,
      offer_subtype: "bloqueio" as const,
      name: null,
      category: "Bloqueio aéreo",
      origin: "Belém",
      origin_iata: "BEL",
      destination: "Porto Alegre",
      destination_iata: "POA",
      departure_date: "2026-08-25",
      return_date: "2026-09-01",
      nights: 7,
      airline: "GOL",
      price_per_person: 1499,
      tax_per_person: 89,
      currency: "BRL",
      available_seats: 5,
      airfare_included: true,
      image_url: null,
      updated_at: "2026-08-20T18:00:00Z",
    },
    {
      kind: "package" as const,
      id: "02519000-0000-4000-8000-000000000002",
      offer_type: "pacote" as const,
      offer_subtype: "internacional" as const,
      name: "João Pessoa Essencial",
      category: "Internacional",
      origin: null,
      origin_iata: null,
      destination: "João Pessoa",
      destination_iata: "JPA",
      departure_date: "2026-09-10",
      return_date: null,
      nights: 7,
      airline: null,
      price_per_person: 2499,
      tax_per_person: null,
      currency: "BRL",
      available_seats: null,
      airfare_included: false,
      image_url: null,
      updated_at: "2026-08-20T18:00:00Z",
    },
  ],
  page: 1,
  per_page: 18,
  total: 20,
  total_pages: 2,
  applied_filters: { sort: "date_asc", page: 1, per_page: 18 },
  updated_at: "2026-08-20T18:19:00.000Z",
  notice: facets.notice,
};

function renderCatalog() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <OpportunitiesCatalog />
    </QueryClientProvider>,
  );
}

describe("Catálogo de oportunidades", () => {
  beforeEach(() => {
    window.localStorage.clear();
    api.fetchFacets.mockReset().mockResolvedValue(facets);
    api.fetchCatalog.mockReset().mockResolvedValue(catalog);
  });

  it("consulta a página real e diferencia bloqueio de pacote sem inventar vagas ou aéreo", async () => {
    const { container } = renderCatalog();

    expect(await screen.findByText("GOL")).toBeInTheDocument();
    expect(screen.getByText("João Pessoa Essencial")).toBeInTheDocument();
    expect(api.fetchCatalog).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, per_page: 18, sort: "date_asc" }),
      expect.any(AbortSignal),
    );

    const packageCard = container.querySelector('[data-offer-id="02519000-0000-4000-8000-000000000002"]');
    expect(packageCard).not.toBeNull();
    expect(within(packageCard as HTMLElement).getByText("Aéreo não incluído")).toBeInTheDocument();
    expect(within(packageCard as HTMLElement).queryByText(/vagas/i)).not.toBeInTheDocument();
  });

  it("envia filtros compatíveis ao contrato e reinicia na primeira página", async () => {
    renderCatalog();
    await screen.findByText("GOL");

    fireEvent.change(screen.getByLabelText("Origem"), { target: { value: "Belém" } });
    fireEvent.change(screen.getByLabelText("Passageiros"), { target: { value: "2" } });
    fireEvent.click(screen.getByRole("button", { name: "Aplicar filtros" }));

    await waitFor(() => expect(api.fetchCatalog).toHaveBeenLastCalledWith(
      expect.objectContaining({ origin: "Belém", passengers: 2, page: 1, per_page: 18 }),
      expect.any(AbortSignal),
    ));
  });

  it("bloqueia busca inválida antes de consultar a função", async () => {
    renderCatalog();
    await screen.findByText("GOL");
    const initialCalls = api.fetchCatalog.mock.calls.length;

    fireEvent.change(screen.getByLabelText("Buscar"), { target: { value: "Rio!" } });
    fireEvent.click(screen.getByRole("button", { name: "Aplicar filtros" }));

    expect(await screen.findByText("Use até 80 caracteres, sem símbolos especiais.")).toBeInTheDocument();
    expect(api.fetchCatalog).toHaveBeenCalledTimes(initialCalls);
  });

  it("faz paginação no servidor", async () => {
    api.fetchCatalog.mockImplementation(async (params) => ({ ...catalog, page: params.page }));
    renderCatalog();
    await screen.findByText("GOL");

    fireEvent.click(screen.getByRole("button", { name: "Próxima" }));

    await waitFor(() => expect(api.fetchCatalog).toHaveBeenLastCalledWith(
      expect.objectContaining({ page: 2 }),
      expect.any(AbortSignal),
    ));
  });

  it("mantém favoritos somente no navegador", async () => {
    renderCatalog();
    await screen.findByText("GOL");

    const favorite = screen.getAllByRole("button", { name: "Adicionar aos favoritos" })[0];
    fireEvent.click(favorite);

    expect(screen.getByRole("button", { name: "Remover dos favoritos" })).toHaveAttribute("aria-pressed", "true");
    expect(window.localStorage.getItem("tomorrow-opportunity-favorites-v1")).toContain("b1652000");
  });

  it("mantém limites e nomes exatos ao montar os parâmetros", () => {
    const invalid = validateCatalogFilters({
      ...DEFAULT_CATALOG_FILTERS,
      passengers: "21",
      startDate: "2026-09-10",
      endDate: "2026-09-01",
    });
    expect(invalid.passengers).toBeTruthy();
    expect(invalid.endDate).toBeTruthy();

    expect(catalogParamsFromFilters({
      ...DEFAULT_CATALOG_FILTERS,
      destination: "João Pessoa",
      onlyWithSeats: true,
    }, 3)).toEqual(expect.objectContaining({
      destination: "João Pessoa",
      only_with_seats: true,
      page: 3,
      per_page: 18,
    }));
  });
});
