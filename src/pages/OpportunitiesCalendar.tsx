import { useQueries, useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Plane,
  Scale,
  Search,
  Sparkles,
  UsersRound,
  X,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";

import {
  OpportunityBadge,
  OpportunityButton,
  OpportunityHeader,
  OpportunityState,
} from "@/components/opportunities";
import { comparisonHref } from "@/lib/opportunityComparison";
import {
  buildCalendarMonth,
  calculatePriceBands,
  calendarForwardWindow,
  fetchOpportunityCalendar,
  monthEnd,
  monthStart,
  priceBand,
  shiftDate,
  shiftMonth,
  singleCalendarCurrency,
  type OpportunityCalendarDate,
} from "@/lib/opportunityCalendar";
import {
  TRAVEL_OFFERS_NOTICE,
  fetchTravelCalendarFacets,
  fetchTravelOfferCatalog,
  type PublicOfferType,
  type TravelOfferCatalogItem,
} from "@/lib/travelOffersPublic";

const weekdays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

const monthFormatter = new Intl.DateTimeFormat("pt-BR", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

const numberFormatter = new Intl.NumberFormat("pt-BR", {
  maximumFractionDigits: 0,
});

function formatDate(value: string | null) {
  if (!value) return "Não informada";
  return dateFormatter.format(new Date(`${value}T00:00:00Z`));
}

function formatMonth(value: string) {
  const formatted = monthFormatter.format(new Date(`${value}T00:00:00Z`));
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

function formatCurrency(value: number | null, currency: string | null) {
  if (value === null || !Number.isFinite(value)) return "Não informado";
  if (!currency) return numberFormatter.format(value);
  try {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${numberFormatter.format(value)} ${currency}`;
  }
}

function compactPrice(value: number) {
  return numberFormatter.format(value);
}

function optionTitle(item: TravelOfferCatalogItem) {
  return item.name || item.airline || item.category || "Oportunidade";
}

function optionRoute(item: TravelOfferCatalogItem) {
  const origin = item.origin_iata || item.origin || "Origem não informada";
  const destination = item.destination_iata || item.destination || "Destino não informado";
  return `${origin} → ${destination}`;
}

type SearchState = {
  origin: string;
  destination: string;
  passengers: number;
  offerType: "" | PublicOfferType;
};

type AppliedSearch = SearchState & {
  minDate: string;
  maxDate: string;
  priceRanges: Array<{ currency: string | null; min: number; max: number }>;
  notice: string;
};

type SearchErrors = Partial<Record<keyof SearchState, string>>;
type CalendarWindow = { startDate: string; endDate: string };

const initialSearch: SearchState = {
  origin: "",
  destination: "",
  passengers: 1,
  offerType: "",
};

export default function OpportunitiesCalendar() {
  const [draft, setDraft] = useState<SearchState>(initialSearch);
  const [confirmed, setConfirmed] = useState<SearchState | null>(null);
  const [applied, setApplied] = useState<AppliedSearch | null>(null);
  const [errors, setErrors] = useState<SearchErrors>({});
  const [visibleMonth, setVisibleMonth] = useState<string>(monthStart(new Date().toISOString().slice(0, 10)));
  const [calendarWindows, setCalendarWindows] = useState<CalendarWindow[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [comparisonIds, setComparisonIds] = useState<string[]>([]);

  const originFacetParams = useMemo(
    () => draft.offerType ? { offer_type: draft.offerType } : {},
    [draft.offerType],
  );

  const originFacetsQuery = useQuery({
    queryKey: ["travel-offers-public", "calendar_facets", "origins", originFacetParams],
    queryFn: ({ signal }) => fetchTravelCalendarFacets(originFacetParams, signal),
    staleTime: 5 * 60_000,
    retry: 1,
  });

  const destinationFacetParams = useMemo(() => draft.origin ? {
    origin: draft.origin,
    ...(draft.offerType ? { offer_type: draft.offerType } : {}),
  } : null, [draft.origin, draft.offerType]);

  const destinationFacetsQuery = useQuery({
    queryKey: ["travel-offers-public", "calendar_facets", "destinations", destinationFacetParams],
    queryFn: ({ signal }) => fetchTravelCalendarFacets(destinationFacetParams!, signal),
    enabled: Boolean(destinationFacetParams),
    staleTime: 5 * 60_000,
    retry: 1,
  });

  useEffect(() => {
    if (!draft.origin || originFacetsQuery.isPending || !originFacetsQuery.data) return;
    const originStillAvailable = originFacetsQuery.data.origins.some((item) => item.value === draft.origin);
    if (originStillAvailable) return;
    setDraft((current) => current.origin === draft.origin
      ? { ...current, origin: "", destination: "" }
      : current);
  }, [draft.origin, originFacetsQuery.data, originFacetsQuery.isPending]);

  useEffect(() => {
    if (!draft.origin || !draft.destination || destinationFacetsQuery.isPending || !destinationFacetsQuery.data) return;
    const destinationStillAvailable = destinationFacetsQuery.data.destinations.some((item) => item.value === draft.destination);
    if (destinationStillAvailable) return;
    setDraft((current) => current.origin === draft.origin && current.destination === draft.destination
      ? { ...current, destination: "" }
      : current);
  }, [draft.origin, draft.destination, destinationFacetsQuery.data, destinationFacetsQuery.isPending]);

  const routeFacetParams = useMemo(() => confirmed ? {
    origin: confirmed.origin,
    destination: confirmed.destination,
    ...(confirmed.offerType ? { offer_type: confirmed.offerType } : {}),
  } : null, [confirmed]);

  const routeFacetsQuery = useQuery({
    queryKey: ["travel-offers-public", "calendar_facets", "route", routeFacetParams],
    queryFn: ({ signal }) => fetchTravelCalendarFacets(routeFacetParams!, signal),
    enabled: Boolean(routeFacetParams),
    staleTime: 60_000,
    retry: 1,
  });

  useEffect(() => {
    if (!confirmed || !routeFacetsQuery.data) return;
    const minDate = routeFacetsQuery.data.date_range.min;
    const maxDate = routeFacetsQuery.data.date_range.max;
    setSelectedDate(null);
    setComparisonIds([]);
    if (!minDate || !maxDate) {
      setApplied(null);
      setCalendarWindows([]);
      return;
    }

    const nextApplied: AppliedSearch = {
      ...confirmed,
      minDate,
      maxDate,
      priceRanges: routeFacetsQuery.data.price_ranges,
      notice: routeFacetsQuery.data.notice,
    };
    setApplied(nextApplied);
    setVisibleMonth(monthStart(minDate));
    setCalendarWindows([calendarForwardWindow(minDate, maxDate)]);
  }, [confirmed, routeFacetsQuery.data]);

  const calendarQueries = useQueries({
    queries: calendarWindows.map((window) => ({
      queryKey: [
        "travel-offers-public",
        "calendar",
        applied?.origin,
        applied?.destination,
        applied?.passengers,
        applied?.offerType,
        window.startDate,
        window.endDate,
      ],
      queryFn: ({ signal }: { signal: AbortSignal }) => fetchOpportunityCalendar({
        origin: applied!.origin,
        destination: applied!.destination,
        start_date: window.startDate,
        end_date: window.endDate,
        passengers: applied!.passengers,
        ...(applied!.offerType ? { offer_type: applied!.offerType } : {}),
      }, signal),
      enabled: Boolean(applied),
      staleTime: 60_000,
      retry: 1,
    })),
  });

  const loadedCalendarResponses = useMemo(
    () => calendarQueries.flatMap((query) => query.data ? [query.data] : []),
    [calendarQueries],
  );

  const calendarDates = useMemo(() => {
    const byDate = new Map<string, OpportunityCalendarDate>();
    for (const response of loadedCalendarResponses) {
      for (const entry of response.dates) {
        const current = byDate.get(entry.date);
        if (!current || entry.min_price_per_person < current.min_price_per_person) byDate.set(entry.date, entry);
      }
    }
    return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
  }, [loadedCalendarResponses]);

  const loadedCoverageEnd = useMemo(() => {
    const ends = loadedCalendarResponses.map((response) => response.end_date).sort();
    return ends.at(-1) ?? null;
  }, [loadedCalendarResponses]);

  const plannedCoverageEnd = calendarWindows.at(-1)?.endDate ?? null;
  const calendarPending = calendarQueries.some((query) => query.isPending || query.isFetching);
  const calendarError = calendarQueries.find((query) => query.isError)?.error;
  const totalOptions = loadedCalendarResponses.reduce((sum, response) => sum + response.total_options, 0);

  const compatibleParams = useMemo(() => {
    if (!applied || !selectedDate) return null;
    return {
      origin: applied.origin,
      destination: applied.destination,
      start_date: selectedDate,
      end_date: selectedDate,
      passengers: applied.passengers,
      ...(applied.offerType ? { offer_type: applied.offerType } : {}),
      sort: "price_asc" as const,
      page: 1,
      per_page: 50,
    };
  }, [applied, selectedDate]);

  const compatibleQuery = useQuery({
    queryKey: ["travel-offers-public", "calendar-compatible", compatibleParams],
    queryFn: ({ signal }) => fetchTravelOfferCatalog(compatibleParams!, signal),
    enabled: Boolean(compatibleParams),
    staleTime: 30_000,
    retry: 1,
  });

  const calendarByDate = useMemo(
    () => new Map(calendarDates.map((item) => [item.date, item])),
    [calendarDates],
  );

  const bands = useMemo(
    () => calculatePriceBands(calendarDates.map((item) => item.min_price_per_person)),
    [calendarDates],
  );

  const currency = singleCalendarCurrency(applied?.priceRanges);
  const monthCells = useMemo(() => buildCalendarMonth(visibleMonth), [visibleMonth]);

  const routeOptions = useMemo(() => {
    const routes = new Set<string>();
    for (const date of calendarDates) {
      if (date.origin_iata && date.destination_iata) routes.add(`${date.origin_iata} → ${date.destination_iata}`);
    }
    return [...routes].sort();
  }, [calendarDates]);

  const returnGroups = useMemo(() => {
    const groups = new Map<string, TravelOfferCatalogItem[]>();
    for (const item of compatibleQuery.data?.items ?? []) {
      const key = item.return_date || "unknown";
      const current = groups.get(key) ?? [];
      current.push(item);
      groups.set(key, current);
    }
    return [...groups.entries()].sort(([a], [b]) => {
      if (a === "unknown") return 1;
      if (b === "unknown") return -1;
      return a.localeCompare(b);
    });
  }, [compatibleQuery.data?.items]);

  const validate = () => {
    const next: SearchErrors = {};
    if (!draft.origin) next.origin = "Selecione a origem.";
    if (!draft.destination) next.destination = "Selecione o destino.";
    if (draft.origin && draft.destination && draft.origin === draft.destination) {
      next.destination = "Origem e destino precisam ser diferentes.";
    }
    if (!Number.isInteger(draft.passengers) || draft.passengers < 1 || draft.passengers > 20) {
      next.passengers = "Informe de 1 a 20 passageiros.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    if (!validate()) return;
    setConfirmed({ ...draft });
    setApplied(null);
    setCalendarWindows([]);
    setSelectedDate(null);
    setComparisonIds([]);
  };

  const changeOrigin = (origin: string) => {
    setDraft((current) => ({ ...current, origin, destination: "" }));
    setErrors((current) => ({ ...current, origin: undefined, destination: undefined }));
  };

  const changeType = (offerType: SearchState["offerType"]) => {
    setDraft((current) => ({ ...current, offerType }));
    setErrors((current) => ({ ...current, origin: undefined, destination: undefined }));
  };

  const selectDate = (entry: OpportunityCalendarDate) => {
    setSelectedDate(entry.date);
    setComparisonIds([]);
  };

  const toggleComparison = (id: string) => {
    setComparisonIds((current) => {
      if (current.includes(id)) return current.filter((item) => item !== id);
      return current.length < 3 ? [...current, id] : current;
    });
  };

  const routeMinMonth = applied ? monthStart(applied.minDate) : null;
  const routeMaxMonth = applied ? monthStart(applied.maxDate) : null;
  const canPrevious = Boolean(routeMinMonth && shiftMonth(visibleMonth, -1) >= routeMinMonth);
  const canNext = Boolean(routeMaxMonth && shiftMonth(visibleMonth, 1) <= routeMaxMonth);

  const moveMonth = (direction: -1 | 1) => {
    if (!applied) return;
    const next = shiftMonth(visibleMonth, direction);
    if (next < monthStart(applied.minDate) || next > monthStart(applied.maxDate)) return;

    const requiredEnd = monthEnd(next) > applied.maxDate ? applied.maxDate : monthEnd(next);
    if (direction > 0 && plannedCoverageEnd && requiredEnd > plannedCoverageEnd && plannedCoverageEnd < applied.maxDate) {
      const nextStart = shiftDate(plannedCoverageEnd, 1);
      setCalendarWindows((current) => [...current, calendarForwardWindow(nextStart, applied.maxDate)]);
    }
    setVisibleMonth(next);
    setSelectedDate(null);
    setComparisonIds([]);
  };

  const requiredVisibleEnd = applied
    ? (monthEnd(visibleMonth) > applied.maxDate ? applied.maxDate : monthEnd(visibleMonth))
    : null;
  const visibleMonthFullyLoaded = Boolean(
    loadedCoverageEnd && requiredVisibleEnd && loadedCoverageEnd >= requiredVisibleEnd,
  );
  const selectedEntry = selectedDate ? calendarByDate.get(selectedDate) : undefined;
  const notice = loadedCalendarResponses.at(-1)?.notice || applied?.notice || routeFacetsQuery.data?.notice || TRAVEL_OFFERS_NOTICE;
  const routeUnavailable = Boolean(confirmed && routeFacetsQuery.data && (!routeFacetsQuery.data.date_range.min || !routeFacetsQuery.data.date_range.max));

  const fieldClass = "opportunity-focus min-h-11 w-full rounded-tomorrow border border-tomorrow-line bg-tomorrow-surface/90 px-3 py-2 text-sm text-tomorrow-text disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <div className="opportunities-theme min-h-screen bg-tomorrow-background text-tomorrow-text">
      <OpportunityHeader
        activeHref="/oportunidades/calendario"
        navItems={[
          { label: "Catálogo", href: "/oportunidades/catalogo" },
          { label: "Comparar", href: "/oportunidades/comparar" },
        ]}
        ctaHref="/teo"
      />

      <main>
        <section className="relative overflow-hidden border-b border-tomorrow-line">
          <div className="pointer-events-none absolute inset-0" aria-hidden="true">
            <div className="absolute -left-20 top-10 size-72 rounded-full bg-tomorrow-teal/10 blur-3xl" />
            <div className="absolute right-0 top-16 size-80 rounded-full bg-tomorrow-gold/10 blur-3xl" />
          </div>
          <div className="relative mx-auto grid w-full max-w-[90rem] gap-8 px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
            <div className="max-w-4xl">
              <OpportunityBadge variant="neutral">
                <CalendarDays className="size-4" aria-hidden="true" />
                Calendário inteligente
              </OpportunityBadge>
              <h1 className="mt-5 max-w-4xl font-editorial text-4xl leading-[0.98] text-tomorrow-text sm:text-6xl lg:text-7xl">
                Veja quando viajar pelo menor valor real disponível.
              </h1>
              <p className="mt-5 max-w-3xl text-base leading-relaxed text-tomorrow-muted sm:text-lg">
                Escolha a rota e consulte. O calendário abre na primeira data real disponível e carrega novos períodos somente quando a navegação exigir.
              </p>
            </div>

            <form onSubmit={submitSearch} className="opportunity-surface grid gap-4 rounded-tomorrow-lg border border-tomorrow-line bg-tomorrow-surface/72 p-4 shadow-tomorrow-surface sm:p-6 lg:grid-cols-6" aria-label="Pesquisar calendário de oportunidades">
              <label className="grid gap-2 lg:col-span-2">
                <span className="text-sm font-semibold text-tomorrow-text">Origem</span>
                <select
                  aria-label="Origem"
                  value={draft.origin}
                  onChange={(event) => changeOrigin(event.target.value)}
                  className={fieldClass}
                  aria-invalid={errors.origin ? true : undefined}
                  disabled={originFacetsQuery.isPending}
                >
                  <option value="">{originFacetsQuery.isPending ? "Carregando..." : "Selecione"}</option>
                  {(originFacetsQuery.data?.origins ?? []).map((item) => <option key={item.value} value={item.value}>{item.value}</option>)}
                </select>
                {errors.origin ? <span className="text-xs text-tomorrow-danger">{errors.origin}</span> : null}
              </label>

              <label className="grid gap-2 lg:col-span-2">
                <span className="text-sm font-semibold text-tomorrow-text">Destino</span>
                <select
                  aria-label="Destino"
                  value={draft.destination}
                  onChange={(event) => {
                    setDraft((current) => ({ ...current, destination: event.target.value }));
                    setErrors((current) => ({ ...current, destination: undefined }));
                  }}
                  className={fieldClass}
                  aria-invalid={errors.destination ? true : undefined}
                  disabled={!draft.origin || destinationFacetsQuery.isPending}
                >
                  <option value="">{!draft.origin ? "Escolha a origem primeiro" : destinationFacetsQuery.isPending ? "Carregando..." : "Selecione"}</option>
                  {(destinationFacetsQuery.data?.destinations ?? []).map((item) => <option key={item.value} value={item.value}>{item.value}</option>)}
                </select>
                {errors.destination ? <span className="text-xs text-tomorrow-danger">{errors.destination}</span> : null}
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-semibold text-tomorrow-text">Passageiros</span>
                <div className="relative">
                  <UsersRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-tomorrow-teal-soft" aria-hidden="true" />
                  <input aria-label="Passageiros" type="number" min={1} max={20} value={draft.passengers} onChange={(event) => setDraft((current) => ({ ...current, passengers: Number(event.target.value) }))} className={`${fieldClass} pl-10`} aria-invalid={errors.passengers ? true : undefined} />
                </div>
                {errors.passengers ? <span className="text-xs text-tomorrow-danger">{errors.passengers}</span> : null}
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-semibold text-tomorrow-text">Tipo</span>
                <select aria-label="Tipo" value={draft.offerType} onChange={(event) => changeType(event.target.value as SearchState["offerType"])} className={fieldClass}>
                  <option value="">Todos</option>
                  <option value="bloqueio_aereo">Bloqueios aéreos</option>
                  <option value="pacote">Pacotes</option>
                </select>
              </label>

              <div className="flex items-end lg:col-span-6">
                <OpportunityButton type="submit" size="lg" fullWidth disabled={originFacetsQuery.isPending || routeFacetsQuery.isFetching}>
                  <Search aria-hidden="true" />
                  Consultar calendário
                </OpportunityButton>
              </div>
            </form>
          </div>
        </section>

        <div className="mx-auto grid w-full max-w-[90rem] gap-8 px-4 py-8 sm:px-6 lg:px-8">
          {originFacetsQuery.isError ? (
            <OpportunityState state="error" title="Não foi possível carregar as origens" description={originFacetsQuery.error instanceof Error ? originFacetsQuery.error.message : undefined} actionLabel="Tentar novamente" onAction={() => originFacetsQuery.refetch()} />
          ) : null}

          {draft.origin && destinationFacetsQuery.isError ? (
            <OpportunityState state="error" title="Não foi possível carregar os destinos desta origem" description={destinationFacetsQuery.error instanceof Error ? destinationFacetsQuery.error.message : undefined} actionLabel="Tentar novamente" onAction={() => destinationFacetsQuery.refetch()} />
          ) : null}

          {!confirmed ? (
            <OpportunityState state="empty" title="Escolha uma rota para abrir o calendário" description="Informe origem, destino, passageiros e tipo. Nenhuma consulta de calendário é feita antes da sua confirmação." />
          ) : null}

          {confirmed && routeFacetsQuery.isPending ? <OpportunityState state="loading" title="Localizando a primeira data disponível" /> : null}

          {confirmed && routeFacetsQuery.isError ? (
            <OpportunityState state="error" title="Não foi possível validar esta rota" description={routeFacetsQuery.error instanceof Error ? routeFacetsQuery.error.message : undefined} actionLabel="Tentar novamente" onAction={() => routeFacetsQuery.refetch()} />
          ) : null}

          {routeUnavailable ? (
            <OpportunityState state="empty" title="Nenhuma data disponível para esta rota" description="Escolha outra combinação de origem, destino ou tipo de oportunidade." />
          ) : null}

          {applied ? (
            <>
              <section className="opportunity-surface overflow-hidden rounded-tomorrow-lg border border-tomorrow-line bg-tomorrow-surface/72" aria-labelledby="calendar-title">
                <div className="grid gap-5 border-b border-tomorrow-line p-4 sm:p-6 lg:grid-cols-[1fr_auto] lg:items-center">
                  <div className="min-w-0">
                    <p className="flex min-w-0 items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-tomorrow-teal-soft">
                      <MapPin className="size-4 shrink-0" aria-hidden="true" />
                      <span className="break-words">{applied.origin} → {applied.destination}</span>
                    </p>
                    <h2 id="calendar-title" className="mt-2 break-words font-editorial text-3xl text-tomorrow-text sm:text-4xl">{formatMonth(visibleMonth)}</h2>
                    <p className="mt-2 text-sm text-tomorrow-muted">
                      {totalOptions} opções carregadas. Navegue pelos meses para consultar novas janelas quando necessário.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <OpportunityButton variant="outline" size="icon" disabled={!canPrevious} aria-label="Mês anterior" onClick={() => moveMonth(-1)}><ChevronLeft aria-hidden="true" /></OpportunityButton>
                    <OpportunityButton variant="outline" size="icon" disabled={!canNext} aria-label="Próximo mês" onClick={() => moveMonth(1)}><ChevronRight aria-hidden="true" /></OpportunityButton>
                  </div>
                </div>

                {calendarError && !visibleMonthFullyLoaded ? (
                  <div className="p-4 sm:p-6">
                    <OpportunityState state="error" title="Não foi possível carregar este mês" description={calendarError instanceof Error ? calendarError.message : undefined} actionLabel="Tentar novamente" onAction={() => calendarQueries.forEach((query) => { if (query.isError) void query.refetch(); })} />
                  </div>
                ) : !visibleMonthFullyLoaded && calendarPending ? (
                  <div className="p-4 sm:p-6"><OpportunityState state="loading" title={`Carregando ${formatMonth(visibleMonth)}`} /></div>
                ) : (
                  <div className="p-2 sm:p-5">
                    <div className="grid grid-cols-7 border-b border-tomorrow-line pb-2 text-center text-[0.65rem] font-bold uppercase tracking-[0.08em] text-tomorrow-muted sm:text-xs">
                      {weekdays.map((day) => <span key={day}>{day}</span>)}
                    </div>
                    <div className="mt-2 grid grid-cols-7 gap-1 sm:gap-2">
                      {monthCells.map((cell) => {
                        const entry = calendarByDate.get(cell.date);
                        const insideRoute = cell.date >= applied.minDate && cell.date <= applied.maxDate;
                        const selectable = Boolean(cell.inMonth && insideRoute && entry);
                        const selected = selectedDate === cell.date;
                        const band = entry ? priceBand(entry.min_price_per_person, bands) : null;
                        const bandClass = band === "cheap"
                          ? "border-tomorrow-teal/70 bg-tomorrow-teal/10"
                          : band === "mid"
                          ? "border-tomorrow-gold/55 bg-tomorrow-gold/5"
                          : band === "high"
                          ? "border-tomorrow-danger/45 bg-tomorrow-danger/5"
                          : "border-tomorrow-line bg-tomorrow-background/30";

                        if (!cell.inMonth) return <span key={cell.date} className="min-h-20 sm:min-h-28" aria-hidden="true" />;

                        return (
                          <button
                            key={cell.date}
                            type="button"
                            disabled={!selectable}
                            onClick={() => entry && selectDate(entry)}
                            className={`opportunity-focus relative min-h-20 min-w-0 rounded-lg border p-1 text-left transition sm:min-h-28 sm:rounded-tomorrow sm:p-2 ${bandClass} ${selected ? "ring-2 ring-tomorrow-gold ring-offset-2 ring-offset-tomorrow-background" : ""} ${!insideRoute ? "opacity-30" : ""} ${selectable ? "hover:-translate-y-0.5 hover:border-tomorrow-gold" : "cursor-default"}`}
                            aria-pressed={selected || undefined}
                            aria-label={entry ? `${formatDate(cell.date)}: ${formatCurrency(entry.min_price_per_person, currency)} por pessoa, ${entry.options_count} opções` : `${formatDate(cell.date)}: sem oferta`}
                          >
                            <span className="block text-xs font-bold text-tomorrow-text sm:text-sm">{cell.day}</span>
                            {entry ? (
                              <>
                                <span className="mt-2 block break-words text-[0.58rem] font-extrabold leading-tight text-tomorrow-text sm:text-xs">{compactPrice(entry.min_price_per_person)}</span>
                                <span className="mt-1 hidden text-[0.62rem] leading-tight text-tomorrow-muted sm:block">{entry.options_count} {entry.options_count === 1 ? "opção" : "opções"}</span>
                                {entry.min_available_seats !== null && entry.min_available_seats <= 5 ? <span className="mt-1 hidden text-[0.6rem] font-bold text-tomorrow-gold-soft lg:block">{entry.min_available_seats} {entry.min_available_seats === 1 ? "vaga" : "vagas"}</span> : null}
                              </>
                            ) : (
                              <span className="mt-2 block break-words text-[0.55rem] leading-tight text-tomorrow-muted sm:text-[0.65rem]">Sem oferta</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="grid gap-4 border-t border-tomorrow-line p-4 text-xs text-tomorrow-muted sm:p-5 lg:grid-cols-[1fr_auto] lg:items-center">
                  <div className="flex flex-wrap gap-x-5 gap-y-2" aria-label="Legenda de preços">
                    <span className="flex items-center gap-2"><span className="size-2.5 rounded-full bg-tomorrow-teal" /> Econômica</span>
                    <span className="flex items-center gap-2"><span className="size-2.5 rounded-full bg-tomorrow-gold" /> Intermediária</span>
                    <span className="flex items-center gap-2"><span className="size-2.5 rounded-full bg-tomorrow-danger" /> Faixa mais alta</span>
                    <span className="flex items-center gap-2"><span className="size-2.5 rounded-full border border-tomorrow-line" /> Sem oferta</span>
                  </div>
                  <span>{currency ? `Valores por pessoa em ${currency}.` : "A moeda é confirmada no detalhe da oferta."}</span>
                </div>
              </section>

              {routeOptions.length ? (
                <section className="opportunity-surface rounded-tomorrow border border-tomorrow-line bg-tomorrow-surface/55 p-4 sm:p-5" aria-label="Aeroportos encontrados">
                  <p className="flex items-center gap-2 text-sm font-semibold text-tomorrow-text"><Plane className="size-4 text-tomorrow-gold" aria-hidden="true" /> Aeroportos encontrados nas datas carregadas</p>
                  <div className="mt-3 flex flex-wrap gap-2">{routeOptions.map((route) => <OpportunityBadge key={route} variant="air">{route}</OpportunityBadge>)}</div>
                  {routeOptions.length > 1 ? <p className="mt-3 text-xs leading-relaxed text-tomorrow-muted">Existem combinações de aeroportos exclusivas no período. Compare a rota exata antes de escolher.</p> : null}
                </section>
              ) : null}

              {visibleMonthFullyLoaded && calendarDates.length === 0 && !calendarPending ? (
                <OpportunityState state="empty" title="Nenhuma data com estoque para esta rota" description="Tente outra quantidade de passageiros ou tipo de oportunidade." />
              ) : null}

              {selectedDate ? (
                <section className="scroll-mt-28" aria-labelledby="returns-title">
                  <div className="mb-5 flex flex-col gap-3 border-b border-tomorrow-line pb-5 sm:flex-row sm:items-end sm:justify-between">
                    <div className="min-w-0">
                      <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-tomorrow-teal-soft"><Sparkles className="size-4" aria-hidden="true" /> Ida selecionada</p>
                      <h2 id="returns-title" className="mt-2 break-words font-editorial text-3xl text-tomorrow-text sm:text-4xl">Voltas compatíveis para {formatDate(selectedDate)}</h2>
                      {selectedEntry ? <p className="mt-2 text-sm text-tomorrow-muted">Menor valor do dia: {formatCurrency(selectedEntry.min_price_per_person, currency)} por pessoa.</p> : null}
                    </div>
                    <OpportunityButton variant="ghost" onClick={() => { setSelectedDate(null); setComparisonIds([]); }}><X aria-hidden="true" /> Limpar ida</OpportunityButton>
                  </div>

                  {compatibleQuery.isPending ? <OpportunityState state="loading" title="Consultando voltas e opções" /> : null}
                  {compatibleQuery.isError ? <OpportunityState state="error" title="Não foi possível consultar as opções desta ida" description={compatibleQuery.error instanceof Error ? compatibleQuery.error.message : undefined} actionLabel="Tentar novamente" onAction={() => compatibleQuery.refetch()} /> : null}
                  {compatibleQuery.data?.items.length === 0 ? <OpportunityState state="empty" title="Nenhuma volta compatível encontrada" description="A disponibilidade pode ter mudado desde a consulta do calendário." /> : null}

                  {returnGroups.length ? (
                    <div className="grid gap-6">
                      {returnGroups.map(([returnDate, items]) => (
                        <div key={returnDate} className="opportunity-surface rounded-tomorrow-lg border border-tomorrow-line bg-tomorrow-surface/60 p-4 sm:p-5">
                          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-xs font-bold uppercase tracking-[0.12em] text-tomorrow-muted">Retorno</p>
                              <h3 className="mt-1 break-words font-editorial text-3xl text-tomorrow-text">{returnDate === "unknown" ? "Data de volta não informada" : formatDate(returnDate)}</h3>
                            </div>
                            <OpportunityBadge variant="neutral">{items.length} {items.length === 1 ? "opção" : "opções"}</OpportunityBadge>
                          </div>

                          <div className="grid gap-3 lg:grid-cols-2">
                            {items.map((item) => {
                              const selectedForComparison = comparisonIds.includes(item.id);
                              const limitReached = comparisonIds.length >= 3 && !selectedForComparison;
                              const best = selectedEntry?.best_option_id === item.id;
                              return (
                                <article key={item.id} className={`min-w-0 rounded-tomorrow border p-4 ${best ? "border-tomorrow-gold/65 bg-tomorrow-gold/5" : "border-tomorrow-line bg-tomorrow-background/30"}`}>
                                  <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
                                    <div className="min-w-0">
                                      <div className="flex flex-wrap gap-2">
                                        <OpportunityBadge variant={item.kind === "air_block" ? "air" : item.offer_subtype === "grupo_guiado" ? "guided" : item.offer_subtype === "evento" ? "event" : "package"}>{item.kind === "air_block" ? "Bloqueio aéreo" : item.offer_subtype === "grupo_guiado" ? "Grupo guiado" : "Pacote"}</OpportunityBadge>
                                        {best ? <OpportunityBadge variant="neutral">Menor valor do dia</OpportunityBadge> : null}
                                      </div>
                                      <h4 className="mt-3 break-words font-semibold text-tomorrow-text">{optionTitle(item)}</h4>
                                      <p className="mt-1 break-words text-sm text-tomorrow-muted">{optionRoute(item)}</p>
                                    </div>
                                    <p className="break-words font-editorial text-2xl text-tomorrow-gold-soft">{formatCurrency(item.price_per_person, item.currency)}</p>
                                  </div>

                                  <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
                                    <div><dt className="text-tomorrow-muted">Noites</dt><dd className="mt-1 font-semibold text-tomorrow-text">{item.nights ?? "Não informado"}</dd></div>
                                    <div><dt className="text-tomorrow-muted">Taxa por pessoa</dt><dd className="mt-1 font-semibold text-tomorrow-text">{formatCurrency(item.tax_per_person, item.currency)}</dd></div>
                                    <div><dt className="text-tomorrow-muted">Vagas</dt><dd className="mt-1 font-semibold text-tomorrow-text">{item.available_seats === null ? "Não informadas" : item.available_seats}</dd></div>
                                    <div><dt className="text-tomorrow-muted">Aéreo</dt><dd className="mt-1 font-semibold text-tomorrow-text">{item.kind === "air_block" || item.airfare_included ? "Incluído" : "Não incluído"}</dd></div>
                                  </dl>

                                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                                    <OpportunityButton asChild variant="outline" fullWidth><a href={`/oportunidades/oferta/${encodeURIComponent(item.id)}`}>Ver detalhes <ArrowRight aria-hidden="true" /></a></OpportunityButton>
                                    <OpportunityButton variant={selectedForComparison ? "teal" : "ghost"} fullWidth disabled={limitReached} aria-pressed={selectedForComparison} onClick={() => toggleComparison(item.id)}>
                                      <Scale aria-hidden="true" /> {selectedForComparison ? "Remover" : limitReached ? "Limite de 3" : "Comparar"}
                                    </OpportunityButton>
                                  </div>
                                </article>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  {compatibleQuery.data && compatibleQuery.data.total > compatibleQuery.data.items.length ? <p className="mt-4 text-xs text-tomorrow-muted">Mostrando as 50 opções de menor preço desta data entre {compatibleQuery.data.total} resultados.</p> : null}
                </section>
              ) : null}

              {comparisonIds.length ? (
                <aside className="opportunity-surface sticky bottom-4 z-20 flex flex-col gap-4 rounded-tomorrow-lg border border-tomorrow-gold/45 bg-tomorrow-background/95 p-4 shadow-tomorrow-gold backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between" aria-live="polite">
                  <div>
                    <p className="font-semibold text-tomorrow-text">{comparisonIds.length} {comparisonIds.length === 1 ? "oportunidade selecionada" : "oportunidades selecionadas"}</p>
                    <p className="mt-1 text-xs text-tomorrow-muted">Selecione até três opções para comparar os dados técnicos.</p>
                  </div>
                  <div className="flex gap-2">
                    <OpportunityButton variant="ghost" onClick={() => setComparisonIds([])}>Limpar</OpportunityButton>
                    <OpportunityButton asChild><a href={comparisonHref(comparisonIds)}><Scale aria-hidden="true" /> Comparar</a></OpportunityButton>
                  </div>
                </aside>
              ) : null}

              <aside className="opportunity-surface rounded-tomorrow border border-tomorrow-gold/30 bg-tomorrow-gold/5 p-5 text-sm leading-relaxed text-tomorrow-muted">{notice}</aside>
            </>
          ) : null}
        </div>
      </main>
    </div>
  );
}
