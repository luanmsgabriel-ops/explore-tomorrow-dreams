import { useState, useEffect } from 'react';
import { MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { TeoMascot } from './TeoMascot';

export const FloatingWhatsApp = () => {
  const whatsappNumber = '5515998389220';
  const message = 'Olá! Vim pelo site e gostaria de saber mais sobre os pacotes de viagem.';
  const [showTeo, setShowTeo] = useState(false);
  
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;

  // Teo appears and hides periodically
  useEffect(() => {
    // Initial appearance after 2 seconds
    const initialTimeout = setTimeout(() => {
      setShowTeo(true);
    }, 2000);

    // Toggle visibility every 8 seconds
    const interval = setInterval(() => {
      setShowTeo(prev => !prev);
    }, 8000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-end gap-3">
      {/* Téo Animated Mascot - appears/hides to the left */}
      <AnimatePresence>
        {showTeo && (
          <motion.div
            initial={{ x: 50, opacity: 0, scale: 0.5 }}
            animate={{ x: 0, opacity: 1, scale: 1 }}
            exit={{ x: 50, opacity: 0, scale: 0.5 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            <Link to="/teo" className="block">
              <TeoMascot size="medium" animated showSpeechBubble />
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* WhatsApp Button */}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="relative flex items-center justify-center w-14 h-14 rounded-full bg-green-500 hover:bg-green-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 animate-fade-in"
        aria-label="Contato via WhatsApp"
      >
        <MessageCircle className="w-7 h-7" />
        
        {/* Pulse animation */}
        <span className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-30" />
      </a>
    </div>
  );
};