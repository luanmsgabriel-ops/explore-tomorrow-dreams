import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { MessageCircle, ArrowRight, Star } from 'lucide-react';
import { TeoMascot } from '@/components/TeoMascot';
import { HeroBackgroundVideo } from './HeroBackgroundVideo';

const TEO_LINES = [
  'Pra onde a gente vai dessa vez?',
  'Conta pra mim: lua de mel, família ou aventura?',
  'Tenho um roteiro de Maldivas que vai te derrubar 🌊',
  'Em 2 minutos te mando a cotação completa.',
];

const avatars = [
  'https://i.pravatar.cc/64?img=12',
  'https://i.pravatar.cc/64?img=32',
  'https://i.pravatar.cc/64?img=47',
  'https://i.pravatar.cc/64?img=68',
];

export const TeoHeroConversation = () => {
  const [lineIdx, setLineIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setLineIdx((i) => (i + 1) % TEO_LINES.length);
    }, 3800);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="relative overflow-hidden pt-28 pb-16 md:pt-36 md:pb-24">
      {/* Cinematic destination video (desktop only, lazy) */}
      <HeroBackgroundVideo />

      {/* Ambient gradient aura */}
      <div
        className="absolute inset-0 -z-10 opacity-70"
        style={{ background: 'var(--gradient-teo-aura)' }}
      />
      <div className="absolute top-1/3 -left-32 w-96 h-96 rounded-full bg-teal/20 blur-3xl animate-parallax-float" />
      <div
        className="absolute bottom-0 -right-32 w-96 h-96 rounded-full bg-gold/15 blur-3xl animate-parallax-float"
        style={{ animationDelay: '2s' }}
      />

      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-16 items-center">
          {/* Left — editorial copy */}
          <div className="lg:col-span-7">
            <span className="inline-flex items-center gap-2 text-[10px] md:text-xs uppercase tracking-[0.3em] text-gold-light/80 mb-6">
              <span className="h-px w-8 bg-gold-light/60" />
              Agente de viagem com IA
            </span>

            <h1 className="font-editorial text-5xl md:text-7xl lg:text-[5.5rem] leading-[0.95] mb-6">
              Sua próxima viagem
              <br />
              começa numa{' '}
              <span className="font-editorial-italic gradient-text-teal">conversa</span>.
            </h1>

            <p className="text-base md:text-lg text-foreground/80 max-w-xl leading-relaxed mb-10">
              Converse com o <strong className="text-foreground">Téo</strong>, o primeiro agente
              de viagem com IA do Brasil. Ele entende o que você quer, monta o roteiro e um
              consultor humano cuida de cada detalhe.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <Link
                to="/teo"
                className="btn-gold flex items-center justify-center gap-3 text-base md:text-lg px-7 py-4 group"
              >
                <MessageCircle className="w-5 h-5" />
                Conversar com o Téo
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                to="/explorar"
                className="btn-outline flex items-center justify-center gap-2 text-base md:text-lg px-7 py-4"
              >
                Ver roteiros reais
              </Link>
            </div>

            {/* Social Proof below CTAs */}
            <div className="flex items-center gap-4 animate-fade-in" style={{ animationDelay: '0.5s' }}>
              <div className="flex -space-x-3">
                {avatars.map((src, i) => (
                  <img
                    key={i}
                    src={src}
                    alt=""
                    className="w-8 h-8 rounded-full ring-2 ring-background object-cover"
                  />
                ))}
              </div>
              <div className="text-xs text-foreground/60">
                <div className="flex items-center gap-1 text-gold-light mb-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3 h-3 fill-current" />
                  ))}
                  <span className="ml-1 text-foreground/80 font-semibold">4.9/5</span>
                </div>
                <span>+1.200 viajantes satisfeitos</span>
              </div>
            </div>
          </div>

          {/* Right — Téo + conversation bubble */}
          <div className="lg:col-span-5 relative flex items-center justify-center">
            <div className="relative">
              {/* Téo aura */}
              <div
                className="absolute inset-0 -m-16 rounded-full blur-3xl"
                style={{ background: 'var(--gradient-teo-aura)' }}
              />

              <div className="relative">
                <TeoMascot size="large" animated />
              </div>

              {/* Live conversation bubble */}
              <div className="absolute -top-6 -right-4 md:-right-12 max-w-[240px]">
                <div className="glass-gold rounded-2xl rounded-bl-sm px-4 py-3 shadow-2xl">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] uppercase tracking-wider text-gold-light/80 font-semibold">
                      Téo
                    </span>
                    <span className="flex gap-0.5">
                      <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-[9px] text-emerald-400/80">online</span>
                    </span>
                  </div>
                  <p
                    key={lineIdx}
                    className="text-sm text-foreground leading-snug animate-fade-in"
                  >
                    {TEO_LINES[lineIdx]}
                  </p>
                </div>
                {/* Tail */}
                <div className="w-3 h-3 -mt-1 ml-4 rotate-45 glass-gold" />
              </div>

              {/* Typing indicator bubble (left, smaller) */}
              <div className="absolute -bottom-2 -left-4 md:-left-10 glass rounded-2xl rounded-br-sm px-3 py-2 shadow-xl">
                <div className="flex items-center gap-1">
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-foreground/60 typing-dot"
                    style={{ animationDelay: '0s' }}
                  />
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-foreground/60 typing-dot"
                    style={{ animationDelay: '0.2s' }}
                  />
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-foreground/60 typing-dot"
                    style={{ animationDelay: '0.4s' }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
