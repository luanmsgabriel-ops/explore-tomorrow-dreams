import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

const fetchDetail = vi.hoisted(() => vi.fn());

vi.mock("@/lib/travelOffersPublic", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/travelOffersPublic")>();
  return { ...original, fetchTravelOfferDetail: fetchDetail };
});

import { parseComparisonIds } from "@/lib/opportunityComparison";
import OpportunityCompare from "./OpportunityCompare";

const airId = "b1652000-0000-4000-8000-000000000001";
const packageId = "548df000-0000-4000-8000-000000000003";

const airItem = {
  kind: "air_block" as const,
  id: airId,
  offer_type: "bloqueio_aereo" as const,
  offer_subtype: "bloqueio" as const,
  origin: "Belém",
  origin_iata: "BEL",
  destination: "Porto Alegre",
  destination_iata: "POA",
  departure_date: "2026-09-10",
  return_date: "2026-09-17",
  nights: 7,
  currency: "BRL",
  available_seats: 5,
  updated_at: "2026-08-20T18:00:00Z",
  price_per_person: 1299,
  tax_per_person: 199,
  airline: "GOL",
  outbound_departure_time: "10:00",
  outbound_arrival_time: "13:00",
  return_departure_time: "14:00",
  return_arrival_time: "17:00",
  issue_deadline: null,
};

const packageItem = {
  kind: "package" as const,
  id: packageId,
  offer_type: "pacote" as const,
  offer_subtype: "internacional" as const,
  origin: null,
  origin_iata: null,
  destination: "Lisboa",
  destination_iata: null,
  departure_date: "2026-10-01",
  return_date: null,
  nights: 7,
  currency: "BRL",
  available_seats: null,
  updated_at: "2026-08-20T18:00:00Z",
  price_per_person: 4290,
  tax_per_person: null,
  name: "Lisboa terrestre",
  category: "Internacional",
  hotel: "Hotel Central",
  meal_plan: "Café da manhã",
  inclusions: ["Hospedagem"],
  promotion: null,
  installment: "10x",
  other_accommodations: [],
  airfare_included: false,
  airfare_price_per_person: null,
  event_specific: false,
  event_name: null,
  ticket_included: false,
  ticket_options: [],
  image_url: null,
};

function renderCompare(query: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/oportunidades/comparar?${query}`]}>
        <OpportunityCompare />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("Comparação de oportunidades", () => {
  beforeEach(() => {
    fetchDetail.mockReset().mockImplementation(async (id: string) => ({
      item: id === airId ? airItem : packageItem,
      updated_at: "2026-08-20T18:19:00Z",
      notice: "Preços e disponibilidade sujeitos à confirmação.",
    }));
  });

  it("valida UUIDs, remove duplicados e limita a três opções", () => {
    expect(parseComparisonIds(`${airId},${airId}`)).toEqual({ ids: [airId], error: null });
    expect(parseComparisonIds("raw_data").error).toBe("invalid");
    expect(parseComparisonIds(`${airId},${packageId},11111111-1111-4111-8111-111111111111,22222222-2222-4222-8222-222222222222`).error).toBe("too_many");
  });

  it("compara ofertas heterogêneas sem inventar taxa, vagas ou aéreo", async () => {
    renderCompare(`ids=${encodeURIComponent(`${airId},${packageId}`)}`);

    expect((await screen.findAllByText(/GOL · Belém/)).length).toBeGreaterThan(0);
    expect(screen.getAllByText("Lisboa terrestre").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Quantidade não informada").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Não calculável sem taxa").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Não incluído").length).toBeGreaterThan(0);
    expect(fetchDetail).toHaveBeenCalledTimes(2);
    expect(screen.getAllByRole("link", { name: "Quero esta oportunidade" })).toHaveLength(2);
  });

  it("não consulta a função para link inválido", () => {
    renderCompare("ids=source_url");
    expect(screen.getByText("Link de comparação inválido")).toBeInTheDocument();
    expect(fetchDetail).not.toHaveBeenCalled();
  });
});
