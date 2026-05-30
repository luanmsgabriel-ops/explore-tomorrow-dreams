import { MessageCircle, FileText, Plane, ReceiptText } from 'lucide-react';
import { EditorialHeading } from './EditorialHeading';

const STEPS = [
  {
    n: '01',
    icon: MessageCircle,
    title: 'Conversa',
    desc: 'Você fala com o Téo como falaria com um amigo. Sem formulário, sem fricção.',
    time: '~2 min',
  },
  {
    n: '02',
    icon: FileText,
    title: 'Roteiro',
    desc: 'O Téo monta o roteiro ideal baseado no seu perfil e desejos.',
    time: '~10 seg',
  },
  {
    n: '03',
    icon: ReceiptText,
    title: 'Cotação',
    desc: 'Um consultor humano revisa o roteiro e envia a cotação final.',
    time: '~24h',
  },
  {
    n: '04',
    icon: Plane,
    title: 'Concierge',
    desc: 'Suporte total durante a viagem. Concierge 24/7 no WhatsApp.',
    time: 'sempre',
  },
];

export const HowItWorksTimeline = () => {
  return (
    <section className="relative py-20 md:py-28 border-t border-gold/10">
      <div className="container mx-auto px-4 lg:px-8">
        <EditorialHeading
          eyebrow="Como funciona"
          size="md"
          align="center"
          className="mb-16 mx-auto max-w-2xl"
        >
          Do chat ao embarque.
          <br />
          <span className="font-editorial-italic gradient-text-teal">Simples assim.</span>
        </EditorialHeading>

        <div className="relative grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 md:gap-6">
          {/* Connecting line (desktop) */}
          <div className="hidden md:block absolute top-12 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />

          {STEPS.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.n} className="relative flex flex-col items-center text-center">
                <div className="relative mb-6">
                  <div className="absolute inset-0 -m-2 rounded-full bg-gold-light/10 blur-xl" />
                  <div className="relative w-24 h-24 rounded-full glass-gold flex items-center justify-center">
                    <Icon className="w-9 h-9 text-gold-light" />
                  </div>
                  <span className="absolute -top-1 -right-1 font-editorial text-2xl text-gold-light/60">
                    {s.n}
                  </span>
                </div>
                <h3 className="font-editorial text-3xl text-foreground mb-2">{s.title}</h3>
                <p className="text-sm text-foreground/70 max-w-xs leading-relaxed mb-3">
                  {s.desc}
                </p>
                <span className="text-[10px] uppercase tracking-[0.25em] text-gold-light/80">
                  {s.time}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
