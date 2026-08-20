import { keepPreviousData, useQuery } from "@tanstack/react-query";
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
  calendarSearchWindow,
  fetchOpportunityCalendar,
  monthIntersectsWindow,
  monthStart,
  priceBand,
  shiftMonth,
  singleCalendarCurrency,
  type OpportunityCalendarDate,
} from "@/lib/opportunityCalendar";
import {
  TRAVEL_OFFERS_NOTICE,
  fetchTravelOfferCatalog,
  fetchTravelOfferFacets,
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
  anchorDate: string;
  offerType: "" | PublicOfferType;
};

type SearchErrors = Partial<Record<keyof SearchState, string>>;

const initialSearch: SearchState = {
  origin: "",
  destination: "",
  passengers: 1,
  anchorDate: "",
  offerType: "",
};

export default function OpportunitiesCalendar() {
  const [draft, setDraft] = useState<SearchState>(initialSearch);
  const [applied, setApplied] = useState<SearchState | null>(null);
  const [errors, setErrors] = useState<SearchErrors>({});
  const [visibleMonth, setVisibleMonth] = useState<string>(monthStart(new Date().toISOString().slice(0, 10)));
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [comparisonIds, setComparisonIds] = useState<string[]>([]);

  const facetsQuery = useQuery({
    queryKey: ["travel-offers-public", "facets"],
    queryFn: ({ signal }) => fetchTravelOfferFacets(signal),
    staleTime: 5 * 60_000,
    retry: 1,
  });

  useEffect(() => {
    const firstDate = facetsQuery.data?.date_range.min;
    if (!firstDate) return;
    setDraft((current) => current.anchorDate ? current : { ...current, anchorDate: firstDate });
  }, [facetsQuery.data?.date_range.min]);

  const searchWindow = useMemo(
    () => applied ? calendarSearchWindow(applied.anchorDate) : null,
    [applied],
  );

  const calendarParams = useMemo(() => {
    if (!applied || !searchWindow) return null;
    return {
      origin: applied.origin,
      destination: applied.destination,
      start_date: searchWindow.startDate,
      end_date: searchWindow.endDate,
      passengers: applied.passengers,
      ...(applied.offerType ? { offer_type: applied.offerType } : {}),
    };
  }, [applied, searchWindow]);

  const calendarQuery = useQuery({
    queryKey: ["travel-offers-public", "calendar", calendarParams],
    queryFn: ({ signal }) => fetchOpportunityCalendar(calendarParams!, signal),
    enabled: Boolean(calendarParams),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
    retry: 1,
  });

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
    () => new Map((calendarQuery.data?.dates ?? []).map((item) => [item.date, item])),
    [calendarQuery.data?.dates],
  );

  const bands = useMemo(
    () => calculatePriceBands((calendarQuery.data?.dates ?? []).map((item) => item.min_price_per_person)),
    [calendarQuery.data?.dates],
  );

  const currency = singleCalendarCurrency(facetsQuery.data?.price_ranges);
  const monthCells = useMemo(() => buildCalendarMonth(visibleMonth), [visibleMonth]);

  const routeOptions = useMemo(() => {
    const routes = new Set<string>();
    for (const date of calendarQuery.data?.dates ?? []) {
      if (date.origin_iata && date.destination_iata) routes.add(`${date.origin_iata} → ${date.destination_iata}`);
    }
    return [...routes].sort();
  }, [calendarQuery.data?.dates]);

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
    if (!draft.anchorDate) next.anchorDate = "Informe a data de referência.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    if (!validate()) return;
    const next = { ...draft };
    setApplied(next);
    setVisibleMonth(monthStart(next.anchorDate));
    setSelectedDate(null);
    setComparisonIds([]);
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

  const canPrevious = Boolean(searchWindow && monthIntersectsWindow(shiftMonth(visibleMonth, -1), searchWindow.startDate, searchWindow.endDate));
  const canNext = Boolean(searchWindow && monthIntersectsWindow(shiftMonth(visibleMonth, 1), searchWindow.startDate, searchWindow.endDate));
  const selectedEntry = selectedDate ? calendarByDate.get(selectedDate) : undefined;
  const notice = calendarQuery.data?.notice || facetsQuery.data?.notice || TRAVEL_OFFERS_NOTICE;

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
          <div className="relative mx-auto grid w-full max-w-[90rem] gap-8 px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
            <div className="max-w-4xl">
              <OpportunityBadge variant="neutral">
                <CalendarDays className="size-4" aria-hidden="true" />
                Calendário inteligente
              </OpportunityBadge>
              <h1 className="mt-5 max-w-4xl font-editorial text-5xl leading-[0.94] text-tomorrow-text sm:text-6xl lg:text-7xl">
                Veja quando viajar pelo menor valor real disponível.
              </h1>
              <p className="mt-5 max-w-3xl text-base leading-relaxed text-tomorrow-muted sm:text-lg">
                Consulte até 60 dias antes e 60 dias depois da sua data de referência. O calendário usa apenas o inventário válido da Tomorrow Travel e não preenche datas sem estoque.
              </p>
            </div>

            <form onSubmit={submitSearch} className="opportunity-surface grid gap-4 rounded-tomorrow-lg border border-tomorrow-line bg-tomorrow-surface/72 p-4 shadow-tomorrow-surface sm:p-6 lg:grid-cols-6" aria-label="Pesquisar calendário de oportunidades">
              <label className="grid gap-2 lg:col-span-2">
                <span className="text-sm font-semibold text-tomorrow-text">Origem</span>
                <select value={draft.origin} onChange={(event) => setDraft((current) => ({ ...current, origin: event.target.value }))} className={fieldClass} aria-invalid={errors.origin ? true : undefined}>
                  <option value="">Selecione</option>
                  {(facetsQuery.data?.origins ?? []).map((item) => <option key={item.value} value={item.value}>{item.value}</option>)}
                </select>
                {errors.origin ? <span className="text-xs text-tomorrow-danger">{errors.origin}</span> : null}
              </label>

              <label className="grid gap-2 lg:col-span-2">
                <span className="text-sm font-semibold text-tomorrow-text">Destino</span>
                <select value={draft.destination} onChange={(event) => setDraft((current) => ({ ...current, destination: event.target.value }))} className={fieldClass} aria-invalid={errors.destination ? true : undefined}>
                  <option value="">Selecione</option>
                  {(facetsQuery.data?.destinations ?? []).map((item) => <option key={item.value} value={item.value}>{item.value}</option>)}
                </select>
                {errors.destination ? <span className="text-xs text-tomorrow-danger">{errors.destination}</span> : null}
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-semibold text-tomorrow-text">Passageiros</span>
                <div className="relative">
                  <UsersRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-tomorrow-teal-soft" aria-hidden="true" />
                  <input type="number" min={1} max={20} value={draft.passengers} onChange={(event) => setDraft((current) => ({ ...current, passengers: Number(event.target.value) }))} className={`${fieldClass} pl-10`} aria-invalid={errors.passengers ? true : undefined} />
                </div>
                {errors.passengers ? <span className="text-xs text-tomorrow-danger">{errors.passengers}</span> : null}
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-semibold text-tomorrow-text">Tipo</span>
                <select value={draft.offerType} onChange={(event) => setDraft((current) => ({ ...current, offerType: event.target.value as SearchState["offerType"] }))} className={fieldClass}>
                  <option value="">Todos</option>
                  <option value="bloqueio_aereo">Bloqueios aéreos</option>
                  <option value="pacote">Pacotes</option>
                </select>
              </label>

              <label className="grid gap-2 lg:col-span-2">
                <span className="text-sm font-semibold text-tomorrow-text">Data de referência</span>
                <input
                  type="date"
                  value={draft.anchorDate}
                  min={facetsQuery.data?.date_range.min ?? undefined}
                  max={facetsQuery.data?.date_range.max ?? undefined}
                  onChange={(event) => setDraft((current) => ({ ...current, anchorDate: event.target.value }))}
                  className={fieldClass}
                  aria-invalid={errors.anchorDate ? true : undefined}
                />
                <span className="text-xs text-tomorrow-muted">A busca cobre uma janela total de 120 dias ao redor desta data.</span>
                {errors.anchorDate ? <span className="text-xs text-tomorrow-danger">{errors.anchorDate}</span> : null}
              </label>

              <div className="flex items-end lg:col-span-4">
                <OpportunityButton type="submit" size="lg" fullWidth disabled={facetsQuery.isPending}>
                  <Search aria-hidden="true" />
                  Consultar calendário
                </OpportunityButton>
              </div>
            </form>
          </div>
        </section>

        <div className="mx-auto grid w-full max-w-[90rem] gap-8 px-4 py-8 sm:px-6 lg:px-8">
          {facetsQuery.isError ? (
            <OpportunityState state="error" title="Não foi possível carregar origens e destinos" description={facetsQuery.error instanceof Error ? facetsQuery.error.message : undefined} actionLabel="Tentar novamente" onAction={() => facetsQuery.refetch()} />
          ) : null}

          {!applied ? (
            <OpportunityState state="empty" title="Escolha uma rota para abrir o calendário" description="Informe origem, destino, passageiros e uma data de referência. Nenhuma consulta de calendário é feita antes da sua confirmação." />
          ) : null}

          {applied && calendarQuery.isPending ? <OpportunityState state="loading" title="Consultando preços por data" /> : null}

          {applied && calendarQuery.isError ? (
            <OpportunityState state="error" title="Não foi possível consultar este período" description={calendarQuery.error instanceof Error ? calendarQuery.error.message : undefined} actionLabel="Tentar novamente" onAction={() => calendarQuery.refetch()} />
          ) : null}

          {applied && calendarQuery.data ? (
            <>
              <section className="opportunity-surface overflow-hidden rounded-tomorrow-lg border border-tomorrow-line bg-tomorrow-surface/72" aria-labelledby="calendar-title">
                <div className="grid gap-5 border-b border-tomorrow-line p-4 sm:p-6 lg:grid-cols-[1fr_auto] lg:items-center">
                  <div>
                    <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-tomorrow-teal-soft">
                      <MapPin className="size-4" aria-hidden="true" />
                      {applied.origin} → {applied.destination}
                    </p>
                    <h2 id="calendar-title" className="mt-2 font-editorial text-4xl text-tomorrow-text">{formatMonth(visibleMonth)}</h2>
                    <p className="mt-2 text-sm text-tomorrow-muted">
                      {calendarQuery.data.total_options} opções encontradas entre {formatDate(calendarQuery.data.start_date)} e {formatDate(calendarQuery.data.end_date)}.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <OpportunityButton variant="outline" size="icon" disabled={!canPrevious} aria-label="Mês anterior" onClick={() => setVisibleMonth((current) => shiftMonth(current, -1))}><ChevronLeft aria-hidden="true" /></OpportunityButton>
                    <OpportunityButton variant="outline" size="icon" disabled={!canNext} aria-label="Próximo mês" onClick={() => setVisibleMonth((current) => shiftMonth(current, 1))}><ChevronRight aria-hidden="true" /></OpportunityButton>
                  </div>
                </div>

                <div className="p-2 sm:p-5">
                  <div className="grid grid-cols-7 border-b border-tomorrow-line pb-2 text-center text-[0.65rem] font-bold uppercase tracking-[0.08em] text-tomorrow-muted sm:text-xs">
                    {weekdays.map((day) => <span key={day}>{day}</span>)}
                  </div>
                  <div className="mt-2 grid grid-cols-7 gap-1 sm:gap-2">
                    {monthCells.map((cell) => {
                      const entry = calendarByDate.get(cell.date);
                      const insideWindow = Boolean(searchWindow && cell.date >= searchWindow.startDate && cell.date <= searchWindow.endDate);
                      const selectable = Boolean(cell.inMonth && insideWindow && entry);
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
                          className={`opportunity-focus relative min-h-20 rounded-lg border p-1 text-left transition sm:min-h-28 sm:rounded-tomorrow sm:p-2 ${bandClass} ${selected ? "ring-2 ring-tomorrow-gold ring-offset-2 ring-offset-tomorrow-background" : ""} ${!insideWindow ? "opacity-30" : ""} ${selectable ? "hover:-translate-y-0.5 hover:border-tomorrow-gold" : "cursor-default"}`}
                          aria-pressed={selected || undefined}
                          aria-label={entry ? `${formatDate(cell.date)}: ${formatCurrency(entry.min_price_per_person, currency)} por pessoa, ${entry.options_count} opções` : `${formatDate(cell.date)}: sem disponibilidade`}
                        >
                          <span className="block text-xs font-bold text-tomorrow-text sm:text-sm">{cell.day}</span>
                          {entry ? (
                            <>
                              <span className="mt-2 block break-all text-[0.62rem] font-extrabold leading-tight text-tomorrow-text sm:text-xs">{compactPrice(entry.min_price_per_person)}</span>
                              <span className="mt-1 hidden text-[0.62rem] leading-tight text-tomorrow-muted sm:block">{entry.options_count} {entry.options_count === 1 ? "opção" : "opções"}</span>
                              {entry.min_available_seats !== null && entry.min_available_seats <= 5 ? <span className="mt-1 hidden text-[0.6rem] font-bold text-tomorrow-gold-soft lg:block">{entry.min_available_seats} {entry.min_available_seats === 1 ? "vaga" : "vagas"}</span> : null}
                            </>
                          ) : (
                            <span className="mt-2 block text-[0.58rem] leading-tight text-tomorrow-muted sm:text-[0.65rem]">Sem oferta</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid gap-4 border-t border-tomorrow-line p-4 text-xs text-tomorrow-muted sm:p-5 lg:grid-cols-[1fr_auto] lg:items-center">
                  <div className="flex flex-wrap gap-x-5 gap-y-2" aria-label="Legenda de preços">
                    <span className="flex items-center gap-2"><span className="size-2.5 rounded-full bg-tomorrow-teal" /> Econômica</span>
                    <span className="flex items-center gap-2"><span className="size-2.5 rounded-full bg-tomorrow-gold" /> Intermediária</span>
                    <span className="flex items-center gap-2"><span className="size-2.5 rounded-full bg-tomorrow-danger" /> Faixa mais alta</span>
                    <span className="flex items-center gap-2"><span className="size-2.5 rounded-full border border-tomorrow-line" /> Sem disponibilidade</span>
                  </div>
                  <span>{currency ? `Valores por pessoa em ${currency}.` : "A moeda é confirmada no detalhe da oferta."}</span>
                </div>
              </section>

              {routeOptions.length ? (
                <section className="opportunity-surface rounded-tomorrow border border-tomorrow-line bg-tomorrow-surface/55 p-4 sm:p-5" aria-label="Aeroportos encontrados">
                  <p className="flex items-center gap-2 text-sm font-semibold text-tomorrow-text"><Plane className="size-4 text-tomorrow-gold" aria-hidden="true" /> Aeroportos encontrados nesta janela</p>
                  <div className="mt-3 flex flex-wrap gap-2">{routeOptions.map((route) => <OpportunityBadge key={route} variant="air">{route}</OpportunityBadge>)}</div>
                  {routeOptions.length > 1 ? <p className="mt-3 text-xs leading-relaxed text-tomorrow-muted">Existem combinações de aeroportos exclusivas no período. Compare a rota exata antes de escolher.</p> : null}
                </section>
              ) : null}

              {calendarQuery.data.dates.length === 0 ? (
                <OpportunityState state="empty" title="Nenhuma data com estoque para esta rota" description="Tente outra data de referência, quantidade de passageiros ou tipo de oportunidade." />
              ) : null}

              {selectedDate ? (
                <section className="scroll-mt-28" aria-labelledby="returns-title">
                  <div className="mb-5 flex flex-col gap-3 border-b border-tomorrow-line pb-5 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-tomorrow-teal-soft"><Sparkles className="size-4" aria-hidden="true" /> Ida selecionada</p>
                      <h2 id="returns-title" className="mt-2 font-editorial text-4xl text-tomorrow-text">Voltas compatíveis para {formatDate(selectedDate)}</h2>
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
                            <div>
                              <p className="text-xs font-bold uppercase tracking-[0.12em] text-tomorrow-muted">Retorno</p>
                              <h3 className="mt-1 font-editorial text-3xl text-tomorrow-text">{returnDate === "unknown" ? "Data de volta não informada" : formatDate(returnDate)}</h3>
                            </div>
                            <OpportunityBadge variant="neutral">{items.length} {items.length === 1 ? "opção" : "opções"}</OpportunityBadge>
                          </div>

                          <div className="grid gap-3 lg:grid-cols-2">
                            {items.map((item) => {
                              const selectedForComparison = comparisonIds.includes(item.id);
                              const limitReached = comparisonIds.length >= 3 && !selectedForComparison;
                              const best = selectedEntry?.best_option_id === item.id;
                              return (
                                <article key={item.id} className={`rounded-tomorrow border p-4 ${best ? "border-tomorrow-gold/65 bg-tomorrow-gold/5" : "border-tomorrow-line bg-tomorrow-background/30"}`}>
                                  <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div>
                                      <div className="flex flex-wrap gap-2">
                                        <OpportunityBadge variant={item.kind === "air_block" ? "air" : item.offer_subtype === "grupo_guiado" ? "guided" : item.offer_subtype === "evento" ? "event" : "package"}>{item.kind === "air_block" ? "Bloqueio aéreo" : item.offer_subtype === "grupo_guiado" ? "Grupo guiado" : "Pacote"}</OpportunityBadge>
                                        {best ? <OpportunityBadge variant="neutral">Menor valor do dia</OpportunityBadge> : null}
                                      </div>
                                      <h4 className="mt-3 font-semibold text-tomorrow-text">{optionTitle(item)}</h4>
                                      <p className="mt-1 text-sm text-tomorrow-muted">{optionRoute(item)}</p>
                                    </div>
                                    <p className="font-editorial text-2xl text-tomorrow-gold-soft">{formatCurrency(item.price_per_person, item.currency)}</p>
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
