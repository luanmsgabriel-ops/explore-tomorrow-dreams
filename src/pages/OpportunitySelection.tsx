import { useQueries, useQuery } from "@tanstack/react-query";
import { ArrowRight, MessageSquareText, Radar, Share2, Sparkles } from "lucide-react";
import { useMemo } from "react";
import { useParams } from "react-router-dom";

import {
  OpportunityBadge,
  OpportunityButton,
  OpportunityCard,
  OpportunityHeader,
  OpportunityState,
  type OpportunityCardBadge,
} from "@/components/opportunities";
import { fetchSharedOpportunitySelection } from "@/lib/opportunitySelection";
import {
  fetchTravelOfferDetail,
  type TravelOfferDetailItem,
} from "@/lib/travelOffersPublic";

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

function formatDate(value: string | null) {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? null : dateFormatter.format(date);
}

function cardTitle(item: TravelOfferDetailItem) {
  if (item.kind === "air_block") return item.airline || item.destination;
  return item.name || item.category || item.destination;
}

function cardImage(item: TravelOfferDetailItem) {
  return item.kind === "air_block" ? null : item.image_url;
}

function cardAirfareIncluded(item: TravelOfferDetailItem) {
  return item.kind === "air_block" ? true : item.airfare_included;
}

function cardBadges(item: TravelOfferDetailItem): OpportunityCardBadge[] {
  const badges: OpportunityCardBadge[] = [];
  if (item.offer_subtype === "evento") badges.push({ label: "Evento", variant: "event" });
  if (item.offer_subtype === "grupo_guiado") badges.push({ label: "Grupo guiado", variant: "guided" });
  if (item.available_seats !== null && item.available_seats <= 5) {
    badges.push({ label: item.available_seats === 1 ? "Última vaga" : "Últimas vagas", variant: "seats" });
  }
  return badges;
}

export default function OpportunitySelection() {
  const { token = "" } = useParams();
  const selectionQuery = useQuery({
    queryKey: ["travel-offer-selection", token],
    queryFn: ({ signal }) => fetchSharedOpportunitySelection(token, signal),
    enabled: Boolean(token),
    retry: 1,
    staleTime: 60_000,
  });

  const offerIds = selectionQuery.data?.offer_ids ?? [];
  const offerQueries = useQueries({
    queries: offerIds.map((id) => ({
      queryKey: ["travel-offers-public", "detail", id],
      queryFn: ({ signal }: { signal: AbortSignal }) => fetchTravelOfferDetail(id, signal),
      retry: 1,
      staleTime: 30_000,
    })),
  });

  const availableOffers = useMemo(
    () => offerQueries.flatMap((query) => query.data?.item ? [query.data.item] : []),
    [offerQueries],
  );
  const unavailableCount = offerQueries.filter((query) => query.isError).length;
  const loadingOffers = offerQueries.some((query) => query.isPending);
  const currentUrl = typeof window !== "undefined" ? window.location.href : "";
  const shareText = selectionQuery.data ? `${selectionQuery.data.title} — Tomorrow Travel` : "Seleção Tomorrow Travel";
  const whatsappShareUrl = currentUrl
    ? `https://wa.me/?text=${encodeURIComponent(`${shareText}: ${currentUrl}`)}`
    : null;

  const sharePage = async () => {
    if (!currentUrl) return;
    if (navigator.share) {
      await navigator.share({ title: shareText, url: currentUrl });
      return;
    }
    await navigator.clipboard.writeText(currentUrl);
  };

  return (
    <div className="opportunities-theme min-h-screen bg-tomorrow-background text-tomorrow-text">
      <OpportunityHeader
        navItems={[
          { label: "Catálogo", href: "/oportunidades/catalogo" },
          { label: "Live", href: "/oportunidades/live" },
          { label: "Comparar", href: "/oportunidades/comparar" },
        ]}
        ctaHref="/oportunidades/live"
        ctaLabel="Falar com o Téo Live"
      />

      <main>
        <section className="relative overflow-hidden border-b border-tomorrow-line">
          <div className="pointer-events-none absolute inset-0 opacity-70" aria-hidden="true">
            <div className="absolute left-[10%] top-8 size-64 rounded-full bg-tomorrow-teal/10 blur-3xl" />
            <div className="absolute right-[8%] top-20 size-64 rounded-full bg-tomorrow-gold/10 blur-3xl" />
          </div>
          <div className="relative mx-auto w-full max-w-[90rem] px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
            <OpportunityBadge variant="neutral"><Sparkles className="size-4" aria-hidden="true" />Seleção compartilhada</OpportunityBadge>
            <h1 className="mt-4 max-w-4xl font-editorial text-4xl leading-[0.96] text-tomorrow-text sm:text-6xl">
              {selectionQuery.data?.title || "Seleção Tomorrow Travel"}
            </h1>
            {selectionQuery.data?.description ? (
              <p className="mt-4 max-w-3xl text-base leading-relaxed text-tomorrow-muted sm:text-lg">{selectionQuery.data.description}</p>
            ) : (
              <p className="mt-4 max-w-3xl text-base leading-relaxed text-tomorrow-muted sm:text-lg">Oportunidades escolhidas para comparar e compartilhar.</p>
            )}
            {selectionQuery.data ? (
              <div className="mt-6 flex flex-wrap gap-2">
                <OpportunityButton variant="outline" onClick={() => void sharePage()}><Share2 aria-hidden="true" />Compartilhar seleção</OpportunityButton>
                {whatsappShareUrl ? <OpportunityButton asChild variant="teal"><a href={whatsappShareUrl} target="_blank" rel="noreferrer">Compartilhar no WhatsApp</a></OpportunityButton> : null}
              </div>
            ) : null}
          </div>
        </section>

        <section className="mx-auto w-full max-w-[90rem] px-4 py-8 sm:px-6 lg:px-8" aria-label="Oportunidades da seleção">
          {selectionQuery.isPending ? <OpportunityState state="loading" /> : null}
          {selectionQuery.isError ? (
            <OpportunityState
              state="error"
              title="Seleção indisponível"
              description={selectionQuery.error instanceof Error ? selectionQuery.error.message : "Este link não está disponível."}
              actionLabel="Explorar catálogo"
              onAction={() => { window.location.href = "/oportunidades/catalogo"; }}
            />
          ) : null}

          {selectionQuery.data && loadingOffers ? <OpportunityState state="loading" title="Atualizando oportunidades" description="Conferindo os dados atuais de cada oferta da seleção." /> : null}

          {selectionQuery.data && !loadingOffers ? (
            <>
              {availableOffers.length ? (
                <div className="grid items-stretch gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {availableOffers.map((item) => (
                    <OpportunityCard
                      key={item.id}
                      id={item.id}
                      kind={item.kind === "air_block" ? "air_block" : "package"}
                      title={cardTitle(item)}
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
                      airfareIncluded={cardAirfareIncluded(item)}
                      imageUrl={cardImage(item)}
                      imageAlt={item.destination ? `Vista de ${item.destination}` : "Imagem pública da oportunidade"}
                      badges={cardBadges(item)}
                      actionHref={`/oportunidades/oferta/${encodeURIComponent(item.id)}`}
                      actionLabel="Ver detalhes"
                      className="h-full"
                    />
                  ))}
                </div>
              ) : null}

              {unavailableCount > 0 ? (
                <div className="mt-6 rounded-tomorrow border border-tomorrow-gold/30 bg-tomorrow-gold/5 p-4 text-sm leading-relaxed text-tomorrow-muted">
                  {unavailableCount === 1 ? "1 oportunidade desta seleção não está mais disponível no inventário atual." : `${unavailableCount} oportunidades desta seleção não estão mais disponíveis no inventário atual.`}
                </div>
              ) : null}
            </>
          ) : null}
        </section>

        {selectionQuery.data ? (
          <section className="border-t border-tomorrow-line bg-tomorrow-surface/45">
            <div className="mx-auto grid w-full max-w-[90rem] gap-5 px-4 py-8 sm:px-6 lg:grid-cols-3 lg:px-8">
              <a href="/oportunidades/catalogo" className="opportunity-focus group rounded-tomorrow-lg border border-tomorrow-line bg-tomorrow-surface/65 p-5 transition-colors hover:border-tomorrow-gold/50">
                <Radar className="size-6 text-tomorrow-gold-soft" aria-hidden="true" />
                <h2 className="mt-4 font-editorial text-2xl text-tomorrow-text">Encontrar mais oportunidades</h2>
                <p className="mt-2 text-sm leading-relaxed text-tomorrow-muted">Abra o catálogo completo e filtre novos pacotes e bloqueios.</p>
                <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-tomorrow-gold-soft">Ir para o catálogo <ArrowRight className="size-4" aria-hidden="true" /></span>
              </a>
              <a href="/oportunidades/live" className="opportunity-focus group rounded-tomorrow-lg border border-tomorrow-line bg-tomorrow-surface/65 p-5 transition-colors hover:border-tomorrow-teal/50">
                <MessageSquareText className="size-6 text-tomorrow-teal-soft" aria-hidden="true" />
                <h2 className="mt-4 font-editorial text-2xl text-tomorrow-text">Conversar com o Téo Live</h2>
                <p className="mt-2 text-sm leading-relaxed text-tomorrow-muted">Peça novas opções por voz e refine destino, período e orçamento.</p>
                <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-tomorrow-teal-soft">Abrir Tomorrow Live <ArrowRight className="size-4" aria-hidden="true" /></span>
              </a>
              <a href="/" className="opportunity-focus group rounded-tomorrow-lg border border-tomorrow-line bg-tomorrow-surface/65 p-5 transition-colors hover:border-tomorrow-gold/50">
                <Sparkles className="size-6 text-tomorrow-gold-soft" aria-hidden="true" />
                <h2 className="mt-4 font-editorial text-2xl text-tomorrow-text">Conhecer a Tomorrow Travel</h2>
                <p className="mt-2 text-sm leading-relaxed text-tomorrow-muted">Volte ao site para conhecer destinos, serviços e outras experiências.</p>
                <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-tomorrow-gold-soft">Ir para o site <ArrowRight className="size-4" aria-hidden="true" /></span>
              </a>
            </div>
          </section>
        ) : null}
      </main>
    </div>
  );
}
