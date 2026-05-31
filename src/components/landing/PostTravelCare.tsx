import { motion } from 'framer-motion';
import { fadeUp } from '@/lib/animations';

export const PostTravelCare = () => {
  return (
    <section className="py-24 md:py-40 bg-ocean-deep overflow-hidden">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="aspect-[4/5] rounded-[3rem] overflow-hidden border border-gold/20 shadow-2xl shadow-gold/5">
              <img
                src="https://images.unsplash.com/photo-1516483642773-2f66ef7c63f6?auto=format&fit=crop&w=1200&q=80"
                alt="Memória de viagem em porta-retrato"
                className="w-full h-full object-cover"
              />
            </div>
            {/* Decorative frame overlay element */}
            <div className="absolute -bottom-8 -right-8 w-64 h-64 border-2 border-gold/10 rounded-[3rem] -z-10" />
          </motion.div>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="flex flex-col"
          >
            <span className="text-gold text-xs tracking-[0.4em] uppercase font-bold mb-6">
              Atenção aos Detalhes
            </span>
            <h2 className="font-editorial text-4xl md:text-6xl text-white leading-tight mb-8">
              Algumas viagens terminam. <br />
              <span className="italic font-editorial-italic gradient-text-teal">Algumas continuam na memória.</span>
            </h2>
            <div className="space-y-6 text-white/60 font-editorial text-xl md:text-2xl leading-relaxed max-w-lg">
              <p>Gostamos de celebrar momentos especiais.</p>
              <p>
                Por isso alguns viajantes recebem lembranças personalizadas após suas viagens.
              </p>
              <p>
                Porque nosso trabalho não termina quando o avião pousa.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
