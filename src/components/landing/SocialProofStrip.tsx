import { Star, Shield, Users, Award, Headphones } from 'lucide-react';
import { motion } from 'framer-motion';
import { fadeUp, staggerContainer } from '@/lib/animations';

const partners = [
  { name: 'Azul Viagens' },
  { name: 'HotelDo' },
  { name: 'Cativa' },
  { name: 'Orinter' },
  { name: 'BedsOnline' },
];

export const SocialProofStrip = () => {
  return (
    <section className="border-y border-white/5 bg-[#020607] relative overflow-hidden">
      <div className="container mx-auto px-4 lg:px-8 py-10">
        <motion.div 
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-center"
        >
          {/* Trust Metrics */}
          <motion.div variants={fadeUp} className="flex items-center gap-6">
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-gold/10 border border-gold/20">
              <Star className="w-6 h-6 text-gold fill-gold" />
            </div>
            <div>
              <div className="flex items-center gap-1 text-gold mb-1">
                <span className="text-white font-bold text-lg">5.0 / 5</span>
                <span className="ml-2 text-white/40 text-[10px] font-medium tracking-widest uppercase">Avaliações</span>
              </div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 leading-none">
                Confiança real de viajantes premium
              </p>
            </div>
          </motion.div>

          {/* Partner Logos Carousel (Static) */}
          <motion.div variants={fadeUp} className="flex flex-col items-center lg:items-center">
             <span className="text-[10px] uppercase tracking-[0.4em] text-white/30 mb-6 font-bold">
              Rede Global de Parceiros
            </span>
            <div className="flex flex-wrap justify-center gap-x-12 gap-y-6">
              {partners.map((p) => (
                <div key={p.name} className="flex items-center gap-3 group opacity-40 hover:opacity-100 transition-opacity duration-500">
                  <img 
                    src={p.logo} 
                    alt={p.name} 
                    className="h-6 md:h-8 w-auto grayscale group-hover:grayscale-0 transition-all duration-500 object-contain"
                  />
                </div>
              ))}
            </div>
          </motion.div>

          {/* Credibility Badges */}
          <motion.div variants={fadeUp} className="flex justify-center lg:justify-end gap-8">
            <div className="flex flex-col items-center gap-2">
              <Shield className="w-6 h-6 text-gold/60" />
              <span className="text-[9px] uppercase tracking-widest text-white/50 text-center">Seguro Viagem<br/>Incluso</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Headphones className="w-6 h-6 text-gold/60" />
              <span className="text-[9px] uppercase tracking-widest text-white/50 text-center">Concierge<br/>24/7 Global</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Award className="w-6 h-6 text-gold/60" />
              <span className="text-[9px] uppercase tracking-widest text-white/50 text-center">Selos de<br/>Curadoria</span>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Background Decorative Line */}
      <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
    </section>
  );
};