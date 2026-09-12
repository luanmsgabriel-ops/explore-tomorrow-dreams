import { useQuery } from '@tanstack/react-query';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, ChevronLeft, ChevronRight, Radar } from 'lucide-react';
import { useEffect, useState } from 'react';
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

function relativePosition(index: number, activeIndex: number, length: number) {
  let distance = index - activeIndex;
  const half = length / 2;

  if (distance > half) distance -= length;
  if (distance < -half) distance += length;

  return distance;
}

export function HomeOpportunityShowcase() {
  const [activeOfferIndex, setActiveOfferIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isNarrow, setIsNarrow] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches,
  );
  const shouldReduceMotion = useReducedMotion();

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

  useEffect(() => {
    const media = window.matchMedia('(max-width: 767px)');
    const onChange = () => setIsNarrow(media.matches);

    onChange();
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    if (offers.length === 0 || isPaused || shouldReduceMotion) return;

    const interval = window.setInterval(() => {
      setActiveOfferIndex((current) => (current + 1) % offers.length);
    }, 5600);

    return () => window.clearInterval(interval);
  }, [offers.length, isPaused, shouldReduceMotion]);

  useEffect(() => {
    if (activeOfferIndex >= offers.length && offers.length > 0) {
      setActiveOfferIndex(0);
    }
  }, [activeOfferIndex, offers.length]);

  const goToOffer = (index: number) => {
    if (offers.length === 0) return;
    setActiveOfferIndex((index + offers.length) % offers.length);
  };

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
            <div
              className="relative mx-auto max-w-6xl select-none pb-14 lg:hidden"
              style={{ perspective: 1500 }}
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
              onFocusCapture={() => setIsPaused(true)}
              onBlurCapture={() => setIsPaused(false)}
            >
              <motion.div
                className="relative h-[560px] overflow-hidden touch-pan-y sm:h-[590px] md:h-[620px]"
                drag={shouldReduceMotion ? false : 'x'}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.08}
                onDragEnd={(_, info) => {
                  if (info.offset.x < -42) goToOffer(activeOfferIndex + 1);
                  if (info.offset.x > 42) goToOffer(activeOfferIndex - 1);
                }}
              >
                {offers.map((item, index) => {
                  const position = relativePosition(index, activeOfferIndex, offers.length);
                  const distance = Math.abs(position);
                  const maxVisibleDistance = isNarrow ? 1 : 2;
                  const isVisible = distance <= maxVisibleDistance;
                  const isActive = position === 0;
                  const direction = position === 0 ? 0 : position > 0 ? 1 : -1;

                  const x = isNarrow
                    ? direction * 248
                    : direction * (distance === 1 ? 360 : 640);
                  const y = distance === 0 ? 0 : distance === 1 ? 28 : 58;
                  const scale = distance === 0 ? 1 : distance === 1 ? (isNarrow ? 0.74 : 0.8) : 0.62;
                  const rotateY = shouldReduceMotion ? 0 : direction * (distance === 1 ? -13 : -20);
                  const opacity = !isVisible ? 0 : distance === 0 ? 1 : distance === 1 ? (isNarrow ? 0.48 : 0.72) : 0.26;

                  return (
                    <div
                      key={item.id}
                      className="pointer-events-none absolute inset-x-0 top-0 flex justify-center"
                      style={{ zIndex: 30 - distance }}
                      aria-hidden={!isVisible}
                    >
                      <motion.div
                        className="w-[84vw] max-w-[390px] sm:w-[390px] md:w-[420px]"
                        initial={false}
                        animate={{ x, y, scale, rotateY, opacity }}
                        transition={
                          shouldReduceMotion
                            ? { duration: 0 }
                            : { type: 'spring', stiffness: 130, damping: 23, mass: 0.82 }
                        }
                        style={{
                          pointerEvents: isActive ? 'auto' : 'none',
                          filter: isActive ? 'none' : 'saturate(0.82) brightness(0.78)',
                        }}
                      >
                        <div className={isActive ? 'drop-shadow-[0_28px_48px_rgba(0,0,0,0.38)]' : ''}>
                          {renderOfferCard(item, index)}
                        </div>
                      </motion.div>
                    </div>
                  );
                })}
              </motion.div>

              <div className="absolute bottom-0 left-1/2 z-40 flex -translate-x-1/2 items-center gap-3">
                <button
                  type="button"
                  onClick={() => goToOffer(activeOfferIndex - 1)}
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-tomorrow-line bg-tomorrow-surface/80 text-tomorrow-text backdrop-blur-sm transition hover:border-tomorrow-gold/60 hover:text-tomorrow-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tomorrow-gold/60"
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
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-tomorrow-line bg-tomorrow-surface/80 text-tomorrow-text backdrop-blur-sm transition hover:border-tomorrow-gold/60 hover:text-tomorrow-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tomorrow-gold/60"
                  aria-label="Próxima oportunidade"
                >
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>

            <div className="hidden items-stretch gap-5 lg:grid lg:grid-cols-2 xl:grid-cols-3">
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
