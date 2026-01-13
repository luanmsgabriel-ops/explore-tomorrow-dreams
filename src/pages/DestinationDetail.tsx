import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { QuoteFormChat } from '@/components/QuoteFormChat';
import { ItineraryGenerator } from '@/components/ItineraryGenerator';
import { DestinationChat } from '@/components/DestinationChat';
import { ImageGenerator } from '@/components/ImageGenerator';
import { VideoPlayer } from '@/components/VideoPlayer';
import { getDestinationById } from '@/data/destinations';
import { Sparkles, MessageCircle, Image, MapPin, Calendar, Users, X, ArrowLeft, Sun, Clock } from 'lucide-react';

type ModalType = 'quote' | 'itinerary' | 'chat' | 'image' | null;

const DestinationDetail = () => {
  const { id } = useParams<{ id: string }>();
  const destination = getDestinationById(id || '');
  const [activeModal, setActiveModal] = useState<ModalType>(null);

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
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Banner */}
      <section className="relative h-[70vh] min-h-[500px]">
        <img src={destination.image} alt={destination.name} className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: 'var(--gradient-hero-overlay)' }} />
        <div className="absolute bottom-0 left-0 right-0 h-40" style={{ background: 'var(--gradient-hero-bottom)' }} />

        {/* Back button */}
        <Link 
          to={`/${destination.type === 'nacional' ? 'nacional' : destination.type === 'internacional' ? 'internacional' : 'explorar'}`}
          className="absolute top-24 left-4 lg:left-8 z-10 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Voltar</span>
        </Link>

        <div className="relative z-10 h-full flex items-end pb-16">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-3xl animate-fade-up">
              <span className="inline-block px-3 py-1 text-sm font-medium rounded-full bg-primary/20 text-primary mb-4">
                {destination.category}
              </span>
              <h1 className="font-serif text-5xl md:text-7xl font-bold text-foreground mb-4 text-shadow-lg">
                {destination.name}
              </h1>
              <div className="flex items-center gap-2 text-muted-foreground mb-6">
                <MapPin className="w-5 h-5" />
                <span className="text-lg">{destination.location}</span>
              </div>
              <p className="text-xl text-muted-foreground max-w-2xl">{destination.description}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Info Cards */}
      <section className="py-8 border-b border-border">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-secondary/50">
              <Sun className="w-6 h-6 text-accent" />
              <div>
                <p className="text-xs text-muted-foreground">Melhor época</p>
                <p className="text-sm font-medium text-foreground">{destination.bestTime}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-xl bg-secondary/50">
              <Clock className="w-6 h-6 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Duração ideal</p>
                <p className="text-sm font-medium text-foreground">{destination.idealDuration}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-xl bg-secondary/50">
              <Users className="w-6 h-6 text-teal-light" />
              <div>
                <p className="text-xs text-muted-foreground">Indicado para</p>
                <p className="text-sm font-medium text-foreground">{destination.forWho}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-xl bg-secondary/50">
              <MapPin className="w-6 h-6 text-gold" />
              <div>
                <p className="text-xs text-muted-foreground">Categoria</p>
                <p className="text-sm font-medium text-foreground">{destination.category}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

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
      <section className="py-16">
        <div className="container mx-auto px-4 lg:px-8">
          <h2 className="font-serif text-3xl font-bold text-foreground mb-8">
            Vídeos de <span className="gradient-text-teal">{destination.name}</span>
          </h2>
          <VideoPlayer videos={destination.videos} destinationName={destination.name} />
        </div>
      </section>

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
