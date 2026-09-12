import { useEffect, useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { EditorialHeading } from './EditorialHeading';
import { fadeUp, staggerContainer } from '@/lib/animations';
import storyCaboFrio from '@/assets/story-cabo-frio-praia-do-forte.jpg';
import storyBombinhas from '@/assets/story-bombinhas-beto-carrero.jpg';
import storyMaragogi from '@/assets/story-maragogi-piscinas-naturais.jpg';
import destChapada from '@/assets/dest-chapada.jpg';
import destIceland from '@/assets/dest-iceland.jpg';
import destKyoto from '@/assets/dest-kyoto.jpg';
import destLencois from '@/assets/dest-lencois.jpg';
import destMachuPicchu from '@/assets/dest-machupicchu.jpg';
import destMaldives from '@/assets/dest-maldives.jpg';

const STORIES = [
  {
    quote:
      'Experiência simplesmente incrível! Desde o primeiro contato até o final da viagem, o atendimento e o suporte foram impecáveis. Super recomendo para quem quer viajar sem preocupações.',
    author: 'Pitonga Gamer',
    image: storyCaboFrio,
  },
  {
    quote:
      'Viagem com a Tomorrow Travel na minha lua de mel, e foi a melhor experiência que tive, me deram todo o suporte necessário e nos surpreenderam positivamente durante a viagem com mimos, super recomendo.',
    author: 'Raquel Lima',
    image: destMaldives,
  },
  {
    quote:
      'Simplesmente adorei! A plataforma de IA me surpreendeu positivamente e a experiência de viagem foi incrível. Recomendo muito, agora só quero viajar assim!',
    author: 'lucas valario',
    image: destKyoto,
  },
  {
    quote:
      'Simplesmente incrível! Agradeço muito ao Luan pelo suporte excepcional e por cuidar de cada detalhe da nossa viagem. Recomendo de olhos fechados!',
    author: 'Lucas JOSE PEREIRA DA SILVA',
    image: destMachuPicchu,
  },
  {
    quote:
      'Desde o primeiro contato até pós viagens clareza nas informações e prontidão no atendimento, ótimo preço, ótimo atendimento.',
    author: 'Rafaela Camargo',
    image: storyBombinhas,
  },
  {
    quote: 'Muito bom! Ótimo atendimento.',
    author: 'Edson Carlos',
    image: destChapada,
  },
  {
    quote:
      'Ótimo atendimento, agilidade e prestatividade. Assistência do início ao fim das viagens. Fechei uma viagem com eles no início desse ano durante as minhas férias e tivemos uma experiência incrível. Já estou cotando mais uma com eles para o final do ano. Recomendo!!!!',
    author: 'Murilo Tirabassi',
    image: destIceland,
  },
  {
    quote: 'Eficiente, tecnológico e prático. Recomendo!',
    author: 'Plinio Marcos',
    image: destLencois,
  },
  {
    quote:
      'Experiência na busca de pacotes e bloqueios aéreos, nunca tive a oportunidade de viver algo prático ao cotar e planejar minha primeira viagem, recomendo demais. Usem o Radar deles. Fui para Gramado pagando apenas R$1150,00 por pessoa.',
    author: 'Ryan Santo',
    image: storyMaragogi,
  },
] as const;

const normalizeIndex = (index: number) => (index + STORIES.length) % STORIES.length;

const relativePosition = (index: number, activeIndex: number) => {
  let distance = index - activeIndex;
  const half = STORIES.length / 2;

  if (distance > half) distance -= STORIES.length;
  if (distance < -half) distance += STORIES.length;

  return distance;
};

export const RealStories = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  const visibleIndexes = useMemo(
    () => STORIES.map((_, index) => index).filter((index) => Math.abs(relativePosition(index, activeIndex)) <= 2),
    [activeIndex],
  );

  useEffect(() => {
    if (isPaused || shouldReduceMotion) return;

    const interval = window.setInterval(() => {
      setActiveIndex((current) => normalizeIndex(current + 1));
    }, 4800);

    return () => window.clearInterval(interval);
  }, [isPaused, shouldReduceMotion]);

  const goTo = (index: number) => setActiveIndex(normalizeIndex(index));

  return (
    <section className="overflow-hidden bg-[radial-gradient(ellipse_at_top,_#fde68a_0%,_#f5c542_35%,_#c8941f_70%,_#8a5a10_100%)] py-24 md:py-40">
      <div className="container mx-auto px-4 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
        >
          <motion.div variants={fadeUp} className="mb-12 md:mb-16">
            <EditorialHeading
              eyebrow="Relatos de Confiança"
              size="lg"
              className="[&_h2]:text-ocean-deep [&>span]:text-ocean-deep/70 [&>span>span]:bg-ocean-deep/40"
            >
              Histórias reais dos <br />
              <span className="font-editorial-italic gradient-text-teal italic">nossos viajantes</span>
            </EditorialHeading>
            <p className="mt-6 max-w-xl font-editorial text-lg leading-relaxed text-ocean-deep/80">
              Cada viagem começa com um planejamento. Mas é durante a experiência que a confiança é construída.
            </p>
          </motion.div>

          <motion.div
            variants={fadeUp}
            className="relative mx-auto h-[540px] max-w-6xl select-none md:h-[610px]"
            style={{ perspective: 1500 }}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            onFocusCapture={() => setIsPaused(true)}
            onBlurCapture={() => setIsPaused(false)}
          >
            <motion.div
              className="absolute inset-0 touch-pan-y"
              drag={shouldReduceMotion ? false : 'x'}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.12}
              onDragEnd={(_, info) => {
                if (info.offset.x < -55) goTo(activeIndex + 1);
                if (info.offset.x > 55) goTo(activeIndex - 1);
              }}
            >
              {STORIES.map((story, index) => {
                const position = relativePosition(index, activeIndex);
                const distance = Math.abs(position);
                const isActive = position === 0;
                const isVisible = visibleIndexes.includes(index);

                const x = position * (isActive ? 0 : 245);
                const y = distance === 0 ? 0 : distance === 1 ? 34 : 72;
                const scale = distance === 0 ? 1 : distance === 1 ? 0.84 : 0.68;
                const rotateY = shouldReduceMotion ? 0 : position * -15;
                const opacity = !isVisible ? 0 : distance === 0 ? 1 : distance === 1 ? 0.82 : 0.34;

                return (
                  <motion.article
                    key={story.author}
                    className="absolute left-1/2 top-1/2 w-[78vw] max-w-[360px] -translate-x-1/2 -translate-y-1/2 md:w-[390px] md:max-w-none"
                    initial={false}
                    animate={{
                      x,
                      y,
                      scale,
                      rotateY,
                      opacity,
                      zIndex: 20 - distance,
                    }}
                    transition={
                      shouldReduceMotion
                        ? { duration: 0 }
                        : { type: 'spring', stiffness: 115, damping: 20, mass: 0.9 }
                    }
                    aria-hidden={!isVisible}
                  >
                    <button
                      type="button"
                      className="group relative block aspect-[3/4] w-full overflow-hidden rounded-[2rem] border border-white/20 text-left shadow-[0_30px_80px_-28px_rgba(7,35,39,0.65)] outline-none focus-visible:ring-2 focus-visible:ring-ocean-deep/70"
                      onClick={() => goTo(index)}
                      tabIndex={isVisible ? 0 : -1}
                      aria-label={`Ver avaliação de ${story.author}`}
                    >
                      <img
                        src={story.image}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        width={1024}
                        height={1365}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.035]"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-black/5" />

                      <div className="absolute inset-0 flex flex-col justify-end p-7 md:p-8">
                        <div className="mb-4 flex items-center gap-3">
                          <span className="text-[11px] font-bold tracking-[0.18em] text-gold">★★★★★</span>
                          <span className="text-[9px] font-bold uppercase tracking-[0.22em] text-white/65">
                            Avaliação Google
                          </span>
                        </div>

                        <blockquote className="mb-6 font-editorial text-[1.35rem] leading-[1.08] text-white md:text-[1.55rem]">
                          “{story.quote}”
                        </blockquote>

                        <p className="text-[11px] font-bold uppercase tracking-[0.13em] text-white/75">
                          {story.author}
                        </p>
                      </div>

                      {isActive && !shouldReduceMotion && (
                        <motion.div
                          className="pointer-events-none absolute inset-0 rounded-[2rem] ring-1 ring-white/30"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: [0.25, 0.7, 0.25] }}
                          transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
                        />
                      )}
                    </button>
                  </motion.article>
                );
              })}
            </motion.div>

            <div className="absolute bottom-0 left-1/2 z-30 flex -translate-x-1/2 items-center gap-4">
              <button
                type="button"
                onClick={() => goTo(activeIndex - 1)}
                className="grid h-11 w-11 place-items-center rounded-full border border-ocean-deep/25 bg-ocean-deep/10 text-ocean-deep backdrop-blur-sm transition hover:bg-ocean-deep hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-deep/60"
                aria-label="Avaliação anterior"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              <div className="flex items-center gap-2" aria-label={`Avaliação ${activeIndex + 1} de ${STORIES.length}`}>
                {STORIES.map((story, index) => (
                  <button
                    key={story.author}
                    type="button"
                    onClick={() => goTo(index)}
                    className={`h-1.5 rounded-full transition-all duration-500 ${
                      index === activeIndex ? 'w-8 bg-ocean-deep' : 'w-1.5 bg-ocean-deep/35 hover:bg-ocean-deep/60'
                    }`}
                    aria-label={`Ir para avaliação ${index + 1}`}
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={() => goTo(activeIndex + 1)}
                className="grid h-11 w-11 place-items-center rounded-full border border-ocean-deep/25 bg-ocean-deep/10 text-ocean-deep backdrop-blur-sm transition hover:bg-ocean-deep hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-deep/60"
                aria-label="Próxima avaliação"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};
