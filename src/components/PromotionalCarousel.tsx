import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { X, ChevronLeft, ChevronRight, Clock, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

interface PromotionalOffer {
  id: string;
  destination_id: string;
  title: string;
  tagline: string | null;
  total_price: number;
  valid_until: string;
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

const CountdownTimer = ({ validUntil }: { validUntil: string }) => {
  const { days, hours, minutes, seconds, expired } = useCountdown(validUntil);

  if (expired) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-destructive/80 text-white text-sm font-medium">
        <Clock className="w-4 h-4" />
        Oferta expirada
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 px-5 py-3 rounded-xl bg-black/70 backdrop-blur-md text-white">
      <Clock className="w-5 h-5 text-accent" />
      <div className="flex items-center gap-1">
        {days > 0 && (
          <>
            <div className="flex flex-col items-center min-w-[40px]">
              <span className="text-2xl font-bold tabular-nums">{String(days).padStart(2, '0')}</span>
              <span className="text-[10px] uppercase tracking-wider text-white/70">dias</span>
            </div>
            <span className="text-2xl font-light text-white/50 mx-1">:</span>
          </>
        )}
        <div className="flex flex-col items-center min-w-[40px]">
          <span className="text-2xl font-bold tabular-nums">{String(hours).padStart(2, '0')}</span>
          <span className="text-[10px] uppercase tracking-wider text-white/70">hrs</span>
        </div>
        <span className="text-2xl font-light text-white/50 mx-1">:</span>
        <div className="flex flex-col items-center min-w-[40px]">
          <span className="text-2xl font-bold tabular-nums">{String(minutes).padStart(2, '0')}</span>
          <span className="text-[10px] uppercase tracking-wider text-white/70">min</span>
        </div>
        <span className="text-2xl font-light text-white/50 mx-1">:</span>
        <div className="flex flex-col items-center min-w-[40px]">
          <span className="text-2xl font-bold tabular-nums animate-pulse">{String(seconds).padStart(2, '0')}</span>
          <span className="text-[10px] uppercase tracking-wider text-white/70">seg</span>
        </div>
      </div>
    </div>
  );
};

export const PromotionalCarousel = () => {
  const [offers, setOffers] = useState<PromotionalOffer[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const shown = sessionStorage.getItem('promo-popup-shown');
    if (shown) {
      return;
    }

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
          valid_until,
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

      console.log('Promotional offers found:', data?.length || 0);

      if (data && data.length > 0) {
        setOffers(data as PromotionalOffer[]);
        setTimeout(() => {
          setIsVisible(true);
          sessionStorage.setItem('promo-popup-shown', 'true');
        }, 2000);
      }
    } catch (error) {
      console.error('Error fetching offers:', error);
    }
  };

  const handleClose = () => {
    setIsVisible(false);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? offers.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === offers.length - 1 ? 0 : prev + 1));
  };

  if (!isVisible || offers.length === 0) return null;

  const currentOffer = offers[currentIndex];
  const destinationImage = currentOffer.destinations?.image_url;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      {/* Close button - Fixed top right corner */}
      <button
        onClick={handleClose}
        className="fixed top-4 right-4 z-[60] p-3 rounded-full bg-black/60 hover:bg-black/80 text-white transition-colors border border-white/20 backdrop-blur-sm"
        aria-label="Fechar"
      >
        <X className="w-6 h-6" />
      </button>

      <div className="relative w-full max-w-lg">

        {/* Card */}
        <div className="relative rounded-3xl overflow-hidden shadow-2xl">
          {/* Background Image */}
          <div className="relative aspect-[4/5] md:aspect-[3/4]">
            {destinationImage ? (
              <img
                src={destinationImage}
                alt={currentOffer.destinations?.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary to-accent" />
            )}
            
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

            {/* Navigation arrows */}
            {offers.length > 1 && (
              <>
                <button
                  onClick={handlePrev}
                  className="absolute left-3 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors backdrop-blur-sm"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={handleNext}
                  className="absolute right-3 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors backdrop-blur-sm"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}

            {/* Badge */}
            <div className="absolute top-4 left-4 flex items-center gap-2 px-4 py-2 rounded-full bg-accent text-accent-foreground text-sm font-semibold shadow-lg">
              <Sparkles className="w-4 h-4" />
              Oferta Imperdível
            </div>

            {/* Content overlay */}
            <div className="absolute inset-x-0 bottom-0 p-6 space-y-4">
              {/* Timer */}
              <div className="flex justify-center">
                <CountdownTimer validUntil={currentOffer.valid_until} />
              </div>

              {/* Destination name */}
              <h3 className="font-serif text-3xl md:text-4xl font-bold text-white text-center drop-shadow-lg">
                {currentOffer.destinations?.name}
              </h3>

              {/* Tagline */}
              {currentOffer.tagline && (
                <p className="text-white/90 text-center text-lg leading-relaxed max-w-sm mx-auto">
                  {currentOffer.tagline}
                </p>
              )}

              {/* CTA Buttons */}
              <div className="flex flex-col gap-3 pt-2">
                <Link
                  to={`/promocao/${currentOffer.id}`}
                  onClick={handleClose}
                  className="w-full btn-gold text-center text-lg py-4"
                >
                  Ver Detalhes da Oferta
                </Link>
                <button
                  onClick={handleClose}
                  className="w-full px-6 py-3 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors text-sm"
                >
                  Ver depois
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Pagination dots */}
        {offers.length > 1 && (
          <div className="flex justify-center gap-2 mt-4">
            {offers.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  idx === currentIndex ? 'bg-white w-6' : 'bg-white/40 hover:bg-white/60'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
