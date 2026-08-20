import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Heart, Radar, Scale, Sparkles, X } from "lucide-react";
import { useMemo, useRef, useState } from "react";

import {
  DEFAULT_CATALOG_FILTERS,
  OpportunityBadge,
  OpportunityButton,
  OpportunityCard,
  OpportunityFilters,
  OpportunityHeader,
  OpportunityPagination,
  OpportunityState,
  catalogParamsFromFilters,
  validateCatalogFilters,
  type CatalogFilterErrors,
  type CatalogFilterValues,
  type OpportunityCardBadge,
} from "@/components/opportunities";
import { useOpportunityFavorites } from "@/hooks/useOpportunityFavorites";
import {
  TRAVEL_OFFERS_NOTICE,
  fetchTravelOfferCatalog,
  fetchTravelOfferFacets,
  type PublicOfferSubtype,
  type PublicOfferType,
  type TravelOfferCatalogItem,
} from "@/lib/travelOffersPublic";

const PAGE_SIZE = 18;

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

const numberFormatter = new Intl.NumberFormat("pt-BR");

const editorialSections: Array<{
  label: string;
  description: string;
  subtype: PublicOfferSubtype;
  offerType: PublicOfferType;
}> = [
  { label: "Bloqueios aéreos", description: "Tarifas com assentos controlados", subtype: "bloqueio", offerType: "bloqueio_aereo" },
  { label: "Pacotes nacionais", description: "Brasil com hospedagem e experiências", subtype: "nacional", offerType: "pacote" },
  { label: "Internacionais", description: "Oportunidades para viajar ao exterior", subtype: "internacional", offerType: "pacote" },
  { label: "Eventos", description: "Viagens ligadas a datas especiais", subtype: "evento", offerType: "pacote" },
  { label: "Grupos guiados", description: "Roteiros acompanhados e estruturados", subtype: "grupo_guiado", offerType: "pacote" },
];

function formatDate(value: string | null) {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? null : dateFormatter.format(date);
}

function badgesFor(item: TravelOfferCatalogItem): OpportunityCardBadge[] {
  const badges: OpportunityCardBadge[] = [];
  if (item.offer_subtype === "evento") badges.push({ label: "Evento", variant: "event" });
  if (item.offer_subtype === "grupo_guiado") badges.push({ label: "Grupo guiado", variant: "guided" });
  if (item.available_seats !== null && item.available_seats <= 5) {
    badges.push({ label: item.available_seats === 1 ? "Última vaga" : "Últimas vagas", variant: "seats" });
  }
  return badges;
}

function countForSubtype(
  facets: Awaited<ReturnType<typeof fetchTravelOfferFacets>> | undefined,
  subtype: PublicOfferSubtype,
) {
  return facets?.subtypes.find((item) => item.value === subtype)?.count ?? null;
}

export default function OpportunitiesCatalog() {
  const [draftFilters, setDraftFilters] = useState<CatalogFilterValues>(DEFAULT_CATALOG_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<CatalogFilterValues>(DEFAULT_CATALOG_FILTERS);
  const [filterErrors, setFilterErrors] = useState<CatalogFilterErrors>({});
  const [page, setPage] = useState(1);
  const [comparisonIds, setComparisonIds] = useState<string[]>([]);
  const resultsRef = useRef<HTMLElement>(null);
  const { favoriteCount, isFavorite, toggleFavorite } = useOpportunityFavorites();

  const facetsQuery = useQuery({
    queryKey: ["travel-offers-public", "facets"],
    queryFn: ({ signal }) => fetchTravelOfferFacets(signal),
    staleTime: 5 * 60_000,
    retry: 1,
  });

  const catalogParams = useMemo(
    () => catalogParamsFromFilters(appliedFilters, page, PAGE_SIZE),
    [appliedFilters, page],
  );

  const catalogQuery = useQuery({
    queryKey: ["travel-offers-public", "catalog", catalogParams],
    queryFn: ({ signal }) => fetchTravelOfferCatalog(catalogParams, signal),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
    retry: 1,
  });

  const applyFilters = () => {
    const errors = validateCatalogFilters(draftFilters);
    setFilterErrors(errors);
    if (Object.keys(errors).length) return;
    setPage(1);
    setAppliedFilters({ ...draftFilters });
  };

  const clearFilters = () => {
    setDraftFilters({ ...DEFAULT_CATALOG_FILTERS });
    setAppliedFilters({ ...DEFAULT_CATALOG_FILTERS });
    setFilterErrors({});
    setPage(1);
  };

  const applyEditorialSection = (subtype: PublicOfferSubtype, offerType: PublicOfferType) => {
    const next = { ...DEFAULT_CATALOG_FILTERS, subtype, offerType };
    setDraftFilters(next);
    setAppliedFilters(next);
    setFilterErrors({});
    setPage(1);
    resultsRef.current?.scrollIntoView?.({ behavior: "smooth", block: "start" });
  };

  const changePage = (nextPage: number) => {
    setPage(nextPage);
    resultsRef.current?.scrollIntoView?.({ behavior: "smooth", block: "start" });
  };

  const toggleComparison = (id: string) => {
    setComparisonIds((current) => {
      if (current.includes(id)) return current.filter((item) => item !== id);
      return current.length < 3 ? [...current, id] : current;
    });
  };

  const total = catalogQuery.data?.total ?? 0;
  const notice = catalogQuery.data?.notice || facetsQuery.data?.notice || TRAVEL_OFFERS_NOTICE;

  return (
    <div className="opportunities-theme min-h-screen bg-tomorrow-background text-tomorrow-text">
      <OpportunityHeader
        activeHref="/oportunidades/catalogo"
        navItems={[
          { label: "Catálogo", href: "/oportunidades/catalogo" },
          { label: "Comparar", href: "/oportunidades/comparar" },
        ]}
        ctaHref="/teo"
      />

      <main>
        <section className="relative overflow-hidden border-b border-tomorrow-line">
          <div className="pointer-events-none absolute inset-0 opacity-70" aria-hidden="true">
            <div className="absolute left-[8%] top-12 size-48 rounded-full bg-tomorrow-teal/10 blur-3xl" />
            <div className="absolute right-[12%] top-24 size-64 rounded-full bg-tomorrow-gold/10 blur-3xl" />
          </div>
          <div className="relative mx-auto grid w-full max-w-[90rem] gap-8 px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
            <div className="max-w-4xl">
              <OpportunityBadge variant="neutral">
                <Radar className="size-4" aria-hidden="true" />
                Radar Tomorrow
              </OpportunityBadge>
              <h1 className="mt-5 max-w-3xl font-editorial text-5xl leading-[0.94] text-tomorrow-text sm:text-6xl lg:text-7xl">
                Oportunidades reais para o seu próximo amanhã.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-relaxed text-tomorrow-muted sm:text-lg">
                Consulte bloqueios aéreos e pacotes válidos do inventário Tomorrow Travel. Sem preços estimados e sem disponibilidade inventada.
              </p>
              <div className="mt-6 flex flex-wrap gap-3 text-sm text-tomorrow-muted">
                <span>{catalogQuery.data ? `${numberFormatter.format(total)} resultados compatíveis` : "Inventário consultado em tempo real"}</span>
                <span aria-hidden="true">·</span>
                <span>{favoriteCount === 1 ? "1 favorito local" : `${favoriteCount} favoritos locais`}</span>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5" aria-label="Coleções de oportunidades">
              {editorialSections.map((section) => {
                const count = countForSubtype(facetsQuery.data, section.subtype);
                const active = appliedFilters.subtype === section.subtype;
                return (
                  <button
                    key={section.subtype}
                    type="button"
                    className={`opportunity-focus rounded-tomorrow border p-4 text-left transition-colors ${
                      active
                        ? "border-tomorrow-gold/70 bg-tomorrow-gold/10"
                        : "border-tomorrow-line bg-tomorrow-surface/65 hover:border-tomorrow-teal/60"
                    }`}
                    aria-pressed={active}
                    onClick={() => applyEditorialSection(section.subtype, section.offerType)}
                  >
                    <span className="block text-sm font-bold text-tomorrow-text">{section.label}</span>
                    <span className="mt-1 block text-xs leading-relaxed text-tomorrow-muted">{section.description}</span>
                    <span className="mt-3 block text-xs font-semibold text-tomorrow-gold-soft">
                      {count === null ? "Consultando" : `${numberFormatter.format(count)} ofertas`}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <div className="mx-auto grid w-full max-w-[90rem] gap-10 px-4 py-10 sm:px-6 lg:px-8">
          <details className="group" open>
            <summary className="opportunity-focus mb-4 flex cursor-pointer list-none items-center justify-between rounded-tomorrow border border-tomorrow-line bg-tomorrow-surface/65 px-4 py-3 font-semibold text-tomorrow-text [&::-webkit-details-marker]:hidden">
              <span>Busca e filtros</span>
              <span className="text-xs font-medium text-tomorrow-muted group-open:hidden">Mostrar</span>
              <span className="hidden text-xs font-medium text-tomorrow-muted group-open:inline">Ocultar</span>
            </summary>
            <OpportunityFilters
              values={draftFilters}
              facets={facetsQuery.data}
              errors={filterErrors}
              disabled={catalogQuery.isFetching && !catalogQuery.data}
              onChange={setDraftFilters}
              onApply={applyFilters}
              onClear={clearFilters}
            />
          </details>

          <section ref={resultsRef} className="scroll-mt-28" aria-labelledby="catalog-results-title">
            <div className="mb-6 flex flex-col gap-3 border-b border-tomorrow-line pb-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-tomorrow-teal-soft">
                  <Sparkles className="size-4" aria-hidden="true" />
                  Inventário válido
                </p>
                <h2 id="catalog-results-title" className="mt-2 font-editorial text-4xl text-tomorrow-text">
                  {catalogQuery.data ? `${numberFormatter.format(total)} oportunidades` : "Oportunidades"}
                </h2>
              </div>
              {catalogQuery.isFetching && catalogQuery.data ? (
                <p className="text-sm text-tomorrow-muted" role="status">Atualizando resultados…</p>
              ) : null}
            </div>

            {catalogQuery.isPending ? <OpportunityState state="loading" /> : null}

            {catalogQuery.isError ? (
              <OpportunityState
                state="error"
                description={catalogQuery.error instanceof Error ? catalogQuery.error.message : undefined}
                actionLabel="Tentar novamente"
                onAction={() => catalogQuery.refetch()}
              />
            ) : null}

            {catalogQuery.data && catalogQuery.data.items.length === 0 ? (
              <OpportunityState state="empty" actionLabel="Limpar filtros" onAction={clearFilters} />
            ) : null}

            {catalogQuery.data && catalogQuery.data.items.length > 0 ? (
              <>
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {catalogQuery.data.items.map((item) => {
                    const favorite = isFavorite(item.id);
                    const selectedForComparison = comparisonIds.includes(item.id);
                    const comparisonLimitReached = comparisonIds.length >= 3 && !selectedForComparison;
                    return (
                      <div key={item.id} className="relative grid gap-3">
                        <OpportunityCard
                          id={item.id}
                          kind={item.kind === "air_block" ? "air_block" : "package"}
                          title={item.name || (item.kind === "air_block" ? item.airline : item.category)}
                          origin={item.origin}
                          originIata={item.origin_iata}
                          destination={item.destination || item.destination_iata || "Destino não informado"}
                          destinationIata={item.destination_iata}
                          departureLabel={formatDate(item.departure_date)}
                          returnLabel={formatDate(item.return_date)}
                          nights={item.nights}
                          pricePerPerson={item.price_per_person}
                          taxPerPerson={item.tax_per_person}
                          currency={item.currency}
                          availableSeats={item.available_seats}
                          airfareIncluded={item.airfare_included}
                          imageUrl={item.image_url}
                          imageAlt={item.destination ? `Vista de ${item.destination}` : "Imagem pública da oportunidade"}
                          badges={badgesFor(item)}
                          actionHref={`/oportunidades/oferta/${encodeURIComponent(item.id)}`}
                          actionLabel="Ver detalhes"
                        />
                        <button
                          type="button"
                          className="opportunity-focus absolute right-4 top-4 z-10 grid size-10 place-items-center rounded-full border border-tomorrow-line bg-tomorrow-background/90 text-tomorrow-gold-soft shadow-lg backdrop-blur transition-colors hover:border-tomorrow-gold"
                          aria-label={favorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                          aria-pressed={favorite}
                          onClick={() => toggleFavorite(item.id)}
                        >
                          <Heart className="size-5" fill={favorite ? "currentColor" : "none"} aria-hidden="true" />
                        </button>
                        <OpportunityButton
                          variant={selectedForComparison ? "teal" : "ghost"}
                          fullWidth
                          disabled={comparisonLimitReached}
                          aria-pressed={selectedForComparison}
                          onClick={() => toggleComparison(item.id)}
                        >
                          {selectedForComparison ? <X aria-hidden="true" /> : <Scale aria-hidden="true" />}
                          {selectedForComparison ? "Remover da comparação" : comparisonLimitReached ? "Limite de 3 opções" : "Adicionar à comparação"}
                        </OpportunityButton>
                      </div>
                    );
                  })}
                </div>
                {comparisonIds.length ? (
                  <aside className="opportunity-surface sticky bottom-4 z-20 mt-6 flex flex-col gap-4 rounded-tomorrow-lg border border-tomorrow-gold/45 bg-tomorrow-background/95 p-4 shadow-tomorrow-gold backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between" aria-live="polite">
                    <div>
                      <p className="font-semibold text-tomorrow-text">{comparisonIds.length} {comparisonIds.length === 1 ? "oportunidade selecionada" : "oportunidades selecionadas"}</p>
                      <p className="mt-1 text-xs text-tomorrow-muted">Escolha até três opções para comparar dados reais lado a lado.</p>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <OpportunityButton variant="ghost" onClick={() => setComparisonIds([])}>Limpar</OpportunityButton>
                      <OpportunityButton asChild>
                        <a href={`/oportunidades/comparar?ids=${encodeURIComponent(comparisonIds.join(","))}`}><Scale aria-hidden="true" />Comparar agora</a>
                      </OpportunityButton>
                    </div>
                  </aside>
                ) : null}
                <div className="mt-10">
                  <OpportunityPagination
                    page={catalogQuery.data.page}
                    totalPages={catalogQuery.data.total_pages}
                    disabled={catalogQuery.isFetching}
                    onPageChange={changePage}
                  />
                </div>
              </>
            ) : null}
          </section>

          <aside className="opportunity-surface flex flex-col gap-4 rounded-tomorrow-lg border border-tomorrow-gold/30 bg-tomorrow-gold/5 p-5 text-sm text-tomorrow-muted sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-3xl leading-relaxed">{notice}</p>
            <OpportunityButton asChild variant="outline" className="shrink-0">
              <a href="/teo">Planejar com o Téo</a>
            </OpportunityButton>
          </aside>
        </div>
      </main>
    </div>
  );
}
