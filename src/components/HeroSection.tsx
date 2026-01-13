import { Play, Sparkles, MessageCircle } from 'lucide-react';
import heroImage from '@/assets/hero-noronha.jpg';

export const HeroSection = () => {
  return (
    <section className="relative h-screen min-h-[600px] overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src={heroImage}
          alt="Fernando de Noronha - Destino em destaque"
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
              Fernando de
              <br />
              <span className="gradient-text-teal">Noronha</span>
            </h1>

            {/* Description */}
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-lg">
              Descubra o paraíso brasileiro. Praias cristalinas, vida marinha exuberante e momentos inesquecíveis esperam por você.
            </p>

            {/* Actions */}
            <div className="flex flex-wrap gap-4">
              <button className="btn-primary flex items-center gap-2">
                <Play className="w-5 h-5" />
                Assistir Vídeos
              </button>
              <button className="btn-gold flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Criar Roteiro com IA
              </button>
              <button className="btn-outline flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                Solicitar Cotação
              </button>
            </div>

            {/* Quick info */}
            <div className="flex flex-wrap gap-6 mt-10 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary" />
                Brasil
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-accent" />
                Praia & Natureza
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-teal-light" />
                Melhor época: Ago - Fev
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
  );
};
