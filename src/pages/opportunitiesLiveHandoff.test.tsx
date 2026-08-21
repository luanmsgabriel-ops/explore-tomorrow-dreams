import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const offer = {
  kind: "package" as const,
  id: "0191a5f2-ccaa-7f03-8f00-1234567890ab",
  offer_type: "pacote" as const,
  offer_subtype: "nacional" as const,
  name: "Maceió em setembro",
  category: "Praia",
  origin: "São Paulo",
  origin_iata: "GRU",
  destination: "Maceió",
  destination_iata: "MCZ",
  departure_date: "2026-09-10",
  return_date: "2026-09-17",
  nights: 7,
  airline: null,
  price_per_person: 1800,
  tax_per_person: null,
  currency: "BRL",
  available_seats: 4,
  airfare_included: true,
  image_url: null,
  updated_at: "2026-08-21T12:00:00Z",
};

vi.mock("@/hooks/useRealtimeVoice", () => ({
  useRealtimeVoice: () => ({
    status: "offers",
    connected: true,
    muted: false,
    speakerEnabled: true,
    audioLevel: 0,
    transcript: [],
    offers: [offer],
    offerHandoff: { offer, requestedChannel: "whatsapp" },
    toolError: null,
    error: null,
    startConversation: vi.fn(),
    endConversation: vi.fn(),
    toggleMute: vi.fn(),
    toggleSpeaker: vi.fn(),
  }),
}));

import OpportunitiesLive from "./OpportunitiesLive";

describe("Tomorrow Live — handoff da oferta", () => {
  beforeEach(() => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("apresenta página real e WhatsApp preenchido para a escolha validada", () => {
    render(<OpportunitiesLive />);

    expect(screen.getByText("Oferta escolhida")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ver oferta" })).toHaveAttribute(
      "href",
      `/oportunidades/oferta/${offer.id}`,
    );
    const whatsapp = screen.getByRole("link", { name: "WhatsApp" });
    expect(whatsapp).toHaveAttribute("target", "_blank");
    const url = new URL(whatsapp.getAttribute("href")!);
    expect(url.origin).toBe("https://wa.me");
    expect(url.searchParams.get("text")).toContain(offer.id);
    expect(url.searchParams.get("text")).toContain("Maceió em setembro");
  });
});
