import { Link } from 'react-router-dom';
import { MessageCircle, ArrowRight } from 'lucide-react';
import { TeoMascot } from '@/components/TeoMascot';

export const ClosingCTA = () => {
  return (
    <section className="relative py-24 md:py-36 overflow-hidden border-t border-gold/10">
      {/* Ambient gradient */}
      <div
        className="absolute inset-0 -z-10 opacity-80"
        style={{ background: 'var(--gradient-teo-aura)' }}
      />

      <div className="container mx-auto px-4 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="absolute inset-0 -m-6 rounded-full bg-gold-light/20 blur-2xl animate-pulse-glow" />
              <div className="relative">
                <TeoMascot size="large" animated />
              </div>
            </div>
          </div>

          <h2 className="font-editorial text-4xl md:text-6xl lg:text-7xl text-foreground leading-[1] mb-6">
            E então?
            <br />
            <span className="font-editorial-italic gradient-text-teal">Pra onde a gente vai?</span>
          </h2>

          <p className="text-base md:text-lg text-foreground/75 max-w-xl mx-auto mb-10">
            O Téo tá online, pronto pra conversar. Sem formulário, sem pressa, sem
            compromisso.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/teo"
              className="btn-gold flex items-center justify-center gap-3 text-base md:text-lg px-8 py-4 group"
            >
              <MessageCircle className="w-5 h-5" />
              Começar a conversa
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <a
              href="https://wa.me/5515991833448"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-outline flex items-center justify-center gap-2 text-base md:text-lg px-8 py-4"
            >
              WhatsApp direto
            </a>
          </div>

          <p className="mt-8 text-xs text-foreground/50">
            Tomorrow Travel · Agente de viagem com IA · Consultoria humana inclusa
          </p>
        </div>
      </div>
    </section>
  );
};
