import { ArrowRight, CalendarDays, Radar } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

import { HeroCinematicBackground } from './HeroCinematicBackground';
import { HomeInventoryPulse } from './HomeInventoryPulse';

export function OpportunityHero() {
  return (
    <section className="relative flex min-h-[680px] items-center overflow-hidden px-4 pb-12 pt-28 sm:min-h-[720px] sm:pb-16 sm:pt-32 lg:min-h-[760px]">
      <HeroCinematicBackground />
      <div className="absolute inset-0 bg-gradient-to-b from-ocean-deep/20 via-ocean-deep/45 to-ocean-deep/90" aria-hidden="true" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_25%,transparent_0%,hsl(var(--ocean-deep)/0.38)_72%)]" aria-hidden="true" />

      <div className="container relative z-10 mx-auto flex flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-5 flex items-center gap-3"
        >
          <span className="h-px w-6 bg-gold/60" />
          <span className="text-[0.625rem] font-semibold uppercase tracking-[0.32em] text-gold-light sm:text-xs">
            Radar Tomorrow
          </span>
          <span className="h-px w-6 bg-gold/60" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="max-w-5xl font-editorial text-5xl leading-[0.9] text-white sm:text-7xl lg:text-8xl"
        >
          Oportunidades reais
          <span className="mt-2 block font-editorial-italic italic text-teal-light">
            para o seu próximo amanhã.
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-6 max-w-2xl text-sm leading-relaxed text-white/75 sm:text-lg"
        >
          Consulte pacotes e bloqueios aéreos disponíveis no inventário da Tomorrow Travel, com atualização automática e confirmação pelo nosso time.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-7"
        >
          <HomeInventoryPulse />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-7 flex w-full max-w-2xl flex-col gap-3 sm:w-auto sm:flex-row"
        >
          <Link
            to="/oportunidades/catalogo"
            className="inline-flex min-h-14 w-full items-center justify-center gap-3 rounded-xl border border-gold-light/70 bg-[var(--gradient-gold)] px-6 text-sm font-bold text-accent-foreground shadow-[var(--shadow-glow-gold)] transition-transform hover:scale-[1.02] sm:w-auto sm:min-w-64 sm:text-base"
          >
            <Radar className="size-5" aria-hidden="true" />
            Ver oportunidades
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
          <Link
            to="/oportunidades/calendario"
            className="inline-flex min-h-14 w-full items-center justify-center gap-3 rounded-xl border border-white/20 bg-ocean-deep/45 px-6 text-sm font-bold text-white backdrop-blur-xl transition hover:border-gold/45 hover:bg-ocean-deep/65 sm:w-auto sm:min-w-56 sm:text-base"
          >
            <CalendarDays className="size-5 text-gold-light" aria-hidden="true" />
            Ver calendário
          </Link>
        </motion.div>

        <p className="mt-4 text-xs text-white/50">
          Preços e disponibilidade sujeitos à confirmação no momento da reserva.
        </p>
      </div>
    </section>
  );
}
