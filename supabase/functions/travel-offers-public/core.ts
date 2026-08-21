declare const Deno: {
  env: { get(name: string): string | undefined };
  serve(handler: (request: Request) => Response | Promise<Response>): void;
};

export const PUBLIC_NOTICE =
  "Preços e disponibilidade estão sujeitos à confirmação no momento da reserva.";

export const LIMITS = {
  requestBytes: 12_000,
  catalogPageSize: 50,
  catalogDefaultPageSize: 20,
  catalogMaxOffset: 10_000,
  calendarRangeDays: 120,
  calendarRows: 5_000,
  facetRows: 25_000,
  passengers: 20,
  requestsPerMinute: 60,
  facetCacheMs: 5 * 60_000,
} as const;

const KNOWN_ACTIONS = ["facets", "catalog", "calendar", "detail"] as const;
const KNOWN_OFFER_TYPES = ["bloqueio_aereo", "pacote"] as const;
const KNOWN_SUBTYPES = [
  "bloqueio",
  "nacional",
  "internacional",
  "evento",
  "grupo_guiado",
] as const;
const SORTS = ["price_asc", "price_desc", "date_asc", "date_desc", "updated_desc"] as const;

type Action = (typeof KNOWN_ACTIONS)[number];
type OfferType = (typeof KNOWN_OFFER_TYPES)[number];
type OfferSubtype = (typeof KNOWN_SUBTYPES)[number];
type Sort = (typeof SORTS)[number];
type JsonRecord = Record<string, unknown>;

type TravelOfferRow = {
  id: string;
  offer_type: string;
  source_type: string | null;
  origin_city: string | null;
  origin_iata: string | null;
  destination_name: string | null;
  destination_iata: string | null;
  departure_date: string | null;
  return_date: string | null;
  nights: number | null;
  airline: string | null;
  outbound_departure_time: string | null;
  outbound_arrival_time: string | null;
  return_departure_time: string | null;
  return_arrival_time: string | null;
  available_seats: number | null;
  currency: string | null;
  price_per_person: number | string | null;
  boarding_tax: number | string | null;
  issue_deadline: string | null;
  updated_at: string | null;
  raw_data?: JsonRecord | null;
};

type CatalogParams = {
  search: string | null;
  origin: string | null;
  origin_iata: string | null;
  destination: string | null;
  destination_iata: string | null;
  offer_type: OfferType | null;
  subtype: OfferSubtype | null;
  category: string | null;
  start_date: string | null;
  end_date: string | null;
  passengers: number | null;
  min_price: number | null;
  max_price: number | null;
  only_with_seats: boolean;
  sort: Sort;
  page: number;
  per_page: number;
};

type CalendarParams = {
  origin: string | null;
  origin_iata: string | null;
  destination: string | null;
  destination_iata: string | null;
  start_date: string;
  end_date: string;
  passengers: number;
  offer_type: OfferType | null;
};

type ValidatedRequest =
  | { action: "facets"; params: Record<string, never> }
  | { action: "catalog"; params: CatalogParams }
  | { action: "calendar"; params: CalendarParams }
  | { action: "detail"; params: { id: string } };

export class ValidationError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(message: string, code = "invalid_request", status = 400) {
    super(message);
    this.name = "ValidationError";
    this.code = code;
    this.status = status;
  }
}

const isRecord = (value: unknown): value is JsonRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const hasOnlyKeys = (value: JsonRecord, allowed: readonly string[]) => {
  const unexpected = Object.keys(value).find((key) => !allowed.includes(key));
  if (unexpected) {
    throw new ValidationError(`Parâmetro não permitido: ${unexpected}.`, "unknown_parameter");
  }
};

const nullableString = (
  value: unknown,
  field: string,
  maxLength: number,
  options: { search?: boolean } = {},
): string | null => {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string") {
    throw new ValidationError(`${field} deve ser texto.`);
  }
  const result = value.trim();
  if (!result || result.length > maxLength) {
    throw new ValidationError(`${field} possui tamanho inválido.`);
  }
  if (options.search && !/^[\p{L}\p{N}\s-]+$/u.test(result)) {
    throw new ValidationError(`${field} contém caracteres não permitidos.`);
  }
  return result;
};

const nullableNumber = (
  value: unknown,
  field: string,
  min: number,
  max: number,
): number | null => {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "number" || !Number.isFinite(value) || value < min || value > max) {
    throw new ValidationError(`${field} possui valor inválido.`);
  }
  return value;
};

const integer = (
  value: unknown,
  field: string,
  fallback: number,
  min: number,
  max: number,
): number => {
  if (value === undefined || value === null) return fallback;
  if (!Number.isInteger(value) || (value as number) < min || (value as number) > max) {
    throw new ValidationError(`${field} possui valor inválido.`);
  }
  return value as number;
};

const boolean = (value: unknown, field: string, fallback = false): boolean => {
  if (value === undefined || value === null) return fallback;
  if (typeof value !== "boolean") throw new ValidationError(`${field} deve ser booleano.`);
  return value;
};

const enumValue = <T extends string>(
  value: unknown,
  field: string,
  allowed: readonly T[],
): T | null => {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string" || !allowed.includes(value as T)) {
    throw new ValidationError(`${field} possui valor não permitido.`);
  }
  return value as T;
};

const isIsoDate = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
};

const nullableDate = (value: unknown, field: string): string | null => {
  const result = nullableString(value, field, 10);
  if (result !== null && !isIsoDate(result)) {
    throw new ValidationError(`${field} deve usar o formato YYYY-MM-DD.`);
  }
  return result;
};

const daysBetween = (start: string, end: string) =>
  Math.round(
    (new Date(`${end}T00:00:00Z`).getTime() - new Date(`${start}T00:00:00Z`).getTime()) /
      86_400_000,
  );

const iata = (value: unknown, field: string): string | null => {
  const result = nullableString(value, field, 3);
  if (result === null) return null;
  const upper = result.toUpperCase();
  if (!/^[A-Z]{3}$/.test(upper)) throw new ValidationError(`${field} deve ser um IATA válido.`);
  return upper;
};

const uuid = (value: unknown): string => {
  const result = nullableString(value, "id", 36);
  if (!result || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(result)) {
    throw new ValidationError("UUID inválido.", "invalid_uuid");
  }
  return result;
};

export function validateApiRequest(body: unknown): ValidatedRequest {
  if (!isRecord(body)) throw new ValidationError("Corpo JSON inválido.");
  hasOnlyKeys(body, ["action", "params"]);

  if (typeof body.action !== "string" || !KNOWN_ACTIONS.includes(body.action as Action)) {
    throw new ValidationError("Ação inválida.", "invalid_action");
  }
  const action = body.action as Action;
  const params = body.params === undefined ? {} : body.params;
  if (!isRecord(params)) throw new ValidationError("params deve ser um objeto.");

  if (action === "facets") {
    hasOnlyKeys(params, []);
    return { action, params: {} };
  }

  if (action === "detail") {
    hasOnlyKeys(params, ["id"]);
    return { action, params: { id: uuid(params.id) } };
  }

  if (action === "catalog") {
    hasOnlyKeys(params, [
      "search",
      "origin",
      "origin_iata",
      "destination",
      "destination_iata",
      "offer_type",
      "subtype",
      "category",
      "start_date",
      "end_date",
      "passengers",
      "min_price",
      "max_price",
      "only_with_seats",
      "sort",
      "page",
      "per_page",
    ]);

    const startDate = nullableDate(params.start_date, "start_date");
    const endDate = nullableDate(params.end_date, "end_date");
    if (startDate && endDate && daysBetween(startDate, endDate) < 0) {
      throw new ValidationError("O período informado é inválido.");
    }
    if (startDate && endDate && daysBetween(startDate, endDate) > 730) {
      throw new ValidationError("O período do catálogo não pode exceder 730 dias.", "range_too_large", 422);
    }

    const minPrice = nullableNumber(params.min_price, "min_price", 0, 1_000_000);
    const maxPrice = nullableNumber(params.max_price, "max_price", 0, 1_000_000);
    if (minPrice !== null && maxPrice !== null && minPrice > maxPrice) {
      throw new ValidationError("A faixa de preço é inválida.");
    }

    const page = integer(params.page, "page", 1, 1, 500);
    const perPage = integer(
      params.per_page,
      "per_page",
      LIMITS.catalogDefaultPageSize,
      1,
      LIMITS.catalogPageSize,
    );
    if ((page - 1) * perPage >= LIMITS.catalogMaxOffset) {
      throw new ValidationError("A paginação excede o limite seguro.", "pagination_limit", 422);
    }

    const sort = enumValue(params.sort, "sort", SORTS) ?? "date_asc";
    const parsed: CatalogParams = {
      search: nullableString(params.search, "search", 80, { search: true }),
      origin: nullableString(params.origin, "origin", 100),
      origin_iata: iata(params.origin_iata, "origin_iata"),
      destination: nullableString(params.destination, "destination", 120),
      destination_iata: iata(params.destination_iata, "destination_iata"),
      offer_type: enumValue(params.offer_type, "offer_type", KNOWN_OFFER_TYPES),
      subtype: enumValue(params.subtype, "subtype", KNOWN_SUBTYPES),
      category: nullableString(params.category, "category", 80),
      start_date: startDate,
      end_date: endDate,
      passengers: nullableNumber(params.passengers, "passengers", 1, LIMITS.passengers),
      min_price: minPrice,
      max_price: maxPrice,
      only_with_seats: boolean(params.only_with_seats, "only_with_seats"),
      sort,
      page,
      per_page: perPage,
    };
    if (parsed.passengers !== null && !Number.isInteger(parsed.passengers)) {
      throw new ValidationError("passengers deve ser inteiro.");
    }

    const hasFilter = Object.entries(parsed).some(([key, value]) =>
      !["page", "per_page", "sort", "only_with_seats"].includes(key) && value !== null
    ) || parsed.only_with_seats;
    if (!hasFilter && perPage > LIMITS.catalogDefaultPageSize) {
      throw new ValidationError(
        `Consultas sem filtro aceitam no máximo ${LIMITS.catalogDefaultPageSize} itens.`,
        "query_too_broad",
        422,
      );
    }
    return { action, params: parsed };
  }

  hasOnlyKeys(params, [
    "origin",
    "origin_iata",
    "destination",
    "destination_iata",
    "start_date",
    "end_date",
    "passengers",
    "offer_type",
  ]);
  const startDate = nullableDate(params.start_date, "start_date");
  const endDate = nullableDate(params.end_date, "end_date");
  const origin = nullableString(params.origin, "origin", 100);
  const originIata = iata(params.origin_iata, "origin_iata");
  const destination = nullableString(params.destination, "destination", 120);
  const destinationIata = iata(params.destination_iata, "destination_iata");
  if (!origin && !originIata) throw new ValidationError("Informe origin ou origin_iata.");
  if (!destination && !destinationIata) {
    throw new ValidationError("Informe destination ou destination_iata.");
  }
  if (!startDate || !endDate) throw new ValidationError("Informe start_date e end_date.");
  const rangeDays = daysBetween(startDate, endDate);
  if (rangeDays < 0) throw new ValidationError("O período informado é inválido.");
  if (rangeDays > LIMITS.calendarRangeDays) {
    throw new ValidationError(
      `O calendário aceita no máximo ${LIMITS.calendarRangeDays} dias.`,
      "range_too_large",
      422,
    );
  }
  const passengers = integer(params.passengers, "passengers", 1, 1, LIMITS.passengers);
  return {
    action,
    params: {
      origin,
      origin_iata: originIata,
      destination,
      destination_iata: destinationIata,
      start_date: startDate,
      end_date: endDate,
      passengers,
      offer_type: enumValue(params.offer_type, "offer_type", KNOWN_OFFER_TYPES),
    },
  };
}

const normalizeText = (value: unknown) => String(value ?? "")
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, " ")
  .trim();

const containsSecret = (value: string) =>
  /(?:https?:\/\/|access[_-]?token\s*[:=]|api[_-]?key\s*[:=]|apikey\s*[:=]|authorization\s*[:=]|bearer\s+[a-z0-9._-]+|service[_-]?role|source[_-]?(?:url|entry)\s*[:=])/i.test(value) ||
  /eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}/.test(value);

const publicText = (value: unknown, maxLength = 1_000): string | null => {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const text = String(value)
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/[\uE000-\uF8FF]/g, "")
    .trim();
  if (!text || containsSecret(text)) return null;
  return text.slice(0, maxLength);
};

const publicTextArray = (value: unknown, maxItems = 50, maxLength = 1_000) =>
  Array.isArray(value)
    ? value.slice(0, maxItems).map((item) => publicText(item, maxLength)).filter((item): item is string => Boolean(item))
    : [];

const finitePositive = (value: unknown): number | null => {
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
};

const nonNegative = (value: unknown): number | null => {
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) && number >= 0 ? number : null;
};

const parseCurrency = (value: unknown): number | null => {
  if (typeof value === "number") return finitePositive(value);
  if (typeof value !== "string") return null;
  const match = value.match(/(?:R\$\s*)?([\d.]+(?:,\d{1,2})?)/);
  if (!match) return null;
  return finitePositive(Number.parseFloat(match[1].replace(/\./g, "").replace(",", ".")));
};

const publicIata = (value: unknown): string | null => {
  const text = publicText(value, 3)?.toUpperCase() ?? null;
  return text && /^[A-Z]{3}$/.test(text) ? text : null;
};

const publicCurrency = (value: unknown): string | null => {
  const text = publicText(value, 3)?.toUpperCase() ?? null;
  return text && /^[A-Z]{3}$/.test(text) ? text : null;
};

const publicImageUrl = (value: unknown): string | null => {
  if (typeof value !== "string" || !value.startsWith("https://")) return null;
  try {
    const url = new URL(value);
    if (url.username || url.password || url.search || url.hash) return null;
    if (/(?:access[_-]?token|api[_-]?key|apikey|authorization|bearer|service[_-]?role)/i.test(url.pathname)) {
      return null;
    }
    if (/^(?:localhost|127\.|10\.|192\.168\.|172\.(?:1[6-9]|2\d|3[01])\.)/i.test(url.hostname)) return null;
    if (!/\.(?:avif|gif|jpe?g|png|webp)$/i.test(url.pathname)) return null;
    return url.toString();
  } catch {
    return null;
  }
};

const categoryForSubtype = (subtype: string | null) => ({
  bloqueio: "Bloqueio aéreo",
  nacional: "Nacional",
  internacional: "Internacional",
  evento: "Evento",
  grupo_guiado: "Grupo guiado",
}[subtype ?? ""] ?? null);

const rawRecord = (row: TravelOfferRow) => isRecord(row.raw_data) ? row.raw_data : {};

const commonFields = (row: TravelOfferRow) => ({
  id: row.id,
  offer_type: row.offer_type as OfferType,
  offer_subtype: row.source_type as OfferSubtype,
  origin: publicText(row.origin_city, 120),
  origin_iata: publicIata(row.origin_iata),
  destination: publicText(row.destination_name, 160),
  destination_iata: publicIata(row.destination_iata),
  departure_date: isIsoDate(String(row.departure_date ?? "")) ? row.departure_date : null,
  return_date: isIsoDate(String(row.return_date ?? "")) ? row.return_date : null,
  nights: Number.isInteger(row.nights) && (row.nights as number) >= 0 ? row.nights : null,
  currency: publicCurrency(row.currency),
  available_seats: Number.isInteger(row.available_seats) && (row.available_seats as number) >= 0
    ? row.available_seats
    : null,
  updated_at: publicText(row.updated_at, 40),
});

const normalizeHotel = (value: unknown) => {
  if (!isRecord(value)) return null;
  const name = publicText(value.nome, 180);
  if (!name) return null;
  return {
    name,
    meal_plan: publicText(value.regime, 120),
    promotion: publicText(value.promo, 160),
    installment: publicText(value.parcela, 120),
    price_per_person: parseCurrency(value.preco),
    tax_per_person: parseCurrency(value.taxas),
  };
};

const includesAirfare = (inclusions: string[], extra: unknown[] = []) => {
  const text = normalizeText([...inclusions, ...extra].join(" "));
  return /\b(passagem aerea|passagens aereas|aereo|voo|voos)\b/.test(text);
};

export function normalizeAirBlock(row: TravelOfferRow) {
  const price = finitePositive(row.price_per_person);
  if (!price) throw new ValidationError("Oferta sem preço válido.", "invalid_offer", 404);
  return {
    kind: "air_block" as const,
    ...commonFields(row),
    airline: publicText(row.airline, 100),
    outbound_departure_time: publicText(row.outbound_departure_time, 20),
    outbound_arrival_time: publicText(row.outbound_arrival_time, 20),
    return_departure_time: publicText(row.return_departure_time, 20),
    return_arrival_time: publicText(row.return_arrival_time, 20),
    price_per_person: price,
    tax_per_person: nonNegative(row.boarding_tax),
    issue_deadline: publicText(row.issue_deadline, 40),
  };
}

export function normalizePackage(row: TravelOfferRow) {
  const raw = rawRecord(row);
  const hotelValues = Array.isArray(raw.hoteis)
    ? raw.hoteis
    : isRecord(raw.hotel)
    ? [raw.hotel]
    : [];
  const hotels = hotelValues.map(normalizeHotel).filter((hotel): hotel is NonNullable<ReturnType<typeof normalizeHotel>> => Boolean(hotel));
  const selectedHotel = [...hotels].sort((a, b) =>
    (a.price_per_person ?? Number.MAX_SAFE_INTEGER) - (b.price_per_person ?? Number.MAX_SAFE_INTEGER)
  )[0] ?? null;
  const inclusions = publicTextArray(raw.inclui, 60, 1_000);
  const ticketValues = Array.isArray(raw.ingressos) ? raw.ingressos : [];
  const ticketOptions = ticketValues.slice(0, 20).map((item) => {
    if (!isRecord(item)) return null;
    const category = publicText(item.categoria, 180);
    if (!category) return null;
    return {
      category,
      price_per_person: parseCurrency(item.preco),
      installment: publicText(item.parcela, 120),
    };
  }).filter((item): item is NonNullable<typeof item> => Boolean(item));
  const airfareIncluded = includesAirfare(inclusions);
  const eventSpecific = row.source_type === "evento" || raw.evento === true;
  const name = publicText(raw.nome, 220) ?? publicText(row.destination_name, 220);
  const category = publicText(raw.categoria, 100) ?? categoryForSubtype(row.source_type);
  const price = selectedHotel?.price_per_person ?? finitePositive(raw.package_price_per_person) ?? finitePositive(row.price_per_person);
  if (!price) throw new ValidationError("Oferta sem preço válido.", "invalid_offer", 404);
  return {
    kind: "package" as const,
    ...commonFields(row),
    name,
    category,
    hotel: selectedHotel?.name ?? null,
    meal_plan: selectedHotel?.meal_plan ?? null,
    inclusions,
    promotion: selectedHotel?.promotion ?? null,
    installment: selectedHotel?.installment ?? publicText(raw.min_parcela, 120),
    price_per_person: price,
    tax_per_person: selectedHotel?.tax_per_person ?? nonNegative(row.boarding_tax),
    other_accommodations: hotels.filter((hotel) => hotel !== selectedHotel),
    airfare_included: airfareIncluded,
    airfare_price_per_person: airfareIncluded ? finitePositive(raw.air_price_per_person) : null,
    event_specific: eventSpecific,
    event_name: eventSpecific ? name : null,
    ticket_included: ticketOptions.length > 0 || inclusions.some((item) => normalizeText(item).includes("ingresso")),
    ticket_options: ticketOptions,
    image_url: publicImageUrl(raw.capa ?? raw.src),
  };
}

export function normalizeGuidedGroup(row: TravelOfferRow) {
  const raw = rawRecord(row);
  const inclusions = publicTextArray(raw.inclui, 80, 1_000);
  const flightNotes = publicTextArray(raw.voos, 30, 1_000);
  const hotelPairs = Array.isArray(raw.hoteis) ? raw.hoteis : [];
  const hotels = hotelPairs.slice(0, 40).map((pair) => {
    if (!Array.isArray(pair)) return null;
    const city = publicText(pair[0], 120);
    const name = publicText(pair[1], 180);
    return name ? { city, name } : null;
  }).filter((item): item is NonNullable<typeof item> => Boolean(item));
  const priceValues = Array.isArray(raw.precos) ? raw.precos : [];
  const priceOptions = priceValues.slice(0, 20).map((item) => {
    if (!isRecord(item)) return null;
    const label = publicText(item.t, 180);
    if (!label) return null;
    return {
      label,
      total: publicText(item.s, 180),
      installment: publicText(item.v, 180),
      featured: item.dest === true,
    };
  }).filter((item): item is NonNullable<typeof item> => Boolean(item));
  const summary = isRecord(raw.summary) ? raw.summary : {};
  const airfareIncluded = includesAirfare(inclusions, [raw.transporte, ...flightNotes]);
  const price = finitePositive(row.price_per_person);
  if (!price) throw new ValidationError("Oferta sem preço válido.", "invalid_offer", 404);
  return {
    kind: "guided_group" as const,
    ...commonFields(row),
    name: publicText(raw.nome, 220) ?? publicText(summary.nome, 220) ?? publicText(row.destination_name, 220),
    description: publicText(raw.desc, 4_000),
    category: publicText(raw.tag, 100) ?? "Grupo guiado",
    duration: publicText(raw.duracao, 100),
    cities: publicTextArray(raw.cidades, 60, 120),
    hotels,
    inclusions,
    payment: publicText(raw.pagamento, 1_000),
    transport: publicText(raw.transporte, 180),
    flight_notes: flightNotes,
    price_options: priceOptions,
    price_per_person: price,
    tax_per_person: nonNegative(row.boarding_tax),
    airfare_included: airfareIncluded,
    airfare_price_per_person: null,
    ticket_included: inclusions.some((item) => normalizeText(item).includes("ingresso")),
    image_url: publicImageUrl(summary.foto),
  };
}

export function normalizeOffer(row: TravelOfferRow) {
  if (row.offer_type === "bloqueio_aereo" && row.source_type === "bloqueio") {
    return normalizeAirBlock(row);
  }
  if (row.offer_type === "pacote" && row.source_type === "grupo_guiado") {
    return normalizeGuidedGroup(row);
  }
  if (
    row.offer_type === "pacote" &&
    ["nacional", "internacional", "evento"].includes(row.source_type ?? "")
  ) {
    return normalizePackage(row);
  }
  throw new ValidationError("Oferta não encontrada.", "not_found", 404);
}

const catalogItem = (row: TravelOfferRow) => {
  const detail = normalizeOffer(row);
  if (detail.kind === "air_block") {
    return {
      kind: detail.kind,
      id: detail.id,
      offer_type: detail.offer_type,
      offer_subtype: detail.offer_subtype,
      name: null,
      category: categoryForSubtype(detail.offer_subtype),
      origin: detail.origin,
      origin_iata: detail.origin_iata,
      destination: detail.destination,
      destination_iata: detail.destination_iata,
      departure_date: detail.departure_date,
      return_date: detail.return_date,
      nights: detail.nights,
      airline: detail.airline,
      price_per_person: detail.price_per_person,
      tax_per_person: detail.tax_per_person,
      currency: detail.currency,
      available_seats: detail.available_seats,
      airfare_included: true,
      image_url: null,
      updated_at: detail.updated_at,
    };
  }
  return {
    kind: detail.kind,
    id: detail.id,
    offer_type: detail.offer_type,
    offer_subtype: detail.offer_subtype,
    name: detail.name,
    category: detail.category,
    origin: detail.origin,
    origin_iata: detail.origin_iata,
    destination: detail.destination,
    destination_iata: detail.destination_iata,
    departure_date: detail.departure_date,
    return_date: detail.return_date,
    nights: detail.nights,
    airline: null,
    price_per_person: detail.price_per_person,
    tax_per_person: detail.tax_per_person,
    currency: detail.currency,
    available_seats: detail.available_seats,
    airfare_included: detail.airfare_included,
    image_url: detail.image_url,
    updated_at: detail.updated_at,
  };
};

type CalendarRow = Pick<
  TravelOfferRow,
  | "id"
  | "offer_type"
  | "source_type"
  | "origin_iata"
  | "destination_iata"
  | "departure_date"
  | "available_seats"
  | "price_per_person"
  | "boarding_tax"
>;

export function aggregateCalendarRows(rows: CalendarRow[], passengers: number) {
  const eligible = rows.filter((row) => {
    const price = finitePositive(row.price_per_person);
    const seats = row.available_seats;
    return Boolean(
      price &&
      row.departure_date &&
      isIsoDate(row.departure_date) &&
      (seats === null || (Number.isInteger(seats) && (seats as number) >= passengers)),
    );
  });
  const grouped = new Map<string, CalendarRow[]>();
  for (const row of eligible) {
    const list = grouped.get(row.departure_date as string) ?? [];
    list.push(row);
    grouped.set(row.departure_date as string, list);
  }
  return [...grouped.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, options]) => {
    const sorted = [...options].sort((a, b) =>
      (finitePositive(a.price_per_person) as number) - (finitePositive(b.price_per_person) as number) ||
      (nonNegative(a.boarding_tax) ?? 0) - (nonNegative(b.boarding_tax) ?? 0)
    );
    const best = sorted[0];
    const seatValues = options
      .map((row) => row.available_seats)
      .filter((value): value is number => Number.isInteger(value) && (value as number) >= passengers);
    return {
      date,
      min_price_per_person: finitePositive(best.price_per_person),
      tax_per_person: nonNegative(best.boarding_tax),
      offer_type: best.offer_type,
      offer_subtype: best.source_type,
      options_count: options.length,
      min_available_seats: seatValues.length ? Math.min(...seatValues) : null,
      origin_iata: publicIata(best.origin_iata),
      destination_iata: publicIata(best.destination_iata),
      best_option_id: best.id,
    };
  });
}

const DETAIL_SELECT = [
  "id",
  "offer_type",
  "source_type",
  "origin_city",
  "origin_iata",
  "destination_name",
  "destination_iata",
  "departure_date",
  "return_date",
  "nights",
  "airline",
  "outbound_departure_time",
  "outbound_arrival_time",
  "return_departure_time",
  "return_arrival_time",
  "available_seats",
  "currency",
  "price_per_person",
  "boarding_tax",
  "issue_deadline",
  "updated_at",
  "raw_data",
].join(",");

const CALENDAR_SELECT = [
  "id",
  "offer_type",
  "source_type",
  "origin_iata",
  "destination_iata",
  "departure_date",
  "available_seats",
  "price_per_person",
  "boarding_tax",
].join(",");

const FACET_SELECT = [
  "offer_type",
  "source_type",
  "origin_city",
  "origin_iata",
  "destination_name",
  "destination_iata",
  "departure_date",
  "price_per_person",
  "currency",
  "category:raw_data->>categoria",
  "tag:raw_data->>tag",
].join(",");

const nowInSaoPaulo = (now = new Date()) =>
  new Intl.DateTimeFormat("fr-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);

const validQuery = (client: any, select: string, count?: "exact") => {
  let query = client
    .from("travel_offers")
    .select(select, count ? { count } : undefined)
    .eq("active", true)
    .in("offer_type", [...KNOWN_OFFER_TYPES])
    .in("source_type", [...KNOWN_SUBTYPES])
    .gt("price_per_person", 0)
    .gte("departure_date", nowInSaoPaulo())
    .or(`issue_deadline.is.null,issue_deadline.gte.${new Date().toISOString()}`);
  return query;
};

const applyLocationFilters = (query: any, params: {
  origin: string | null;
  origin_iata: string | null;
  destination: string | null;
  destination_iata: string | null;
}) => {
  if (params.origin_iata) query = query.eq("origin_iata", params.origin_iata);
  else if (params.origin) query = query.ilike("origin_city", params.origin);
  if (params.destination_iata) query = query.eq("destination_iata", params.destination_iata);
  else if (params.destination) query = query.ilike("destination_name", params.destination);
  return query;
};

const fetchBatches = async (
  makeQuery: (start: number, count: boolean) => any,
  maxRows: number,
) => {
  const batchSize = 1_000;
  const first = await makeQuery(0, true).range(0, batchSize - 1);
  if (first.error) throw first.error;
  const total = Number(first.count ?? first.data?.length ?? 0);
  if (total > maxRows) {
    throw new ValidationError("Consulta ampla demais. Refine os filtros.", "query_too_broad", 422);
  }
  const rows = [...(first.data ?? [])];
  for (let start = batchSize; start < total; start += batchSize) {
    const result = await makeQuery(start, false).range(start, Math.min(start + batchSize - 1, total - 1));
    if (result.error) throw result.error;
    rows.push(...(result.data ?? []));
  }
  return { rows, total };
};

let facetCache: { expiresAt: number; payload: unknown } | null = null;

const countedValues = (map: Map<string, number>) => [...map.entries()]
  .map(([value, count]) => ({ value, count }))
  .sort((a, b) => a.value.localeCompare(b.value, "pt-BR"));

const facets = async (client: any) => {
  if (facetCache && facetCache.expiresAt > Date.now()) return facetCache.payload;
  const { rows } = await fetchBatches(
    (_start, count) => validQuery(client, FACET_SELECT, count ? "exact" : undefined),
    LIMITS.facetRows,
  );
  const offerTypes = new Map<string, number>();
  const subtypes = new Map<string, number>();
  const origins = new Map<string, number>();
  const originAirports = new Map<string, number>();
  const destinations = new Map<string, number>();
  const destinationAirports = new Map<string, number>();
  const categories = new Map<string, number>();
  const prices = new Map<string, number[]>();
  let minDate: string | null = null;
  let maxDate: string | null = null;

  for (const row of rows) {
    const add = (map: Map<string, number>, value: unknown, max = 160) => {
      const text = publicText(value, max);
      if (text) map.set(text, (map.get(text) ?? 0) + 1);
    };
    add(offerTypes, row.offer_type);
    add(subtypes, row.source_type);
    add(origins, row.origin_city);
    add(originAirports, publicIata(row.origin_iata));
    add(destinations, row.destination_name);
    add(destinationAirports, publicIata(row.destination_iata));
    add(categories, row.category ?? row.tag ?? categoryForSubtype(row.source_type), 100);
    if (isIsoDate(String(row.departure_date ?? ""))) {
      minDate = !minDate || row.departure_date < minDate ? row.departure_date : minDate;
      maxDate = !maxDate || row.departure_date > maxDate ? row.departure_date : maxDate;
    }
    const price = finitePositive(row.price_per_person);
    if (price) {
      const currency = publicCurrency(row.currency) ?? "";
      const list = prices.get(currency) ?? [];
      list.push(price);
      prices.set(currency, list);
    }
  }
  const payload = {
    offer_types: countedValues(offerTypes),
    subtypes: countedValues(subtypes),
    origins: countedValues(origins),
    origin_airports: countedValues(originAirports),
    destinations: countedValues(destinations),
    destination_airports: countedValues(destinationAirports),
    categories: countedValues(categories),
    date_range: { min: minDate, max: maxDate },
    price_ranges: [...prices.entries()].map(([currency, values]) => ({
      currency: currency || null,
      min: Math.min(...values),
      max: Math.max(...values),
    })),
    updated_at: new Date().toISOString(),
    notice: PUBLIC_NOTICE,
  };
  facetCache = { expiresAt: Date.now() + LIMITS.facetCacheMs, payload };
  return payload;
};

const catalog = async (client: any, params: CatalogParams) => {
  let query = validQuery(client, DETAIL_SELECT, "exact");
  query = applyLocationFilters(query, params);
  if (params.search) {
    const pattern = `%${params.search}%`;
    query = query.or(
      `destination_name.ilike.${pattern},origin_city.ilike.${pattern},raw_data->>nome.ilike.${pattern}`,
    );
  }
  if (params.offer_type) query = query.eq("offer_type", params.offer_type);
  if (params.subtype) query = query.eq("source_type", params.subtype);
  if (params.category) {
    if (normalizeText(params.category) === "grupo guiado") query = query.eq("source_type", "grupo_guiado");
    else query = query.ilike("raw_data->>categoria", params.category);
  }
  if (params.start_date) query = query.gte("departure_date", params.start_date);
  if (params.end_date) query = query.lte("departure_date", params.end_date);
  if (params.passengers !== null) {
    query = query.or(`available_seats.is.null,available_seats.gte.${params.passengers}`);
  }
  if (params.min_price !== null) query = query.gte("price_per_person", params.min_price);
  if (params.max_price !== null) query = query.lte("price_per_person", params.max_price);
  if (params.only_with_seats) query = query.gt("available_seats", 0);

  const orders: Record<Sort, [string, boolean]> = {
    price_asc: ["price_per_person", true],
    price_desc: ["price_per_person", false],
    date_asc: ["departure_date", true],
    date_desc: ["departure_date", false],
    updated_desc: ["updated_at", false],
  };
  const [column, ascending] = orders[params.sort];
  query = query.order(column, { ascending }).order("id", { ascending: true });
  const start = (params.page - 1) * params.per_page;
  const result = await query.range(start, start + params.per_page - 1);
  if (result.error) throw result.error;
  const total = Number(result.count ?? 0);
  return {
    items: (result.data ?? []).map(catalogItem),
    page: params.page,
    per_page: params.per_page,
    total,
    total_pages: total === 0 ? 0 : Math.ceil(total / params.per_page),
    applied_filters: Object.fromEntries(
      Object.entries(params).filter(([, value]) => value !== null && value !== false),
    ),
    updated_at: new Date().toISOString(),
    notice: PUBLIC_NOTICE,
  };
};

const calendar = async (client: any, params: CalendarParams) => {
  const makeQuery = (_start: number, count: boolean) => {
    let query = validQuery(client, CALENDAR_SELECT, count ? "exact" : undefined);
    query = applyLocationFilters(query, params)
      .gte("departure_date", params.start_date)
      .lte("departure_date", params.end_date)
      .or(`available_seats.is.null,available_seats.gte.${params.passengers}`)
      .order("departure_date", { ascending: true })
      .order("price_per_person", { ascending: true });
    if (params.offer_type) query = query.eq("offer_type", params.offer_type);
    return query;
  };
  const { rows, total } = await fetchBatches(makeQuery, LIMITS.calendarRows);
  return {
    start_date: params.start_date,
    end_date: params.end_date,
    passengers: params.passengers,
    total_options: total,
    dates: aggregateCalendarRows(rows, params.passengers),
    updated_at: new Date().toISOString(),
    notice: PUBLIC_NOTICE,
  };
};

const detail = async (client: any, id: string) => {
  const result = await validQuery(client, DETAIL_SELECT)
    .eq("id", id)
    .limit(1)
    .maybeSingle();
  if (result.error) throw result.error;
  if (!result.data) throw new ValidationError("Oferta não encontrada.", "not_found", 404);
  return {
    item: normalizeOffer(result.data),
    updated_at: new Date().toISOString(),
    notice: PUBLIC_NOTICE,
  };
};

const getSupabaseClient = async () => {
  const url = Deno.env.get("SUPABASE_URL");
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceRole) throw new Error("Missing server configuration");
  // Deno resolves pinned npm: specifiers in the Edge Runtime.
  // @ts-ignore TypeScript outside Deno does not understand the npm: protocol.
  const { createClient } = await import("npm:@supabase/supabase-js@2.90.1");
  return createClient(url, serviceRole, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
};

const defaultOrigins = [
  "https://tomorrowtravelbr.com.br",
  "https://www.tomorrowtravelbr.com.br",
  "https://explore-tomorrow-dreams.lovable.app",
  "http://localhost:5173",
];

const allowedOrigins = () => {
  const configured = Deno.env.get("TRAVEL_OFFERS_ALLOWED_ORIGINS")
    ?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean) ?? [];
  return new Set([...defaultOrigins, ...configured]);
};

const corsHeaders = (origin: string | null) => {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
  if (origin && allowedOrigins().has(origin)) headers["Access-Control-Allow-Origin"] = origin;
  return headers;
};

const securityHeaders = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
};

const response = (body: unknown, status: number, origin: string | null) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...securityHeaders, ...corsHeaders(origin) },
  });

const rateBuckets = new Map<string, { windowStart: number; count: number }>();

const checkRateLimit = (request: Request, action: Action) => {
  const ip = request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-real-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown";
  const key = `${ip}:${action}`;
  const now = Date.now();
  const current = rateBuckets.get(key);
  const cost = action === "facets" ? 6 : action === "calendar" ? 2 : 1;
  if (!current || now - current.windowStart >= 60_000) {
    rateBuckets.set(key, { windowStart: now, count: cost });
    return;
  }
  current.count += cost;
  if (current.count > LIMITS.requestsPerMinute) {
    throw new ValidationError("Muitas consultas. Tente novamente em instantes.", "rate_limited", 429);
  }
};

export const handler = async (request: Request): Promise<Response> => {
  const requestId = crypto.randomUUID();
  const origin = request.headers.get("origin");
  try {
    if (origin && !allowedOrigins().has(origin)) {
      return response({ error: { code: "origin_not_allowed", message: "Origem não permitida." }, request_id: requestId }, 403, null);
    }
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }
    if (request.method !== "POST") {
      return response({ error: { code: "method_not_allowed", message: "Método não permitido." }, request_id: requestId }, 405, origin);
    }
    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.toLowerCase().startsWith("application/json")) {
      return response({ error: { code: "unsupported_media_type", message: "Use application/json." }, request_id: requestId }, 415, origin);
    }
    const declaredLength = Number(request.headers.get("content-length") ?? 0);
    if (declaredLength > LIMITS.requestBytes) {
      throw new ValidationError("Corpo da requisição excede o limite.", "request_too_large", 413);
    }
    const text = await request.text();
    if (new TextEncoder().encode(text).byteLength > LIMITS.requestBytes) {
      throw new ValidationError("Corpo da requisição excede o limite.", "request_too_large", 413);
    }
    let body: unknown;
    try {
      body = JSON.parse(text);
    } catch {
      throw new ValidationError("JSON inválido.", "invalid_json");
    }
    const validated = validateApiRequest(body);
    checkRateLimit(request, validated.action);
    const client = await getSupabaseClient();
    const payload = validated.action === "facets"
      ? await facets(client)
      : validated.action === "catalog"
      ? await catalog(client, validated.params)
      : validated.action === "calendar"
      ? await calendar(client, validated.params)
      : await detail(client, validated.params.id);
    return response(payload, 200, origin);
  } catch (error) {
    if (error instanceof ValidationError) {
      return response({ error: { code: error.code, message: error.message }, request_id: requestId }, error.status, origin);
    }
    console.error("[travel-offers-public] request failed", {
      request_id: requestId,
      error: error instanceof Error ? error.message : "unknown",
    });
    return response(
      { error: { code: "internal_error", message: "Não foi possível concluir a consulta." }, request_id: requestId },
      500,
      origin,
    );
  }
};

if ((import.meta as ImportMeta & { main?: boolean }).main) Deno.serve(handler);
