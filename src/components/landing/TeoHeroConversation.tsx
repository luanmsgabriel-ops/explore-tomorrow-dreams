import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { MessageCircle, ArrowRight, Star, MousePointer2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { HeroBackgroundVideo } from './HeroBackgroundVideo';
import teoCharacter from '@/assets/teo-character.png';

const TEO_LINES = [
  'Pra onde a gente vai dessa vez?',
  'Conta pra mim: lua de mel, família ou aventura?',
  'Tenho um roteiro de Maldivas que vai te derrubar 🌊',
  'Em 2 minutos te mando a cotação completa.',
];

const avatars = [
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=64&h=64&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=64&h=64&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=64&h=64&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=64&h=64&q=80',
];

export const TeoHeroConversation = () => {
  const [lineIdx, setLineIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setLineIdx((i) => (i + 1) % TEO_LINES.length);
    }, 4500);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-20 pb-12">
      {/* Cinematic Background */}
      <HeroBackgroundVideo />
      
      {/* Dark Overlay & Gradients */}
      <div className="absolute inset-0 bg-black/40 -z-10" />
      <div 
        className="absolute inset-0 -z-10"
        style={{ 
          background: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.8) 100%)' 
        }}
      />

      {/* Ambient Light Orbs */}
      <motion.div 
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.1, 0.2, 0.1],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/4 -left-1/4 w-[500px] h-[500px] rounded-full bg-teal/20 blur-[120px] -z-10" 
      />
      <motion.div 
        animate={{ 
          scale: [1.2, 1, 1.2],
          opacity: [0.1, 0.15, 0.1],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-1/4 -right-1/4 w-[500px] h-[500px] rounded-full bg-gold/15 blur-[120px] -z-10" 
      />

      <div className="container mx-auto px-4 relative z-10 flex flex-col items-center">
        {/* Eyebrow */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="flex items-center gap-3 mb-8"
        >
          <span className="h-px w-6 bg-gold/60" />
          <span className="text-[10px] md:text-xs uppercase tracking-[0.4em] text-gold-light/90 font-medium">
            Inteligência Artificial + Consultoria Humana
          </span>
          <span className="h-px w-6 bg-gold/60" />
        </motion.div>

        {/* Headline */}
        <div className="text-center mb-12">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="font-editorial text-5xl md:text-8xl lg:text-9xl leading-[0.9] text-white"
          >
            <span className="block mb-2">Não procure a viagem</span>
            <span className="font-editorial-italic gradient-text-teal italic block mb-2">perfeita.</span>
            <span className="block opacity-90 text-4xl md:text-7xl lg:text-8xl">Converse com o Téo.</span>
          </motion.h1>
        </div>

        {/* Téo Protagonist Center */}
        <div className="relative mb-8 md:mb-12 flex items-center justify-center">
          {/* Téo Aura/Glow */}
          <motion.div
            animate={{ 
              scale: [1, 1.1, 1],
              opacity: [0.3, 0.5, 0.3]
            }}
            transition={{ duration: 4, repeat: Infinity }}
            className="absolute inset-0 bg-teal/30 rounded-full blur-[80px] -z-10 scale-150"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="relative"
          >
            {/* Mascot Image */}
            <motion.div
              animate={{ y: [0, -12, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="relative z-20"
            >
              <img 
                src={teoCharacter} 
                alt="Téo" 
                className="w-[200px] md:w-[280px] lg:w-[320px] h-auto drop-shadow-[0_20px_50px_rgba(0,180,180,0.4)]"
              />
            </motion.div>

            {/* Bubble - Right */}
            <AnimatePresence mode="wait">
              <motion.div
                key={lineIdx}
                initial={{ opacity: 0, x: 20, y: 10, scale: 0.8 }}
                animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="absolute -top-[90px] left-1/2 -translate-x-1/2 md:left-auto md:translate-x-0 md:-top-4 md:-right-32 lg:-right-48 z-30 w-[200px] md:w-[280px]"
              >
                <div className="glass-gold rounded-2xl rounded-bl-none px-5 py-4 shadow-[0_15px_30px_rgba(0,0,0,0.3)] border border-gold/20">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] uppercase tracking-widest text-gold-light font-bold">Téo</span>
                    <span className="flex gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    </span>
                  </div>
                  <p className="text-sm md:text-base text-white/90 leading-tight">
                    {TEO_LINES[lineIdx]}
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Typing Indicator - Left */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1 }}
              className="absolute bottom-10 -left-12 md:-left-20 glass rounded-full px-4 py-2 shadow-xl border border-white/10"
            >
              <div className="flex items-center gap-1.5">
                {[0, 0.2, 0.4].map((delay) => (
                  <motion.span
                    key={delay}
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay }}
                    className="w-1.5 h-1.5 rounded-full bg-teal"
                  />
                ))}
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Subheadline & CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="flex flex-col items-center"
        >
          <div className="flex flex-wrap justify-center gap-3 mb-6">
            <span className="px-3 py-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-[10px] font-bold tracking-[0.2em] text-white uppercase">100% Grátis</span>
            <span className="px-3 py-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-[10px] font-bold tracking-[0.2em] text-white uppercase">Roteiro em 10s</span>
            <span className="px-3 py-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-[10px] font-bold tracking-[0.2em] text-white uppercase">IA + Consultor Humano</span>
          </div>
          
          <p className="text-lg md:text-xl text-white/70 max-w-2xl text-center leading-relaxed mb-6 md:mb-8">
            Fale como fala com um amigo. O Téo cria seu roteiro personalizado em minutos — 
            e um consultor humano transforma em realidade.
          </p>

          <div className="flex flex-col sm:flex-row gap-5 mb-8 md:mb-10">
            <Link
              to="/teo"
              className="btn-gold flex items-center justify-center gap-4 text-lg px-10 py-5 group relative overflow-hidden"
            >
              <motion.div
                className="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-700"
              />
              <MessageCircle className="w-6 h-6" />
              <span className="relative z-10 font-semibold">Conversar com o Téo</span>
              <ArrowRight className="w-5 h-5 relative z-10 transition-transform group-hover:translate-x-2" />
            </Link>
            
            <Link
              to="/explorar"
              className="btn-outline border-white/20 bg-white/5 backdrop-blur-sm text-white hover:bg-white/10 flex items-center justify-center gap-2 text-lg px-10 py-5"
            >
              Ver roteiros reais
            </Link>
          </div>

          {/* Social Proof */}
          <div className="flex flex-col items-center gap-3">
            <div className="flex -space-x-3">
              {avatars.map((src, i) => (
                <motion.img
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 + (i * 0.1) }}
                  src={src}
                  alt=""
                  className="w-10 h-10 rounded-full ring-2 ring-black/40 object-cover"
                />
              ))}
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="flex items-center gap-1.5 text-gold-light mb-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current" />
                ))}
                <span className="ml-1 text-white font-bold">4.9/5</span>
              </div>
              <span className="text-xs uppercase tracking-[0.2em] text-white/50">Confiança de +1.200 viajantes premium</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 1 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3"
      >
        <span className="text-[10px] uppercase tracking-[0.4em] text-white/40">Rolar</span>
        <div className="w-px h-16 bg-gradient-to-b from-gold/80 to-transparent relative overflow-hidden">
          <motion.div 
            animate={{ y: [0, 64] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="absolute top-0 left-0 w-full h-1/2 bg-white/40"
          />
        </div>
      </motion.div>
    </section>
  );
};