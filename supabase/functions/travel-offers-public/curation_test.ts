import {
  normalizePackage,
  validateApiRequest,
} from "./core.ts";

declare const Deno: {
  test(name: string, fn: () => void | Promise<void>): void;
};

const assert = (condition: unknown, message: string) => {
  if (!condition) throw new Error(message);
};

Deno.test("catalog aceita ordenação editorial", () => {
  const validated = validateApiRequest({
    action: "catalog",
    params: {
      sort: "editorial",
      page: 1,
      per_page: 20,
      offer_type: "pacote",
    },
  });

  assert(validated.action === "catalog", "ação deveria permanecer catalog");
  if (validated.action !== "catalog") return;
  assert(validated.params.sort === "editorial", "sort editorial deveria ser preservado");
});

Deno.test("normalização expõe somente metadados editoriais seguros", () => {
  const item = normalizePackage({
    id: "4900baa4-bced-49a6-a8c9-a5a0a1ef6835",
    offer_type: "pacote",
    source_type: "internacional",
    origin_city: "São Paulo",
    origin_iata: "GRU",
    destination_name: "Paris",
    destination_iata: "CDG",
    departure_date: "2027-01-10",
    return_date: "2027-01-20",
    nights: 10,
    airline: null,
    outbound_departure_time: null,
    outbound_arrival_time: null,
    return_departure_time: null,
    return_arrival_time: null,
    available_seats: 8,
    currency: "BRL",
    price_per_person: 9999,
    boarding_tax: 0,
    issue_deadline: null,
    updated_at: "2026-08-22T18:00:00Z",
    raw_data: {
      nome: "Título editorial aplicado pela fonte interna",
      capa: "https://example.com/oferta.webp",
      hoteis: [{ nome: "Hotel Teste", preco: "9999" }],
      inclui: ["Hospedagem"],
    },
    curation_featured: true,
    curation_sort_order: -5,
    curation_campaign_label: "Seleção Tomorrow",
    curation_subtitle: "Escolha editorial da equipe Tomorrow Travel",
  });

  assert(item.name === "Título editorial aplicado pela fonte interna", "título efetivo não foi usado");
  assert(item.image_url === "https://example.com/oferta.webp", "imagem efetiva não foi usada");
  assert(item.featured === true, "featured deveria ser público");
  assert(item.editorial_order === -5, "ordem editorial deveria ser pública");
  assert(item.campaign_label === "Seleção Tomorrow", "campanha deveria ser pública");
  assert(
    item.editorial_subtitle === "Escolha editorial da equipe Tomorrow Travel",
    "subtítulo editorial deveria ser público",
  );
});
