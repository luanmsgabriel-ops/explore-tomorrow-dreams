import { Star, Quote } from 'lucide-react';
import { motion } from 'framer-motion';
import { EditorialHeading } from './EditorialHeading';
import { fadeUp, staggerContainer, scaleUp } from '@/lib/animations';

interface Testimonial {
  name: string;
  trip: string;
  text: string;
  avatar: string;
  rating: number;
}

const TESTIMONIALS: Testimonial[] = [
  {
    name: 'Camila R.',
    trip: 'Lua de mel · Maldivas',
    text: 'Conversei com o Téo num domingo à noite. Segunda de manhã já tinha a cotação completa. Achei que era robô, mas parecia papo de amiga. Incrível!',
    avatar: 'https://i.pravatar.cc/120?img=47',
    rating: 5
  },
  {
    name: 'Rafael e Júlia',
    trip: 'Família · Patagônia',
    text: 'Levamos as crianças pro fim do mundo sem stress nenhum. O concierge no WhatsApp salvou a gente quando o voo atrasou no Chile.',
    avatar: 'https://i.pravatar.cc/120?img=12',
    rating: 5
  },
  {
    name: 'Marina P.',
    trip: 'Solo · Japão',
    text: 'O roteiro tinha coisas que eu nunca acharia sozinha. Curadoria real. E o melhor: nenhum formulário gigante. Foi tudo no chat em minutos.',
    avatar: 'https://i.pravatar.cc/120?img=32',
    rating: 5
  },
  {
    name: 'Bruno T.',
    trip: 'Aventura · Noronha',
    text: 'Pedi “6 dias, mergulho e pouco turistão”. Voltou um roteiro absurdamente certeiro. O Téo realmente entende o que a gente quer.',
    avatar: 'https://i.pravatar.cc/120?img=68',
    rating: 5
  },
  {
    name: 'Fernanda L.',
    trip: 'Casal · Caribe',
    text: 'A cotação chegou em horas, não em dias. A agilidade da IA com o cuidado humano da Tomorrow é a combinação perfeita.',
    avatar: 'https://i.pravatar.cc/120?img=5',
    rating: 5
  },
  {
    name: 'Gustavo M.',
    trip: 'Business · Londres',
    text: 'Precisava de um hotel específico perto da City. O Téo resolveu em segundos e o consultor ainda conseguiu um upgrade no check-in.',
    avatar: 'https://i.pravatar.cc/120?img=11',
    rating: 5
  }
];

export const TestimonialsWall = () => {
  return (
    <section className="relative py-24 md:py-40 bg-[#020607] overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-teal/5 blur-[120px] rounded-full -z-10" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gold/5 blur-[120px] rounded-full -z-10" />

      <div className="container mx-auto px-4 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
        >
          <motion.div variants={fadeUp}>
            <EditorialHeading
              eyebrow="Experiências Reais"
              size="lg"
              align="center"
              className="mb-20 mx-auto max-w-3xl"
            >
              Histórias de quem trocou a busca pela
              <br />
              <span className="font-editorial-italic gradient-text-teal italic">conversa inteligente</span>.
            </EditorialHeading>
          </motion.div>

          <div className="columns-1 md:columns-2 lg:columns-3 gap-8 space-y-8">
            {TESTIMONIALS.map((t, i) => (
              <motion.figure
                key={t.name}
                variants={fadeUp}
                whileHover={{ y: -8 }}
                className="break-inside-avoid relative p-8 rounded-[2rem] border border-white/5 bg-white/5 backdrop-blur-xl transition-all duration-500 hover:border-gold/30 hover:bg-white/[0.07] group"
              >
                <div className="absolute top-6 right-8 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Quote className="w-12 h-12 text-gold" />
                </div>

                <div className="flex items-center gap-1 text-gold mb-6">
                  {[...Array(t.rating)].map((_, j) => (
                    <Star key={j} className="w-3.5 h-3.5 fill-current" />
                  ))}
                </div>

                <blockquote className="font-editorial text-xl md:text-2xl text-white leading-tight mb-8">
                  “{t.text}”
                </blockquote>

                <figcaption className="flex items-center gap-4 pt-6 border-t border-white/10">
                  <motion.img
                    variants={scaleUp}
                    src={t.avatar}
                    alt={t.name}
                    loading="lazy"
                    className="w-12 h-12 rounded-full object-cover ring-2 ring-gold/20"
                  />
                  <div>
                    <p className="text-base font-bold text-white tracking-wide">{t.name}</p>
                    <p className="text-xs text-white/40 uppercase tracking-widest">{t.trip}</p>
                  </div>
                </figcaption>
              </motion.figure>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};