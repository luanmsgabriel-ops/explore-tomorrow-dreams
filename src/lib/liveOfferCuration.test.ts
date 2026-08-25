import { describe, expect, it } from "vitest";

import type { TravelOfferCatalogItem } from "@/lib/travelOffersPublic";
import {
  cheapestOfferPerDestination,
  curateLiveOfferBatch,
  userRequestsDestinationComparison,
} from "./liveOfferCuration";

function offer(id: string, destination: string, price: number): TravelOfferCatalogItem {
  return {
    kind: "package",
    id,
    offer_type: "pacote",
    offer_subtype: "nacional",
    name: `${destination} ${price}`,
    category: null,
    origin: "São Paulo",
    origin_iata: "GRU",
    destination,
    destination_iata: null,
    departure_date: "2026-09-10",
    return_date: "2026-09-17",
    nights: 7,
    airline: null,
    price_per_person: price,
    tax_per_person: null,
    currency: "BRL",
    available_seats: null,
    airfare_included: true,
    image_url: null,
    featured: false,
    editorial_order: 0,
    campaign_label: null,
    editorial_subtitle: null,
    updated_at: "2026-08-25T12:00:00Z",
  };
}

describe("Tomorrow Live comparison curation", () => {
  it("detecta pedido explícito de destinos diferentes", () => {
    expect(userRequestsDestinationComparison([
      { id: "1", role: "user", text: "Me mostre três opções de destinos diferentes", final: true },
    ])).toBe(true);
  });

  it("mantém exatamente uma oferta mais barata por destino", () => {
    const items = [
      offer("f1", "Fortaleza", 1400),
      offer("f2", "Fortaleza", 1013),
      offer("m1", "Maceió", 1800),
      offer("m2", "Maceió", 1320),
      offer("p1", "Porto de Galinhas", 1600),
      offer("p2", "Porto de Galinhas", 1250),
    ];

    expect(cheapestOfferPerDestination(items).map((item) => item.id)).toEqual(["f2", "m2", "p2"]);
  });

  it("limita comparação a três destinos e não cria nove cards", () => {
    const first = curateLiveOfferBatch([], [
      offer("f1", "Fortaleza", 1400),
      offer("f2", "Fortaleza", 1013),
      offer("f3", "Fortaleza", 1500),
    ], true);
    const second = curateLiveOfferBatch(first, [offer("p1", "Porto de Galinhas", 1250)], true);
    const third = curateLiveOfferBatch(second, [offer("m1", "Maceió", 1320)], true);

    expect(third).toHaveLength(3);
    expect(third.map((item) => item.destination)).toEqual(["Fortaleza", "Porto de Galinhas", "Maceió"]);
  });
});
