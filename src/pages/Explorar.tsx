import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { DestinationCard } from '@/components/DestinationCard';
import { useDestinations } from '@/hooks/useDestinations';
import { Compass, Loader2 } from 'lucide-react';

const Explorar = () => {
  const { destinations, isLoading } = useDestinations('explorar');

  return (
    <div className="min-h-screen bg-cover bg-center bg-no-repeat bg-fixed" style={{ backgroundImage: "url('/images/hero-worldmap-bg.png')" }}>
      <Header />

      {/* Hero */}
      <section className="pt-32 pb-16 md:pt-40 md:pb-20 relative">
        <div className="container mx-auto px-4 lg:px-8 relative z-10">
          <div className="max-w-3xl bg-black/50 backdrop-blur-md rounded-2xl p-8 border border-gold/20">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-gold mb-6">
              <Compass className="w-4 h-4 text-gold-light" />
              <span className="text-sm font-medium text-gold-light">Experiências Únicas</span>
            </div>
            <h1 className="font-serif text-4xl md:text-6xl font-bold mb-4">
              <span className="text-gold-embossed">Explorar</span>
            </h1>
            <p className="text-white text-lg md:text-xl max-w-2xl">
              Destinos incríveis para todos os perfis de viajante. Descubra o mundo com a ajuda da nossa IA.
            </p>
          </div>
        </div>
      </section>

      {/* Grid */}
      <section className="pb-20 relative">
        <div className="container mx-auto px-4 lg:px-8 relative z-10">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-gold" />
            </div>
          ) : destinations.length === 0 ? (
            <div className="text-center py-20 text-white bg-black/40 backdrop-blur-sm rounded-2xl border border-gold/10">
              Nenhum destino encontrado nesta categoria.
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {destinations.map((destination) => (
                <div key={destination.id} className="transition-transform duration-300 hover:scale-[1.02]">
                  <DestinationCard {...destination} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Explorar;
