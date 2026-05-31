import { motion } from 'framer-motion';
import { EditorialHeading } from './EditorialHeading';
import { fadeUp, staggerContainer } from '@/lib/animations';

const STORIES = [
  {
    destination: "CABO FRIO • RJ",
    quote: "O atendimento foi personalizado, muito rápido e nos acompanhou do início ao fim.",
    author: "Alex Vieira",
    // Praia do Forte / Cabo Frio — RJ
    image: "https://images.unsplash.com/photo-1583416750470-965b2707b355?auto=format&fit=crop&w=800&q=80",
  },
  {
    destination: "BOMBINHAS + BETO CARRERO",
    quote: "Achei maravilhosa.",
    author: "Mylena Cavalheiro",
    // Praia de Bombinhas — SC
    image: "https://images.unsplash.com/photo-1535470850581-95288969cdb3?auto=format&fit=crop&w=800&q=80",
  },
  {
    destination: "MARAGOGI",
    quote: "Obrigada por essa experiência.",
    author: "Cliente Tomorrow Travel",
    // Piscinas naturais de Maragogi — AL
    image: "https://images.unsplash.com/photo-1621789098261-9c79a056af9d?auto=format&fit=crop&w=800&q=80",
  }
];


export const RealStories = () => {
  return (
    <section className="py-24 md:py-40 bg-[#020607]">
      <div className="container mx-auto px-4 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
        >
          <motion.div variants={fadeUp} className="mb-16 md:mb-24">
            <EditorialHeading
              eyebrow="Relatos de Confiança"
              size="lg"
            >
              Histórias reais dos <br />
              <span className="font-editorial-italic gradient-text-teal italic">nossos viajantes</span>
            </EditorialHeading>
            <p className="mt-6 text-white/50 font-editorial text-lg max-w-xl leading-relaxed">
              Cada viagem começa com um planejamento. Mas é durante a experiência que a confiança é construída.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {STORIES.map((story, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                className="group relative"
              >
                <div className="aspect-[3/4] overflow-hidden rounded-[2rem] border border-white/10 relative">
                  <img
                    src={story.image}
                    alt={story.destination}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
                  
                  <div className="absolute inset-0 p-8 flex flex-col justify-end">
                    <span className="text-gold text-[10px] tracking-[0.3em] font-bold mb-4">
                      {story.destination}
                    </span>
                    <blockquote className="text-white font-editorial text-xl md:text-2xl leading-tight mb-6">
                      “{story.quote}”
                    </blockquote>
                    <p className="text-white/70 font-bold tracking-wide uppercase text-xs">
                      {story.author}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};
