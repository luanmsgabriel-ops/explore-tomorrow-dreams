import { Link } from 'react-router-dom';
import { MessageCircle, ArrowRight, Sparkles, ShieldCheck, Heart, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { TeoMascot } from '@/components/TeoMascot';
import { fadeUp, staggerContainer, scaleUp } from '@/lib/animations';
import swissVillage from '@/assets/hero-swiss-village.jpg';

export const ClosingCTA = () => {
  return (
    <section className="relative py-32 md:py-48 overflow-hidden bg-black isolate">
      {/* Swiss Village Background Image */}
      <img
        src={swissVillage}
        alt="Vila suíça com lago azul e montanhas"
        className="absolute inset-0 w-full h-full object-cover opacity-90 z-0"
      />

      {/* Dark overlay to keep text legible */}
      <div className="absolute inset-0 z-[1] bg-gradient-to-b from-black/40 via-black/25 to-black/50" />


      {/* Teal accent glow */}
      <div
        className="absolute inset-0 z-[1] opacity-20 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at center, rgba(0,255,200,0.15) 0%, transparent 70%)'
        }}
      />
      
      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        <motion.div 
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center"
        >

          <motion.div variants={fadeUp}>
            <h2 className="font-editorial text-5xl md:text-8xl lg:text-9xl text-white leading-[0.9] mb-8 text-center [text-shadow:_0_4px_24px_rgba(0,0,0,0.6)]">
              <span className="block drop-shadow-lg">Sua história</span>
              <span className="block font-editorial-italic gradient-text-teal italic pr-[0.15em] drop-shadow-lg">começa aqui.</span>
            </h2>

          </motion.div>

          <motion.p variants={fadeUp} className="text-lg md:text-2xl text-white/60 max-w-2xl mx-auto mb-14 leading-relaxed font-light">
            O Téo está online agora, esperando para transformar seus desejos em um roteiro inesquecível. Sem formulários, apenas uma conversa inspiradora.
          </motion.p>

          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
            <Link
              to="/teo"
              className="btn-gold flex items-center justify-center gap-4 text-xl px-12 py-6 group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/10 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              <MessageCircle className="w-6 h-6" />
              <span className="relative z-10 font-bold">Conversar com o Téo</span>
              <ArrowRight className="w-5 h-5 relative z-10 transition-transform group-hover:translate-x-2" />
            </Link>
            
            <a
              href="https://wa.me/5515991833448"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-3 text-white/50 hover:text-white transition-colors py-4 px-6"
            >
              <span className="text-lg font-medium">Falar via WhatsApp</span>
              <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center group-hover:border-white/40 transition-all">
                <ArrowRight className="w-4 h-4" />
              </div>
            </a>
          </motion.div>

          {/* Emotional Close & Trust */}
          <motion.div 
            variants={fadeUp}
            className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-16 border-t border-white/5"
          >
            <div className="flex flex-col items-center gap-3">
              <Sparkles className="w-6 h-6 text-gold/60" />
              <p className="text-[10px] uppercase tracking-[0.3em] text-white/40 font-bold">IA de Próxima Geração</p>
            </div>
            <div className="flex flex-col items-center gap-3">
              <Heart className="w-6 h-6 text-gold/60" />
              <p className="text-[10px] uppercase tracking-[0.3em] text-white/40 font-bold">Consultoria com Alma</p>
            </div>
            <div className="flex flex-col items-center gap-3">
              <ShieldCheck className="w-6 h-6 text-gold/60" />
              <p className="text-[10px] uppercase tracking-[0.3em] text-white/40 font-bold">Segurança Tomorrow</p>
            </div>
          </motion.div>

          <motion.div variants={fadeUp} className="mt-16 flex flex-col items-center gap-2">
            <p className="text-[10px] uppercase tracking-[0.4em] text-white/20">Tomorrow Travel · 2026</p>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => <Star key={i} className="w-2.5 h-2.5 fill-gold/40 text-transparent" />)}
              </div>
              <span className="text-[9px] text-white/30 uppercase tracking-widest font-medium">Excelência Comprovada</span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};