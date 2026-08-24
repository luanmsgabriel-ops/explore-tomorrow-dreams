import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Heart, Radar, Scale, SlidersHorizontal, Sparkles, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

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
  fetchTravelCatalogFacets,
  fetchTravelOfferCatalog,
  fetchTravelOfferFacets,
  type CatalogFacetParams,
  type PublicOfferSubtype,
  type PublicOfferType,
  type TravelOfferCatalogItem,
} from "@/lib/travelOffersPublic";

const PAGE_SIZE = 18;

const PRIORITY_CATALOG_FILTERS: CatalogFilterValues = {
  ...DEFAULT_CATALOG_FILTERS,
  offerType: "pacote",
  sort: "price_asc",
};

const ALL_CATALOG_FILTERS: CatalogFilterValues = {
  ...PRIORITY_CATALOG_FILTERS,
  offerType: "",
};

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

const numberFormatter = new Intl.NumberFormat("pt-BR");

const editorialSections: Array<{
  label: string;
  subtype: PublicOfferSubtype;
  offerType: PublicOfferType;
}> = [
  { label: "Nacionais", subtype: "nacional", offerType: "pacote" },
  { label: "Internacionais", subtype: "internacional", offerType: "pacote" },
  { label: "Eventos", subtype: "evento", offerType: "pacote" },
  { label: "Grupos", subtype: "grupo_guiado", offerType: "pacote" },
  { label: "Aéreo", subtype: "bloqueio", offerType: "bloqueio_aereo" },
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

function countActiveFilters(filters: CatalogFilterValues) {
  const fields: Array<keyof CatalogFilterValues> = [
    "search",
    "origin",
    "destination",
    "offerType",
    "subtype",
    "category",
    "startDate",
    "endDate",
    "passengers",
    "minPrice",
    "maxPrice",
    "onlyWithSeats",
    "sort",
  ];

  return fields.filter((field) => filters[field] !== PRIORITY_CATALOG_FILTERS[field]).length;
}

function baseFacetParams(filters: CatalogFilterValues): CatalogFacetParams {
  return {
    ...(filters.offerType ? { offer_type: filters.offerType } : {}),
    ...(filters.subtype ? { subtype: filters.subtype } : {}),
  };
}

export default function OpportunitiesCatalog() {
  const [draftFilters, setDraftFilters] = useState<CatalogFilterValues>(PRIORITY_CATALOG_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<CatalogFilterValues>(PRIORITY_CATALOG_FILTERS);
  const [filterErrors, setFilterErrors] = useState<CatalogFilterErrors>({});
  const [filtersOpen, setFiltersOpen] = useState(false);
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

  const originFacetParams = useMemo(() => baseFacetParams(draftFilters), [draftFilters.offerType, draftFilters.subtype]);
  const originFacetsQuery = useQuery({
    queryKey: ["travel-offers-public", "catalog-facets", "origins", originFacetParams],
    queryFn: ({ signal }) => fetchTravelCatalogFacets(originFacetParams, signal),
    staleTime: 5 * 60_000,
    retry: 1,
  });

  const destinationFacetParams = useMemo<CatalogFacetParams | null>(() => draftFilters.origin ? {
    ...baseFacetParams(draftFilters),
    origin: draftFilters.origin,
  } : null, [draftFilters.origin, draftFilters.offerType, draftFilters.subtype]);
  const destinationFacetsQuery = useQuery({
    queryKey: ["travel-offers-public", "catalog-facets", "destinations", destinationFacetParams],
    queryFn: ({ signal }) => fetchTravelCatalogFacets(destinationFacetParams!, signal),
    enabled: Boolean(destinationFacetParams),
    staleTime: 5 * 60_000,
    retry: 1,
  });

  const categoryFacetParams = useMemo<CatalogFacetParams>(() => ({
    ...baseFacetParams(draftFilters),
    ...(draftFilters.origin ? { origin: draftFilters.origin } : {}),
    ...(draftFilters.destination ? { destination: draftFilters.destination } : {}),
  }), [draftFilters.offerType, draftFilters.subtype, draftFilters.origin, draftFilters.destination]);
  const categoryFacetsQuery = useQuery({
    queryKey: ["travel-offers-public", "catalog-facets", "categories", categoryFacetParams],
    queryFn: ({ signal }) => fetchTravelCatalogFacets(categoryFacetParams, signal),
    staleTime: 5 * 60_000,
    retry: 1,
  });

  useEffect(() => {
    if (!draftFilters.origin || originFacetsQuery.isPending || !originFacetsQuery.data) return;
    if (originFacetsQuery.data.origins.some((item) => item.value === draftFilters.origin)) return;
    setDraftFilters((current) => current.origin === draftFilters.origin
      ? { ...current, origin: "", destination: "", category: "" }
      : current);
  }, [draftFilters.origin, originFacetsQuery.data, originFacetsQuery.isPending]);

  useEffect(() => {
    if (!draftFilters.origin || !draftFilters.destination || destinationFacetsQuery.isPending || !destinationFacetsQuery.data) return;
    if (destinationFacetsQuery.data.destinations.some((item) => item.value === draftFilters.destination)) return;
    setDraftFilters((current) => current.origin === draftFilters.origin && current.destination === draftFilters.destination
      ? { ...current, destination: "", category: "" }
      : current);
  }, [draftFilters.origin, draftFilters.destination, destinationFacetsQuery.data, destinationFacetsQuery.isPending]);

  useEffect(() => {
    if (!draftFilters.category || categoryFacetsQuery.isPending || !categoryFacetsQuery.data) return;
    if (categoryFacetsQuery.data.categories.some((item) => item.value === draftFilters.category)) return;
    setDraftFilters((current) => current.category === draftFilters.category ? { ...current, category: "" } : current);
  }, [draftFilters.category, categoryFacetsQuery.data, categoryFacetsQuery.isPending]);

  const contextualFacets = useMemo(() => {
    if (!facetsQuery.data) return undefined;
    return {
      ...facetsQuery.data,
      origins: originFacetsQuery.data?.origins ?? [],
      destinations: draftFilters.origin ? destinationFacetsQuery.data?.destinations ?? [] : [],
      categories: categoryFacetsQuery.data?.categories ?? [],
      date_range: categoryFacetsQuery.data?.date_range ?? facetsQuery.data.date_range,
      price_ranges: categoryFacetsQuery.data?.price_ranges ?? facetsQuery.data.price_ranges,
    };
  }, [draftFilters.origin, categoryFacetsQuery.data, destinationFacetsQuery.data, facetsQuery.data, originFacetsQuery.data]);

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

  const handleDraftFiltersChange = (next: CatalogFilterValues) => {
    setDraftFilters((current) => {
      if (next.offerType !== current.offerType) {
        return { ...next, subtype: "", category: "", origin: "", destination: "" };
      }
      if (next.subtype !== current.subtype) {
        return { ...next, category: "", origin: "", destination: "" };
      }
      if (next.origin !== current.origin) return { ...next, destination: "", category: "" };
      if (next.destination !== current.destination) return { ...next, category: "" };
      return next;
    });
    setFilterErrors({});
  };

  const applyFilters = () => {
    const errors = validateCatalogFilters(draftFilters);
    setFilterErrors(errors);
    if (Object.keys(errors).length) return;
    setPage(1);
    setAppliedFilters({ ...draftFilters });
    setFiltersOpen(false);
  };

  const clearFilters = () => {
    setDraftFilters({ ...PRIORITY_CATALOG_FILTERS });
    setAppliedFilters({ ...PRIORITY_CATALOG_FILTERS });
    setFilterErrors({});
    setPage(1);
    setFiltersOpen(false);
  };

  const applyQuickFilter = (filters: CatalogFilterValues) => {
    setDraftFilters({ ...filters });
    setAppliedFilters({ ...filters });
    setFilterErrors({});
    setPage(1);
    setFiltersOpen(false);
    resultsRef.current?.scrollIntoView?.({ behavior: "smooth", block: "start" });
  };

  const showPackages = () => applyQuickFilter(PRIORITY_CATALOG_FILTERS);
  const showAll = () => applyQuickFilter(ALL_CATALOG_FILTERS);

  const applyEditorialSection = (subtype: PublicOfferSubtype, offerType: PublicOfferType) => {
    applyQuickFilter({ ...PRIORITY_CATALOG_FILTERS, subtype, offerType });
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
  const activeFilterCount = countActiveFilters(appliedFilters);
  const packagesActive = appliedFilters.offerType === "pacote" && !appliedFilters.subtype;
  const allActive = appliedFilters.offerType === "" && !appliedFilters.subtype;
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
          <div className="relative mx-auto grid w-full max-w-[90rem] gap-5 px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
            <div className="max-w-4xl">
              <OpportunityBadge variant="neutral">
                <Radar className="size-4" aria-hidden="true" />
                Radar Tomorrow
              </OpportunityBadge>
              <h1 className="mt-4 max-w-3xl font-editorial text-4xl leading-[0.96] text-tomorrow-text sm:text-6xl lg:text-7xl">
                Oportunidades reais para o seu próximo amanhã.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-tomorrow-muted sm:text-lg">
                Pacotes e bloqueios aéreos válidos do inventário Tomorrow Travel, sem preços estimados ou disponibilidade inventada.
              </p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs text-tomorrow-muted sm:text-sm">
                <span>{catalogQuery.data ? `${numberFormatter.format(total)} resultados compatíveis` : "Inventário consultado em tempo real"}</span>
                <span aria-hidden="true">·</span>
                <span>{favoriteCount === 1 ? "1 favorito local" : `${favoriteCount} favoritos locais`}</span>
              </div>
            </div>

            <div className="-mx-4 overflow-x-auto px-4 pb-1 sm:mx-0 sm:overflow-visible sm:px-0" aria-label="Atalhos de oportunidades">
              <div className="flex min-w-max gap-1.5 sm:min-w-0 sm:flex-wrap">
                <button
                  type="button"
                  className={`opportunity-focus rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                    packagesActive
                      ? "border-tomorrow-gold/70 bg-tomorrow-gold/12 text-tomorrow-gold-soft"
                      : "border-tomorrow-line bg-tomorrow-surface/60 text-tomorrow-text hover:border-tomorrow-teal/60"
                  }`}
                  aria-pressed={packagesActive}
                  onClick={showPackages}
                >
                  Pacotes
                </button>
                {editorialSections.map((section) => {
                  const active = appliedFilters.subtype === section.subtype;
                  return (
                    <button
                      key={section.subtype}
                      type="button"
                      className={`opportunity-focus rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                        active
                          ? "border-tomorrow-gold/70 bg-tomorrow-gold/12 text-tomorrow-gold-soft"
                          : "border-tomorrow-line bg-tomorrow-surface/60 text-tomorrow-text hover:border-tomorrow-teal/60"
                      }`}
                      aria-pressed={active}
                      onClick={() => applyEditorialSection(section.subtype, section.offerType)}
                    >
                      {section.label}
                    </button>
                  );
                })}
                <button
                  type="button"
                  className={`opportunity-focus rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                    allActive
                      ? "border-tomorrow-gold/70 bg-tomorrow-gold/12 text-tomorrow-gold-soft"
                      : "border-tomorrow-line bg-tomorrow-surface/60 text-tomorrow-text hover:border-tomorrow-teal/60"
                  }`}
                  aria-pressed={allActive}
                  onClick={showAll}
                >
                  Todos
                </button>
              </div>
            </div>
          </div>
        </section>

        <div className="mx-auto grid w-full max-w-[90rem] gap-5 px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              className="opportunity-focus inline-flex min-h-10 items-center gap-2 rounded-full border border-tomorrow-line bg-tomorrow-surface/70 px-4 py-2 text-sm font-semibold text-tomorrow-text transition-colors hover:border-tomorrow-gold/60"
              onClick={() => setFiltersOpen(true)}
              aria-haspopup="dialog"
            >
              <SlidersHorizontal className="size-4 text-tomorrow-teal-soft" aria-hidden="true" />
              Filtrar e ordenar
              {activeFilterCount > 0 ? (
                <span className="rounded-full bg-tomorrow-gold/15 px-2 py-0.5 text-xs font-bold text-tomorrow-gold-soft">
                  {activeFilterCount}
                </span>
              ) : null}
            </button>
            {packagesActive && appliedFilters.sort === "price_asc" ? (
              <span className="text-xs font-medium text-tomorrow-muted">Pacotes do menor preço para o maior</span>
            ) : null}
          </div>

          {filtersOpen ? (
            <div
              className="fixed inset-0 z-50 flex items-end bg-black/75 sm:items-center sm:p-4"
              role="dialog"
              aria-modal="true"
              aria-labelledby="catalog-filter-dialog-title"
            >
              <div className="max-h-[92vh] w-full overflow-y-auto rounded-t-tomorrow-lg border border-tomorrow-line bg-tomorrow-background p-3 shadow-2xl sm:mx-auto sm:max-w-5xl sm:rounded-tomorrow-lg sm:p-4">
                <div className="mb-3 flex items-center justify-between gap-4 px-1">
                  <div>
                    <p id="catalog-filter-dialog-title" className="font-editorial text-2xl text-tomorrow-text">Filtrar oportunidades</p>
                    <p className="mt-1 text-xs text-tomorrow-muted">Os filtros exibem somente combinações válidas do inventário atual.</p>
                  </div>
                  <button
                    type="button"
                    className="opportunity-focus grid size-10 shrink-0 place-items-center rounded-full border border-tomorrow-line text-tomorrow-text"
                    aria-label="Fechar filtros"
                    onClick={() => setFiltersOpen(false)}
                  >
                    <X className="size-5" aria-hidden="true" />
                  </button>
                </div>
                <OpportunityFilters
                  values={draftFilters}
                  facets={contextualFacets}
                  errors={filterErrors}
                  disabled={catalogQuery.isFetching && !catalogQuery.data}
                  onChange={handleDraftFiltersChange}
                  onApply={applyFilters}
                  onClear={clearFilters}
                />
              </div>
            </div>
          ) : null}

          <section ref={resultsRef} className="scroll-mt-28" aria-labelledby="catalog-results-title">
            <div className="mb-5 flex flex-col gap-2 border-b border-tomorrow-line pb-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-tomorrow-teal-soft">
                  <Sparkles className="size-4" aria-hidden="true" />
                  Inventário válido
                </p>
                <h2 id="catalog-results-title" className="mt-1 font-editorial text-3xl text-tomorrow-text sm:text-4xl">
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
