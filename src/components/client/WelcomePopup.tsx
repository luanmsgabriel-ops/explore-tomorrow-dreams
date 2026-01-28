import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { X, Plane } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface WelcomePopupProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string | null;
  userName: string;
  customCaption?: string | null;
}

export const WelcomePopup = ({ isOpen, onClose, imageUrl, userName, customCaption }: WelcomePopupProps) => {
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setImageLoaded(false);
    }
  }, [isOpen]);

  if (!imageUrl) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl md:max-w-2xl p-0 overflow-hidden bg-transparent border-none shadow-none">
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="relative rounded-2xl overflow-hidden bg-card shadow-2xl"
            >
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center text-foreground hover:bg-background transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Welcome Text Header */}
              <div className="relative z-10 px-6 pt-6 pb-4 text-center bg-gradient-to-b from-background to-transparent">
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                >
                  {customCaption ? (
                    <h2 className="font-serif text-xl md:text-2xl font-bold text-foreground mb-2">
                      {customCaption}
                    </h2>
                  ) : (
                    <>
                      <h2 className="font-serif text-xl md:text-2xl font-bold text-foreground mb-2">
                        Bem-vindo ao início da sua próxima história.
                      </h2>
                      <p className="text-sm md:text-base text-muted-foreground">
                        Com a <span className="text-primary font-semibold">Tomorrow Travel</span> sua experiência 
                        começa antes mesmo da sua <span className="gradient-text-gold font-semibold">VIAGEM</span>
                        <Plane className="inline-block w-4 h-4 ml-1 text-accent" />
                      </p>
                    </>
                  )}
                </motion.div>
              </div>

              {/* Image Container */}
              <div className="relative">
                {!imageLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center bg-secondary/50 min-h-[300px]">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
                <motion.img
                  src={imageUrl}
                  alt="Boas-vindas"
                  className={`w-full h-auto max-h-[60vh] object-cover transition-opacity duration-500 ${
                    imageLoaded ? 'opacity-100' : 'opacity-0'
                  }`}
                  onLoad={() => setImageLoaded(true)}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: imageLoaded ? 1 : 0 }}
                />
                
                {/* Gradient Overlay at Bottom */}
                <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-card to-transparent" />
              </div>

              {/* Footer */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="p-6 text-center bg-card"
              >
                <p className="text-lg font-serif text-foreground">
                  Olá, <span className="gradient-text-teal font-bold">{userName}</span>!
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Sua jornada dos sonhos começa agora ✨
                </p>
                <button
                  onClick={onClose}
                  className="mt-4 px-8 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-colors"
                >
                  Explorar Minha Viagem
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};
