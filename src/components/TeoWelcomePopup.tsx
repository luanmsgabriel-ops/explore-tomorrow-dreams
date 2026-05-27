import { useState, useEffect } from 'react';
import { X, MessageCircle, Star, Shield, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import teoCharacter from '@/assets/teo-character.png';

const WHATSAPP_LINK = 'https://wa.me/5515991833448?text=Olá!%20Vim%20pelo%20site%20e%20quero%20conhecer%20o%20Téo!';
const STORAGE_KEY = 'hasSeenTeoPopup';

export const TeoWelcomePopup = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const hasSeen = localStorage.getItem(STORAGE_KEY);
    if (!hasSeen) {
      const timer = setTimeout(() => setIsOpen(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem(STORAGE_KEY, 'true');
  };

  const handleWhatsApp = () => {
    window.open(WHATSAPP_LINK, '_blank');
    handleClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 30 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 flex items-center justify-center z-[101] p-4"
          >
            <div className="relative w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-b from-card to-background border border-border">
              {/* Close */}
              <button
                onClick={handleClose}
                className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-muted/80 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Glow accent */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full bg-primary/20 blur-3xl pointer-events-none" />

              {/* Content */}
              <div className="relative px-8 pt-8 pb-10 text-center">
                {/* Teo avatar */}
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                  className="mx-auto mb-5 w-28 h-28 md:w-32 md:h-32"
                >
                  <img
                    src={teoCharacter}
                    alt="Téo - Agente de IA"
                    className="w-full h-full object-contain drop-shadow-lg"
                  />
                </motion.div>

                {/* Badge */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-primary/20 text-primary text-xs md:text-sm font-bold mb-3 border border-primary/30 shadow-sm shadow-primary/10"
                >
                  <Sparkles className="w-4 h-4" />
                  🌍 1º Agente de IA de Viagens B2C do Mundo
                </motion.div>

                {/* Title */}
                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="font-serif text-2xl md:text-3xl font-bold text-foreground mb-2"
                >
                  Conheça o Téo! 🌍
                </motion.h2>

                {/* Subtitle */}
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  className="text-base md:text-lg font-semibold gradient-text-gold mb-4"
                >
                  ⚡ Sua cotação em minutos
                </motion.p>

                {/* Description */}
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-base md:text-lg text-muted-foreground mb-6 leading-relaxed"
                >
                  Receba cotações em minutos, tire dúvidas sobre destinos e monte sua viagem dos sonhos com IA.{' '}
                  <span className="text-foreground font-medium">Disponível 24/7 no WhatsApp!</span>
                </motion.p>

                {/* Trust badges */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="flex items-center justify-center gap-4 mb-6 text-xs text-muted-foreground"
                >
                  <span className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-accent" /> 500+ avaliações
                  </span>
                  <span className="flex items-center gap-1">
                    <Shield className="w-3.5 h-3.5 text-primary" /> Cadastur
                  </span>
                </motion.div>

                {/* CTA */}
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.45 }}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleWhatsApp}
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-base transition-colors shadow-lg shadow-[#25D366]/25"
                >
                  <MessageCircle className="w-5 h-5" />
                  Falar com o Téo no WhatsApp
                </motion.button>

                {/* Secondary link */}
                <motion.a
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.55 }}
                  href="/teo"
                  onClick={handleClose}
                  className="inline-block mt-4 text-sm text-primary hover:underline"
                >
                  Saiba mais sobre o Téo →
                </motion.a>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
