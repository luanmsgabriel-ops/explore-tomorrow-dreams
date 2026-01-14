import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { X, ChevronLeft, ChevronRight, Tag, Clock, Check } from 'lucide-react';
import { Link } from 'react-router-dom';

interface PromotionalOffer {
  id: string;
  destination_id: string;
  title: string;
  total_price: number;
  cash_price: number | null;
  installments: number | null;
  installment_value: number | null;
  inclusions: string[];
  valid_until: string;
  promo_image_url: string | null;
  destinations: {
    name: string;
    slug: string;
    image_url: string | null;
  };
}

export const PromotionalCarousel = () => {
  const [offers, setOffers] = useState<PromotionalOffer[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [hasBeenShown, setHasBeenShown] = useState(false);

  useEffect(() => {
    // Check if popup was already shown in this session
    const shown = sessionStorage.getItem('promo-popup-shown');
    if (shown) {
      setHasBeenShown(true);
      return;
    }

    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    try {
      const { data, error } = await supabase
        .from('promotional_offers')
        .select(`
          *,
          destinations (
            name,
            slug,
            image_url
          )
        `)
        .eq('is_active', true)
        .gte('valid_until', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        setOffers(data as PromotionalOffer[]);
        // Show popup after a short delay
        setTimeout(() => {
          setIsVisible(true);
          sessionStorage.setItem('promo-popup-shown', 'true');
          setHasBeenShown(true);
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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getTimeRemaining = (validUntil: string) => {
    const now = new Date();
    const end = new Date(validUntil);
    const diff = end.getTime() - now.getTime();
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) {
      return `${days} dia${days > 1 ? 's' : ''} restante${days > 1 ? 's' : ''}`;
    }
    return `${hours} hora${hours > 1 ? 's' : ''} restante${hours > 1 ? 's' : ''}`;
  };

  if (!isVisible || offers.length === 0) return null;

  const currentOffer = offers[currentIndex];
  const backgroundImage = currentOffer.promo_image_url || currentOffer.destinations?.image_url;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-4xl bg-card rounded-2xl overflow-hidden shadow-2xl">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Navigation arrows */}
        {offers.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}

        {/* Content */}
        <div className="relative">
          {/* Background Image */}
          <div className="relative h-64 md:h-80">
            {backgroundImage ? (
              <img
                src={backgroundImage}
                alt={currentOffer.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary to-accent" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-card via-card/50 to-transparent" />
            
            {/* Badge */}
            <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent text-accent-foreground text-sm font-medium">
              <Tag className="w-4 h-4" />
              Oferta Especial
            </div>

            {/* Timer */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/50 text-white text-sm">
              <Clock className="w-4 h-4" />
              {getTimeRemaining(currentOffer.valid_until)}
            </div>
          </div>

          {/* Details */}
          <div className="p-6 md:p-8 -mt-16 relative z-10">
            <h3 className="font-serif text-2xl md:text-3xl font-bold text-foreground mb-2">
              {currentOffer.title}
            </h3>
            <p className="text-muted-foreground mb-4">
              {currentOffer.destinations?.name}
            </p>

            {/* Pricing */}
            <div className="flex flex-wrap items-end gap-4 mb-6">
              <div>
                <span className="text-sm text-muted-foreground">A partir de</span>
                <p className="text-3xl md:text-4xl font-bold gradient-text-gold">
                  {formatCurrency(currentOffer.total_price)}
                </p>
              </div>
              
              {currentOffer.cash_price && (
                <div className="px-3 py-1.5 rounded-lg bg-green-500/10 text-green-400 text-sm">
                  À vista: {formatCurrency(currentOffer.cash_price)}
                </div>
              )}
              
              {currentOffer.installments && currentOffer.installment_value && (
                <div className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-sm">
                  ou {currentOffer.installments}x de {formatCurrency(currentOffer.installment_value)}
                </div>
              )}
            </div>

            {/* Inclusions */}
            {currentOffer.inclusions && currentOffer.inclusions.length > 0 && (
              <div className="mb-6">
                <p className="text-sm font-medium text-foreground mb-2">Incluso no pacote:</p>
                <div className="flex flex-wrap gap-2">
                  {currentOffer.inclusions.map((inclusion, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-secondary text-sm text-foreground"
                    >
                      <Check className="w-3 h-3 text-primary" />
                      {inclusion}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* CTA */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                to={`/destino/${currentOffer.destinations?.slug}`}
                onClick={handleClose}
                className="flex-1 btn-gold text-center"
              >
                Ver Destino
              </Link>
              <button
                onClick={handleClose}
                className="flex-1 px-6 py-3 rounded-xl border border-border text-foreground hover:bg-secondary transition-colors"
              >
                Ver depois
              </button>
            </div>
          </div>
        </div>

        {/* Pagination dots */}
        {offers.length > 1 && (
          <div className="flex justify-center gap-2 pb-4">
            {offers.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  idx === currentIndex ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
