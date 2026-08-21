import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { OfferHandoffSelection } from "@/hooks/useRealtimeVoice";
import type { TravelOfferCatalogItem } from "@/lib/travelOffersPublic";
import { LiveOfferOverlay } from "./LiveOfferOverlay";

const offer = (index: number): TravelOfferCatalogItem => ({
  kind: "package",
  id: `0191a5f2-ccaa-7f03-8f00-1234567890a${index}`,
  offer_type: "pacote",
  offer_subtype: "nacional",
  name: `Pacote Maceió ${index}`,
  category: "Praia",
  origin: "São Paulo",
  origin_iata: "GRU",
  destination: "Maceió",
  destination_iata: "MCZ",
  departure_date: "2026-09-10",
  return_date: "2026-09-17",
  nights: 7,
  airline: null,
  price_per_person: 1800 + index,
  tax_per_person: null,
  currency: "BRL",
  available_seats: null,
  airfare_included: true,
  image_url: null,
  updated_at: "2026-08-21T12:00:00Z",
});

describe("LiveOfferOverlay", () => {
  it("apresenta até três ofertas flutuantes sobre o Live e permite minimizar", () => {
    const offers = [offer(1), offer(2), offer(3)];
    render(<LiveOfferOverlay offers={offers} handoff={null} detailPath={null} whatsappUrl={null} />);

    expect(screen.getByRole("region", { name: "Ofertas encontradas pelo Téo" })).toBeInTheDocument();
    expect(screen.getAllByRole("article")).toHaveLength(3);
    expect(screen.getByRole("link", { name: "Abrir oferta: Pacote Maceió 1" })).toHaveAttribute(
      "href",
      `/oportunidades/oferta/${offers[0].id}`,
    );

    fireEvent.click(screen.getByRole("button", { name: "Minimizar ofertas encontradas" }));
    expect(screen.queryByRole("region", { name: "Ofertas encontradas pelo Téo" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Mostrar 3 ofertas" }));
    expect(screen.getByRole("region", { name: "Ofertas encontradas pelo Téo" })).toBeInTheDocument();
  });

  it("abre a oferta escolhida em pop-up sem remover as opções encontradas", () => {
    const selected = offer(1);
    const handoff: OfferHandoffSelection = {
      requestId: "handoff-1",
      offer: selected,
      requestedChannel: "whatsapp",
      searchContext: { destination: "Maceió", passengers: 2 },
    };
    const detailPath = `/oportunidades/oferta/${selected.id}`;
    const whatsappUrl = "https://wa.me/5515991833448?text=oferta";

    render(<LiveOfferOverlay offers={[selected]} handoff={handoff} detailPath={detailPath} whatsappUrl={whatsappUrl} />);

    expect(screen.getByRole("dialog", { name: "Pacote Maceió 1" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ver oferta" })).toHaveAttribute("href", detailPath);
    expect(screen.getByRole("link", { name: "WhatsApp" })).toHaveAttribute("href", whatsappUrl);
    expect(screen.getByText("O Téo continua falando enquanto você compara as opções.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Fechar oferta escolhida" }));
    expect(screen.queryByRole("dialog", { name: "Pacote Maceió 1" })).not.toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Ofertas encontradas pelo Téo" })).toBeInTheDocument();
  });
});
