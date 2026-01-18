import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import teoCharacter from '@/assets/teo-character.png';

interface TeoMascotProps {
  size?: 'small' | 'medium' | 'large';
  animated?: boolean;
  onClick?: () => void;
  showSpeechBubble?: boolean;
  speechText?: string;
  bubblePosition?: 'left' | 'top';
}

const TEO_PHRASES = [
  "Eiiii! 👋",
  "Bora viajar? ✈️",
  "Tô aqui! 😄",
  "Fala comigo! 💬",
  "Owww! 🌴",
  "Partiu? 🎒",
];

export const TeoMascot = ({ 
  size = 'medium', 
  animated = true, 
  onClick,
  showSpeechBubble = false,
  speechText,
  bubblePosition = 'left'
}: TeoMascotProps) => {
  const [currentPhrase, setCurrentPhrase] = useState(TEO_PHRASES[0]);
  const [showBubble, setShowBubble] = useState(showSpeechBubble);

  const sizeMap = {
    small: { width: 48, height: 48 },
    medium: { width: 100, height: 100 },
    large: { width: 160, height: 160 },
  };

  const { width, height } = sizeMap[size];

  // Speech bubble phrases
  useEffect(() => {
    if (!showSpeechBubble || speechText) return;

    const phraseInterval = setInterval(() => {
      setShowBubble(true);
      setCurrentPhrase(TEO_PHRASES[Math.floor(Math.random() * TEO_PHRASES.length)]);
      setTimeout(() => setShowBubble(false), 3000);
    }, 6000);

    // Show initial bubble
    setTimeout(() => {
      setShowBubble(true);
      setTimeout(() => setShowBubble(false), 3000);
    }, 1500);

    return () => clearInterval(phraseInterval);
  }, [showSpeechBubble, speechText]);

  const bubbleClasses = bubblePosition === 'top' 
    ? "absolute -top-10 left-1/2 -translate-x-1/2 bg-white rounded-xl px-3 py-1.5 shadow-lg border-2 border-primary/30 whitespace-nowrap z-20"
    : "absolute right-full mr-2 bg-white rounded-xl px-3 py-1.5 shadow-lg border-2 border-primary/30 whitespace-nowrap z-20";

  const bubbleTailClasses = bubblePosition === 'top'
    ? "absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-white"
    : "absolute top-1/2 -right-2 -translate-y-1/2 w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-l-[8px] border-l-white";

  return (
    <div className="relative inline-flex items-center justify-center" onClick={onClick}>
      {/* Speech Bubble */}
      <AnimatePresence>
        {(showBubble || speechText) && showSpeechBubble && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: bubblePosition === 'top' ? 10 : 0, x: bubblePosition === 'left' ? 10 : 0 }}
            animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: bubblePosition === 'top' ? 10 : 0, x: bubblePosition === 'left' ? 10 : 0 }}
            className={bubbleClasses}
          >
            <span className="text-xs font-medium text-gray-800">{speechText || currentPhrase}</span>
            {/* Bubble tail */}
            <div className={bubbleTailClasses} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Teo Character Image with animations */}
      <motion.div
        className="cursor-pointer overflow-hidden rounded-full"
        style={{ width, height }}
        animate={animated ? {
          y: [0, -4, 0],
          rotate: [0, -2, 2, 0],
        } : {}}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <motion.img
          src={teoCharacter}
          alt="Téo - Assistente de Viagem"
          className="w-full h-full object-cover object-top"
          style={{ 
            filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.25))'
          }}
          animate={animated ? {
            scale: [1, 1.02, 1],
          } : {}}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </motion.div>
    </div>
  );
};
