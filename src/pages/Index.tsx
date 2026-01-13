import { Header } from '@/components/Header';
import { HeroSection } from '@/components/HeroSection';
import { DestinationCarousel } from '@/components/DestinationCarousel';
import { Footer } from '@/components/Footer';
import { useDestinations } from '@/hooks/useDestinations';
import { Compass, Globe, MapPin, Sparkles, Play, MessageCircle, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const Index = () => {
  const { destinations: explorarDestinations, isLoading: loadingExplorar } = useDestinations('explorar');
  const { destinations: nacionalDestinations, isLoading: loadingNacional } = useDestinations('nacional');
  const { destinations: internacionalDestinations, isLoading: loadingInternacional } = useDestinations('internacional');

  const isLoading = loadingExplorar || loadingNacional || loadingInternacional;

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
            <Link to="/explorar" className="group p-8 rounded-2xl bg-gradient-to-br from-secondary to-background border border-border hover:border-primary/50 transition-all duration-300">
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Compass className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-serif text-2xl font-bold text-foreground mb-3">Explorar</h3>
              <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                Destinos fora do comum e experiências que poucos conhecem. Para os verdadeiros exploradores.
              </p>
              <span className="text-primary text-sm font-medium group-hover:underline">Ver destinos →</span>
            </Link>

            <Link to="/nacional" className="group p-8 rounded-2xl bg-gradient-to-br from-secondary to-background border border-border hover:border-accent/50 transition-all duration-300">
              <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <MapPin className="w-7 h-7 text-accent" />
              </div>
              <h3 className="font-serif text-2xl font-bold text-foreground mb-3">Nacional</h3>
              <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                As joias escondidas do Brasil. Praias paradisíacas, cachoeiras e paisagens de tirar o fôlego.
              </p>
              <span className="text-accent text-sm font-medium group-hover:underline">Ver destinos →</span>
            </Link>

            <Link to="/internacional" className="group p-8 rounded-2xl bg-gradient-to-br from-secondary to-background border border-border hover:border-teal-light/50 transition-all duration-300">
              <div className="w-14 h-14 rounded-xl bg-teal-light/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Globe className="w-7 h-7 text-teal-light" />
              </div>
              <h3 className="font-serif text-2xl font-bold text-foreground mb-3">Internacional</h3>
              <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                Os melhores destinos do mundo. Culturas, paisagens e experiências que vão além das fronteiras.
              </p>
              <span className="text-teal-light text-sm font-medium group-hover:underline">Ver destinos →</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Carousels */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {explorarDestinations.length > 0 && (
            <DestinationCarousel
              title="Explorar"
              destinations={explorarDestinations}
              accentColor="teal"
            />
          )}

          {nacionalDestinations.length > 0 && (
            <DestinationCarousel
              title="Brasil"
              destinations={nacionalDestinations}
              accentColor="gold"
            />
          )}

          {internacionalDestinations.length > 0 && (
            <DestinationCarousel
              title="Internacional"
              destinations={internacionalDestinations}
              accentColor="teal"
            />
          )}
        </>
      )}

      {/* Features Section */}
      <section className="py-20 border-t border-border">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-4">
              Por que escolher a <span className="gradient-text-teal">Tomorrow Travel</span>?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center p-6">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-serif text-lg font-bold text-foreground mb-2">Roteiros com IA</h3>
              <p className="text-muted-foreground text-sm">
                Crie roteiros personalizados em segundos com nossa inteligência artificial.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
                <Play className="w-8 h-8 text-accent" />
              </div>
              <h3 className="font-serif text-lg font-bold text-foreground mb-2">Vídeos Imersivos</h3>
              <p className="text-muted-foreground text-sm">
                Explore os destinos antes de viajar com vídeos selecionados especialmente.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 rounded-2xl bg-teal-light/10 flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-8 h-8 text-teal-light" />
              </div>
              <h3 className="font-serif text-lg font-bold text-foreground mb-2">Chat Inteligente</h3>
              <p className="text-muted-foreground text-sm">
                Tire dúvidas sobre qualquer destino com nosso assistente virtual 24/7.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 rounded-2xl bg-gold/10 flex items-center justify-center mx-auto mb-4">
                <Globe className="w-8 h-8 text-gold" />
              </div>
              <h3 className="font-serif text-lg font-bold text-foreground mb-2">Curadoria Premium</h3>
              <p className="text-muted-foreground text-sm">
                Destinos selecionados por especialistas para experiências únicas.
              </p>
            </div>
          </div>
        </div>
      </section>

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
              <Link to="/explorar" className="btn-gold flex items-center gap-2">
                <Compass className="w-5 h-5" />
                Explorar Destinos
              </Link>
              <Link to="/nacional" className="btn-outline">
                Ver Brasil
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
