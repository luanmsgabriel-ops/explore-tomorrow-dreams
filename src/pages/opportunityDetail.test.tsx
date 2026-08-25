import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

const fetchDetail = vi.hoisted(() => vi.fn());

vi.mock("@/lib/travelOffersPublic", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/travelOffersPublic")>();
  return { ...original, fetchTravelOfferDetail: fetchDetail };
});

import OpportunityDetail from "./OpportunityDetail";

const airId = "b1652000-0000-4000-8000-000000000001";

const common = {
  id: airId,
  offer_type: "bloqueio_aereo" as const,
  offer_subtype: "bloqueio" as const,
  origin: "Ribeirão Preto",
  origin_iata: "RAO",
  destination: "Fortaleza",
  destination_iata: "FOR",
  departure_date: "2026-09-10",
  return_date: "2026-09-17",
  nights: 7,
  currency: "BRL",
  available_seats: 5,
  updated_at: "2026-08-20T18:00:00Z",
  price_per_person: 1299,
  tax_per_person: 199,
};

const airDetail = {
  item: {
    ...common,
    kind: "air_block" as const,
    airline: "GOL",
    outbound_departure_time: "10:00",
    outbound_arrival_time: "13:00",
    return_departure_time: "14:00",
    return_arrival_time: "17:00",
    issue_deadline: "2026-09-01T23:59:00-03:00",
  },
  updated_at: "2026-08-20T18:19:00Z",
  notice: "Preços e disponibilidade sujeitos à confirmação.",
};

function renderDetail(id = airId) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/oportunidades/oferta/${id}`]}>
        <Routes><Route path="/oportunidades/oferta/:id" element={<OpportunityDetail />} /></Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("Detalhe público da oportunidade", () => {
  beforeEach(() => {
    fetchDetail.mockReset().mockResolvedValue(airDetail);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
  });

  it("não consulta a Edge Function quando o UUID é inválido", () => {
    renderDetail("raw_data");
    expect(screen.getByText("Identificador inválido")).toBeInTheDocument();
    expect(fetchDetail).not.toHaveBeenCalled();
  });

  it("mostra bloqueio, total calculado e direciona o CTA diretamente ao WhatsApp", async () => {
    renderDetail();
    expect(await screen.findByText(/GOL · Ribeirão Preto/)).toBeInTheDocument();
    expect(screen.getByText("10:00 → 13:00")).toBeInTheDocument();
    expect(screen.getByText(/Total por pessoa:/)).toHaveTextContent("R$ 1.498,00");

    const cta = screen.getByRole("link", { name: "Quero esta oportunidade" });
    const whatsappUrl = new URL(cta.getAttribute("href") ?? "");
    expect(whatsappUrl.origin).toBe("https://wa.me");
    expect(whatsappUrl.pathname).toBe("/5515991833448");
    expect(whatsappUrl.searchParams.get("text")).toContain(airId);
    expect(cta).toHaveAttribute("target", "_blank");
    expect(cta.getAttribute("href")).not.toContain("/teo?offer_id=");

    fireEvent.click(screen.getByRole("button", { name: "Copiar link" }));
    await waitFor(() => expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      `http://localhost:3000/oportunidades/oferta/${airId}`,
    ));
    expect(JSON.stringify(airDetail)).not.toContain("raw_data");
    expect(JSON.stringify(airDetail)).not.toContain("source_url");
  });

  it("distingue pacote sem aéreo e sem quantidade de vagas", async () => {
    fetchDetail.mockResolvedValue({
      ...airDetail,
      item: {
        ...common,
        id: "548df000-0000-4000-8000-000000000003",
        kind: "package",
        offer_type: "pacote",
        offer_subtype: "internacional",
        origin: null,
        origin_iata: null,
        name: "Pacote terrestre",
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
        available_seats: null,
      },
    });
    renderDetail("548df000-0000-4000-8000-000000000003");

    expect(await screen.findByText("Pacote terrestre")).toBeInTheDocument();
    expect(screen.getByText("Quantidade não informada")).toBeInTheDocument();
    expect(screen.getByText("Aéreo incluído").parentElement).toHaveTextContent("Não");
    expect(screen.getByText("Hospedagem")).toBeInTheDocument();
  });

  it("renderiza a estrutura exclusiva de grupo guiado", async () => {
    fetchDetail.mockResolvedValue({
      ...airDetail,
      item: {
        ...common,
        id: "17133000-0000-4000-8000-000000000005",
        kind: "guided_group",
        offer_type: "pacote",
        offer_subtype: "grupo_guiado",
        name: "Inglaterra, Escócia e Irlanda",
        description: "Roteiro acompanhado.",
        category: "GRUPO COM GUIA",
        duration: "15 dias / 14 noites",
        cities: ["Londres", "Dublin"],
        hotels: [{ city: "Londres", name: "Holiday Inn" }],
        inclusions: ["Guia acompanhante"],
        payment: "10 parcelas",
        transport: "Aéreo",
        flight_notes: ["Ida GRU → LHR"],
        price_options: [{ label: "Duplo", total: "R$ 33.682", installment: "10x", featured: true }],
        airfare_included: true,
        airfare_price_per_person: null,
        ticket_included: false,
        image_url: null,
      },
    });
    renderDetail("17133000-0000-4000-8000-000000000005");

    expect(await screen.findByText("Inglaterra, Escócia e Irlanda")).toBeInTheDocument();
    expect(screen.getByText("Holiday Inn")).toBeInTheDocument();
    expect(screen.getByText("Ida GRU → LHR")).toBeInTheDocument();
    expect(screen.getByText("R$ 33.682")).toBeInTheDocument();
  });
});
