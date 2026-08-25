import { useQueries } from "@tanstack/react-query";
import { ArrowLeft, Check, Plus, Scale, X } from "lucide-react";
import { useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";

import {
  OpportunityBadge,
  OpportunityButton,
  OpportunityHeader,
  OpportunityState,
} from "@/components/opportunities";
import {
  formatOpportunityCurrency,
  formatOpportunityDate,
  opportunityRoute,
  opportunityTitle,
  opportunityTotalPerPerson,
  opportunityTypeLabel,
} from "@/components/opportunities/detailFormatters";
import {
  TRAVEL_OFFERS_NOTICE,
  fetchTravelOfferDetail,
  type TravelOfferDetailItem,
} from "@/lib/travelOffersPublic";
import {
  comparisonHref,
  mergeComparisonIds,
  parseComparisonIds,
  readStoredComparisonIds,
  writeStoredComparisonIds,
} from "@/lib/opportunityComparison";

const navItems = [
  { label: "Catálogo", href: "/oportunidades/catalogo" },
  { label: "Comparar", href: "/oportunidades/comparar" },
];

type ComparisonRow = {
  label: string;
  value: (item: TravelOfferDetailItem) => string;
};

function known(value: string | null | undefined, fallback = "Não informado") {
  return value || fallback;
}

const rows: ComparisonRow[] = [
  { label: "Tipo", value: opportunityTypeLabel },
  { label: "Rota", value: opportunityRoute },
  { label: "Saída", value: (item) => known(formatOpportunityDate(item.departure_date)) },
  { label: "Retorno", value: (item) => known(formatOpportunityDate(item.return_date)) },
  { label: "Noites", value: (item) => item.nights === null ? "Não informado" : String(item.nights) },
  { label: "Valor por pessoa", value: (item) => known(formatOpportunityCurrency(item.price_per_person, item.currency)) },
  { label: "Taxa por pessoa", value: (item) => known(formatOpportunityCurrency(item.tax_per_person, item.currency), "Não informada") },
  { label: "Total por pessoa", value: (item) => known(formatOpportunityCurrency(opportunityTotalPerPerson(item), item.currency), "Não calculável sem taxa") },
  { label: "Vagas", value: (item) => item.available_seats === null ? "Quantidade não informada" : String(item.available_seats) },
  {
    label: "Aéreo",
    value: (item) => item.kind === "air_block" || item.airfare_included ? "Incluído" : "Não incluído",
  },
  {
    label: "Hospedagem",
    value: (item) => item.kind === "package" ? known(item.hotel) : item.kind === "guided_group" ? known(item.hotels[0]?.name) : "Não se aplica",
  },
  {
    label: "Regime",
    value: (item) => item.kind === "package" ? known(item.meal_plan) : "Não se aplica",
  },
  {
    label: "Evento",
    value: (item) => item.kind === "package" && item.event_specific ? known(item.event_name, "Evento específico") : "Não",
  },
  {
    label: "Ingresso",
    value: (item) => item.kind === "air_block" ? "Não se aplica" : item.ticket_included ? "Incluído" : "Não incluído",
  },
  {
    label: "Inclusões",
    value: (item) => item.kind === "air_block" ? "Não se aplica" : item.inclusions.length ? item.inclusions.join(" · ") : "Não informadas",
  },
];

function itemBadgeVariant(item: TravelOfferDetailItem) {
  return item.kind === "air_block"
    ? "air" as const
    : item.kind === "guided_group"
    ? "guided" as const
    : item.offer_subtype === "evento"
    ? "event" as const
    : "package" as const;
}

export default function OpportunityCompare() {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedParam = searchParams.get("ids");
  const parsed = useMemo(() => parseComparisonIds(requestedParam), [requestedParam]);
  const storedIds = readStoredComparisonIds();
  const selectedIds = parsed.error ? [] : mergeComparisonIds(storedIds, parsed.ids);
  const selectedKey = selectedIds.join(",");
  const droppedRequestedId = !parsed.error && parsed.ids.some((id) => !selectedIds.includes(id));

  useEffect(() => {
    if (parsed.error) return;
    writeStoredComparisonIds(selectedIds);
    if (selectedKey && requestedParam !== selectedKey) {
      setSearchParams({ ids: selectedKey }, { replace: true });
    }
  }, [parsed.error, requestedParam, selectedKey, selectedIds, setSearchParams]);

  const detailQueries = useQueries({
    queries: selectedIds.map((id) => ({
      queryKey: ["travel-offers-public", "detail", id],
      queryFn: ({ signal }: { signal: AbortSignal }) => fetchTravelOfferDetail(id, signal),
      staleTime: 30_000,
      retry: 1,
    })),
  });
  const items = detailQueries.flatMap((query) => query.data?.item ? [query.data.item] : []);
  const pending = detailQueries.some((query) => query.isPending);
  const failed = detailQueries.find((query) => query.isError);

  return (
    <div className="opportunities-theme min-h-screen overflow-x-hidden bg-tomorrow-background text-tomorrow-text">
      <OpportunityHeader activeHref="/oportunidades/comparar" navItems={navItems} ctaHref="/teo" />
      <main className="mx-auto grid w-full min-w-0 max-w-[90rem] gap-7 overflow-x-hidden px-4 py-7 sm:px-6 sm:py-8 lg:px-8">
        <a href="/oportunidades/catalogo" className="opportunity-focus inline-flex w-fit max-w-full items-center gap-2 rounded-lg text-sm font-semibold text-tomorrow-muted hover:text-tomorrow-text">
          <ArrowLeft className="size-4 shrink-0" aria-hidden="true" />
          <span>Voltar ao catálogo</span>
        </a>

        <header className="min-w-0 max-w-4xl">
          <OpportunityBadge variant="neutral"><Scale className="size-4" aria-hidden="true" />Comparação transparente</OpportunityBadge>
          <h1 className="mt-5 max-w-full break-words font-editorial text-4xl leading-[0.98] text-tomorrow-text [overflow-wrap:anywhere] sm:text-6xl">Compare até três oportunidades.</h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-tomorrow-muted sm:text-base">Os valores permanecem por pessoa, taxas ficam separadas e informações ausentes não são preenchidas por estimativa.</p>
          {!parsed.error && selectedIds.length ? (
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <OpportunityBadge variant="neutral">{selectedIds.length}/3 selecionadas</OpportunityBadge>
              {selectedIds.length < 3 ? (
                <OpportunityButton asChild variant="outline" size="sm">
                  <a href="/oportunidades/catalogo"><Plus aria-hidden="true" />Adicionar outra oportunidade</a>
                </OpportunityButton>
              ) : null}
            </div>
          ) : null}
        </header>

        {parsed.error ? (
          <OpportunityState
            state="error"
            title={parsed.error === "too_many" ? "Limite de comparação excedido" : "Link de comparação inválido"}
            description={parsed.error === "too_many" ? "Escolha no máximo três oportunidades." : "O link contém um identificador inválido."}
            actionLabel="Escolher no catálogo"
            actionHref="/oportunidades/catalogo"
          />
        ) : null}

        {droppedRequestedId ? (
          <OpportunityState
            state="empty"
            title="Você já tem três oportunidades salvas"
            description="Remova uma das opções atuais antes de adicionar uma nova à comparação."
            actionLabel="Ver comparação atual"
            actionHref={comparisonHref(selectedIds)}
          />
        ) : null}

        {!parsed.error && selectedIds.length === 0 ? (
          <OpportunityState
            state="empty"
            title="Nenhuma oportunidade selecionada"
            description="Escolha até três opções no catálogo. A seleção fica salva neste navegador enquanto você procura outras oportunidades."
            actionLabel="Abrir catálogo"
            actionHref="/oportunidades/catalogo"
          />
        ) : null}

        {!parsed.error && pending ? <OpportunityState state="loading" title="Montando comparação" /> : null}

        {!parsed.error && failed ? (
          <OpportunityState
            state="error"
            title="Não foi possível montar a comparação"
            description={failed.error instanceof Error ? failed.error.message : undefined}
            actionLabel="Tentar novamente"
            onAction={() => detailQueries.forEach((query) => query.refetch())}
          />
        ) : null}

        {!parsed.error && !pending && !failed && items.length ? (
          <>
            <section className="grid min-w-0 gap-4 md:hidden" aria-label="Comparação adaptada para celular">
              {items.map((item) => {
                const remainingIds = selectedIds.filter((id) => id !== item.id);
                return (
                  <article key={item.id} className="opportunity-surface min-w-0 max-w-full overflow-hidden rounded-tomorrow-lg border border-tomorrow-line bg-tomorrow-surface/70 p-4">
                    <div className="min-w-0">
                      <OpportunityBadge variant={itemBadgeVariant(item)}>{opportunityTypeLabel(item)}</OpportunityBadge>
                      <h2 className="mt-3 max-w-full break-words font-editorial text-3xl leading-[1.02] text-tomorrow-text [overflow-wrap:anywhere]">{opportunityTitle(item)}</h2>
                    </div>

                    <div className="mt-4 grid min-w-0 gap-2 sm:grid-cols-2">
                      <OpportunityButton asChild variant="outline" size="sm" fullWidth>
                        <a className="max-w-full whitespace-normal text-center" href={`/oportunidades/oferta/${encodeURIComponent(item.id)}`}>Ver detalhes</a>
                      </OpportunityButton>
                      <a
                        href={comparisonHref(remainingIds)}
                        onClick={() => writeStoredComparisonIds(remainingIds)}
                        className="opportunity-focus inline-flex min-h-9 max-w-full items-center justify-center gap-2 rounded-lg px-2 text-center text-xs font-semibold text-tomorrow-muted hover:text-tomorrow-text"
                        aria-label={`Remover ${opportunityTitle(item)} da comparação`}
                      >
                        <X className="size-4 shrink-0" aria-hidden="true" />Remover
                      </a>
                    </div>

                    <dl className="mt-5 min-w-0 divide-y divide-tomorrow-line/70 border-t border-tomorrow-line/70">
                      {rows.map((row) => (
                        <div key={row.label} className="grid min-w-0 gap-1 py-3">
                          <dt className="break-words text-[0.68rem] font-bold uppercase tracking-[0.1em] text-tomorrow-muted [overflow-wrap:anywhere]">{row.label}</dt>
                          <dd className="min-w-0 max-w-full break-words text-sm leading-relaxed text-tomorrow-text [overflow-wrap:anywhere]">{row.value(item)}</dd>
                        </div>
                      ))}
                    </dl>
                  </article>
                );
              })}
            </section>

            <section className="hidden max-w-full overflow-x-auto rounded-tomorrow-lg border border-tomorrow-line bg-tomorrow-surface/70 md:block" aria-label="Tabela comparativa de oportunidades">
              <table className="w-full min-w-[52rem] table-fixed border-collapse text-left text-sm">
                <thead>
                  <tr>
                    <th className="sticky left-0 z-10 w-44 border-b border-r border-tomorrow-line bg-tomorrow-surface p-4 text-xs uppercase tracking-[0.12em] text-tomorrow-muted">Critério</th>
                    {items.map((item) => {
                      const remainingIds = selectedIds.filter((id) => id !== item.id);
                      return (
                        <th key={item.id} className="min-w-64 border-b border-tomorrow-line p-4 align-top">
                          <div className="grid min-h-[11.5rem] grid-rows-[auto_1fr_auto] gap-3">
                            <OpportunityBadge variant={itemBadgeVariant(item)}>{opportunityTypeLabel(item)}</OpportunityBadge>
                            <p className="break-words font-editorial text-2xl leading-tight text-tomorrow-text [overflow-wrap:anywhere]">{opportunityTitle(item)}</p>
                            <div className="grid gap-2 self-end">
                              <OpportunityButton asChild variant="outline" size="sm" fullWidth>
                                <a href={`/oportunidades/oferta/${encodeURIComponent(item.id)}`}>Ver detalhes</a>
                              </OpportunityButton>
                              <a
                                href={comparisonHref(remainingIds)}
                                onClick={() => writeStoredComparisonIds(remainingIds)}
                                className="opportunity-focus inline-flex min-h-9 items-center justify-center gap-2 rounded-lg text-xs font-semibold text-tomorrow-muted hover:text-tomorrow-text"
                                aria-label={`Remover ${opportunityTitle(item)} da comparação`}
                              >
                                <X className="size-4" aria-hidden="true" />Remover
                              </a>
                            </div>
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.label}>
                      <th className="sticky left-0 z-10 border-b border-r border-tomorrow-line bg-tomorrow-surface p-4 text-xs font-bold uppercase tracking-[0.08em] text-tomorrow-muted">{row.label}</th>
                      {items.map((item) => (
                        <td key={`${row.label}-${item.id}`} className="max-w-80 break-words border-b border-tomorrow-line p-4 align-top leading-relaxed text-tomorrow-text [overflow-wrap:anywhere]">{row.value(item)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            <section className="grid min-w-0 items-stretch gap-4 md:grid-cols-3" aria-label="Escolher oportunidade">
              {items.map((item) => (
                <div key={item.id} className="opportunity-surface grid h-full min-w-0 grid-rows-[1fr_auto] gap-4 rounded-tomorrow border border-tomorrow-gold/30 bg-tomorrow-gold/5 p-5">
                  <div className="min-w-0">
                    <p className="break-words font-semibold text-tomorrow-text [overflow-wrap:anywhere]">{opportunityTitle(item)}</p>
                    <p className="mt-2 break-words text-sm text-tomorrow-muted [overflow-wrap:anywhere]">{formatOpportunityCurrency(item.price_per_person, item.currency)} por pessoa</p>
                  </div>
                  <OpportunityButton asChild fullWidth>
                    <a className="max-w-full whitespace-normal text-center" href={`/teo?offer_id=${encodeURIComponent(item.id)}`}><Check aria-hidden="true" />Quero esta oportunidade</a>
                  </OpportunityButton>
                </div>
              ))}
            </section>

            <aside className="opportunity-surface min-w-0 rounded-tomorrow border border-tomorrow-gold/30 bg-tomorrow-gold/5 p-5 text-sm leading-relaxed text-tomorrow-muted">{detailQueries[0]?.data?.notice || TRAVEL_OFFERS_NOTICE}</aside>
          </>
        ) : null}
      </main>
    </div>
  );
}