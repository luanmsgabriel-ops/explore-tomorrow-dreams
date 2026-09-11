import { ArrowRight, Headphones, Radar, Scale, UserCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { EditorialHeading } from './EditorialHeading';
import { fadeUp, staggerContainer, lineDrawX, popIn } from '@/lib/animations';

const STEPS = [
  {
    n: '01',
    icon: Radar,
    title: 'Explore',
    desc: 'Acesse pacotes e bloqueios disponíveis no inventário atualizado da Tomorrow Travel.',
    time: 'em tempo real',
  },
  {
    n: '02',
    icon: Scale,
    title: 'Compare',
    desc: 'Filtre por origem, destino e período e selecione as oportunidades que fazem sentido para você.',
    time: 'no seu ritmo',
  },
  {
    n: '03',
    icon: UserCheck,
    title: 'Confirme',
    desc: 'Nosso time valida preço, disponibilidade e todos os detalhes antes da reserva.',
    time: 'com atendimento humano',
  },
  {
    n: '04',
    icon: Headphones,
    title: 'Viaje assistido',
    desc: 'A Tomorrow acompanha você antes, durante e depois da viagem pelos canais de atendimento.',
    time: 'do início ao retorno',
  },
];

export const HowItWorksTimeline = () => {
  return (
    <section className="relative py-16 md:py-24 border-t border-gold/10 overflow-hidden">
      <div className="container mx-auto px-4 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
        >
          <motion.div variants={fadeUp}>
            <EditorialHeading
              eyebrow="Como funciona"
              size="md"
              align="center"
              className="mb-14 mx-auto max-w-2xl md:mb-20"
            >
              Do radar à sua viagem.
              <br />
              <span className="font-editorial-italic gradient-text-teal">Simples assim.</span>
            </EditorialHeading>
          </motion.div>

          <div className="relative grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-12 md:gap-6">
            {/* Connecting line (desktop) */}
            <motion.div 
              variants={lineDrawX}
              className="hidden md:block absolute top-12 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent origin-left z-0" 
            />

            {STEPS.map((s, i) => {
              const Icon = s.icon;
              return (
                <motion.div 
                  key={s.n} 
                  variants={fadeUp}
                  className="relative flex flex-col items-center text-center group z-10"
                >
                  <div className="relative mb-8">
                    {/* Animated Glow on Hover */}
                    <motion.div 
                      className="absolute inset-0 -m-4 rounded-full bg-gold-light/5 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" 
                    />
                    
                    <motion.div 
                      variants={popIn}
                      whileHover={{ scale: 1.1, rotate: [0, -5, 5, 0] }}
                      transition={{ type: "spring", stiffness: 300, damping: 15 }}
                      className="relative w-24 h-24 rounded-full glass-gold flex items-center justify-center shadow-xl border border-white/10"
                    >
                      <Icon className="w-9 h-9 text-gold-light group-hover:text-gold transition-colors duration-300" />
                    </motion.div>
                    
                    <motion.span 
                      variants={popIn}
                      className="absolute -top-1 -right-1 font-editorial text-2xl text-gold-light/60 bg-black/40 backdrop-blur-md rounded-full w-10 h-10 flex items-center justify-center border border-white/5"
                    >
                      {s.n}
                    </motion.span>
                  </div>
                  
                  <motion.h3 
                    variants={fadeUp}
                    className="font-editorial text-3xl text-foreground mb-3 group-hover:text-gold-light transition-colors duration-300"
                  >
                    {s.title}
                  </motion.h3>
                  
                  <motion.p 
                    variants={fadeUp}
                    className="text-sm text-foreground/70 max-w-xs leading-relaxed mb-4"
                  >
                    {s.desc}
                  </motion.p>
                  
                  <motion.span 
                    variants={fadeUp}
                    className="text-[10px] uppercase tracking-[0.3em] text-gold-light/60 font-bold"
                  >
                    {s.time}
                  </motion.span>
                </motion.div>
              );
            })}
          </div>
          <motion.div 
            variants={fadeUp}
            className="mt-16 flex justify-center"
          >
            <Link
              to="/oportunidades/catalogo"
              className="btn-gold flex items-center gap-3 px-8 py-4 group"
            >
              <Radar className="w-5 h-5" />
              <span className="font-semibold">Explorar oportunidades</span>
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};
