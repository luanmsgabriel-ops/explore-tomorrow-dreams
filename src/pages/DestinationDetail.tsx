import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { QuoteFormChat } from '@/components/QuoteFormChat';
import { ItineraryGenerator } from '@/components/ItineraryGenerator';
import { DestinationChat } from '@/components/DestinationChat';
import { ImageGenerator } from '@/components/ImageGenerator';
import { VideoPlayer } from '@/components/VideoPlayer';
import { useDestinationById } from '@/hooks/useDestinations';
import { useAutoAmbientSound } from '@/hooks/useAmbientSound';
import { useAnalytics } from '@/hooks/useAnalytics';
import { Sparkles, MessageCircle, Image, MapPin, Calendar, Users, X, ArrowLeft, Sun, Clock, Loader2, TrendingDown, Plane } from 'lucide-react';

type ModalType = 'quote' | 'itinerary' | 'chat' | 'image' | null;

const DestinationDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { destination, isLoading } = useDestinationById(id || '');
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const { trackDestinationView } = useAnalytics();
  
  // Auto-play ocean sound for beach destinations
  useAutoAmbientSound(destination?.category || '');

  // Track destination view
  useEffect(() => {
    if (destination) {
      trackDestinationView(destination.id, destination.name);
    }
  }, [destination?.id]);

  const handleGoBack = () => {
    navigate(-1);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!destination) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-serif text-4xl font-bold text-foreground mb-4">Destino não encontrado</h1>
          <p className="text-muted-foreground mb-6">O destino que você procura não existe.</p>
          <Link to="/" className="btn-primary">Voltar ao início</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="cinematic-bg">
      <Header />

      {/* Hero Banner */}
      <section className="relative h-[70vh] min-h-[500px] overflow-hidden">
        <img src={destination.image} alt={destination.name} className="absolute inset-0 w-full h-full object-cover scale-105" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/40 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-background via-background/60 to-transparent" />

        {/* Back button */}
        <button 
          onClick={handleGoBack}
          className="absolute top-24 left-4 lg:left-8 z-20 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer bg-background/30 backdrop-blur-sm px-3 py-2 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Voltar</span>
        </button>

        <div className="relative z-10 h-full flex items-end pb-16">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-3xl animate-fade-up bg-black/40 backdrop-blur-md p-8 rounded-2xl border border-gold/20">
              <span className="inline-block px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-full glass-gold text-gold-light mb-6">
                {destination.category}
              </span>
              <h1 className="font-serif text-5xl md:text-7xl font-bold mb-4">
                <span className="text-gold-embossed">{destination.name}</span>
              </h1>
              <div className="flex items-center gap-2 text-white/80 mb-6">
                <MapPin className="w-5 h-5 text-gold" />
                <span className="text-lg font-medium">{destination.location}</span>
              </div>
              <p className="text-xl text-white/90 leading-relaxed max-w-2xl">{destination.description}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Info Cards */}
      <section className="py-8 border-b border-border">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3 p-5 rounded-2xl bg-black/40 backdrop-blur-sm border border-white/5">
              <Sun className="w-6 h-6 text-gold" />
              <div>
                <p className="text-[10px] uppercase tracking-wider text-white/50">Melhor época</p>
                <p className="text-sm font-bold text-white">{destination.bestTime}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-5 rounded-2xl bg-black/40 backdrop-blur-sm border border-white/5">
              <Clock className="w-6 h-6 text-gold" />
              <div>
                <p className="text-[10px] uppercase tracking-wider text-white/50">Duração ideal</p>
                <p className="text-sm font-bold text-white">{destination.idealDuration}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-5 rounded-2xl bg-black/40 backdrop-blur-sm border border-white/5">
              <Users className="w-6 h-6 text-gold" />
              <div>
                <p className="text-[10px] uppercase tracking-wider text-white/50">Indicado para</p>
                <p className="text-sm font-bold text-white">{destination.forWho}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-5 rounded-2xl bg-black/40 backdrop-blur-sm border border-white/5">
              <MapPin className="w-6 h-6 text-gold" />
              <div>
                <p className="text-[10px] uppercase tracking-wider text-white/50">Categoria</p>
                <p className="text-sm font-bold text-white">{destination.category}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Best Price Periods Section */}
      {destination.bestPricePeriods && destination.bestPricePeriods.length > 0 && (
        <section className="py-8 border-b border-border bg-gradient-to-r from-green-500/5 via-transparent to-green-500/5">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-full bg-green-500/20">
                <TrendingDown className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <Plane className="w-4 h-4" />
                  Melhores Períodos para Passagens Aéreas
                </h3>
                <p className="text-xs text-muted-foreground">Baseado em dados históricos de preços</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {destination.bestPricePeriods.map((period, index) => (
                <div 
                  key={index} 
                  className="flex items-start gap-4 p-4 rounded-xl bg-card border border-green-500/20 hover:border-green-500/40 transition-colors"
                >
                  <div className="p-2 rounded-lg bg-green-500/10 shrink-0">
                    <Calendar className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground text-lg">{period.period}</p>
                    <p className="text-sm text-muted-foreground">{period.reason}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <p className="mt-4 text-xs text-muted-foreground text-center italic">
              💡 Dica: Reserve com antecedência para garantir os melhores preços nestes períodos
            </p>
          </div>
        </section>
      )}

      {/* Action buttons */}
      <section className="py-8 border-b border-border sticky top-16 z-30 glass">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex flex-wrap gap-3">
            <button onClick={() => setActiveModal('itinerary')} className="btn-primary flex items-center gap-2 text-sm">
              <Sparkles className="w-4 h-4" />
              Criar Roteiro com IA
            </button>
            <button onClick={() => setActiveModal('quote')} className="btn-gold flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4" />
              Solicitar Cotação
            </button>
            <button onClick={() => setActiveModal('chat')} className="btn-outline flex items-center gap-2 text-sm">
              <MessageCircle className="w-4 h-4" />
              Chat com IA
            </button>
            <button onClick={() => setActiveModal('image')} className="btn-outline flex items-center gap-2 text-sm">
              <Image className="w-4 h-4" />
              Gerar Imagem
            </button>
          </div>
        </div>
      </section>

      {/* Video section */}
      {destination.videos && destination.videos.length > 0 && (
        <section className="py-16">
          <div className="container mx-auto px-4 lg:px-8">
            <h2 className="font-serif text-3xl font-bold text-foreground mb-8">
              Vídeos de <span className="gradient-text-teal">{destination.name}</span>
            </h2>
            <VideoPlayer videos={destination.videos} destinationName={destination.name} />
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-primary/10 via-transparent to-accent/10">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="font-serif text-3xl font-bold text-foreground mb-4">
              Pronto para conhecer <span className="gradient-text-gold">{destination.name}</span>?
            </h2>
            <p className="text-muted-foreground mb-8">
              Nossa equipe de especialistas vai criar uma viagem sob medida para você.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <button onClick={() => setActiveModal('quote')} className="btn-gold flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Solicitar Cotação
              </button>
              <button onClick={() => setActiveModal('itinerary')} className="btn-outline flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Criar Roteiro com IA
              </button>
            </div>
          </div>
        </div>
      </section>

      <Footer />

      {/* Modal */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm" onClick={() => setActiveModal(null)}>
          <div className="relative w-full max-w-2xl max-h-[90vh] bg-card border border-border rounded-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setActiveModal(null)} className="absolute top-4 right-4 z-10 p-2 rounded-full bg-secondary hover:bg-muted transition-colors">
              <X className="w-5 h-5 text-foreground" />
            </button>
            
            <div className="overflow-y-auto max-h-[90vh]">
              {activeModal === 'quote' && <QuoteFormChat destinationId={destination.id} destinationName={destination.name} onClose={() => setActiveModal(null)} />}
              {activeModal === 'itinerary' && <ItineraryGenerator destinationId={destination.id} destinationName={destination.name} onClose={() => setActiveModal(null)} />}
              {activeModal === 'chat' && <div className="h-[600px]"><DestinationChat destinationId={destination.id} destinationName={destination.name} /></div>}
              {activeModal === 'image' && <ImageGenerator destinationId={destination.id} destinationName={destination.name} />}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DestinationDetail;
