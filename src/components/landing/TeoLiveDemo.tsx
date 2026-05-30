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
    <section className="relative py-20 md:py-28">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <EditorialHeading
            eyebrow="Demonstração"
            size="md"
            align="center"
            className="mb-10"
          >
            Conversa de verdade.
            <br />
            <span className="font-editorial-italic gradient-text-teal">
              Não é formulário.
            </span>
          </EditorialHeading>

          {/* Chat preview card */}
          <div className="relative glass-gold rounded-3xl p-6 md:p-8 shadow-[var(--shadow-editorial)]">
            {/* Téo avatar */}
            <div className="flex items-center gap-3 mb-6 pb-5 border-b border-gold/15">
              <TeoMascot size="small" animated />
              <div>
                <p className="text-sm font-semibold text-foreground">Téo</p>
                <p className="text-xs text-foreground/60 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Pronto pra conversar
                </p>
              </div>
            </div>

            {/* Sample message from Téo */}
            <div className="flex gap-3 mb-6">
              <div className="flex-shrink-0">
                <TeoMascot size="small" animated={false} />
              </div>
              <div className="bg-ocean-mid/60 rounded-2xl rounded-tl-sm px-4 py-3 max-w-md">
                <p className="text-sm text-foreground leading-relaxed">
                  E aí, viajante! 🌍 Me conta uma coisa: qual é a vibe da próxima
                  viagem? Pode escolher uma opção aí embaixo ou digitar direto.
                </p>
              </div>
            </div>

            {/* Quick prompts */}
            <div className="flex flex-wrap gap-2 mb-6">
              {PROMPTS.map((p) => (
                <Link
                  key={p.label}
                  to="/teo"
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-full border border-gold/30 bg-ocean-deep/40 text-sm text-foreground/90 hover:bg-gold/10 hover:border-gold/60 transition-all"
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
                Conta pro Téo o que você quer...
              </span>
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-gold-light to-gold-dark text-ocean-deep group-hover:scale-110 transition-transform">
                <ArrowRight className="w-4 h-4" />
              </span>
            </Link>

            <div className="mt-5 flex items-center justify-center gap-2 text-xs text-foreground/50">
              <Sparkles className="w-3.5 h-3.5 text-gold-light" />
              Grátis · Sem cadastro · Resposta em segundos
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
