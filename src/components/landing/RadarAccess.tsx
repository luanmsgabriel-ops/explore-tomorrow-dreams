import { ArrowRight, CalendarDays, MessageCircle, Radar, Scale } from 'lucide-react';
import { Link } from 'react-router-dom';

import { EditorialHeading } from './EditorialHeading';

const accessOptions = [
  {
    icon: Radar,
    eyebrow: 'Explorar',
    title: 'Catálogo de oportunidades',
    description: 'Pesquise pacotes, bloqueios aéreos, eventos e grupos com filtros baseados no inventário real.',
    action: 'Abrir catálogo',
    href: '/oportunidades/catalogo',
    accent: 'teal',
  },
  {
    icon: CalendarDays,
    eyebrow: 'Escolher datas',
    title: 'Calendário inteligente',
    description: 'Consulte combinações válidas de origem, destino, período e passageiros antes de decidir.',
    action: 'Consultar calendário',
    href: '/oportunidades/calendario',
    accent: 'gold',
  },
  {
    icon: MessageCircle,
    eyebrow: 'Conversar',
    title: 'Tomorrow Live',
    description: 'Descubra possibilidades em uma conversa com o Téo e veja as oportunidades aparecerem na experiência.',
    action: 'Entrar no Live',
    href: '/oportunidades/live',
    accent: 'teal',
  },
] as const;

export function RadarAccess() {
  return (
    <section className="relative overflow-hidden py-20 sm:py-24" aria-label="Formas de encontrar oportunidades">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,hsl(var(--teal)/0.08),transparent_45%)]" aria-hidden="true" />
      <div className="container relative mx-auto px-4 lg:px-8">
        <EditorialHeading eyebrow="Escolha seu caminho" align="center" size="lg">
          Três formas de encontrar o seu próximo amanhã.
        </EditorialHeading>
        <p className="mx-auto mt-5 max-w-2xl text-center text-sm leading-relaxed text-muted-foreground sm:text-lg">
          Explore por conta própria, compare datas ou converse com o Téo. Todos os caminhos levam ao mesmo inventário da Tomorrow Travel.
        </p>

        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {accessOptions.map((option) => {
            const Icon = option.icon;
            const teal = option.accent === 'teal';
            return (
              <Link
                key={option.href}
                to={option.href}
                className="group relative grid min-h-[22rem] grid-rows-[auto_1fr_auto] overflow-hidden rounded-[2rem] border border-gold/20 bg-ocean-mid/55 p-7 backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-gold/50 hover:shadow-[0_24px_80px_hsl(190_80%_2%/0.48)] sm:p-8"
              >
                <div className={`absolute -right-16 -top-16 size-48 rounded-full blur-3xl ${teal ? 'bg-teal/15' : 'bg-gold/15'}`} aria-hidden="true" />
                <div className="relative">
                  <span className={`grid size-14 place-items-center rounded-2xl border ${teal ? 'border-teal/35 bg-teal/10 text-teal-light' : 'border-gold/35 bg-gold/10 text-gold-light'}`}>
                    <Icon className="size-6" aria-hidden="true" />
                  </span>
                  <p className="mt-6 text-[0.6875rem] font-bold uppercase tracking-[0.22em] text-gold-light/75">{option.eyebrow}</p>
                  <h3 className="mt-3 font-editorial text-4xl leading-none text-foreground">{option.title}</h3>
                  <p className="mt-5 text-sm leading-relaxed text-muted-foreground">{option.description}</p>
                </div>
                <span className="relative mt-8 inline-flex items-center gap-2 font-semibold text-gold-light">
                  {option.action}
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </span>
              </Link>
            );
          })}
        </div>

        <div className="mt-8 flex justify-center">
          <Link to="/oportunidades/comparar" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-5 text-sm font-semibold text-muted-foreground transition hover:border-gold/35 hover:text-gold-light">
            <Scale className="size-4" aria-hidden="true" />
            Comparar oportunidades selecionadas
          </Link>
        </div>
      </div>
    </section>
  );
}
