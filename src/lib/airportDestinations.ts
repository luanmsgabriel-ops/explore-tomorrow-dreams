const AIRPORT_DESTINATION_BY_IATA: Record<string, string> = {
  REC: "Recife",
  POA: "Porto Alegre",
};

const AIRPORT_IATA_BY_CITY = Object.fromEntries(
  Object.entries(AIRPORT_DESTINATION_BY_IATA).map(([iata, city]) => [normalizeAirportLookup(city), iata]),
);

function normalizeAirportLookup(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function canonicalAirBlockDestination(destinationIata: string | null, fallback: string | null) {
  if (!destinationIata) return fallback;
  return AIRPORT_DESTINATION_BY_IATA[destinationIata.toUpperCase()] ?? fallback;
}

export function airportIataForDestinationCity(value: string | null | undefined) {
  if (!value) return null;
  return AIRPORT_IATA_BY_CITY[normalizeAirportLookup(value)] ?? null;
}
