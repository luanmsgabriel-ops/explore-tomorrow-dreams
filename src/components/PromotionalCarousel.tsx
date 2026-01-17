import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { X, ChevronLeft, ChevronRight, Clock, Sparkles, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

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
    <div className="flex flex-col items-center gap-1">
      <span className="text-xs sm:text-sm text-white/80 font-medium">Oferta expira em:</span>
      <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-5 py-2 sm:py-3 rounded-xl bg-black/70 backdrop-blur-md text-white">
        <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-accent" />
        <div className="flex items-center gap-0.5 sm:gap-1">
          {days > 0 && (
            <>
              <div className="flex flex-col items-center min-w-[32px] sm:min-w-[40px]">
                <span className="text-lg sm:text-2xl font-bold tabular-nums">{String(days).padStart(2, '0')}</span>
                <span className="text-[8px] sm:text-[10px] uppercase tracking-wider text-white/70">dias</span>
              </div>
              <span className="text-lg sm:text-2xl font-light text-white/50 mx-0.5 sm:mx-1">:</span>
            </>
          )}
          <div className="flex flex-col items-center min-w-[32px] sm:min-w-[40px]">
            <span className="text-lg sm:text-2xl font-bold tabular-nums">{String(hours).padStart(2, '0')}</span>
            <span className="text-[8px] sm:text-[10px] uppercase tracking-wider text-white/70">hrs</span>
          </div>
          <span className="text-lg sm:text-2xl font-light text-white/50 mx-0.5 sm:mx-1">:</span>
          <div className="flex flex-col items-center min-w-[32px] sm:min-w-[40px]">
            <span className="text-lg sm:text-2xl font-bold tabular-nums">{String(minutes).padStart(2, '0')}</span>
            <span className="text-[8px] sm:text-[10px] uppercase tracking-wider text-white/70">min</span>
          </div>
          <span className="text-lg sm:text-2xl font-light text-white/50 mx-0.5 sm:mx-1">:</span>
          <div className="flex flex-col items-center min-w-[32px] sm:min-w-[40px]">
            <span className="text-lg sm:text-2xl font-bold tabular-nums animate-pulse">{String(seconds).padStart(2, '0')}</span>
            <span className="text-[8px] sm:text-[10px] uppercase tracking-wider text-white/70">seg</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export const PromotionalCarousel = () => {
  const [offers, setOffers] = useState<PromotionalOffer[]>([]);
  const [totalOffers, setTotalOffers] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const navigate = useNavigate();

  // Total slides = offers + 1 (for "view more" slide)
  const totalSlides = offers.length + 1;
  const isViewMoreSlide = currentIndex === offers.length;

  useEffect(() => {
    const shown = sessionStorage.getItem('promo-popup-shown');
    if (shown) {
      return;
    }

    fetchOffers();
  }, []);

  // Auto-scroll effect
  useEffect(() => {
    if (!isVisible || isPaused || offers.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => {
        // Loop back to first offer after "view more" slide
        if (prev >= offers.length) {
          return 0;
        }
        return prev + 1;
      });
    }, 5000); // 5 seconds per slide

    return () => clearInterval(interval);
  }, [isVisible, isPaused, offers.length]);

  const fetchOffers = async () => {
    try {
      // First get total count of active offers
      const { count, error: countError } = await supabase
        .from('promotional_offers')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)
        .gte('valid_until', new Date().toISOString());

      if (countError) {
        console.error('Error counting offers:', countError);
      } else {
        setTotalOffers(count || 0);
      }

      // Then fetch only the 3 most recent
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
        .order('created_at', { ascending: false })
        .limit(3);

      if (error) {
        console.error('Error fetching promotional offers:', error);
        throw error;
      }

      console.log('Promotional offers found:', data?.length || 0, 'of', count || 0, 'total');

      if (data && data.length > 0) {
        setOffers(data as PromotionalOffer[]);
        setIsVisible(true);
        sessionStorage.setItem('promo-popup-shown', 'true');
      }
    } catch (error) {
      console.error('Error fetching offers:', error);
    }
  };

  const handleViewAllOffers = () => {
    handleClose();
    navigate('/explorar?ofertas=true');
  };

  const handleClose = () => {
    setIsVisible(false);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? totalSlides - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev >= totalSlides - 1 ? 0 : prev + 1));
  };

  if (!isVisible || offers.length === 0) return null;

  const currentOffer = !isViewMoreSlide ? offers[currentIndex] : null;
  const destinationImage = currentOffer?.destinations?.image_url;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      {/* Close button - Fixed top right corner */}
      <button
        onClick={handleClose}
        className="fixed top-2 right-2 sm:top-4 sm:right-4 z-[60] p-2 sm:p-3 rounded-full bg-black/60 hover:bg-black/80 text-white transition-colors border border-white/20 backdrop-blur-sm"
        aria-label="Fechar"
      >
        <X className="w-5 h-5 sm:w-6 sm:h-6" />
      </button>

      <div 
        className="relative w-full max-w-lg max-h-[95vh] overflow-y-auto"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >

        {/* Card */}
        <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl">
          {/* Background Image or View More Slide */}
          <div className="relative min-h-[70vh] sm:min-h-0 sm:aspect-[3/4]">
            {isViewMoreSlide ? (
              // View More Slide
              <div className="w-full h-full bg-gradient-to-br from-primary via-primary/80 to-accent flex flex-col items-center justify-center p-6 sm:p-10">
                <Sparkles className="w-16 h-16 sm:w-20 sm:h-20 text-white/90 mb-6" />
                <h3 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-white text-center mb-4">
                  Mais Ofertas
                </h3>
                <p className="text-white/90 text-center text-lg sm:text-xl mb-8 max-w-sm">
                  Descubra todas as {totalOffers} ofertas exclusivas disponíveis para você
                </p>
                <button
                  onClick={handleViewAllOffers}
                  className="btn-gold text-lg sm:text-xl py-4 px-8 flex items-center gap-3"
                >
                  Ver Todas as Ofertas
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            ) : (
              // Offer Slide
              <>
                {destinationImage ? (
                  <img
                    src={destinationImage}
                    alt={currentOffer?.destinations?.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary to-accent" />
                )}
                
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

                {/* Badge */}
                <div className="absolute top-3 left-3 sm:top-4 sm:left-4 flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-accent text-accent-foreground text-xs sm:text-sm font-semibold shadow-lg">
                  <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
                  Oferta Imperdível
                </div>

                {/* Content overlay */}
                <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6 space-y-3 sm:space-y-4">
                  {/* Timer */}
                  {currentOffer && (
                    <div className="flex justify-center">
                      <CountdownTimer validUntil={currentOffer.valid_until} />
                    </div>
                  )}

                  {/* Destination name */}
                  <h3 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-white text-center drop-shadow-lg">
                    {currentOffer?.destinations?.name}
                  </h3>

                  {/* Tagline */}
                  {currentOffer?.tagline && (
                    <p className="text-white/90 text-center text-sm sm:text-lg leading-relaxed max-w-sm mx-auto line-clamp-3">
                      {currentOffer.tagline}
                    </p>
                  )}

                  {/* CTA Buttons */}
                  <div className="flex flex-col gap-2 sm:gap-3 pt-1 sm:pt-2">
                    <Link
                      to={`/promocao/${currentOffer?.id}`}
                      onClick={handleClose}
                      className="w-full btn-gold text-center text-base sm:text-lg py-3 sm:py-4"
                    >
                      Ver Detalhes da Oferta
                    </Link>
                    <button
                      onClick={handleClose}
                      className="w-full px-6 py-2 sm:py-3 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors text-xs sm:text-sm"
                    >
                      Ver depois
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Navigation arrows - always visible */}
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
          </div>
        </div>

        {/* Pagination dots - includes view more slide */}
        <div className="flex justify-center gap-2 mt-4">
          {Array.from({ length: totalSlides }).map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`h-2.5 rounded-full transition-all ${
                idx === currentIndex ? 'bg-white w-6' : 'bg-white/40 hover:bg-white/60 w-2.5'
              }`}
            />
          ))}
        </div>

        {/* Progress bar for auto-scroll */}
        {!isPaused && (
          <div className="mt-2 mx-auto max-w-xs">
            <div className="h-1 bg-white/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-accent rounded-full animate-[progress_5s_linear_infinite]"
                style={{ 
                  animation: 'progress 5s linear infinite',
                }}
              />
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes progress {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </div>
  );
};
