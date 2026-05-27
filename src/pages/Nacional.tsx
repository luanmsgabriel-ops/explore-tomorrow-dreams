import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { DestinationCard } from '@/components/DestinationCard';
import { useDestinations } from '@/hooks/useDestinations';
import { MapPin, Loader2 } from 'lucide-react';

const Nacional = () => {
  const { destinations, isLoading } = useDestinations('nacional');

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="pt-32 pb-16 md:pt-40 md:pb-20">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6">
              <MapPin className="w-4 h-4 text-accent" />
              <span className="text-sm font-medium text-accent">Brasil</span>
            </div>
            <h1 className="font-serif text-4xl md:text-6xl font-bold text-foreground mb-4">
              Destinos <span className="gradient-text-gold">Nacionais</span>
            </h1>
            <p className="text-muted-foreground text-lg md:text-xl max-w-2xl">
              As joias mais preciosas do Brasil. Praias paradisíacas, cachoeiras espetaculares e paisagens que vão te surpreender.
            </p>
          </div>
        </div>
      </section>

      {/* Grid */}
      <section className="pb-20">
        <div className="container mx-auto px-4 lg:px-8">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : destinations.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              Nenhum destino encontrado nesta categoria.
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {destinations.map((destination) => (
                <DestinationCard key={destination.id} {...destination} />
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Nacional;
