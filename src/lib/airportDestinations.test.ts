import { describe, expect, it } from "vitest";

import {
  airportIataForDestinationCity,
  canonicalAirBlockDestination,
  canonicalAirBlockFacetDestination,
  sourceAirBlockDestinationForCity,
} from "./airportDestinations";

describe("airport destination semantics", () => {
  it("usa a cidade real do aeroporto para bloqueios conhecidos", () => {
    expect(canonicalAirBlockDestination("REC", "Porto de Galinhas")).toBe("Recife");
    expect(canonicalAirBlockDestination("POA", "Gramado")).toBe("Porto Alegre");
    expect(canonicalAirBlockDestination("MCZ", "Maceió")).toBe("Maceió");
  });

  it("resolve a cidade pesquisada para o IATA real", () => {
    expect(airportIataForDestinationCity("Recife")).toBe("REC");
    expect(airportIataForDestinationCity("RECIFE")).toBe("REC");
    expect(airportIataForDestinationCity("Porto Alegre")).toBe("POA");
  });

  it("converte apenas os rótulos de fornecedor conhecidos nas facetas", () => {
    expect(canonicalAirBlockFacetDestination("Porto de Galinhas")).toBe("Recife");
    expect(canonicalAirBlockFacetDestination("Gramado")).toBe("Porto Alegre");
    expect(canonicalAirBlockFacetDestination("Maceió")).toBe("Maceió");
  });

  it("traduz a cidade canônica de volta ao rótulo necessário para a RPC existente", () => {
    expect(sourceAirBlockDestinationForCity("Recife")).toBe("Porto de Galinhas");
    expect(sourceAirBlockDestinationForCity("Porto Alegre")).toBe("Gramado");
    expect(sourceAirBlockDestinationForCity("Maceió")).toBe("Maceió");
  });
});
