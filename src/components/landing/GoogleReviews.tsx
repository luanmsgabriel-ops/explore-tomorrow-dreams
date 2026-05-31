import { Star, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { fadeUp, staggerContainer } from '@/lib/animations';

const GOOGLE_REVIEWS = [
  {
    text: "Melhor custo benefício",
  },
  {
    text: "O melhor preço e o melhor atendimento",
  },
  {
    text: "Concretizar seus sonhos com as melhores viagens",
  }
];

export const GoogleReviews = () => {
  return (
    <section className="py-24 bg-[#020607]">
      <div className="container mx-auto px-4 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="max-w-4xl mx-auto"
        >
          <motion.div variants={fadeUp} className="text-center mb-16">
            <h2 className="text-white font-editorial text-3xl md:text-5xl mb-6">Avaliações públicas</h2>
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-1 text-gold">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-current" />
                ))}
                <span className="ml-3 text-2xl font-bold text-white">5.0</span>
              </div>
              <div className="flex items-center gap-2 text-white/40 text-sm uppercase tracking-widest">
                <CheckCircle2 className="w-4 h-4 text-teal" />
                4 avaliações verificadas no Google
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {GOOGLE_REVIEWS.map((review, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                className="p-8 rounded-3xl border border-white/5 bg-white/[0.02] flex flex-col justify-center items-center text-center group hover:border-gold/20 transition-colors"
              >
                <div className="flex items-center gap-1 text-gold mb-4 opacity-40 group-hover:opacity-100 transition-opacity">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="w-3 h-3 fill-current" />
                  ))}
                </div>
                <p className="font-editorial text-lg md:text-xl text-white/80 leading-snug">
                  “{review.text}”
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};
