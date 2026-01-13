import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { DestinationCard } from '@/components/DestinationCard';
import { getDestinationsByType } from '@/data/destinations';
import { Compass } from 'lucide-react';

const Explorar = () => {
  const destinations = getDestinationsByType('explorar');

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="pt-32 pb-16 md:pt-40 md:pb-20">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6">
              <Compass className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Experiências Únicas</span>
            </div>
            <h1 className="font-serif text-4xl md:text-6xl font-bold text-foreground mb-4">
              <span className="gradient-text-teal">Explorar</span>
            </h1>
            <p className="text-muted-foreground text-lg md:text-xl max-w-2xl">
              Destinos fora do comum e experiências exclusivas para viajantes que buscam o extraordinário.
            </p>
          </div>
        </div>
      </section>

      {/* Grid */}
      <section className="pb-20">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {destinations.map((destination) => (
              <DestinationCard key={destination.id} {...destination} />
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Explorar;
