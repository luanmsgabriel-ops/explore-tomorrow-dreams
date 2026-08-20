import { useQueries } from "@tanstack/react-query";
import { ArrowLeft, Check, Scale, X } from "lucide-react";
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
import { comparisonHref, parseComparisonIds } from "@/lib/opportunityComparison";

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

export default function OpportunityCompare() {
  const [searchParams] = useSearchParams();
  const parsed = parseComparisonIds(searchParams.get("ids"));
  const detailQueries = useQueries({
    queries: parsed.ids.map((id) => ({
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
    <div className="opportunities-theme min-h-screen bg-tomorrow-background text-tomorrow-text">
      <OpportunityHeader activeHref="/oportunidades/comparar" navItems={navItems} ctaHref="/teo" />
      <main className="mx-auto grid w-full max-w-[90rem] gap-8 px-4 py-8 sm:px-6 lg:px-8">
        <a href="/oportunidades/catalogo" className="opportunity-focus inline-flex w-fit items-center gap-2 rounded-lg text-sm font-semibold text-tomorrow-muted hover:text-tomorrow-text">
          <ArrowLeft className="size-4" aria-hidden="true" />
          Voltar ao catálogo
        </a>

        <header className="max-w-4xl">
          <OpportunityBadge variant="neutral"><Scale className="size-4" aria-hidden="true" />Comparação transparente</OpportunityBadge>
          <h1 className="mt-5 font-editorial text-5xl leading-none text-tomorrow-text sm:text-6xl">Compare até três oportunidades.</h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-tomorrow-muted">Os valores permanecem por pessoa, taxas ficam separadas e informações ausentes não são preenchidas por estimativa.</p>
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

        {!parsed.error && parsed.ids.length === 0 ? (
          <OpportunityState
            state="empty"
            title="Nenhuma oportunidade selecionada"
            description="Escolha até três opções no catálogo para comparar os dados reais lado a lado."
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
            <section className="overflow-x-auto rounded-tomorrow-lg border border-tomorrow-line bg-tomorrow-surface/70" aria-label="Tabela comparativa de oportunidades">
              <table className="w-full min-w-[52rem] border-collapse text-left text-sm">
                <thead>
                  <tr>
                    <th className="sticky left-0 z-10 w-44 border-b border-r border-tomorrow-line bg-tomorrow-surface p-4 text-xs uppercase tracking-[0.12em] text-tomorrow-muted">Critério</th>
                    {items.map((item) => (
                      <th key={item.id} className="min-w-64 border-b border-tomorrow-line p-4 align-top">
                        <OpportunityBadge variant={item.kind === "air_block" ? "air" : item.kind === "guided_group" ? "guided" : item.offer_subtype === "evento" ? "event" : "package"}>{opportunityTypeLabel(item)}</OpportunityBadge>
                        <p className="mt-3 font-editorial text-2xl leading-tight text-tomorrow-text">{opportunityTitle(item)}</p>
                        <div className="mt-4 grid gap-2">
                          <OpportunityButton asChild variant="outline" size="sm" fullWidth>
                            <a href={`/oportunidades/oferta/${encodeURIComponent(item.id)}`}>Ver detalhes</a>
                          </OpportunityButton>
                          <a
                            href={comparisonHref(parsed.ids.filter((id) => id !== item.id))}
                            className="opportunity-focus inline-flex min-h-9 items-center justify-center gap-2 rounded-lg text-xs font-semibold text-tomorrow-muted hover:text-tomorrow-text"
                            aria-label={`Remover ${opportunityTitle(item)} da comparação`}
                          >
                            <X className="size-4" aria-hidden="true" />Remover
                          </a>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.label}>
                      <th className="sticky left-0 z-10 border-b border-r border-tomorrow-line bg-tomorrow-surface p-4 text-xs font-bold uppercase tracking-[0.08em] text-tomorrow-muted">{row.label}</th>
                      {items.map((item) => (
                        <td key={`${row.label}-${item.id}`} className="border-b border-tomorrow-line p-4 align-top leading-relaxed text-tomorrow-text">{row.value(item)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            <section className="grid gap-4 md:grid-cols-3" aria-label="Escolher oportunidade">
              {items.map((item) => (
                <div key={item.id} className="opportunity-surface grid content-between gap-4 rounded-tomorrow border border-tomorrow-gold/30 bg-tomorrow-gold/5 p-5">
                  <div>
                    <p className="font-semibold text-tomorrow-text">{opportunityTitle(item)}</p>
                    <p className="mt-2 text-sm text-tomorrow-muted">{formatOpportunityCurrency(item.price_per_person, item.currency)} por pessoa</p>
                  </div>
                  <OpportunityButton asChild fullWidth>
                    <a href={`/teo?offer_id=${encodeURIComponent(item.id)}`}><Check aria-hidden="true" />Quero esta oportunidade</a>
                  </OpportunityButton>
                </div>
              ))}
            </section>

            <aside className="opportunity-surface rounded-tomorrow border border-tomorrow-gold/30 bg-tomorrow-gold/5 p-5 text-sm leading-relaxed text-tomorrow-muted">{detailQueries[0]?.data?.notice || TRAVEL_OFFERS_NOTICE}</aside>
          </>
        ) : null}
      </main>
    </div>
  );
}
