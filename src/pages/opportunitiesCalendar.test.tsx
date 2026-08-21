import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const api = vi.hoisted(() => ({
  fetchCalendarFacets: vi.fn(),
  fetchCatalog: vi.fn(),
  fetchCalendar: vi.fn(),
}));

vi.mock("@/lib/travelOffersPublic", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/travelOffersPublic")>();
  return {
    ...original,
    fetchTravelCalendarFacets: api.fetchCalendarFacets,
    fetchTravelOfferCatalog: api.fetchCatalog,
  };
});

vi.mock("@/lib/opportunityCalendar", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/opportunityCalendar")>();
  return {
    ...original,
    fetchOpportunityCalendar: api.fetchCalendar,
  };
});

import OpportunitiesCalendar from "./OpportunitiesCalendar";

const notice = "Preços e disponibilidade estão sujeitos à confirmação no momento da reserva.";

function facets(params: Record<string, unknown>) {
  if (params.offer_type === "bloqueio_aereo" && params.origin === "São Paulo") {
    return {
      origins: [{ value: "São Paulo", count: 5 }],
      destinations: [{ value: "Natal", count: 3 }],
      date_range: { min: "2026-08-24", max: "2027-08-30" },
      price_ranges: [{ currency: "BRL", min: 1200, max: 4200 }],
      updated_at: "2026-08-21T02:00:00Z",
      notice,
    };
  }
  if (params.origin === "São Paulo" && params.destination === "Recife") {
    return {
      origins: [{ value: "São Paulo", count: 8 }],
      destinations: [{ value: "Recife", count: 4 }],
      date_range: { min: "2026-08-24", max: "2027-08-30" },
      price_ranges: [{ currency: "BRL", min: 1200, max: 4200 }],
      updated_at: "2026-08-21T02:00:00Z",
      notice,
    };
  }
  if (params.origin === "São Paulo") {
    return {
      origins: [{ value: "São Paulo", count: 8 }],
      destinations: [{ value: "Natal", count: 3 }, { value: "Recife", count: 4 }],
      date_range: { min: "2026-08-24", max: "2027-08-30" },
      price_ranges: [{ currency: "BRL", min: 1200, max: 4200 }],
      updated_at: "2026-08-21T02:00:00Z",
      notice,
    };
  }
  return {
    origins: [{ value: "Londrina", count: 5 }, { value: "São Paulo", count: 8 }],
    destinations: [],
    date_range: { min: "2026-08-24", max: "2027-08-30" },
    price_ranges: [{ currency: "BRL", min: 1200, max: 4200 }],
    updated_at: "2026-08-21T02:00:00Z",
    notice,
  };
}

function renderCalendar() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <OpportunitiesCalendar />
    </QueryClientProvider>,
  );
}

describe("Calendário de oportunidades", () => {
  beforeEach(() => {
    api.fetchCalendarFacets.mockReset().mockImplementation(async (params) => facets(params));
    api.fetchCatalog.mockReset().mockResolvedValue({ items: [], total: 0, page: 1, per_page: 50, total_pages: 0, notice });
    api.fetchCalendar.mockReset().mockImplementation(async (params) => ({
      start_date: params.start_date,
      end_date: params.end_date,
      passengers: params.passengers,
      total_options: 0,
      dates: [],
      updated_at: "2026-08-21T02:00:00Z",
      notice,
    }));
  });

  it("remove a data de referência e não consulta calendário antes da confirmação", async () => {
    renderCalendar();
    await screen.findByRole("option", { name: "São Paulo" });

    expect(screen.queryByText("Data de referência")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Data de referência")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Destino")).toBeDisabled();
    expect(api.fetchCalendar).not.toHaveBeenCalled();
  });

  it("carrega somente destinos vinculados à origem e limpa o destino ao trocar origem", async () => {
    renderCalendar();
    await screen.findByRole("option", { name: "São Paulo" });

    fireEvent.change(screen.getByLabelText("Origem"), { target: { value: "São Paulo" } });
    expect(await screen.findByRole("option", { name: "Recife" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Natal" })).toBeInTheDocument();
    expect(api.fetchCalendarFacets).toHaveBeenCalledWith(
      expect.objectContaining({ origin: "São Paulo" }),
      expect.any(AbortSignal),
    );

    fireEvent.change(screen.getByLabelText("Destino"), { target: { value: "Recife" } });
    expect(screen.getByLabelText("Destino")).toHaveValue("Recife");
    fireEvent.change(screen.getByLabelText("Origem"), { target: { value: "Londrina" } });
    expect(screen.getByLabelText("Destino")).toHaveValue("");
  });

  it("preserva origem e destino ao trocar o tipo quando a rota continua válida", async () => {
    renderCalendar();
    await screen.findByRole("option", { name: "São Paulo" });

    fireEvent.change(screen.getByLabelText("Origem"), { target: { value: "São Paulo" } });
    await screen.findByRole("option", { name: "Recife" });
    fireEvent.change(screen.getByLabelText("Destino"), { target: { value: "Recife" } });

    fireEvent.change(screen.getByLabelText("Tipo"), { target: { value: "pacote" } });

    await waitFor(() => expect(api.fetchCalendarFacets).toHaveBeenCalledWith(
      expect.objectContaining({ origin: "São Paulo", offer_type: "pacote" }),
      expect.any(AbortSignal),
    ));
    expect(screen.getByLabelText("Origem")).toHaveValue("São Paulo");
    expect(screen.getByLabelText("Destino")).toHaveValue("Recife");
    expect(api.fetchCalendar).not.toHaveBeenCalled();
  });

  it("limpa somente o destino quando ele deixa de existir no novo tipo", async () => {
    renderCalendar();
    await screen.findByRole("option", { name: "São Paulo" });

    fireEvent.change(screen.getByLabelText("Origem"), { target: { value: "São Paulo" } });
    await screen.findByRole("option", { name: "Recife" });
    fireEvent.change(screen.getByLabelText("Destino"), { target: { value: "Recife" } });

    fireEvent.change(screen.getByLabelText("Tipo"), { target: { value: "bloqueio_aereo" } });

    await waitFor(() => expect(screen.getByLabelText("Destino")).toHaveValue(""));
    expect(screen.getByLabelText("Origem")).toHaveValue("São Paulo");
    expect(screen.getByLabelText("Tipo")).toHaveValue("bloqueio_aereo");
  });

  it("abre na primeira data real e carrega nova janela somente ao avançar além da cobertura", async () => {
    renderCalendar();
    await screen.findByRole("option", { name: "São Paulo" });
    fireEvent.change(screen.getByLabelText("Origem"), { target: { value: "São Paulo" } });
    await screen.findByRole("option", { name: "Recife" });
    fireEvent.change(screen.getByLabelText("Destino"), { target: { value: "Recife" } });

    expect(api.fetchCalendar).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Consultar calendário" }));

    await waitFor(() => expect(api.fetchCalendar).toHaveBeenCalledTimes(1));
    expect(api.fetchCalendar).toHaveBeenLastCalledWith(
      expect.objectContaining({
        origin: "São Paulo",
        destination: "Recife",
        start_date: "2026-08-24",
        end_date: "2026-12-22",
      }),
      expect.any(AbortSignal),
    );
    expect(await screen.findByText("Agosto de 2026")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Próximo mês" }));
    fireEvent.click(screen.getByRole("button", { name: "Próximo mês" }));
    fireEvent.click(screen.getByRole("button", { name: "Próximo mês" }));
    expect(api.fetchCalendar).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: "Próximo mês" }));
    await waitFor(() => expect(api.fetchCalendar).toHaveBeenCalledTimes(2));
    expect(api.fetchCalendar).toHaveBeenLastCalledWith(
      expect.objectContaining({
        start_date: "2026-12-23",
      }),
      expect.any(AbortSignal),
    );
  });
});
