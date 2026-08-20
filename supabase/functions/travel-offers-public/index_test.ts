import {
  aggregateCalendarRows,
  LIMITS,
  normalizeOffer,
  ValidationError,
  validateApiRequest,
} from "./index.ts";

declare const Deno: {
  test(name: string, fn: () => void | Promise<void>): void;
};

const assert: (condition: unknown, message?: string) => asserts condition = (
  condition: unknown,
  message = "assertion failed",
) => {
  if (!condition) throw new Error(message);
};

const assertEquals = (actual: unknown, expected: unknown) => {
  const left = JSON.stringify(actual);
  const right = JSON.stringify(expected);
  if (left !== right) throw new Error(`expected ${right}, received ${left}`);
};

const assertThrowsValidation = (fn: () => unknown, code: string) => {
  try {
    fn();
  } catch (error) {
    if (!(error instanceof ValidationError)) throw new Error("expected ValidationError");
    assertEquals(error.code, code);
    return;
  }
  throw new Error("expected function to throw");
};

const base = {
  id: "11111111-1111-4111-8111-111111111111",
  offer_type: "bloqueio_aereo",
  source_type: "bloqueio",
  origin_city: "São Paulo",
  origin_iata: "GRU",
  destination_name: "Recife",
  destination_iata: "REC",
  departure_date: "2026-09-10",
  return_date: "2026-09-17",
  nights: 7,
  airline: "LATAM",
  outbound_departure_time: "10:00",
  outbound_arrival_time: "13:00",
  return_departure_time: "14:00",
  return_arrival_time: "17:00",
  available_seats: 4,
  currency: "BRL",
  price_per_person: 1299,
  boarding_tax: 199,
  issue_deadline: "2026-09-01T23:59:00-03:00",
  updated_at: "2026-08-20T12:00:00Z",
  raw_data: {},
};

const packageBase = {
  ...base,
  offer_type: "pacote",
  source_type: "nacional",
  destination_iata: null,
  airline: null,
  available_seats: null,
  issue_deadline: null,
  price_per_person: 4290,
  boarding_tax: 398.04,
  raw_data: {
    nome: "João Pessoa com passeios",
    categoria: "Nacional",
    inclui: ["Passagem aérea ida e volta", "Hospedagem"],
    air_price_per_person: 1305,
    hoteis: [
      { nome: "Hotel A", preco: "R$ 4.330,00", taxas: "R$ 199,00", regime: "Café da manhã" },
      { nome: "Hotel B", preco: "R$ 4.290,00", taxas: "R$ 199,00", parcela: "10x de R$ 429" },
    ],
  },
};

Deno.test("1. normaliza bloqueio aéreo válido", () => {
  const item = normalizeOffer(base as any);
  assertEquals(item.kind, "air_block");
  assertEquals(item.available_seats, 4);
  assertEquals(item.price_per_person, 1299);
});

Deno.test("2. normaliza pacote nacional e escolhe hospedagem de menor valor", () => {
  const item = normalizeOffer(packageBase as any);
  assertEquals(item.kind, "package");
  if (item.kind !== "package") throw new Error("unexpected kind");
  assertEquals(item.hotel, "Hotel B");
  assertEquals(item.tax_per_person, 199);
});

Deno.test("3. pacote internacional sem origem aérea mantém campos nulos", () => {
  const item = normalizeOffer({
    ...packageBase,
    source_type: "internacional",
    origin_city: null,
    origin_iata: null,
    raw_data: { nome: "Pacote terrestre", categoria: "Internacional", inclui: ["Hospedagem"] },
  } as any);
  if (item.kind !== "package") throw new Error("unexpected kind");
  assertEquals(item.origin, null);
  assertEquals(item.origin_iata, null);
  assertEquals(item.airfare_included, false);
});

Deno.test("4. pacote de evento identifica ingresso", () => {
  const item = normalizeOffer({
    ...packageBase,
    source_type: "evento",
    raw_data: {
      nome: "Show",
      categoria: "Evento",
      evento: true,
      hotel: { nome: "Hotel Central", regime: "Café da manhã" },
      ingressos: [{ categoria: "Pista", preco: "R$ 2.400,00", parcela: "10x de R$ 240" }],
      inclui: ["Aéreo", "Hospedagem"],
    },
  } as any);
  if (item.kind !== "package") throw new Error("unexpected kind");
  assertEquals(item.event_specific, true);
  assertEquals(item.ticket_included, true);
  assertEquals(item.ticket_options[0].category, "Pista");
});

Deno.test("5. grupo guiado usa normalizador próprio", () => {
  const item = normalizeOffer({
    ...packageBase,
    source_type: "grupo_guiado",
    destination_name: "Reino Unido e Irlanda",
    price_per_person: 33682,
    boarding_tax: 0,
    raw_data: {
      nome: "Inglaterra, Escócia e Irlanda",
      tag: "GRUPO COM GUIA",
      duracao: "15 dias / 14 noites",
      cidades: ["Londres", "Dublin"],
      hoteis: [["Londres", "Holiday Inn"], ["Dublin", "Dublin One"]],
      inclui: ["Passagem aérea ida e volta", "Guia acompanhante"],
      transporte: "Aéreo",
      voos: ["Ida GRU → LHR"],
      precos: [{ t: "Acomodação dupla", s: "total R$ 33.682", v: "10x de R$ 3.368,20", dest: true }],
    },
  } as any);
  assertEquals(item.kind, "guided_group");
  if (item.kind !== "guided_group") throw new Error("unexpected kind");
  assertEquals(item.hotels[0], { city: "Londres", name: "Holiday Inn" });
  assertEquals(item.airfare_included, true);
});

Deno.test("6. calendário sem resultado devolve lista vazia", () => {
  assertEquals(aggregateCalendarRows([], 2), []);
});

Deno.test("7. data sem estoque válido não recebe preço", () => {
  const dates = aggregateCalendarRows([{ ...base, available_seats: 0 } as any], 1);
  assertEquals(dates, []);
});

Deno.test("8. valida paginação real", () => {
  const request = validateApiRequest({ action: "catalog", params: { page: 3, per_page: 10, destination: "Recife" } });
  assertEquals(request.action, "catalog");
  if (request.action !== "catalog") throw new Error("unexpected action");
  assertEquals(request.params.page, 3);
  assertEquals(request.params.per_page, 10);
});

Deno.test("9. rejeita quantidade acima do limite máximo", () => {
  assertThrowsValidation(
    () => validateApiRequest({ action: "catalog", params: { per_page: LIMITS.catalogPageSize + 1 } }),
    "invalid_request",
  );
});

Deno.test("10. rejeita ação inválida", () => {
  assertThrowsValidation(() => validateApiRequest({ action: "delete", params: {} }), "invalid_action");
});

Deno.test("11. rejeita UUID inválido", () => {
  assertThrowsValidation(() => validateApiRequest({ action: "detail", params: { id: "abc" } }), "invalid_uuid");
});

Deno.test("12. rejeita tentativa de solicitar campo interno", () => {
  assertThrowsValidation(
    () => validateApiRequest({ action: "catalog", params: { fields: ["raw_data"] } }),
    "unknown_parameter",
  );
});

Deno.test("13. DTO não contém raw_data", () => {
  const json = JSON.stringify(normalizeOffer(packageBase as any));
  assert(!json.includes("raw_data"));
});

Deno.test("14. DTO não contém source_url", () => {
  const json = JSON.stringify(normalizeOffer({ ...packageBase, source_url: "https://internal" } as any));
  assert(!json.includes("source_url"));
  assert(!json.includes("https://internal"));
});

Deno.test("15. remove token ou link interno de texto público", () => {
  const item = normalizeOffer({
    ...packageBase,
    raw_data: {
      ...packageBase.raw_data,
      inclui: ["Hospedagem", "https://supplier.invalid/file?access_token=secret"],
    },
  } as any);
  if (item.kind !== "package") throw new Error("unexpected kind");
  const json = JSON.stringify(item);
  assert(!json.includes("access_token"));
  assertEquals(item.inclusions, ["Hospedagem"]);
});

Deno.test("16. calendário exclui bloqueio com passageiros acima das vagas", () => {
  const dates = aggregateCalendarRows([{ ...base, available_seats: 2 } as any], 3);
  assertEquals(dates, []);
});

Deno.test("17. pacote sem informação de vagas retorna null", () => {
  const item = normalizeOffer(packageBase as any);
  assertEquals(item.available_seats, null);
});

Deno.test("18. pacote sem aéreo retorna airfare_included false e preço aéreo null", () => {
  const item = normalizeOffer({
    ...packageBase,
    origin_iata: null,
    raw_data: { nome: "Hotel e passeios", inclui: ["Hospedagem", "Transfer"] },
  } as any);
  if (item.kind !== "package") throw new Error("unexpected kind");
  assertEquals(item.airfare_included, false);
  assertEquals(item.airfare_price_per_person, null);
});

Deno.test("19. calendário rejeita intervalo superior a 120 dias", () => {
  assertThrowsValidation(
    () => validateApiRequest({
      action: "calendar",
      params: {
        origin_iata: "GRU",
        destination_iata: "REC",
        start_date: "2026-09-01",
        end_date: "2027-01-01",
        passengers: 2,
      },
    }),
    "range_too_large",
  );
});

Deno.test("20. pacote sem imagem pública não expõe caminho relativo", () => {
  const item = normalizeOffer({
    ...packageBase,
    raw_data: { ...packageBase.raw_data, capa: "img/internal.webp" },
  } as any);
  if (item.kind !== "package") throw new Error("unexpected kind");
  assertEquals(item.image_url, null);
});
