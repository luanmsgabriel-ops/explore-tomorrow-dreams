import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Link } from 'react-router-dom';
import { Clock, Sparkles, MapPin, Filter, X, SlidersHorizontal, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

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
  promo_image_url: string | null;
  inclusions: string[];
  departure_date: string | null;
  return_date: string | null;
  destinations: {
    id: string;
    name: string;
    slug: string;
    image_url: string | null;
    location: string;
    type: string;
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

const CountdownBadge = ({ validUntil }: { validUntil: string }) => {
  const { days, hours, minutes, expired } = useCountdown(validUntil);

  if (expired) {
    return (
      <span className="px-3 py-1 rounded-full bg-destructive/90 text-white text-xs font-medium">
        Expirada
      </span>
    );
  }

  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/70 backdrop-blur-sm text-white text-xs font-medium">
      <Clock className="w-3 h-3" />
      {days > 0 ? `${days}d ${hours}h` : `${hours}h ${minutes}m`}
    </div>
  );
};

const OfferCard = ({ offer }: { offer: PromotionalOffer }) => {
  const imageUrl = offer.promo_image_url || offer.destinations?.image_url;

  return (
    <Link 
      to={`/promocao/${offer.id}`}
      className="group relative bg-card rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={offer.destinations?.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary to-accent" />
        )}
        
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

        {/* Badge */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent text-accent-foreground text-xs font-semibold shadow-lg">
          <Sparkles className="w-3 h-3" />
          Oferta
        </div>

        {/* Countdown */}
        <div className="absolute top-3 right-3">
          <CountdownBadge validUntil={offer.valid_until} />
        </div>

        {/* Destination name on image */}
        <div className="absolute bottom-3 left-3 right-3">
          <h3 className="font-serif text-xl font-bold text-white drop-shadow-lg">
            {offer.destinations?.name}
          </h3>
          <div className="flex items-center gap-1 text-white/80 text-sm">
            <MapPin className="w-3 h-3" />
            {offer.destinations?.location}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        <h4 className="font-semibold text-foreground line-clamp-1">{offer.title}</h4>
        
        {offer.tagline && (
          <p className="text-sm text-muted-foreground line-clamp-2">{offer.tagline}</p>
        )}

        {/* Travel dates */}
        {(offer.departure_date || offer.return_date) && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4 text-primary" />
            <span>
              {offer.departure_date && new Date(offer.departure_date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
              {offer.departure_date && offer.return_date && ' - '}
              {offer.return_date && new Date(offer.return_date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
            </span>
          </div>
        )}

        {/* Inclusions preview */}
        {offer.inclusions && offer.inclusions.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {offer.inclusions.slice(0, 3).map((inclusion, idx) => (
              <span 
                key={idx}
                className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-xs"
              >
                {inclusion}
              </span>
            ))}
            {offer.inclusions.length > 3 && (
              <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-xs">
                +{offer.inclusions.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Price */}
        <div className="pt-2 border-t border-border">
          <div className="flex items-end justify-between">
            <div>
              <span className="text-xs text-muted-foreground">A partir de</span>
              <div className="text-2xl font-bold text-primary">
                R$ {offer.total_price.toLocaleString('pt-BR')}
              </div>
            </div>
            {offer.installments && offer.installment_value && (
              <div className="text-right text-sm text-muted-foreground">
                ou {offer.installments}x de R$ {offer.installment_value.toLocaleString('pt-BR')}
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};

const Ofertas = () => {
  const [offers, setOffers] = useState<PromotionalOffer[]>([]);
  const [filteredOffers, setFilteredOffers] = useState<PromotionalOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [destinations, setDestinations] = useState<{ id: string; name: string }[]>([]);
  
  // Filters
  const [selectedDestination, setSelectedDestination] = useState<string>('all');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 50000]);
  const [sortBy, setSortBy] = useState<string>('newest');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const maxPrice = 50000;

  useEffect(() => {
    fetchOffers();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [offers, selectedDestination, priceRange, sortBy]);

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
          promo_image_url,
          inclusions,
          departure_date,
          return_date,
          destinations (
            id,
            name,
            slug,
            image_url,
            location,
            type
          )
        `)
        .eq('is_active', true)
        .gte('valid_until', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        setOffers(data as PromotionalOffer[]);
        
        // Extract unique destinations
        const uniqueDestinations = Array.from(
          new Map(
            data
              .filter(o => o.destinations)
              .map(o => [o.destinations.id, { id: o.destinations.id, name: o.destinations.name }])
          ).values()
        );
        setDestinations(uniqueDestinations);
      }
    } catch (error) {
      console.error('Error fetching offers:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let result = [...offers];

    // Filter by destination
    if (selectedDestination !== 'all') {
      result = result.filter(o => o.destination_id === selectedDestination);
    }

    // Filter by price range
    result = result.filter(o => o.total_price >= priceRange[0] && o.total_price <= priceRange[1]);

    // Sort
    switch (sortBy) {
      case 'newest':
        // Already sorted by created_at desc
        break;
      case 'price-asc':
        result.sort((a, b) => a.total_price - b.total_price);
        break;
      case 'price-desc':
        result.sort((a, b) => b.total_price - a.total_price);
        break;
      case 'expiring':
        result.sort((a, b) => new Date(a.valid_until).getTime() - new Date(b.valid_until).getTime());
        break;
    }

    setFilteredOffers(result);
  };

  const clearFilters = () => {
    setSelectedDestination('all');
    setPriceRange([0, maxPrice]);
    setSortBy('newest');
  };

  const hasActiveFilters = selectedDestination !== 'all' || priceRange[0] > 0 || priceRange[1] < maxPrice;

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Destination filter */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Destino</label>
        <Select value={selectedDestination} onValueChange={setSelectedDestination}>
          <SelectTrigger>
            <SelectValue placeholder="Todos os destinos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os destinos</SelectItem>
            {destinations.map(dest => (
              <SelectItem key={dest.id} value={dest.id}>{dest.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Price range filter */}
      <div className="space-y-4">
        <label className="text-sm font-medium text-foreground">Faixa de Preço</label>
        <div className="px-2">
          <Slider
            value={priceRange}
            onValueChange={(value) => setPriceRange(value as [number, number])}
            max={maxPrice}
            step={500}
            className="w-full"
          />
        </div>
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>R$ {priceRange[0].toLocaleString('pt-BR')}</span>
          <span>R$ {priceRange[1].toLocaleString('pt-BR')}</span>
        </div>
      </div>

      {/* Sort */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Ordenar por</label>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Mais recentes</SelectItem>
            <SelectItem value="price-asc">Menor preço</SelectItem>
            <SelectItem value="price-desc">Maior preço</SelectItem>
            <SelectItem value="expiring">Expirando em breve</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Clear filters */}
      {hasActiveFilters && (
        <Button 
          variant="outline" 
          className="w-full"
          onClick={clearFilters}
        >
          <X className="w-4 h-4 mr-2" />
          Limpar filtros
        </Button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-cover bg-center bg-no-repeat bg-fixed" style={{ backgroundImage: "url('/images/hero-worldmap-bg.png')" }}>
      <Header />
      
      <main className="flex-1 relative">
        {/* Hero section */}
        <section className="relative py-16 sm:py-24">
          <div className="container mx-auto px-4 text-center relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-gold mb-6">
              <Sparkles className="w-4 h-4 text-gold-light" />
              <span className="text-sm font-medium text-gold-light">Ofertas Exclusivas</span>
            </div>
            <div className="max-w-3xl mx-auto bg-black/50 backdrop-blur-md rounded-2xl p-8 border border-gold/20">
              <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-bold mb-4">
                <span className="text-gold-embossed">Ofertas</span> Imperdíveis
              </h1>
              <p className="text-lg text-white max-w-2xl mx-auto">
                Descubra pacotes promocionais incríveis para os destinos mais desejados. 
                Ofertas por tempo limitado!
              </p>
            </div>
          </div>
        </section>

        {/* Filters and offers grid */}
        <section className="py-12 relative z-10">
          <div className="container mx-auto px-4">
            {/* Mobile filter button */}
            <div className="lg:hidden mb-6">
              <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" className="w-full bg-black/60 backdrop-blur-md border-gold/30 text-gold-light">
                    <SlidersHorizontal className="w-4 h-4 mr-2" />
                    Filtros
                    {hasActiveFilters && (
                      <span className="ml-2 px-2 py-0.5 rounded-full bg-gold text-ocean-deep text-xs font-bold">
                        Ativos
                      </span>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80 bg-ocean-deep border-gold/20">
                  <SheetHeader>
                    <SheetTitle className="text-gold">Filtros</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6">
                    <FilterContent />
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            <div className="flex gap-8">
              {/* Desktop filters sidebar */}
              <aside className="hidden lg:block w-72 flex-shrink-0">
                <div className="sticky top-24 bg-black/60 backdrop-blur-md rounded-xl p-6 shadow-xl border border-gold/20">
                  <div className="flex items-center gap-2 mb-6">
                    <Filter className="w-5 h-5 text-gold-light" />
                    <h2 className="font-semibold text-gold-light">Filtros</h2>
                  </div>
                  <FilterContent />
                </div>
              </aside>

              {/* Offers grid */}
              <div className="flex-1">
                {/* Results count */}
                <div className="flex items-center justify-between mb-6 bg-black/40 backdrop-blur-sm px-4 py-2 rounded-lg border border-gold/10 inline-block">
                  <p className="text-gold-light/80 text-sm">
                    {filteredOffers.length} {filteredOffers.length === 1 ? 'oferta encontrada' : 'ofertas encontradas'}
                  </p>
                </div>

                {loading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                      <div key={i} className="animate-pulse card-gold-border bg-black/40">
                        <div className="aspect-[4/3] bg-gold/10 rounded-t-2xl" />
                        <div className="p-4 space-y-3">
                          <div className="h-5 bg-gold/10 rounded w-3/4" />
                          <div className="h-4 bg-gold/10 rounded w-full" />
                          <div className="h-8 bg-gold/10 rounded w-1/2" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : filteredOffers.length === 0 ? (
                  <div className="text-center py-16 bg-black/40 backdrop-blur-sm rounded-2xl border border-gold/10">
                    <Sparkles className="w-16 h-16 text-gold/30 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">
                      Nenhuma oferta encontrada
                    </h3>
                    <p className="text-white/60 mb-6">
                      Tente ajustar os filtros para encontrar ofertas
                    </p>
                    {hasActiveFilters && (
                      <Button variant="outline" onClick={clearFilters} className="border-gold/50 text-gold-light hover:bg-gold/10">
                        Limpar filtros
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredOffers.map(offer => (
                      <div key={offer.id} className="transition-transform duration-300 hover:scale-[1.02]">
                        <OfferCard offer={offer} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Ofertas;
