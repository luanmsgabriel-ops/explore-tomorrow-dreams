import { Header } from '@/components/Header';
import { HeroSection } from '@/components/HeroSection';
import { DestinationCarousel } from '@/components/DestinationCarousel';
import { Footer } from '@/components/Footer';
import { getDestinationsByType } from '@/data/destinations';
import { Compass, Globe, MapPin, Sparkles } from 'lucide-react';

const Index = () => {
  const explorarDestinations = getDestinationsByType('explorar');
  const nacionalDestinations = getDestinationsByType('nacional');
  const internacionalDestinations = getDestinationsByType('internacional');

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero */}
      <HeroSection />

      {/* Categories intro */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="font-serif text-3xl md:text-5xl font-bold text-foreground mb-4">
              Descubra o <span className="gradient-text-teal">Extraordinário</span>
            </h2>
            <p className="text-muted-foreground text-lg">
              Curadoria de destinos únicos para viajantes que buscam experiências autênticas e inesquecíveis.
            </p>
          </div>

          {/* Category cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="group p-8 rounded-2xl bg-gradient-to-br from-secondary to-background border border-border hover:border-primary/50 transition-all duration-300">
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Compass className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-serif text-2xl font-bold text-foreground mb-3">Explorar</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Destinos fora do comum e experiências que poucos conhecem. Para os verdadeiros exploradores.
              </p>
            </div>

            <div className="group p-8 rounded-2xl bg-gradient-to-br from-secondary to-background border border-border hover:border-accent/50 transition-all duration-300">
              <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <MapPin className="w-7 h-7 text-accent" />
              </div>
              <h3 className="font-serif text-2xl font-bold text-foreground mb-3">Nacional</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                As joias escondidas do Brasil. Praias paradisíacas, cachoeiras e paisagens de tirar o fôlego.
              </p>
            </div>

            <div className="group p-8 rounded-2xl bg-gradient-to-br from-secondary to-background border border-border hover:border-teal-light/50 transition-all duration-300">
              <div className="w-14 h-14 rounded-xl bg-teal-light/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Globe className="w-7 h-7 text-teal-light" />
              </div>
              <h3 className="font-serif text-2xl font-bold text-foreground mb-3">Internacional</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Os melhores destinos do mundo. Culturas, paisagens e experiências que vão além das fronteiras.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Carousels */}
      <DestinationCarousel
        title="Explorar"
        destinations={explorarDestinations}
        accentColor="teal"
      />

      <DestinationCarousel
        title="Brasil"
        destinations={nacionalDestinations}
        accentColor="gold"
      />

      <DestinationCarousel
        title="Internacional"
        destinations={internacionalDestinations}
        accentColor="teal"
      />

      {/* CTA Section */}
      <section className="py-20 md:py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-accent/10" />
        <div className="container mx-auto px-4 lg:px-8 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6">
              <Sparkles className="w-4 h-4 text-accent" />
              <span className="text-sm font-medium text-accent">Powered by AI</span>
            </div>
            <h2 className="font-serif text-3xl md:text-5xl font-bold text-foreground mb-6">
              Crie seu roteiro <span className="gradient-text-gold">personalizado</span>
            </h2>
            <p className="text-muted-foreground text-lg mb-8 max-w-2xl mx-auto">
              Nossa inteligência artificial cria roteiros sob medida para você. Informe suas preferências e receba um plano de viagem exclusivo em segundos.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <button className="btn-gold flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Criar Roteiro com IA
              </button>
              <button className="btn-outline">
                Solicitar Cotação
              </button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
