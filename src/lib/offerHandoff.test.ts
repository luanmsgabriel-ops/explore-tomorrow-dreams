import { describe, expect, it } from "vitest";

import type { TravelOfferCatalogItem } from "./travelOffersPublic";
import {
  buildOfferDetailPath,
  buildOfferWhatsAppMessage,
  buildOfferWhatsAppUrl,
  travelHandoffContextFromCatalogParams,
} from "./offerHandoff";

const offer: TravelOfferCatalogItem = {
  kind: "package",
  id: "0191a5f2-ccaa-7f03-8f00-1234567890ab",
  offer_type: "pacote",
  offer_subtype: "nacional",
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

describe("offer handoff", () => {
  it("monta a página pública a partir do ID real", () => {
    expect(buildOfferDetailPath(offer.id)).toBe(`/oportunidades/oferta/${offer.id}`);
  });

  it("preenche a mensagem somente com os dados públicos presentes", () => {
    const message = buildOfferWhatsAppMessage(
      offer,
      `https://tomorrowtravelbr.com.br/oportunidades/oferta/${offer.id}`,
    );

    expect(message).toContain("Maceió em setembro");
    expect(message).toContain("São Paulo (GRU) → Maceió (MCZ)");
    expect(message).toContain("Período: 10/09/2026 a 17/09/2026");
    expect(message).toContain("Valor por pessoa: R$ 1.800,00");
    expect(message).toContain(`Código da oferta: ${offer.id}`);
    expect(message).not.toContain("Hotel:");
    expect(message).not.toContain("Taxa:");
  });

  it("gera um link wa.me codificado sem enviar a mensagem automaticamente", () => {
    const url = buildOfferWhatsAppUrl(offer, { origin: "https://tomorrowtravelbr.com.br" });
    const parsed = new URL(url);

    expect(parsed.origin).toBe("https://wa.me");
    expect(parsed.pathname).toBe("/5515991833448");
    expect(parsed.searchParams.get("text")).toContain(offer.id);
    expect(parsed.searchParams.get("text")).toContain("Tomorrow Live");
  });

  it("leva somente preferências estruturadas da busca para o WhatsApp", () => {
    const context = travelHandoffContextFromCatalogParams({
      search: "texto livre que não deve ir para o WhatsApp",
      origin: "Sorocaba",
      destination: "Maceió",
      start_date: "2026-09-01",
      end_date: "2026-09-30",
      passengers: 2,
      offer_type: "pacote",
      sort: "date_asc",
      page: 1,
      per_page: 3,
    });
    const url = buildOfferWhatsAppUrl(offer, { context });
    const message = new URL(url).searchParams.get("text") ?? "";

    expect(message).toContain("Preferências informadas no Tomorrow Live:");
    expect(message).toContain("Origem desejada: Sorocaba");
    expect(message).toContain("Destino desejado: Maceió");
    expect(message).toContain("Período desejado: 01/09/2026 a 30/09/2026");
    expect(message).toContain("2 passageiros");
    expect(message).toContain("Tipo procurado: Pacote");
    expect(message).not.toContain("texto livre que não deve ir");
  });
});
