import { useQuery } from '@tanstack/react-query';
import { ArrowRight, ChevronLeft, ChevronRight, Radar } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

import {
  OpportunityBadge,
  OpportunityButton,
  OpportunityCard,
  OpportunityState,
  type OpportunityCardBadge,
} from '@/components/opportunities';
import {
  TRAVEL_OFFERS_NOTICE,
  fetchTravelOfferCatalog,
  type TravelOfferCatalogItem,
} from '@/lib/travelOffersPublic';

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});

function formatDate(value: string | null) {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? null : dateFormatter.format(date);
}

function badgesFor(item: TravelOfferCatalogItem): OpportunityCardBadge[] {
  const badges: OpportunityCardBadge[] = [];
  if (item.featured) badges.push({ label: 'Destaque', variant: 'success' });
  if (item.campaign_label) badges.push({ label: item.campaign_label, variant: 'neutral' });
  if (item.offer_subtype === 'evento') badges.push({ label: 'Evento', variant: 'event' });
  if (item.offer_subtype === 'grupo_guiado') badges.push({ label: 'Grupo guiado', variant: 'guided' });
  if (item.available_seats !== null && item.available_seats <= 5) {
    badges.push({
      label: item.available_seats === 1 ? 'Última vaga' : 'Últimas vagas',
      variant: 'seats',
    });
  }
  return badges;
}

export function HomeOpportunityShowcase() {
  const [activeOfferIndex, setActiveOfferIndex] = useState(0);
  const mobileCarouselRef = useRef<HTMLDivElement>(null);

  const offersQuery = useQuery({
    queryKey: ['travel-offers-public', 'home-showcase'],
    queryFn: ({ signal }) => fetchTravelOfferCatalog({
      offer_type: 'pacote',
      sort: 'editorial',
      page: 1,
      per_page: 6,
    }, signal),
    staleTime: 5 * 60_000,
    retry: 1,
    retryDelay: 1_000,
  });

  const offers = offersQuery.data?.items ?? [];

  const goToOffer = useCallback((index: number) => {
    const container = mobileCarouselRef.current;
    if (!container || offers.length === 0) return;

    const normalizedIndex = (index + offers.length) % offers.length;
    const slides = Array.from(container.querySelectorAll<HTMLElement>('[data-offer-slide]'));
    const target = slides[normalizedIndex];
    if (!target) return;

    const left = target.offsetLeft - (container.clientWidth - target.clientWidth) / 2;
    container.scrollTo({ left, behavior: 'smooth' });
    setActiveOfferIndex(normalizedIndex);
  }, [offers.length]);

  const handleMobileScroll = useCallback(() => {
    const container = mobileCarouselRef.current;
    if (!container) return;

    const slides = Array.from(container.querySelectorAll<HTMLElement>('[data-offer-slide]'));
    if (slides.length === 0) return;

    const center = container.scrollLeft + container.clientWidth / 2;
    let closestIndex = 0;
    let closestDistance = Number.POSITIVE_INFINITY;

    slides.forEach((slide, index) => {
      const slideCenter = slide.offsetLeft + slide.clientWidth / 2;
      const distance = Math.abs(slideCenter - center);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });

    setActiveOfferIndex(closestIndex);
  }, []);

  const renderOfferCard = (item: TravelOfferCatalogItem, index: number) => (
    <OpportunityCard
      id={item.id}
      kind={item.kind === 'air_block' ? 'air_block' : 'package'}
      title={item.name || item.category}
      origin={item.origin}
      originIata={item.origin_iata}
      destination={item.destination || item.destination_iata || 'Destino não informado'}
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
      imageAlt={item.destination ? `Vista de ${item.destination}` : 'Imagem pública da oportunidade'}
      imageEager={index < 3}
      imagePreloadMargin="900px 0px"
      badges={badgesFor(item)}
      actionHref={`/oportunidades/oferta/${encodeURIComponent(item.id)}`}
      actionLabel="Ver detalhes"
      className="h-full"
    />
  );

  return (
    <section
      id="oportunidades-em-destaque"
      className="opportunities-theme relative overflow-hidden border-y border-tomorrow-line py-16 sm:py-20 lg:py-24"
      aria-labelledby="home-opportunities-title"
    >
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute left-[4%] top-10 size-64 rounded-full bg-tomorrow-teal/10 blur-3xl" />
        <div className="absolute right-[7%] top-24 size-72 rounded-full bg-tomorrow-gold/10 blur-3xl" />
      </div>

      <div className="relative mx-auto w-full max-w-[90rem] px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <OpportunityBadge variant="neutral">
              <Radar aria-hidden="true" />
              Radar Tomorrow
            </OpportunityBadge>
            <h2 id="home-opportunities-title" className="mt-5 font-editorial text-4xl leading-[0.96] text-tomorrow-text sm:text-6xl lg:text-7xl">
              Oportunidades que existem agora.
            </h2>
            <p className="mt-5 max-w-2xl text-sm leading-relaxed text-tomorrow-muted sm:text-lg">
              Pacotes reais do inventário Tomorrow Travel, apresentados com origem, período e preço por pessoa quando informados pela fonte.
            </p>
          </div>

          <OpportunityButton asChild variant="outline" size="lg" className="w-full shrink-0 sm:w-auto">
            <Link to="/oportunidades/catalogo">
              Explorar todas
              <ArrowRight aria-hidden="true" />
            </Link>
          </OpportunityButton>
        </div>

        {offersQuery.isPending ? <OpportunityState state="loading" /> : null}

        {offersQuery.isError ? (
          <OpportunityState
            state="error"
            title="Não foi possível atualizar a vitrine"
            description="O catálogo completo continua disponível para uma nova consulta."
            actionLabel="Tentar novamente"
            onAction={() => offersQuery.refetch()}
          />
        ) : null}

        {offersQuery.data && offers.length === 0 ? (
          <OpportunityState
            state="empty"
            title="Nenhum pacote disponível nesta vitrine"
            description="Consulte o catálogo para verificar outros tipos de oportunidade."
            actionLabel="Abrir catálogo"
            actionHref="/oportunidades/catalogo"
          />
        ) : null}

        {offers.length > 0 ? (
          <>
            <div className="sm:hidden">
              <div
                ref={mobileCarouselRef}
                onScroll={handleMobileScroll}
                className="-mx-4 flex snap-x snap-mandatory items-stretch gap-4 overflow-x-auto px-[6vw] pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                aria-label="Carrossel de oportunidades em destaque"
              >
                {offers.map((item, index) => (
                  <div
                    key={item.id}
                    data-offer-slide
                    className="flex w-[88vw] max-w-[390px] shrink-0 snap-center"
                  >
                    {renderOfferCard(item, index)}
                  </div>
                ))}
              </div>

              <div className="mt-5 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => goToOffer(activeOfferIndex - 1)}
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-tomorrow-line bg-tomorrow-surface/70 text-tomorrow-text backdrop-blur-sm transition hover:border-tomorrow-gold/60 hover:text-tomorrow-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tomorrow-gold/60"
                  aria-label="Oportunidade anterior"
                >
                  <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                </button>

                <div className="flex items-center gap-1.5" aria-label={`Oportunidade ${activeOfferIndex + 1} de ${offers.length}`}>
                  {offers.map((item, index) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => goToOffer(index)}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        index === activeOfferIndex
                          ? 'w-7 bg-tomorrow-gold'
                          : 'w-1.5 bg-tomorrow-muted/40 hover:bg-tomorrow-muted/70'
                      }`}
                      aria-label={`Ir para oportunidade ${index + 1}`}
                    />
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => goToOffer(activeOfferIndex + 1)}
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-tomorrow-line bg-tomorrow-surface/70 text-tomorrow-text backdrop-blur-sm transition hover:border-tomorrow-gold/60 hover:text-tomorrow-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tomorrow-gold/60"
                  aria-label="Próxima oportunidade"
                >
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>

            <div className="hidden items-stretch gap-5 sm:grid sm:grid-cols-2 xl:grid-cols-3">
              {offers.map((item, index) => (
                <div key={item.id} className="h-full">
                  {renderOfferCard(item, index)}
                </div>
              ))}
            </div>
          </>
        ) : null}

        <div className="mt-8 border-t border-tomorrow-line pt-6 text-sm text-tomorrow-muted">
          <p className="max-w-3xl leading-relaxed">
            {offersQuery.data?.notice || TRAVEL_OFFERS_NOTICE}
          </p>
        </div>
      </div>
    </section>
  );
}
