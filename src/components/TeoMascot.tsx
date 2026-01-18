import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TeoMascotProps {
  size?: 'small' | 'medium' | 'large';
  animated?: boolean;
  onClick?: () => void;
  showSpeechBubble?: boolean;
  speechText?: string;
}

const TEO_PHRASES = [
  "Eiiii! 👋",
  "Bora viajar? ✈️",
  "Tô aqui! 😄",
  "Fala comigo! 💬",
  "Owww! 🌴",
  "Ta calor aí? 🥵",
  "Partiu? 🎒",
];

export const TeoMascot = ({ 
  size = 'medium', 
  animated = true, 
  onClick,
  showSpeechBubble = false,
  speechText
}: TeoMascotProps) => {
  const [expression, setExpression] = useState<'happy' | 'wink' | 'surprised' | 'laugh'>('happy');
  const [isBlinking, setIsBlinking] = useState(false);
  const [currentPhrase, setCurrentPhrase] = useState(TEO_PHRASES[0]);
  const [showBubble, setShowBubble] = useState(showSpeechBubble);

  const sizeMap = {
    small: { width: 60, height: 60 },
    medium: { width: 120, height: 120 },
    large: { width: 200, height: 200 },
  };

  const { width, height } = sizeMap[size];

  // Random expressions
  useEffect(() => {
    if (!animated) return;

    const expressionInterval = setInterval(() => {
      const expressions: ('happy' | 'wink' | 'surprised' | 'laugh')[] = ['happy', 'wink', 'surprised', 'laugh'];
      setExpression(expressions[Math.floor(Math.random() * expressions.length)]);
    }, 3000);

    return () => clearInterval(expressionInterval);
  }, [animated]);

  // Blinking effect
  useEffect(() => {
    if (!animated) return;

    const blinkInterval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 150);
    }, 2500 + Math.random() * 2000);

    return () => clearInterval(blinkInterval);
  }, [animated]);

  // Speech bubble phrases
  useEffect(() => {
    if (!showSpeechBubble || speechText) return;

    const phraseInterval = setInterval(() => {
      setShowBubble(true);
      setCurrentPhrase(TEO_PHRASES[Math.floor(Math.random() * TEO_PHRASES.length)]);
      setTimeout(() => setShowBubble(false), 3000);
    }, 5000);

    // Show initial bubble
    setTimeout(() => {
      setShowBubble(true);
      setTimeout(() => setShowBubble(false), 3000);
    }, 1000);

    return () => clearInterval(phraseInterval);
  }, [showSpeechBubble, speechText]);

  const renderEyes = () => {
    if (isBlinking) {
      return (
        <>
          {/* Closed eyes - blinking */}
          <motion.path
            d="M 35 45 Q 42 42, 50 45"
            stroke="#1a1a2e"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
          />
          <motion.path
            d="M 70 45 Q 77 42, 85 45"
            stroke="#1a1a2e"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
          />
        </>
      );
    }

    switch (expression) {
      case 'wink':
        return (
          <>
            {/* Left eye - winking */}
            <motion.path
              d="M 35 45 Q 42 42, 50 45"
              stroke="#1a1a2e"
              strokeWidth="3"
              strokeLinecap="round"
              fill="none"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
            />
            {/* Right eye - open */}
            <motion.ellipse cx="77" cy="42" rx="12" ry="14" fill="white" stroke="#1a1a2e" strokeWidth="2" />
            <motion.circle cx="77" cy="44" r="7" fill="#1a1a2e" />
            <motion.circle cx="80" cy="41" r="3" fill="white" />
          </>
        );
      case 'surprised':
        return (
          <>
            {/* Wide open eyes */}
            <motion.ellipse 
              cx="42" cy="42" rx="14" ry="16" 
              fill="white" stroke="#1a1a2e" strokeWidth="2"
              animate={{ ry: [16, 18, 16] }}
              transition={{ duration: 0.3, repeat: Infinity, repeatDelay: 2 }}
            />
            <motion.circle cx="42" cy="44" r="8" fill="#1a1a2e" />
            <motion.circle cx="45" cy="41" r="3" fill="white" />
            
            <motion.ellipse 
              cx="77" cy="42" rx="14" ry="16" 
              fill="white" stroke="#1a1a2e" strokeWidth="2"
              animate={{ ry: [16, 18, 16] }}
              transition={{ duration: 0.3, repeat: Infinity, repeatDelay: 2 }}
            />
            <motion.circle cx="77" cy="44" r="8" fill="#1a1a2e" />
            <motion.circle cx="80" cy="41" r="3" fill="white" />
          </>
        );
      case 'laugh':
        return (
          <>
            {/* Happy squinting eyes */}
            <motion.path
              d="M 32 45 Q 42 38, 52 45"
              stroke="#1a1a2e"
              strokeWidth="3"
              strokeLinecap="round"
              fill="none"
            />
            <motion.path
              d="M 67 45 Q 77 38, 87 45"
              stroke="#1a1a2e"
              strokeWidth="3"
              strokeLinecap="round"
              fill="none"
            />
          </>
        );
      default: // happy
        return (
          <>
            {/* Left eye */}
            <motion.ellipse cx="42" cy="42" rx="12" ry="14" fill="white" stroke="#1a1a2e" strokeWidth="2" />
            <motion.circle 
              cx="42" cy="44" r="7" fill="#1a1a2e"
              animate={{ cx: [42, 44, 42, 40, 42] }}
              transition={{ duration: 4, repeat: Infinity }}
            />
            <motion.circle cx="45" cy="41" r="3" fill="white" />
            
            {/* Right eye */}
            <motion.ellipse cx="77" cy="42" rx="12" ry="14" fill="white" stroke="#1a1a2e" strokeWidth="2" />
            <motion.circle 
              cx="77" cy="44" r="7" fill="#1a1a2e"
              animate={{ cx: [77, 79, 77, 75, 77] }}
              transition={{ duration: 4, repeat: Infinity }}
            />
            <motion.circle cx="80" cy="41" r="3" fill="white" />
          </>
        );
    }
  };

  const renderMouth = () => {
    switch (expression) {
      case 'surprised':
        return (
          <motion.ellipse 
            cx="60" cy="72" rx="8" ry="10" 
            fill="#1a1a2e"
            animate={{ ry: [10, 12, 10] }}
            transition={{ duration: 0.5, repeat: Infinity }}
          />
        );
      case 'laugh':
        return (
          <>
            <motion.path
              d="M 40 65 Q 60 85, 80 65"
              fill="#1a1a2e"
              animate={{ d: ["M 40 65 Q 60 85, 80 65", "M 40 65 Q 60 90, 80 65", "M 40 65 Q 60 85, 80 65"] }}
              transition={{ duration: 0.3, repeat: Infinity }}
            />
            {/* Teeth */}
            <rect x="50" y="65" width="20" height="8" fill="white" rx="2" />
          </>
        );
      case 'wink':
        return (
          <motion.path
            d="M 45 68 Q 60 78, 75 68"
            stroke="#1a1a2e"
            strokeWidth="4"
            strokeLinecap="round"
            fill="none"
          />
        );
      default:
        return (
          <motion.path
            d="M 45 65 Q 60 80, 75 65"
            stroke="#1a1a2e"
            strokeWidth="4"
            strokeLinecap="round"
            fill="none"
            animate={{ d: ["M 45 65 Q 60 80, 75 65", "M 45 67 Q 60 78, 75 67", "M 45 65 Q 60 80, 75 65"] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        );
    }
  };

  return (
    <div className="relative inline-block" onClick={onClick}>
      {/* Speech Bubble */}
      <AnimatePresence>
        {(showBubble || speechText) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: 10 }}
            className="absolute -top-12 left-1/2 -translate-x-1/2 bg-white rounded-2xl px-3 py-2 shadow-lg border-2 border-amber-300 whitespace-nowrap z-10"
          >
            <span className="text-sm font-medium text-gray-800">{speechText || currentPhrase}</span>
            {/* Bubble tail */}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[10px] border-t-white" />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.svg
        width={width}
        height={height}
        viewBox="0 0 120 120"
        className="cursor-pointer drop-shadow-xl"
        animate={animated ? {
          y: [0, -5, 0],
          rotate: [0, -2, 2, 0],
        } : {}}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        {/* Definitions for gradients */}
        <defs>
          {/* Body gradient - warm orange/coral */}
          <linearGradient id="bodyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFB347" />
            <stop offset="50%" stopColor="#FF8C42" />
            <stop offset="100%" stopColor="#FF6B35" />
          </linearGradient>
          
          {/* Face gradient - lighter */}
          <radialGradient id="faceGradient" cx="40%" cy="30%" r="60%">
            <stop offset="0%" stopColor="#FFCC80" />
            <stop offset="100%" stopColor="#FFB347" />
          </radialGradient>
          
          {/* Cheek blush */}
          <radialGradient id="blushGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FF9999" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#FF9999" stopOpacity="0" />
          </radialGradient>

          {/* Shadow */}
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="3" floodOpacity="0.2"/>
          </filter>
        </defs>

        {/* Body/Head - main shape */}
        <motion.ellipse
          cx="60"
          cy="60"
          rx="50"
          ry="48"
          fill="url(#bodyGradient)"
          filter="url(#shadow)"
          animate={animated ? { rx: [50, 52, 50], ry: [48, 50, 48] } : {}}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Face area - lighter center */}
        <ellipse
          cx="60"
          cy="55"
          rx="42"
          ry="40"
          fill="url(#faceGradient)"
        />

        {/* Eyebrows */}
        <motion.path
          d="M 30 30 Q 42 25, 52 32"
          stroke="#8B4513"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
          animate={expression === 'surprised' ? { d: "M 30 25 Q 42 18, 52 25" } : {}}
        />
        <motion.path
          d="M 68 32 Q 78 25, 90 30"
          stroke="#8B4513"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
          animate={expression === 'surprised' ? { d: "M 68 25 Q 78 18, 90 25" } : {}}
        />

        {/* Eyes */}
        {renderEyes()}

        {/* Cheeks - blush */}
        <motion.circle 
          cx="25" cy="55" r="12" 
          fill="url(#blushGradient)"
          animate={{ opacity: [0.6, 0.8, 0.6] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <motion.circle 
          cx="95" cy="55" r="12" 
          fill="url(#blushGradient)"
          animate={{ opacity: [0.6, 0.8, 0.6] }}
          transition={{ duration: 2, repeat: Infinity }}
        />

        {/* Nose */}
        <ellipse cx="60" cy="55" rx="5" ry="4" fill="#E07020" />

        {/* Mouth */}
        {renderMouth()}

        {/* Little hair tuft */}
        <motion.path
          d="M 55 12 Q 60 5, 65 12 M 50 15 Q 55 8, 60 15 M 60 15 Q 65 8, 70 15"
          stroke="#8B4513"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
          animate={{ rotate: [-5, 5, -5] }}
          transition={{ duration: 1, repeat: Infinity }}
          style={{ transformOrigin: '60px 12px' }}
        />

        {/* Aviator hat/goggles on top - travel theme */}
        <motion.ellipse
          cx="60"
          cy="18"
          rx="25"
          ry="10"
          fill="#4A90A4"
          stroke="#2C5F73"
          strokeWidth="2"
        />
        <motion.ellipse
          cx="60"
          cy="20"
          rx="20"
          ry="6"
          fill="#5BA3B8"
        />
        {/* Goggle straps */}
        <path d="M 35 18 Q 30 25, 25 35" stroke="#2C5F73" strokeWidth="3" fill="none" />
        <path d="M 85 18 Q 90 25, 95 35" stroke="#2C5F73" strokeWidth="3" fill="none" />
      </motion.svg>
    </div>
  );
};
