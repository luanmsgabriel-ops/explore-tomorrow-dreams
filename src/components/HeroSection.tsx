import { useState } from 'react';
import { Play, Sparkles, MessageCircle, X, Loader2, Image, Phone } from 'lucide-react';
import { QuoteFormChat } from '@/components/QuoteFormChat';
import { ItineraryGenerator } from '@/components/ItineraryGenerator';
import { VideoPlayer } from '@/components/VideoPlayer';
import { ImageGenerator } from '@/components/ImageGenerator';
import { useFeaturedDestination } from '@/hooks/useDestinations';

import { GoldenCompass } from '@/components/GoldenCompass';
import { DecorativeAirplane } from '@/components/DecorativeAirplane';

type ModalType = 'videos' | 'itinerary' | 'quote' | 'image' | null;

export const HeroSection = () => {
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const { destination, isLoading } = useFeaturedDestination();

  return (
    <>
      <section className="relative min-h-screen overflow-hidden">
        
        {/* Decorative airplanes */}
        <div className="absolute top-20 right-[15%] opacity-40 animate-float" style={{ animationDelay: '0.5s' }}>
          <DecorativeAirplane size="lg" direction="right" />
        </div>
        <div className="absolute bottom-32 left-[10%] opacity-30 animate-float" style={{ animationDelay: '1.5s' }}>
          <DecorativeAirplane size="md" direction="left" />
        </div>
        <div className="absolute top-[40%] right-[5%] opacity-25 animate-float" style={{ animationDelay: '2s' }}>
          <DecorativeAirplane size="sm" direction="right" />
        </div>

        {/* Content */}
        <div className="relative z-10 min-h-screen flex items-center">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left side - Text content */}
              <div className="animate-fade-up">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-gold mb-8">
                  <Sparkles className="w-4 h-4 text-gold-light" />
                  <span className="text-sm font-medium text-gold-light">Viagens Extraordinárias</span>
                </div>

                {/* Title with embossed gold effect */}
                <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
                  <span className="text-gold-embossed">Explore o</span>
                  <br />
                  <span className="text-gold-embossed">Mundo com a</span>
                  <br />
                  <span className="gradient-text-teal">Tomorrow</span>
                  <span className="text-gold-embossed"> Travel</span>
                </h1>

                {/* Description */}
                <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-lg leading-relaxed">
                  Tecnologia de ponta para facilitar sua viagem. 
                  <span className="text-gold-light font-medium"> O primeiro agente de IA </span>
                  do mundo no setor de viagens, acessível para todos.
                </p>

                {/* CTA Buttons */}
                <div className="flex flex-wrap gap-4">
                  <button 
                    onClick={() => setActiveModal('quote')}
                    className="btn-gold flex items-center gap-3 text-lg px-8 py-4"
                  >
                    <Phone className="w-5 h-5" />
                    Falar com Consultor
                  </button>
                  <button 
                    onClick={() => setActiveModal('itinerary')}
                    className="btn-outline flex items-center gap-3 text-lg px-8 py-4"
                  >
                    <Sparkles className="w-5 h-5" />
                    Criar Roteiro com IA
                  </button>
                </div>

                {/* Quick actions */}
                <div className="flex flex-wrap gap-4 mt-8">
                  <button 
                    onClick={() => setActiveModal('videos')}
                    className="flex items-center gap-2 text-muted-foreground hover:text-gold-light transition-colors"
                    disabled={isLoading}
                  >
                    <Play className="w-4 h-4" />
                    <span className="text-sm">Assistir Vídeos</span>
                  </button>
                  <button 
                    onClick={() => setActiveModal('image')}
                    className="flex items-center gap-2 text-muted-foreground hover:text-gold-light transition-colors"
                  >
                    <Image className="w-4 h-4" />
                    <span className="text-sm">Gerar Imagem com IA</span>
                  </button>
                </div>
              </div>

              {/* Right side - Compass */}
              <div className="hidden lg:flex items-center justify-center">
                <GoldenCompass size="lg" className="opacity-90" />
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 animate-bounce">
          <div className="w-6 h-10 rounded-full border-2 border-gold/50 flex justify-center pt-2">
            <div className="w-1.5 h-3 rounded-full bg-gold/50" />
          </div>
        </div>
      </section>

      {/* Modal */}
      {activeModal && destination && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm" onClick={() => setActiveModal(null)}>
          <div className="relative w-full max-w-4xl max-h-[90vh] glass-gold rounded-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
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
          <Loader2 className="w-8 h-8 animate-spin text-gold" />
        </div>
      )}
    </>
  );
};