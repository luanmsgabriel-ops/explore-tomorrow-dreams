import { useState } from 'react';
import { Play, Sparkles, MessageCircle, X, Loader2, Image } from 'lucide-react';
import heroImage from '@/assets/hero-noronha.jpg';
import { QuoteFormChat } from '@/components/QuoteFormChat';
import { ItineraryGenerator } from '@/components/ItineraryGenerator';
import { VideoPlayer } from '@/components/VideoPlayer';
import { ImageGenerator } from '@/components/ImageGenerator';
import { useFeaturedDestination } from '@/hooks/useDestinations';

type ModalType = 'videos' | 'itinerary' | 'quote' | 'image' | null;

export const HeroSection = () => {
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const { destination, isLoading } = useFeaturedDestination();

  // Use featured destination data or fallback
  const displayName = destination?.name || 'Fernando de Noronha';
  const displayDescription = destination?.description || 'Descubra o paraíso brasileiro. Praias cristalinas, vida marinha exuberante e momentos inesquecíveis esperam por você.';
  const displayLocation = destination?.location || 'Brasil';
  const displayCategory = destination?.category || 'Praia & Natureza';
  const displayBestTime = destination?.bestTime || 'Ago - Fev';
  const displayImage = destination?.image && destination.image !== '/placeholder.svg' ? destination.image : heroImage;

  // Split name for styling (first part normal, last part colored)
  const nameParts = displayName.split(' ');
  const lastName = nameParts.pop() || '';
  const firstName = nameParts.join(' ');

  return (
    <>
      <section className="relative h-screen min-h-[600px] overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src={displayImage}
            alt={`${displayName} - Destino em destaque`}
            className="w-full h-full object-cover"
          />
          {/* Gradient overlays */}
          <div
            className="absolute inset-0"
            style={{ background: 'var(--gradient-hero-overlay)' }}
          />
          <div
            className="absolute bottom-0 left-0 right-0 h-40"
            style={{ background: 'var(--gradient-hero-bottom)' }}
          />
        </div>

        {/* Content */}
        <div className="relative z-10 h-full flex items-center">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-2xl animate-fade-up">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6">
                <Sparkles className="w-4 h-4 text-accent" />
                <span className="text-sm font-medium text-accent">Destino em Destaque</span>
              </div>

              {/* Title */}
              <h1 className="font-serif text-5xl md:text-7xl font-bold text-foreground mb-4 text-shadow-lg">
                {firstName && (
                  <>
                    {firstName}
                    <br />
                  </>
                )}
                <span className="gradient-text-teal">{lastName}</span>
              </h1>

              {/* Description */}
              <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-lg">
                {displayDescription}
              </p>

              {/* Actions */}
              <div className="flex flex-wrap gap-4">
                <button 
                  onClick={() => setActiveModal('videos')}
                  className="btn-primary flex items-center gap-2"
                  disabled={isLoading}
                >
                  <Play className="w-5 h-5" />
                  Assistir Vídeos
                </button>
                <button 
                  onClick={() => setActiveModal('itinerary')}
                  className="btn-gold flex items-center gap-2"
                >
                  <Sparkles className="w-5 h-5" />
                  Criar Roteiro com IA
                </button>
                <button 
                  onClick={() => setActiveModal('quote')}
                  className="btn-outline flex items-center gap-2"
                >
                  <MessageCircle className="w-5 h-5" />
                  Solicitar Cotação
                </button>
                <button 
                  onClick={() => setActiveModal('image')}
                  className="btn-outline flex items-center gap-2"
                >
                  <Image className="w-5 h-5" />
                  Gerar Imagem com IA
                </button>
              </div>

              {/* Quick info */}
              <div className="flex flex-wrap gap-6 mt-10 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary" />
                  {displayLocation}
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-accent" />
                  {displayCategory}
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-teal-light" />
                  Melhor época: {displayBestTime}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 animate-bounce">
          <div className="w-6 h-10 rounded-full border-2 border-muted-foreground/50 flex justify-center pt-2">
            <div className="w-1.5 h-3 rounded-full bg-muted-foreground/50" />
          </div>
        </div>
      </section>

      {/* Modal */}
      {activeModal && destination && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm" onClick={() => setActiveModal(null)}>
          <div className="relative w-full max-w-4xl max-h-[90vh] bg-card border border-border rounded-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setActiveModal(null)} className="absolute top-4 right-4 z-10 p-2 rounded-full bg-secondary hover:bg-muted transition-colors">
              <X className="w-5 h-5 text-foreground" />
            </button>
            
            <div className="overflow-y-auto max-h-[90vh]">
              {activeModal === 'videos' && (
                <div className="p-6">
                  <h2 className="font-serif text-2xl font-bold text-foreground mb-6">
                    Vídeos de <span className="gradient-text-teal">{destination.name}</span>
                  </h2>
                  {destination.videos && destination.videos.length > 0 ? (
                    <VideoPlayer videos={destination.videos} destinationName={destination.name} />
                  ) : (
                    <p className="text-muted-foreground text-center py-8">Nenhum vídeo disponível.</p>
                  )}
                </div>
              )}
              {activeModal === 'itinerary' && (
                <ItineraryGenerator destinationId={destination.id} destinationName={destination.name} onClose={() => setActiveModal(null)} />
              )}
              {activeModal === 'quote' && (
                <QuoteFormChat destinationId={destination.id} destinationName={destination.name} onClose={() => setActiveModal(null)} />
              )}
              {activeModal === 'image' && (
                <ImageGenerator destinationId={destination.id} destinationName={destination.name} />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Loading Modal */}
      {activeModal && isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}
    </>
  );
};