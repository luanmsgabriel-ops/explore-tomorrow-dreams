const AIRPORT_DESTINATION_BY_IATA: Record<string, string> = {
  REC: "Recife",
  POA: "Porto Alegre",
};

const AIR_BLOCK_SOURCE_DESTINATION_BY_IATA: Record<string, string> = {
  REC: "Porto de Galinhas",
  POA: "Gramado",
};

function normalizeAirportLookup(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const AIRPORT_IATA_BY_CITY = Object.fromEntries(
  Object.entries(AIRPORT_DESTINATION_BY_IATA).map(([iata, city]) => [normalizeAirportLookup(city), iata]),
);

const AIRPORT_IATA_BY_SOURCE_DESTINATION = Object.fromEntries(
  Object.entries(AIR_BLOCK_SOURCE_DESTINATION_BY_IATA).map(([iata, destination]) => [normalizeAirportLookup(destination), iata]),
);

export function canonicalAirBlockDestination(destinationIata: string | null, fallback: string | null) {
  if (!destinationIata) return fallback;
  return AIRPORT_DESTINATION_BY_IATA[destinationIata.toUpperCase()] ?? fallback;
}

export function airportIataForDestinationCity(value: string | null | undefined) {
  if (!value) return null;
  return AIRPORT_IATA_BY_CITY[normalizeAirportLookup(value)] ?? null;
}

export function canonicalAirBlockFacetDestination(value: string) {
  const iata = AIRPORT_IATA_BY_SOURCE_DESTINATION[normalizeAirportLookup(value)];
  return iata ? AIRPORT_DESTINATION_BY_IATA[iata] : value;
}

export function sourceAirBlockDestinationForCity(value: string | null | undefined) {
  const iata = airportIataForDestinationCity(value);
  return iata ? AIR_BLOCK_SOURCE_DESTINATION_BY_IATA[iata] ?? value ?? null : value ?? null;
}
