import { describe, expect, it } from "vitest";

import type { TravelOfferCatalogItem } from "@/lib/travelOffersPublic";
import { liveRouteSummary, liveRoutesFromOffers } from "./liveRoute";

const offer = (overrides: Partial<TravelOfferCatalogItem> = {}): TravelOfferCatalogItem => ({
  kind: "air_block",
  id: crypto.randomUUID(),
  offer_type: "bloqueio_aereo",
  offer_subtype: "bloqueio",
  name: null,
  category: null,
  origin: "São Paulo",
  origin_iata: "GRU",
  destination: "Recife",
  destination_iata: "REC",
  departure_date: "2026-10-10",
  return_date: "2026-10-15",
  nights: 5,
  airline: null,
  price_per_person: 1200,
  tax_per_person: null,
  currency: "BRL",
  available_seats: 8,
  airfare_included: true,
  image_url: null,
  featured: false,
  editorial_order: 0,
  campaign_label: null,
  editorial_subtitle: null,
  updated_at: "2026-09-11T10:00:00Z",
  ...overrides,
});

describe("Tomorrow Live route resolver", () => {
  it("desenha somente uma rota sustentada por origem e destino reais da oferta", () => {
    const routes = liveRoutesFromOffers([offer({ id: "offer-1" })]);

    expect(routes).toHaveLength(1);
    expect(routes[0]).toMatchObject({
      offerId: "offer-1",
      origin: { label: "GRU", iata: "GRU" },
      destination: { label: "REC", iata: "REC" },
    });
    expect(liveRouteSummary(routes)).toBe("GRU → REC");
  });

  it("prioriza a oferta escolhida e limita comparações a três rotas", () => {
    const routes = liveRoutesFromOffers([
      offer({ id: "recife", destination: "Recife", destination_iata: "REC" }),
      offer({ id: "lisboa", destination: "Lisboa", destination_iata: "LIS" }),
      offer({ id: "miami", destination: "Miami", destination_iata: "MIA" }),
      offer({ id: "orlando", destination: "Orlando", destination_iata: "MCO" }),
    ], "miami");

    expect(routes).toHaveLength(3);
    expect(routes[0].offerId).toBe("miami");
    expect(liveRouteSummary(routes)).toBe("GRU → MIA +2");
  });

  it("não inventa arco quando uma localização não possui coordenadas confiáveis", () => {
    expect(liveRoutesFromOffers([
      offer({ destination: "Destino sem mapa", destination_iata: "ZZZ" }),
    ])).toEqual([]);
  });

  it("remove rotas duplicadas entre opções da mesma origem e destino", () => {
    expect(liveRoutesFromOffers([
      offer({ id: "first" }),
      offer({ id: "second", price_per_person: 1350 }),
    ])).toHaveLength(1);
  });
});
