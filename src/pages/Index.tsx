import { Header } from '@/components/Header';
import { ImmersiveScrollHero } from '@/components/ImmersiveScrollHero';
import { DestinationCarousel } from '@/components/DestinationCarousel';
import { PromotionalCarousel } from '@/components/PromotionalCarousel';
import { ActiveOffersCarousel } from '@/components/ActiveOffersCarousel';
import { Footer } from '@/components/Footer';
import { TeoWelcomePopup } from '@/components/TeoWelcomePopup';
import { useDestinations } from '@/hooks/useDestinations';
import { Compass, Globe, MapPin, Sparkles, Play, MessageCircle, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { DecorativeAirplane } from '@/components/DecorativeAirplane';


const Index = () => {
  const { destinations: explorarDestinations, isLoading: loadingExplorar } = useDestinations('explorar');
  const { destinations: nacionalDestinations, isLoading: loadingNacional } = useDestinations('nacional');
  const { destinations: internacionalDestinations, isLoading: loadingInternacional } = useDestinations('internacional');

  const isLoading = loadingExplorar || loadingNacional || loadingInternacional;

  return (
    <div className="min-h-screen bg-cover bg-center bg-fixed bg-no-repeat" style={{ backgroundImage: "url('/images/hero-worldmap-bg.png')" }}>
      <AnimatedWires />
      <Header />
      <TeoWelcomePopup />
      
      {/* Promotional Popup Carousel */}
      <PromotionalCarousel />
      
      {/* Hero */}
      <ImmersiveScrollHero />

      {/* Active Offers Carousel */}
      <ActiveOffersCarousel />

      {/* Section divider with airplane */}
      <div className="relative py-4">
        <div className="line-gold" />
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/50 backdrop-blur-sm px-4 rounded-full">
          <DecorativeAirplane size="sm" className="opacity-60" />
        </div>
      </div>

      {/* Discover section */}
      <section className="py-10 md:py-14 world-map-bg">
        <div className="container mx-auto px-4 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto bg-black/50 backdrop-blur-sm rounded-2xl p-8">
            <h2 className="font-serif text-3xl md:text-5xl font-bold mb-4">
              <span className="text-gold-embossed">Descubra o</span>{' '}
              <span className="gradient-text-teal">Extraordinário</span>
            </h2>
            <p className="text-white text-lg">
              Tecnologia de ponta para facilitar sua viagem. O primeiro agente de IA do mundo no setor de viagens, acessível para todos.
            </p>
          </div>
        </div>
      </section>

      {/* Carousels */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-gold" />
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

      {/* Categories Section */}
      <section className="py-16 md:py-24 world-map-bg">
        <div className="container mx-auto px-4 lg:px-8 relative z-10">
          {/* Section divider */}
          <div className="relative mb-12">
            <div className="line-gold" />
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-4">
              <Compass className="w-6 h-6 text-gold opacity-60" />
            </div>
          </div>

          {/* Category cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link to="/explorar" className="group card-gold-border p-8 transition-all duration-300 hover:scale-105 bg-black/50 backdrop-blur-sm">
              <div className="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform border border-gold/30">
                <Compass className="w-7 h-7 text-gold-light" />
              </div>
              <h3 className="font-serif text-2xl font-bold text-gold-embossed mb-3">Explorar</h3>
              <p className="text-white text-sm leading-relaxed mb-4">
                Destinos fora do comum e experiências que poucos conhecem. Para os verdadeiros exploradores.
              </p>
              <span className="text-gold-light text-sm font-medium group-hover:underline">Ver destinos →</span>
            </Link>

            <Link to="/nacional" className="group card-gold-border p-8 transition-all duration-300 hover:scale-105 bg-black/50 backdrop-blur-sm">
              <div className="w-14 h-14 rounded-xl bg-accent/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform border border-gold/30">
                <MapPin className="w-7 h-7 text-gold-light" />
              </div>
              <h3 className="font-serif text-2xl font-bold text-gold-embossed mb-3">Nacional</h3>
              <p className="text-white text-sm leading-relaxed mb-4">
                As joias escondidas do Brasil. Praias paradisíacas, cachoeiras e paisagens de tirar o fôlego.
              </p>
              <span className="text-gold-light text-sm font-medium group-hover:underline">Ver destinos →</span>
            </Link>

            <Link to="/internacional" className="group card-gold-border p-8 transition-all duration-300 hover:scale-105 bg-black/50 backdrop-blur-sm">
              <div className="w-14 h-14 rounded-xl bg-teal/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform border border-gold/30">
                <Globe className="w-7 h-7 text-teal-light" />
              </div>
              <h3 className="font-serif text-2xl font-bold text-gold-embossed mb-3">Internacional</h3>
              <p className="text-white text-sm leading-relaxed mb-4">
                Os melhores destinos do mundo. Culturas, paisagens e experiências que vão além das fronteiras.
              </p>
              <span className="text-teal-light text-sm font-medium group-hover:underline">Ver destinos →</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 border-t border-gold/20">
        <div className="container mx-auto px-4 lg:px-8 bg-black/50 backdrop-blur-sm rounded-2xl p-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4">
              <span className="text-gold-embossed">Por que escolher a</span>{' '}
              <span className="gradient-text-teal">Tomorrow Travel</span>?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center p-6 card-gold-border bg-black/50 backdrop-blur-sm">
              <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-4 border border-gold/30">
                <Sparkles className="w-8 h-8 text-gold-light" />
              </div>
              <h3 className="font-serif text-lg font-bold text-gold-embossed mb-2">Roteiros com IA</h3>
              <p className="text-white text-sm">
                Crie roteiros personalizados em segundos com nossa inteligência artificial.
              </p>
            </div>

            <div className="text-center p-6 card-gold-border bg-black/50 backdrop-blur-sm">
              <div className="w-16 h-16 rounded-2xl bg-accent/20 flex items-center justify-center mx-auto mb-4 border border-gold/30">
                <Play className="w-8 h-8 text-gold-light" />
              </div>
              <h3 className="font-serif text-lg font-bold text-gold-embossed mb-2">Vídeos Imersivos</h3>
              <p className="text-white text-sm">
                Explore os destinos antes de viajar com vídeos selecionados especialmente.
              </p>
            </div>

            <div className="text-center p-6 card-gold-border bg-black/50 backdrop-blur-sm">
              <div className="w-16 h-16 rounded-2xl bg-teal/20 flex items-center justify-center mx-auto mb-4 border border-gold/30">
                <MessageCircle className="w-8 h-8 text-teal-light" />
              </div>
              <h3 className="font-serif text-lg font-bold text-gold-embossed mb-2">Chat Inteligente</h3>
              <p className="text-white text-sm">
                Tire dúvidas sobre qualquer destino com nosso assistente virtual 24/7.
              </p>
            </div>

            <div className="text-center p-6 card-gold-border bg-black/50 backdrop-blur-sm">
              <div className="w-16 h-16 rounded-2xl bg-gold/20 flex items-center justify-center mx-auto mb-4 border border-gold/30">
                <Globe className="w-8 h-8 text-gold-light" />
              </div>
              <h3 className="font-serif text-lg font-bold text-gold-embossed mb-2">IA Pioneira no Turismo</h3>
              <p className="text-white text-sm">
                O primeiro agente de IA B2C do mundo no setor de viagens.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-32 relative overflow-hidden world-map-bg">
        <div className="container mx-auto px-4 lg:px-8 relative z-10">
          <div className="max-w-3xl mx-auto text-center bg-black/50 backdrop-blur-sm rounded-2xl p-8 md:p-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-gold mb-6">
              <Sparkles className="w-4 h-4 text-gold-light" />
              <span className="text-sm font-medium text-gold-light">Powered by AI</span>
            </div>
            <h2 className="font-serif text-3xl md:text-5xl font-bold mb-6">
              <span className="text-gold-embossed">Crie seu roteiro</span>{' '}
              <span className="gradient-text-teal">personalizado</span>
            </h2>
            <p className="text-white text-lg mb-8 max-w-2xl mx-auto">
              Nossa inteligência artificial cria roteiros sob medida para você. Informe suas preferências e receba um plano de viagem personalizado em segundos.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/explorar" className="btn-gold flex items-center gap-2 text-lg px-8 py-4">
                <Compass className="w-5 h-5" />
                Explorar Destinos
              </Link>
              <Link to="/nacional" className="btn-outline bg-teal/80 text-white border-teal text-lg px-8 py-4">
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