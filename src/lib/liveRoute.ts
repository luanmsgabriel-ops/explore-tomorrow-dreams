import type { TravelOfferCatalogItem } from "@/lib/travelOffersPublic";

export type LiveRoutePoint = {
  lat: number;
  lng: number;
  label: string;
  iata: string | null;
};

export type LiveGlobeRoute = {
  id: string;
  offerId: string;
  origin: LiveRoutePoint;
  destination: LiveRoutePoint;
};

type Coordinates = { lat: number; lng: number };

const AIRPORT_COORDINATES: Record<string, Coordinates> = {
  GRU: { lat: -23.4356, lng: -46.4731 },
  CGH: { lat: -23.6261, lng: -46.6566 },
  VCP: { lat: -23.0074, lng: -47.1345 },
  GIG: { lat: -22.809, lng: -43.2506 },
  SDU: { lat: -22.9105, lng: -43.1631 },
  BSB: { lat: -15.8697, lng: -47.9208 },
  CNF: { lat: -19.6244, lng: -43.9719 },
  SSA: { lat: -12.9086, lng: -38.3225 },
  REC: { lat: -8.1265, lng: -34.9236 },
  FOR: { lat: -3.7763, lng: -38.5326 },
  MCZ: { lat: -9.5108, lng: -35.7917 },
  NAT: { lat: -5.7681, lng: -35.3761 },
  JPA: { lat: -7.1458, lng: -34.9486 },
  AJU: { lat: -10.984, lng: -37.0703 },
  VIX: { lat: -20.258, lng: -40.286 },
  POA: { lat: -29.9944, lng: -51.1714 },
  FLN: { lat: -27.6703, lng: -48.5525 },
  CWB: { lat: -25.5285, lng: -49.1758 },
  IGU: { lat: -25.6003, lng: -54.485 },
  NVT: { lat: -26.8799, lng: -48.6514 },
  CXJ: { lat: -29.1971, lng: -51.1875 },
  RAO: { lat: -21.1364, lng: -47.7767 },
  SJP: { lat: -20.8166, lng: -49.4065 },
  BEL: { lat: -1.3793, lng: -48.4763 },
  MAO: { lat: -3.0386, lng: -60.0497 },
  SLZ: { lat: -2.5854, lng: -44.2341 },
  THE: { lat: -5.0599, lng: -42.8235 },
  IOS: { lat: -14.8159, lng: -39.0332 },
  BPS: { lat: -16.4386, lng: -39.0809 },
  LIS: { lat: 38.7742, lng: -9.1342 },
  MAD: { lat: 40.4983, lng: -3.5676 },
  BCN: { lat: 41.2974, lng: 2.0833 },
  CDG: { lat: 49.0097, lng: 2.5479 },
  ORY: { lat: 48.7262, lng: 2.3652 },
  FCO: { lat: 41.8003, lng: 12.2389 },
  AMS: { lat: 52.3105, lng: 4.7683 },
  ATH: { lat: 37.9364, lng: 23.9445 },
  DXB: { lat: 25.2532, lng: 55.3657 },
  MIA: { lat: 25.7959, lng: -80.287 },
  MCO: { lat: 28.4312, lng: -81.3081 },
  JFK: { lat: 40.6413, lng: -73.7781 },
  LAS: { lat: 36.084, lng: -115.1537 },
  LAX: { lat: 33.9416, lng: -118.4085 },
  SCL: { lat: -33.3929, lng: -70.7858 },
  EZE: { lat: -34.8222, lng: -58.5358 },
  AEP: { lat: -34.5592, lng: -58.4156 },
  BRC: { lat: -41.1512, lng: -71.1575 },
  USH: { lat: -54.8433, lng: -68.2958 },
  CUN: { lat: 21.0365, lng: -86.8771 },
  PUJ: { lat: 18.5674, lng: -68.3634 },
};

const CITY_COORDINATES: Record<string, Coordinates> = {
  "sao paulo": AIRPORT_COORDINATES.GRU,
  campinas: AIRPORT_COORDINATES.VCP,
  "rio de janeiro": AIRPORT_COORDINATES.GIG,
  brasilia: AIRPORT_COORDINATES.BSB,
  "belo horizonte": AIRPORT_COORDINATES.CNF,
  salvador: AIRPORT_COORDINATES.SSA,
  recife: AIRPORT_COORDINATES.REC,
  "porto de galinhas": AIRPORT_COORDINATES.REC,
  fortaleza: AIRPORT_COORDINATES.FOR,
  maceio: AIRPORT_COORDINATES.MCZ,
  natal: AIRPORT_COORDINATES.NAT,
  "joao pessoa": AIRPORT_COORDINATES.JPA,
  aracaju: AIRPORT_COORDINATES.AJU,
  vitoria: AIRPORT_COORDINATES.VIX,
  "porto alegre": AIRPORT_COORDINATES.POA,
  gramado: AIRPORT_COORDINATES.POA,
  canela: AIRPORT_COORDINATES.POA,
  florianopolis: AIRPORT_COORDINATES.FLN,
  curitiba: AIRPORT_COORDINATES.CWB,
  "foz do iguacu": AIRPORT_COORDINATES.IGU,
  navegantes: AIRPORT_COORDINATES.NVT,
  "balneario camboriu": AIRPORT_COORDINATES.NVT,
  belem: AIRPORT_COORDINATES.BEL,
  manaus: AIRPORT_COORDINATES.MAO,
  "sao luis": AIRPORT_COORDINATES.SLZ,
  teresina: AIRPORT_COORDINATES.THE,
  ilheus: AIRPORT_COORDINATES.IOS,
  "porto seguro": AIRPORT_COORDINATES.BPS,
  lisboa: AIRPORT_COORDINATES.LIS,
  madrid: AIRPORT_COORDINATES.MAD,
  barcelona: AIRPORT_COORDINATES.BCN,
  paris: AIRPORT_COORDINATES.CDG,
  roma: AIRPORT_COORDINATES.FCO,
  amsterdam: AIRPORT_COORDINATES.AMS,
  atenas: AIRPORT_COORDINATES.ATH,
  dubai: AIRPORT_COORDINATES.DXB,
  miami: AIRPORT_COORDINATES.MIA,
  orlando: AIRPORT_COORDINATES.MCO,
  "nova york": AIRPORT_COORDINATES.JFK,
  "new york": AIRPORT_COORDINATES.JFK,
  "las vegas": AIRPORT_COORDINATES.LAS,
  "los angeles": AIRPORT_COORDINATES.LAX,
  santiago: AIRPORT_COORDINATES.SCL,
  "buenos aires": AIRPORT_COORDINATES.EZE,
  bariloche: AIRPORT_COORDINATES.BRC,
  ushuaia: AIRPORT_COORDINATES.USH,
  cancun: AIRPORT_COORDINATES.CUN,
  "punta cana": AIRPORT_COORDINATES.PUJ,
};

function normalizeLocation(value: string | null | undefined) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function resolvePoint(iata: string | null, name: string | null): LiveRoutePoint | null {
  const normalizedIata = iata?.trim().toUpperCase() || null;
  const coordinates = (normalizedIata ? AIRPORT_COORDINATES[normalizedIata] : null)
    ?? CITY_COORDINATES[normalizeLocation(name)];
  if (!coordinates) return null;

  return {
    ...coordinates,
    label: normalizedIata || name?.trim() || "Local",
    iata: normalizedIata,
  };
}

function routeFromOffer(offer: TravelOfferCatalogItem): LiveGlobeRoute | null {
  const origin = resolvePoint(offer.origin_iata, offer.origin);
  const destination = resolvePoint(offer.destination_iata, offer.destination);
  if (!origin || !destination) return null;
  if (Math.abs(origin.lat - destination.lat) < 0.01 && Math.abs(origin.lng - destination.lng) < 0.01) return null;

  return {
    id: `${origin.iata ?? normalizeLocation(origin.label)}-${destination.iata ?? normalizeLocation(destination.label)}`,
    offerId: offer.id,
    origin,
    destination,
  };
}

export function liveRoutesFromOffers(
  offers: TravelOfferCatalogItem[],
  preferredOfferId?: string | null,
  limit = 3,
) {
  const ordered = preferredOfferId
    ? [...offers].sort((left, right) => Number(right.id === preferredOfferId) - Number(left.id === preferredOfferId))
    : offers;
  const routes = new Map<string, LiveGlobeRoute>();

  for (const offer of ordered) {
    const route = routeFromOffer(offer);
    if (!route || routes.has(route.id)) continue;
    routes.set(route.id, route);
    if (routes.size >= Math.max(1, limit)) break;
  }

  return [...routes.values()];
}

export function liveRouteSummary(routes: LiveGlobeRoute[]) {
  if (!routes.length) return null;
  const first = routes[0];
  const primary = `${first.origin.label} → ${first.destination.label}`;
  return routes.length === 1 ? primary : `${primary} +${routes.length - 1}`;
}
