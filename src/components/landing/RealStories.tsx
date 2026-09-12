import { useEffect, useState } from 'react';
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

const quoteSize = (quote: string) => {
  if (quote.length > 220) return 'text-[0.82rem] leading-[1.16] md:text-[1.02rem] md:leading-[1.18]';
  if (quote.length > 165) return 'text-[0.9rem] leading-[1.15] md:text-[1.12rem] md:leading-[1.17]';
  if (quote.length > 110) return 'text-[1rem] leading-[1.12] md:text-[1.25rem] md:leading-[1.14]';
  return 'text-[1.12rem] leading-[1.1] md:text-[1.4rem] md:leading-[1.1]';
};

export const RealStories = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches,
  );
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    const media = window.matchMedia('(max-width: 767px)');
    const onChange = () => setIsMobile(media.matches);

    onChange();
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    if (isPaused || shouldReduceMotion) return;

    const interval = window.setInterval(() => {
      setActiveIndex((current) => normalizeIndex(current + 1));
    }, 4800);

    return () => window.clearInterval(interval);
  }, [isPaused, shouldReduceMotion]);

  const goTo = (index: number) => setActiveIndex(normalizeIndex(index));

  return (
    <section className="overflow-hidden bg-[radial-gradient(ellipse_at_top,_#fde68a_0%,_#f5c542_35%,_#c8941f_70%,_#8a5a10_100%)] py-16 md:py-28 lg:py-32">
      <div className="container mx-auto px-4 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
        >
          <motion.div variants={fadeUp} className="mb-8 md:mb-12">
            <EditorialHeading
              eyebrow="Relatos de Confiança"
              size="lg"
              className="[&_h2]:text-ocean-deep [&>span]:text-ocean-deep/70 [&>span>span]:bg-ocean-deep/40"
            >
              Histórias reais dos <br />
              <span className="font-editorial-italic gradient-text-teal italic">nossos viajantes</span>
            </EditorialHeading>
            <p className="mt-5 max-w-xl font-editorial text-base leading-relaxed text-ocean-deep/80 md:text-lg">
              Cada viagem começa com um planejamento. Mas é durante a experiência que a confiança é construída.
            </p>
          </motion.div>

          <motion.div
            variants={fadeUp}
            className="relative mx-auto h-[430px] w-full max-w-6xl select-none md:h-[540px]"
            style={{ perspective: 1400 }}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            onFocusCapture={() => setIsPaused(true)}
            onBlurCapture={() => setIsPaused(false)}
          >
            <motion.div
              className="absolute inset-x-0 top-0 h-[378px] touch-pan-y md:h-[480px]"
              drag={shouldReduceMotion ? false : 'x'}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.1}
              onDragEnd={(_, info) => {
                if (info.offset.x < -45) goTo(activeIndex + 1);
                if (info.offset.x > 45) goTo(activeIndex - 1);
              }}
            >
              {STORIES.map((story, index) => {
                const position = relativePosition(index, activeIndex);
                const distance = Math.abs(position);
                const maxVisibleDistance = isMobile ? 1 : 2;
                const isVisible = distance <= maxVisibleDistance;
                const isActive = position === 0;
                const direction = position === 0 ? 0 : position > 0 ? 1 : -1;

                const x = isMobile
                  ? direction * 150
                  : direction * (distance === 1 ? 245 : 430);
                const y = distance === 0 ? 0 : distance === 1 ? 22 : 48;
                const scale = distance === 0 ? 1 : distance === 1 ? 0.78 : 0.64;
                const rotateY = shouldReduceMotion ? 0 : direction * (distance === 1 ? -11 : -18);
                const opacity = !isVisible ? 0 : distance === 0 ? 1 : distance === 1 ? 0.72 : 0.26;

                return (
                  <motion.article
                    key={story.author}
                    className="absolute left-1/2 top-[46%] w-[260px] -translate-x-1/2 -translate-y-1/2 md:top-1/2 md:w-[340px]"
                    initial={false}
                    animate={{ x, y, scale, rotateY, opacity, zIndex: 30 - distance }}
                    transition={
                      shouldReduceMotion
                        ? { duration: 0 }
                        : { type: 'spring', stiffness: 125, damping: 22, mass: 0.85 }
                    }
                    style={{ pointerEvents: isVisible ? 'auto' : 'none' }}
                    aria-hidden={!isVisible}
                  >
                    <button
                      type="button"
                      className="group relative block aspect-[3/4] w-full overflow-hidden rounded-[1.6rem] border border-white/20 text-left shadow-[0_24px_58px_-24px_rgba(7,35,39,0.6)] outline-none focus-visible:ring-2 focus-visible:ring-ocean-deep/70 md:rounded-[2rem]"
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
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.025]"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/42 to-black/5" />

                      <div className="absolute inset-0 flex flex-col justify-end p-5 md:p-7">
                        <div className="mb-3 flex items-center gap-2 md:mb-4 md:gap-3">
                          <span className="whitespace-nowrap text-[9px] font-bold tracking-[0.12em] text-gold md:text-[11px] md:tracking-[0.18em]">
                            ★★★★★
                          </span>
                          <span className="whitespace-nowrap text-[7px] font-bold uppercase tracking-[0.14em] text-white/65 md:text-[9px] md:tracking-[0.22em]">
                            Avaliação Google
                          </span>
                        </div>

                        <blockquote className={`mb-4 font-editorial text-white md:mb-5 ${quoteSize(story.quote)}`}>
                          “{story.quote}”
                        </blockquote>

                        <p className="text-[9px] font-bold uppercase tracking-[0.11em] text-white/75 md:text-[11px] md:tracking-[0.13em]">
                          {story.author}
                        </p>
                      </div>

                      {isActive && !shouldReduceMotion && (
                        <motion.div
                          className="pointer-events-none absolute inset-0 rounded-[1.6rem] ring-1 ring-white/25 md:rounded-[2rem]"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: [0.2, 0.58, 0.2] }}
                          transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
                        />
                      )}
                    </button>
                  </motion.article>
                );
              })}
            </motion.div>

            <div className="absolute bottom-0 left-1/2 z-40 flex -translate-x-1/2 items-center gap-2.5 md:gap-4">
              <button
                type="button"
                onClick={() => goTo(activeIndex - 1)}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-ocean-deep/25 bg-white/20 text-ocean-deep backdrop-blur-sm transition hover:bg-ocean-deep hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-deep/60 md:h-11 md:w-11"
                aria-label="Avaliação anterior"
              >
                <ChevronLeft className="h-4 w-4 md:h-5 md:w-5" />
              </button>

              <div className="flex items-center gap-1.5 md:gap-2" aria-label={`Avaliação ${activeIndex + 1} de ${STORIES.length}`}>
                {STORIES.map((story, index) => (
                  <button
                    key={story.author}
                    type="button"
                    onClick={() => goTo(index)}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      index === activeIndex ? 'w-6 bg-ocean-deep md:w-8' : 'w-1.5 bg-ocean-deep/35 hover:bg-ocean-deep/60'
                    }`}
                    aria-label={`Ir para avaliação ${index + 1}`}
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={() => goTo(activeIndex + 1)}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-ocean-deep/25 bg-white/20 text-ocean-deep backdrop-blur-sm transition hover:bg-ocean-deep hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-deep/60 md:h-11 md:w-11"
                aria-label="Próxima avaliação"
              >
                <ChevronRight className="h-4 w-4 md:h-5 md:w-5" />
              </button>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};
