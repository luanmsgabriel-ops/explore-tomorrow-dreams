import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ArrowLeft, Clock, Check, MapPin, Calendar, Users, Loader2, Plane } from 'lucide-react';
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
  inclusions: string[];
  valid_until: string;
  departure_date: string | null;
  return_date: string | null;
  destinations: {
    name: string;
    slug: string;
    location: string;
    image_url: string | null;
    description: string;
    best_time: string;
    ideal_duration: string;
    for_who: string;
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

const CountdownDisplay = ({ validUntil }: { validUntil: string }) => {
  const { days, hours, minutes, seconds, expired } = useCountdown(validUntil);

  if (expired) {
    return (
      <div className="flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-destructive/10 text-destructive">
        <Clock className="w-5 h-5" />
        <span className="font-medium">Esta oferta expirou</span>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-accent/20 to-primary/20 rounded-2xl p-6">
      <p className="text-center text-sm text-muted-foreground mb-3 flex items-center justify-center gap-2">
        <Clock className="w-4 h-4" />
        Oferta termina em:
      </p>
      <div className="flex justify-center gap-3 md:gap-6">
        {[
          { value: days, label: 'Dias' },
          { value: hours, label: 'Horas' },
          { value: minutes, label: 'Min' },
          { value: seconds, label: 'Seg' },
        ].map((item, idx) => (
          <div key={idx} className="flex flex-col items-center">
            <div className="bg-card border border-border rounded-xl w-14 h-14 md:w-16 md:h-16 flex items-center justify-center shadow-lg">
              <span className={`text-2xl md:text-3xl font-bold text-foreground tabular-nums ${item.label === 'Seg' ? 'animate-pulse' : ''}`}>
                {String(item.value).padStart(2, '0')}
              </span>
            </div>
            <span className="text-xs text-muted-foreground mt-1 uppercase tracking-wider">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const PromocaoDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [offer, setOffer] = useState<PromotionalOffer | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchOffer();
    }
  }, [id]);

  const fetchOffer = async () => {
    try {
      const { data, error } = await supabase
        .from('promotional_offers')
        .select(`
          *,
          destinations (
            name,
            slug,
            location,
            image_url,
            description,
            best_time,
            ideal_duration,
            for_who
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      setOffer(data as PromotionalOffer);
      trackEventStandalone('offer_view', {
        offer_id: data.id,
        offer_title: data.title,
        destination_name: (data as any).destinations?.name,
        source: 'detail_page',
      });
    } catch (error) {
      console.error('Error fetching offer:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!offer) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Oferta não encontrada</h1>
          <Link to="/" className="text-primary hover:underline">
            Voltar para a página inicial
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const destination = offer.destinations;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main>
        {/* Hero Section */}
        <section className="relative h-[50vh] md:h-[60vh]">
          {destination?.image_url ? (
            <img
              src={destination.image_url}
              alt={destination.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary to-accent" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
          
          {/* Back button */}
          <Link
            to="/"
            className="absolute top-24 left-4 md:left-8 flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Link>

          {/* Content */}
          <div className="absolute inset-x-0 bottom-0 p-6 md:p-12">
            <div className="container mx-auto max-w-5xl">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent text-accent-foreground text-sm font-semibold mb-4">
                Oferta Promocional
              </div>
              <h1 className="font-serif text-3xl md:text-5xl font-bold text-white mb-2 drop-shadow-lg">
                {offer.title}
              </h1>
              {destination && (
                <div className="flex items-center gap-2 text-white/80">
                  <MapPin className="w-4 h-4" />
                  <span>{destination.name}, {destination.location}</span>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Details Section */}
        <section className="py-12 md:py-16">
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Main content */}
              <div className="lg:col-span-2 space-y-8">
                {/* Tagline */}
                {offer.tagline && (
                  <div className="p-6 rounded-2xl bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20">
                    <p className="text-lg md:text-xl text-foreground leading-relaxed">
                      {offer.tagline}
                    </p>
                  </div>
                )}

                {/* Countdown */}
                <CountdownDisplay validUntil={offer.valid_until} />

                {/* Travel Dates */}
                {(offer.departure_date || offer.return_date) && (
                  <div className="p-4 rounded-2xl bg-secondary border border-border">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Plane className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Datas da viagem</span>
                        <p className="text-lg font-semibold text-foreground">
                          {offer.departure_date && new Date(offer.departure_date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                          {offer.departure_date && offer.return_date && ' → '}
                          {offer.return_date && new Date(offer.return_date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Inclusions */}
                {offer.inclusions && offer.inclusions.length > 0 && (
                  <div>
                    <h2 className="font-serif text-2xl font-bold text-foreground mb-4">
                      O que está incluso
                    </h2>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {offer.inclusions.map((inclusion, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-3 p-4 rounded-xl bg-secondary"
                        >
                          <div className="shrink-0 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                            <Check className="w-4 h-4 text-primary" />
                          </div>
                          <span className="text-foreground">{inclusion}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Destination Info */}
                {destination && (
                  <div>
                    <h2 className="font-serif text-2xl font-bold text-foreground mb-4">
                      Sobre o Destino
                    </h2>
                    <p className="text-muted-foreground mb-6 leading-relaxed">
                      {destination.description}
                    </p>
                    <div className="grid sm:grid-cols-3 gap-4">
                      <div className="p-4 rounded-xl bg-secondary">
                        <div className="flex items-center gap-2 text-primary mb-2">
                          <Calendar className="w-4 h-4" />
                          <span className="text-sm font-medium">Melhor Época</span>
                        </div>
                        <p className="text-foreground text-sm">{destination.best_time}</p>
                      </div>
                      <div className="p-4 rounded-xl bg-secondary">
                        <div className="flex items-center gap-2 text-primary mb-2">
                          <Clock className="w-4 h-4" />
                          <span className="text-sm font-medium">Duração Ideal</span>
                        </div>
                        <p className="text-foreground text-sm">{destination.ideal_duration}</p>
                      </div>
                      <div className="p-4 rounded-xl bg-secondary">
                        <div className="flex items-center gap-2 text-primary mb-2">
                          <Users className="w-4 h-4" />
                          <span className="text-sm font-medium">Ideal Para</span>
                        </div>
                        <p className="text-foreground text-sm">{destination.for_who}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Sidebar - Pricing */}
              <div className="lg:col-span-1">
                <div className="sticky top-24 p-6 rounded-2xl bg-card border border-border shadow-lg space-y-6">
                  <div>
                    <span className="text-sm text-muted-foreground">A partir de</span>
                    <p className="text-4xl font-bold gradient-text-gold">
                      {formatCurrency(offer.total_price)}
                    </p>
                  </div>

                  {offer.cash_price && (
                    <div className="px-4 py-3 rounded-xl bg-green-500/10 border border-green-500/20">
                      <span className="text-sm text-muted-foreground">À vista</span>
                      <p className="text-xl font-bold text-green-400">
                        {formatCurrency(offer.cash_price)}
                      </p>
                    </div>
                  )}

                  {offer.installments && offer.installment_value && (
                    <div className="px-4 py-3 rounded-xl bg-primary/10 border border-primary/20">
                      <span className="text-sm text-muted-foreground">Parcelado</span>
                      <p className="text-xl font-bold text-primary">
                        {offer.installments}x de {formatCurrency(offer.installment_value)}
                      </p>
                    </div>
                  )}

                  <div className="space-y-3 pt-4">
                    <Link
                      to={`/destino/${destination?.slug}`}
                      className="w-full btn-gold text-center block"
                    >
                      Solicitar Orçamento
                    </Link>
                    <a
                      href="https://wa.me/5511999999999"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full px-6 py-3 rounded-xl border border-border text-foreground hover:bg-secondary transition-colors flex items-center justify-center gap-2"
                    >
                      Falar no WhatsApp
                    </a>
                  </div>

                  <p className="text-xs text-center text-muted-foreground">
                    Oferta válida até {new Date(offer.valid_until).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default PromocaoDetail;
