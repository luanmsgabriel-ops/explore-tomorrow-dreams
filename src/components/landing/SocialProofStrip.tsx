import { Star, Shield, Users, Award, Headphones } from 'lucide-react';
import { motion } from 'framer-motion';
import { fadeUp, staggerContainer } from '@/lib/animations';

const partners = [
  { name: 'LATAM', logo: 'https://cdn.worldvectorlogo.com/logos/latam-airlines-1.svg' },
  { name: 'Emirates', logo: 'https://upload.wikimedia.org/wikipedia/commons/d/d0/Emirates_logo.svg' },
  { name: 'Marriott', logo: 'https://cdn.worldvectorlogo.com/logos/marriott-international-1.svg' },
  { name: 'Four Seasons', logo: 'https://cdn.worldvectorlogo.com/logos/four-seasons-hotels-and-resorts.svg' },
  { name: 'Aman', logo: 'https://www.aman.com/themes/custom/aman/logo.svg' },
  { name: 'Belmond', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Belmond_logo.svg/1200px-Belmond_logo.svg.png' }
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
            <div className="flex -space-x-4">
              {avatars.map((src, i) => (
                <motion.img
                  key={i}
                  src={src}
                  alt=""
                  whileHover={{ y: -5, zIndex: 10 }}
                  className="w-12 h-12 rounded-full ring-4 ring-black object-cover cursor-pointer"
                />
              ))}
              <div className="w-12 h-12 rounded-full ring-4 ring-black bg-gold/10 flex items-center justify-center text-[10px] font-bold text-gold-light backdrop-blur-sm">
                +1.2k
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1 text-gold mb-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-current" />
                ))}
                <span className="ml-2 text-white font-bold text-lg">4.9/5</span>
              </div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 leading-none">
                Satisfação real de viajantes premium
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