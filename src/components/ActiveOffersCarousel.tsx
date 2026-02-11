import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ChevronLeft, ChevronRight, Clock, Sparkles, Tag, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import { trackEventStandalone } from '@/hooks/useAnalytics';

interface PromotionalOffer {
  id: string;
  destination_id: string;
  title: string;
  tagline: string | null;
  total_price: number;
  cash_price: number | null;
  installments: number | null;
  installment_value: number | null;
  valid_until: string;
  departure_date: string | null;
  return_date: string | null;
  destinations: {
    name: string;
    slug: string;
    image_url: string | null;
  };
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  expired: boolean;
}

const useCountdown = (targetDate: string): TimeRemaining => {
  const calculateTimeRemaining = useCallback((): TimeRemaining => {
    const now = new Date().getTime();
    const end = new Date(targetDate).getTime();
    const diff = end - now;

    if (diff <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
    }

    return {
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
      minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
      seconds: Math.floor((diff % (1000 * 60)) / 1000),
      expired: false,
    };
  }, [targetDate]);

  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>(calculateTimeRemaining);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining(calculateTimeRemaining());
    }, 1000);

    return () => clearInterval(interval);
  }, [calculateTimeRemaining]);

  return timeRemaining;
};

const OfferCountdown = ({ validUntil }: { validUntil: string }) => {
  const { days, hours, minutes, seconds, expired } = useCountdown(validUntil);

  if (expired) {
    return (
      <div className="flex items-center gap-1 text-destructive text-xs font-medium">
        <Clock className="w-3 h-3" />
        Expirada
      </div>
    );
  }

  return (
    <div className="flex flex-col items-start gap-0.5">
      <span className="text-[10px] text-white/70">Oferta expira em:</span>
      <div className="flex items-center gap-1.5 text-xs">
        <Clock className="w-3 h-3 text-accent" />
        <span className="font-medium text-white">
          {days > 0 && `${days}d `}
          {String(hours).padStart(2, '0')}:{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </span>
      </div>
    </div>
  );
};

const OfferCard = ({ offer }: { offer: PromotionalOffer }) => {
  const destinationImage = offer.destinations?.image_url;

  const handleOfferClick = () => {
    trackEventStandalone('offer_click', {
      offer_id: offer.id,
      offer_title: offer.title,
      destination_name: offer.destinations?.name,
      source: 'inline_carousel',
    });
  };

  return (
    <Link
      to={`/promocao/${offer.id}`}
      onClick={handleOfferClick}
      className="group flex-shrink-0 w-[280px] sm:w-[320px] rounded-2xl overflow-hidden bg-card border border-border hover:border-accent/50 transition-all duration-300 hover:shadow-lg"
    >
      {/* Image */}
      <div className="relative h-40 sm:h-48 overflow-hidden">
        {destinationImage ? (
          <img
            src={destinationImage}
            alt={offer.destinations?.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary to-accent" />
        )}
        
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

        {/* Badge */}
        <div className="absolute top-3 left-3 flex items-center gap-1 px-2 py-1 rounded-full bg-accent text-accent-foreground text-xs font-semibold">
          <Sparkles className="w-3 h-3" />
          Oferta
        </div>

        {/* Timer */}
        <div className="absolute bottom-3 left-3 px-2 py-1 rounded-lg bg-black/70 backdrop-blur-sm">
          <OfferCountdown validUntil={offer.valid_until} />
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-serif text-lg font-bold text-foreground mb-1 group-hover:text-primary transition-colors">
          {offer.destinations?.name}
        </h3>
        
        {offer.tagline && (
          <p className="text-muted-foreground text-sm line-clamp-2 mb-2">
            {offer.tagline}
          </p>
        )}

        {/* Travel dates */}
        {(offer.departure_date || offer.return_date) && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
            <Calendar className="w-3 h-3 text-primary" />
            <span>
              {offer.departure_date && new Date(offer.departure_date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
              {offer.departure_date && offer.return_date && ' - '}
              {offer.return_date && new Date(offer.return_date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
            </span>
          </div>
        )}

        {/* Price */}
        <div className="flex items-end justify-between">
          <div>
            {offer.installments && offer.installment_value && (
              <p className="text-xs text-muted-foreground">
                {offer.installments}x de
              </p>
            )}
            <p className="text-xl font-bold text-accent">
              {offer.installments && offer.installment_value
                ? `R$ ${offer.installment_value.toLocaleString('pt-BR')}`
                : `R$ ${offer.total_price.toLocaleString('pt-BR')}`
              }
            </p>
            {offer.cash_price && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Tag className="w-3 h-3" />
                À vista: R$ {offer.cash_price.toLocaleString('pt-BR')}
              </p>
            )}
          </div>
          <span className="text-primary text-sm font-medium group-hover:underline">
            Ver oferta →
          </span>
        </div>
      </div>
    </Link>
  );
};

export const ActiveOffersCarousel = () => {
  const [offers, setOffers] = useState<PromotionalOffer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const scrollContainerRef = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    try {
      const { data, error } = await supabase
        .from('promotional_offers')
        .select(`
          id,
          destination_id,
          title,
          tagline,
          total_price,
          cash_price,
          installments,
          installment_value,
          valid_until,
          departure_date,
          return_date,
          destinations (
            name,
            slug,
            image_url
          )
        `)
        .eq('is_active', true)
        .gte('valid_until', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching promotional offers:', error);
        throw error;
      }

      if (data) {
        setOffers(data as PromotionalOffer[]);
      }
    } catch (error) {
      console.error('Error fetching offers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    const container = document.getElementById('offers-carousel');
    if (container) {
      const scrollAmount = 340;
      container.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  if (isLoading) {
    return null;
  }

  if (offers.length === 0) {
    return null;
  }

  return (
    <section className="py-12 md:py-16">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
              <Tag className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h2 className="font-serif text-2xl md:text-3xl font-bold text-foreground">
                Ofertas <span className="gradient-text-gold">Especiais</span>
              </h2>
              <p className="text-muted-foreground text-sm">
                Pacotes com preços imperdíveis por tempo limitado
              </p>
            </div>
          </div>

          {/* Navigation */}
          <div className="hidden sm:flex items-center gap-2">
            <button
              onClick={() => scroll('left')}
              className="p-2 rounded-full bg-secondary hover:bg-secondary/80 text-foreground transition-colors"
              aria-label="Anterior"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => scroll('right')}
              className="p-2 rounded-full bg-secondary hover:bg-secondary/80 text-foreground transition-colors"
              aria-label="Próximo"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Carousel */}
        <div
          id="offers-carousel"
          className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 -mx-4 px-4 lg:mx-0 lg:px-0"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {offers.map((offer) => (
            <div key={offer.id} style={{ scrollSnapAlign: 'start' }}>
              <OfferCard offer={offer} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
