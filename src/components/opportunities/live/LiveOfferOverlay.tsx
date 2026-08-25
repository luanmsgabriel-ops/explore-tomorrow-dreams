import { useEffect, useRef, useState, type CSSProperties } from "react";
import {
  ArrowRight,
  CalendarDays,
  ChevronUp,
  Layers3,
  MapPin,
  MessageCircle,
  Plane,
  X,
} from "lucide-react";

import { OpportunityBadge, OpportunityButton } from "@/components/opportunities";
import type { OfferHandoffSelection } from "@/hooks/useRealtimeVoice";
import { offerHandoffTitle } from "@/lib/offerHandoff";
import type { TravelOfferCatalogItem } from "@/lib/travelOffersPublic";
import { cn } from "@/lib/utils";

interface LiveOfferOverlayProps {
  offers: TravelOfferCatalogItem[];
  handoff: OfferHandoffSelection | null;
  detailPath: string | null;
  whatsappUrl: string | null;
  navigate?: (target: string) => void;
}

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

const defaultNavigate = (target: string) => window.location.assign(target);
const OFFER_SWAP_MS = 150;
const MAX_VISIBLE_COMPARISON_OFFERS = 3;

export function automaticHandoffTarget(
  handoff: OfferHandoffSelection | null,
  detailPath: string | null,
  whatsappUrl: string | null,
) {
  if (!handoff) return null;
  if (handoff.requestedChannel === "details") return detailPath;
  if (handoff.requestedChannel === "whatsapp") return whatsappUrl;
  return null;
}

function formatDate(value: string | null) {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? null : dateFormatter.format(date);
}

function formatCurrency(value: number, currency: string | null) {
  const safeCurrency = currency && /^[A-Z]{3}$/.test(currency) ? currency : "BRL";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: safeCurrency }).format(value);
}

function offerRoute(item: TravelOfferCatalogItem) {
  const origin = item.origin_iata || item.origin;
  const destination = item.destination_iata || item.destination;
  if (origin && destination) return `${origin} → ${destination}`;
  return destination || origin || "Rota não informada";
}

function offerPeriod(item: TravelOfferCatalogItem) {
  return [formatDate(item.departure_date), formatDate(item.return_date)].filter(Boolean).join(" a ");
}

function destinationKey(item: TravelOfferCatalogItem) {
  return (item.destination_iata || item.destination || item.id)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

export function selectLiveComparisonOffers(offers: TravelOfferCatalogItem[]) {
  const distinctDestinations = new Set(offers.map(destinationKey));
  if (distinctDestinations.size <= 1) return offers.slice(0, MAX_VISIBLE_COMPARISON_OFFERS);

  const cheapestByDestination = new Map<string, TravelOfferCatalogItem>();
  const destinationOrder: string[] = [];
  for (const offer of offers) {
    const key = destinationKey(offer);
    const current = cheapestByDestination.get(key);
    if (!current) {
      cheapestByDestination.set(key, offer);
      destinationOrder.push(key);
      continue;
    }
    if (offer.price_per_person < current.price_per_person) cheapestByDestination.set(key, offer);
  }

  return destinationOrder
    .map((key) => cheapestByDestination.get(key))
    .filter((item): item is TravelOfferCatalogItem => Boolean(item))
    .slice(0, MAX_VISIBLE_COMPARISON_OFFERS);
}

function FloatingOfferCard({ item, index }: { item: TravelOfferCatalogItem; index: number }) {
  const style = {
    "--live-card-tilt": "0deg",
    "--live-card-offset": "0px",
    "--live-card-delay": `${index * -0.65}s`,
  } as CSSProperties;
  const period = offerPeriod(item);

  return (
    <article
      className="live-offer-float-card opportunity-scope group relative flex min-h-[19.5rem] w-[17rem] flex-none snap-center flex-col overflow-hidden rounded-2xl border border-tomorrow-gold/40 bg-[#071f23] shadow-[0_24px_65px_rgba(0,0,0,0.62),0_0_22px_rgba(76,198,190,0.10)] transition-[opacity,transform,box-shadow] duration-500 ease-out sm:w-[18rem] lg:min-h-[20rem] lg:w-auto lg:min-w-0 motion-reduce:transition-none"
      style={style}
      data-floating-offer-id={item.id}
    >
      {item.image_url ? (
        <div className="relative h-24 shrink-0 overflow-hidden">
          <img src={item.image_url} alt="" loading="lazy" className="size-full object-cover transition-transform duration-500 motion-safe:group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#071f23] via-transparent to-transparent" aria-hidden="true" />
        </div>
      ) : (
        <div className="h-2 shrink-0 bg-gradient-to-r from-tomorrow-teal/70 via-tomorrow-gold/65 to-tomorrow-teal/35" aria-hidden="true" />
      )}

      <div className="grid flex-1 grid-rows-[auto_1fr_auto] gap-3 p-4">
        <div className="flex items-center justify-between gap-2">
          <OpportunityBadge variant={item.kind === "air_block" ? "air" : "package"}>
            {item.kind === "air_block" ? <Plane aria-hidden="true" /> : null}
            {item.kind === "air_block" ? "Bloqueio" : "Pacote"}
          </OpportunityBadge>
          <span className="text-[0.62rem] font-bold uppercase tracking-[0.16em] text-tomorrow-teal-soft">Opção {index + 1}</span>
        </div>

        <div className="min-h-0">
          <h3 className="line-clamp-3 font-editorial text-xl leading-[1.05] text-tomorrow-text">{offerHandoffTitle(item)}</h3>
          <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-tomorrow-text">
            <MapPin className="size-3.5 shrink-0 text-tomorrow-gold" aria-hidden="true" />
            {offerRoute(item)}
          </p>
          {period ? (
            <p className="mt-1.5 flex items-start gap-1.5 text-[0.7rem] leading-relaxed text-tomorrow-muted">
              <CalendarDays className="mt-0.5 size-3.5 shrink-0 text-tomorrow-teal-soft" aria-hidden="true" />
              {period}
            </p>
          ) : null}
        </div>

        <div className="flex items-end justify-between gap-3 border-t border-tomorrow-line pt-3">
          <div>
            <p className="text-[0.6rem] font-semibold uppercase tracking-[0.12em] text-tomorrow-muted">Por pessoa</p>
            <p className="mt-0.5 font-editorial text-2xl leading-none text-tomorrow-gold-soft">
              {formatCurrency(item.price_per_person, item.currency)}
            </p>
          </div>
          <a
            href={`/oportunidades/oferta/${encodeURIComponent(item.id)}`}
            aria-label={`Abrir oferta: ${offerHandoffTitle(item)}`}
            className="opportunity-focus grid size-10 shrink-0 place-items-center rounded-xl border border-tomorrow-teal/40 bg-[#0b3034] text-tomorrow-teal-soft transition-colors hover:border-tomorrow-gold/55 hover:text-tomorrow-gold-soft"
          >
            <ArrowRight aria-hidden="true" />
          </a>
        </div>
      </div>
    </article>
  );
}

export function LiveOfferOverlay({ offers, handoff, detailPath, whatsappUrl, navigate = defaultNavigate }: LiveOfferOverlayProps) {
  const curatedOffers = selectLiveComparisonOffers(offers);
  const [deckOpen, setDeckOpen] = useState(curatedOffers.length > 0);
  const [handoffOpen, setHandoffOpen] = useState(Boolean(handoff));
  const [displayedOffers, setDisplayedOffers] = useState(() => curatedOffers);
  const [offersTransitioning, setOffersTransitioning] = useState(false);
  const automaticNavigationRef = useRef<string | null>(null);

  useEffect(() => {
    if (curatedOffers.length > 0) setDeckOpen(true);
  }, [curatedOffers.length]);

  useEffect(() => {
    const nextOffers = curatedOffers;
    const currentKey = displayedOffers.map((item) => item.id).join(":");
    const nextKey = nextOffers.map((item) => item.id).join(":");
    if (currentKey === nextKey) return undefined;

    setOffersTransitioning(true);
    const swapTimer = window.setTimeout(() => {
      setDisplayedOffers(nextOffers);
      window.requestAnimationFrame(() => setOffersTransitioning(false));
    }, displayedOffers.length > 0 ? OFFER_SWAP_MS : 0);

    return () => window.clearTimeout(swapTimer);
  }, [curatedOffers, displayedOffers]);

  useEffect(() => {
    if (handoff) setHandoffOpen(true);
  }, [handoff]);

  useEffect(() => {
    const target = automaticHandoffTarget(handoff, detailPath, whatsappUrl);
    if (!handoff || !target) return;
    const navigationKey = `${handoff.offer.id}:${handoff.requestedChannel}`;
    if (automaticNavigationRef.current === navigationKey) return;
    automaticNavigationRef.current = navigationKey;
    navigate(target);
  }, [detailPath, handoff, navigate, whatsappUrl]);

  useEffect(() => {
    if (!handoffOpen) return undefined;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setHandoffOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [handoffOpen]);

  if (offers.length === 0 && displayedOffers.length === 0 && !handoff) return null;
  const visibleOffers = displayedOffers;

  return (
    <>
      <div className="pointer-events-none absolute inset-x-0 top-[18%] z-30 px-2 sm:top-[22%] sm:px-3 lg:top-[26%]">
        {deckOpen && visibleOffers.length > 0 ? (
          <section
            className={cn(
              "pointer-events-auto rounded-2xl border border-tomorrow-teal/30 bg-[#06191d] p-3 shadow-[0_22px_72px_rgba(0,0,0,0.60),0_0_26px_rgba(76,198,190,0.08)] transition-[opacity,transform] duration-300 ease-out sm:p-4 motion-reduce:transition-none",
              offersTransitioning ? "translate-y-1 opacity-55" : "translate-y-0 opacity-100",
            )}
            aria-label="Ofertas encontradas pelo Téo"
            aria-live="polite"
          >
            <div className="mb-3 flex items-center justify-between gap-3 px-1">
              <p className="flex items-center gap-2 text-[0.65rem] font-bold uppercase tracking-[0.17em] text-tomorrow-gold-soft">
                <Layers3 className="size-3.5" aria-hidden="true" />
                {visibleOffers.length === 1 ? "1 oportunidade encontrada" : `${visibleOffers.length} oportunidades encontradas`}
              </p>
              <button
                type="button"
                onClick={() => setDeckOpen(false)}
                aria-label="Minimizar ofertas encontradas"
                className="opportunity-focus grid size-8 place-items-center rounded-lg border border-tomorrow-line bg-[#0a2529] text-tomorrow-muted transition-colors duration-300 hover:text-tomorrow-text"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>
            <div className="flex snap-x snap-mandatory items-stretch gap-3 overflow-x-auto px-1 pb-2 pt-1 lg:grid lg:grid-cols-3 lg:overflow-visible">
              {visibleOffers.map((item, index) => <FloatingOfferCard key={item.id} item={item} index={index} />)}
            </div>
            <p className="px-1 pt-1 text-center text-[0.62rem] text-tomorrow-muted">O Téo continua falando enquanto você compara as opções.</p>
          </section>
        ) : visibleOffers.length > 0 ? (
          <button
            type="button"
            onClick={() => setDeckOpen(true)}
            className="opportunity-focus pointer-events-auto mx-auto flex items-center gap-2 rounded-full border border-tomorrow-gold/40 bg-[#071f23] px-4 py-2 text-xs font-semibold text-tomorrow-gold-soft shadow-tomorrow-surface transition-[transform,opacity,border-color] duration-300 ease-out motion-safe:hover:-translate-y-0.5"
          >
            <ChevronUp className="size-4" aria-hidden="true" />
            Mostrar {visibleOffers.length} {visibleOffers.length === 1 ? "oferta" : "ofertas"}
          </button>
        ) : null}
      </div>

      {handoffOpen && handoff && detailPath && whatsappUrl ? (
        <div
          className="fixed inset-0 z-[80] grid items-end bg-tomorrow-background/72 p-3 backdrop-blur-md sm:place-items-center sm:p-6"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) setHandoffOpen(false);
          }}
        >
          <section
            role="dialog"
            aria-labelledby="live-offer-popup-title"
            aria-describedby="live-offer-popup-description"
            className="opportunity-scope relative w-full max-w-xl overflow-hidden rounded-tomorrow-lg border border-tomorrow-gold/45 bg-tomorrow-background/96 shadow-[0_30px_100px_rgba(0,0,0,0.7),0_0_44px_rgba(213,175,72,0.12)]"
            data-offer-handoff-id={handoff.offer.id}
          >
            <button
              type="button"
              onClick={() => setHandoffOpen(false)}
              aria-label="Fechar oferta escolhida"
              className="opportunity-focus absolute right-3 top-3 z-10 grid size-10 place-items-center rounded-full border border-tomorrow-line bg-tomorrow-background/82 text-tomorrow-muted backdrop-blur hover:text-tomorrow-text"
            >
              <X className="size-5" aria-hidden="true" />
            </button>

            {handoff.offer.image_url ? (
              <div className="relative h-36 overflow-hidden sm:h-44">
                <img src={handoff.offer.image_url} alt="" className="size-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-tomorrow-background via-tomorrow-background/20 to-transparent" aria-hidden="true" />
              </div>
            ) : (
              <div className="h-3 bg-gradient-to-r from-tomorrow-teal via-tomorrow-gold to-tomorrow-teal/60" aria-hidden="true" />
            )}

            <div className={cn("grid gap-4 p-5 sm:p-6", handoff.offer.image_url && "relative -mt-7")}>
              <div>
                <OpportunityBadge variant="success">Oferta escolhida</OpportunityBadge>
                <h2 id="live-offer-popup-title" className="mt-3 pr-10 font-editorial text-3xl leading-none text-tomorrow-text sm:text-4xl">
                  {offerHandoffTitle(handoff.offer)}
                </h2>
                <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-tomorrow-text">
                  <MapPin className="size-4 shrink-0 text-tomorrow-gold" aria-hidden="true" />
                  {offerRoute(handoff.offer)}
                </p>
                {offerPeriod(handoff.offer) ? (
                  <p className="mt-2 flex items-center gap-2 text-xs text-tomorrow-muted">
                    <CalendarDays className="size-4 shrink-0 text-tomorrow-teal-soft" aria-hidden="true" />
                    {offerPeriod(handoff.offer)}
                  </p>
                ) : null}
              </div>

              <div className="rounded-xl border border-tomorrow-gold/25 bg-tomorrow-gold/7 p-4">
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-tomorrow-muted">Valor por pessoa</p>
                <p className="mt-1 font-editorial text-4xl leading-none text-tomorrow-gold-soft">
                  {formatCurrency(handoff.offer.price_per_person, handoff.offer.currency)}
                </p>
              </div>

              <p id="live-offer-popup-description" className="text-xs leading-relaxed text-tomorrow-muted">
                Quando você pede diretamente a página ou o WhatsApp, o Tomorrow Live inicia o redirecionamento automático. Estes botões permanecem disponíveis como alternativa caso o navegador impeça a saída automática.
              </p>

              <div className="grid gap-2 sm:grid-cols-2">
                <OpportunityButton asChild fullWidth variant={handoff.requestedChannel === "details" ? "gold" : "outline"}>
                  <a href={detailPath}>Ver oferta <ArrowRight aria-hidden="true" /></a>
                </OpportunityButton>
                <OpportunityButton asChild fullWidth variant={handoff.requestedChannel === "details" ? "outline" : "gold"}>
                  <a href={whatsappUrl} target="_blank" rel="noreferrer"><MessageCircle aria-hidden="true" />WhatsApp</a>
                </OpportunityButton>
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}