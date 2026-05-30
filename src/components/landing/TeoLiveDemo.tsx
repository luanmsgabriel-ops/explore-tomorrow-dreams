import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { TeoMascot } from '@/components/TeoMascot';
import { EditorialHeading } from './EditorialHeading';

const PROMPTS = [
  { label: 'Lua de mel romântica', emoji: '💍' },
  { label: 'Praia com a família', emoji: '🏖️' },
  { label: 'Mochilão na Ásia', emoji: '🎒' },
  { label: 'Neve em julho', emoji: '🎿' },
  { label: 'Europa em 15 dias', emoji: '🇪🇺' },
  { label: 'Caribe tudo incluído', emoji: '🍹' },
];

export const TeoLiveDemo = () => {
  return (
    <section className="relative py-20 md:py-28 border-t border-gold/10">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <EditorialHeading
              eyebrow="Demonstração"
              size="lg"
              className="mb-6"
            >
              Experimente a
              <br />
              <span className="font-editorial-italic gradient-text-teal">
                mágica do Téo
              </span>.
            </EditorialHeading>
            <p className="text-lg text-foreground/70 mb-8 max-w-lg leading-relaxed">
              O Téo não é apenas um chat. Ele é um especialista que conhece cada canto do mundo e está pronto para criar o seu roteiro personalizado em segundos.
            </p>
            <ul className="space-y-4 mb-8">
              {[
                'Entendimento natural de desejos',
                'Curadoria de experiências exclusivas',
                'Cotação rápida com parceiros premium',
                'Ajustes em tempo real na conversa'
              ].map(item => (
                <li key={item} className="flex items-center gap-3 text-foreground/80">
                  <div className="w-1.5 h-1.5 rounded-full bg-gold-light" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="relative">
            {/* Decorative background glow */}
            <div className="absolute inset-0 bg-gold-light/5 blur-[100px] -z-10" />
            
            {/* Chat preview card */}
            <div className="relative glass-gold rounded-3xl p-6 md:p-8 shadow-[var(--shadow-editorial)]">
              {/* Téo header */}
              <div className="flex items-center gap-3 mb-6 pb-5 border-b border-gold/15">
                <TeoMascot size="small" animated />
                <div>
                  <p className="text-sm font-semibold text-foreground">Téo</p>
                  <p className="text-xs text-foreground/60 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Pronto pra conversar
                  </p>
                </div>
              </div>

              {/* Sample messages */}
              <div className="space-y-4 mb-6 max-h-[300px] overflow-y-auto pr-2 scrollbar-hide">
                <div className="flex gap-3">
                  <div className="flex-shrink-0">
                    <TeoMascot size="small" animated={false} />
                  </div>
                  <div className="bg-ocean-mid/60 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[85%]">
                    <p className="text-sm text-foreground leading-relaxed">
                      E aí, viajante! 🌍 Me conta uma coisa: qual é a vibe da próxima viagem? 
                    </p>
                  </div>
                </div>

                <div className="flex flex-row-reverse gap-3">
                  <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs">👤</span>
                  </div>
                  <div className="bg-gold/10 rounded-2xl rounded-tr-sm px-4 py-3 max-w-[85%] border border-gold/20">
                    <p className="text-sm text-foreground leading-relaxed">
                      Quero algo romântico na Grécia, com vista para o mar. 💍
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex-shrink-0">
                    <TeoMascot size="small" animated={false} />
                  </div>
                  <div className="bg-ocean-mid/60 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[85%]">
                    <p className="text-sm text-foreground leading-relaxed">
                      Santorini é imbatível! 🇬🇷 Tenho um roteiro em Oia com as melhores vistas da Caldeira. Quer ver?
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick prompts */}
              <div className="flex flex-wrap gap-2 mb-6">
                {PROMPTS.map((p) => (
                  <Link
                    key={p.label}
                    to={`/teo?q=${encodeURIComponent(p.label)}`}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-full border border-gold/30 bg-ocean-deep/40 text-[10px] sm:text-xs text-foreground/90 hover:bg-gold/10 hover:border-gold/60 transition-all"
                  >
                    <span>{p.emoji}</span>
                    {p.label}
                  </Link>
                ))}
              </div>

              {/* Fake input */}
              <Link
                to="/teo"
                className="flex items-center justify-between gap-3 w-full px-4 py-3.5 rounded-2xl border border-gold/25 bg-ocean-deep/60 hover:border-gold/50 transition-colors group"
              >
                <span className="text-sm text-foreground/50">
                  Responda ao Téo...
                </span>
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-gold-light to-gold-dark text-ocean-deep group-hover:scale-110 transition-transform">
                  <ArrowRight className="w-4 h-4" />
                </span>
              </Link>

              <div className="mt-5 flex items-center justify-center gap-2 text-[10px] text-foreground/50">
                <Sparkles className="w-3.5 h-3.5 text-gold-light" />
                Grátis · Resposta em segundos · Consultoria Humana
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
