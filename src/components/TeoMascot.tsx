import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TeoMascotProps {
  size?: 'small' | 'medium' | 'large';
  animated?: boolean;
  onClick?: () => void;
  showSpeechBubble?: boolean;
  speechText?: string;
  bubblePosition?: 'left' | 'top'; // Position of speech bubble
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
  const [expression, setExpression] = useState<'happy' | 'wink' | 'surprised' | 'laugh'>('happy');
  const [isBlinking, setIsBlinking] = useState(false);
  const [currentPhrase, setCurrentPhrase] = useState(TEO_PHRASES[0]);
  const [showBubble, setShowBubble] = useState(showSpeechBubble);

  const sizeMap = {
    small: { width: 48, height: 48 },
    medium: { width: 100, height: 100 },
    large: { width: 160, height: 160 },
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
    }, 6000);

    // Show initial bubble
    setTimeout(() => {
      setShowBubble(true);
      setTimeout(() => setShowBubble(false), 3000);
    }, 1500);

    return () => clearInterval(phraseInterval);
  }, [showSpeechBubble, speechText]);

  const renderEyes = () => {
    if (isBlinking) {
      return (
        <>
          {/* Closed eyes - blinking */}
          <motion.path
            d="M 28 52 Q 34 49, 40 52"
            stroke="#2d1810"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
          />
          <motion.path
            d="M 60 52 Q 66 49, 72 52"
            stroke="#2d1810"
            strokeWidth="2.5"
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
              d="M 28 52 Q 34 48, 40 52"
              stroke="#2d1810"
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
            />
            {/* Right eye - open */}
            <ellipse cx="66" cy="50" rx="8" ry="9" fill="white" />
            <circle cx="66" cy="51" r="5" fill="#2d1810" />
            <circle cx="68" cy="49" r="2" fill="white" />
          </>
        );
      case 'surprised':
        return (
          <>
            {/* Wide open eyes */}
            <motion.ellipse 
              cx="34" cy="50" rx="9" ry="11" 
              fill="white"
              animate={{ ry: [11, 12, 11] }}
              transition={{ duration: 0.3, repeat: Infinity, repeatDelay: 2 }}
            />
            <motion.circle cx="34" cy="51" r="5" fill="#2d1810" />
            <motion.circle cx="36" cy="49" r="2" fill="white" />
            
            <motion.ellipse 
              cx="66" cy="50" rx="9" ry="11" 
              fill="white"
              animate={{ ry: [11, 12, 11] }}
              transition={{ duration: 0.3, repeat: Infinity, repeatDelay: 2 }}
            />
            <motion.circle cx="66" cy="51" r="5" fill="#2d1810" />
            <motion.circle cx="68" cy="49" r="2" fill="white" />
          </>
        );
      case 'laugh':
        return (
          <>
            {/* Happy squinting eyes */}
            <motion.path
              d="M 26 52 Q 34 45, 42 52"
              stroke="#2d1810"
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
            />
            <motion.path
              d="M 58 52 Q 66 45, 74 52"
              stroke="#2d1810"
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
            />
          </>
        );
      default: // happy
        return (
          <>
            {/* Left eye */}
            <ellipse cx="34" cy="50" rx="8" ry="9" fill="white" />
            <motion.circle 
              cx="34" cy="51" r="5" fill="#2d1810"
              animate={{ cx: [34, 36, 34, 32, 34] }}
              transition={{ duration: 4, repeat: Infinity }}
            />
            <circle cx="36" cy="49" r="2" fill="white" />
            
            {/* Right eye */}
            <ellipse cx="66" cy="50" rx="8" ry="9" fill="white" />
            <motion.circle 
              cx="66" cy="51" r="5" fill="#2d1810"
              animate={{ cx: [66, 68, 66, 64, 66] }}
              transition={{ duration: 4, repeat: Infinity }}
            />
            <circle cx="68" cy="49" r="2" fill="white" />
          </>
        );
    }
  };

  const renderMouth = () => {
    switch (expression) {
      case 'surprised':
        return (
          <motion.ellipse 
            cx="50" cy="72" rx="6" ry="8" 
            fill="#8B4513"
            animate={{ ry: [8, 10, 8] }}
            transition={{ duration: 0.5, repeat: Infinity }}
          />
        );
      case 'laugh':
        return (
          <>
            <motion.path
              d="M 35 68 Q 50 82, 65 68"
              fill="#8B4513"
              animate={{ d: ["M 35 68 Q 50 82, 65 68", "M 35 68 Q 50 85, 65 68", "M 35 68 Q 50 82, 65 68"] }}
              transition={{ duration: 0.4, repeat: Infinity }}
            />
            {/* Teeth */}
            <rect x="42" y="68" width="16" height="6" fill="white" rx="2" />
          </>
        );
      case 'wink':
        return (
          <motion.path
            d="M 38 68 Q 50 76, 62 68"
            stroke="#8B4513"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
          />
        );
      default:
        return (
          <motion.path
            d="M 38 68 Q 50 78, 62 68"
            stroke="#8B4513"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
            animate={{ d: ["M 38 68 Q 50 78, 62 68", "M 38 70 Q 50 76, 62 70", "M 38 68 Q 50 78, 62 68"] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        );
    }
  };

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

      <motion.svg
        width={width}
        height={height}
        viewBox="0 0 100 100"
        className="cursor-pointer drop-shadow-lg"
        animate={animated ? {
          y: [0, -3, 0],
          rotate: [0, -1, 1, 0],
        } : {}}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        {/* Definitions for gradients */}
        <defs>
          {/* Skin gradient - warm peachy tone */}
          <radialGradient id="skinGradient" cx="40%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#FFE0C2" />
            <stop offset="50%" stopColor="#FFD4B0" />
            <stop offset="100%" stopColor="#F5C49C" />
          </radialGradient>
          
          {/* Hair gradient - brown */}
          <linearGradient id="hairGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#5D4037" />
            <stop offset="50%" stopColor="#4E342E" />
            <stop offset="100%" stopColor="#3E2723" />
          </linearGradient>
          
          {/* Shirt gradient - primary travel color */}
          <linearGradient id="shirtGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0891B2" />
            <stop offset="100%" stopColor="#0E7490" />
          </linearGradient>
          
          {/* Cheek blush */}
          <radialGradient id="blushGradient2" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFAAAA" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#FFAAAA" stopOpacity="0" />
          </radialGradient>

          {/* 3D shadow */}
          <filter id="shadow3d" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="2" dy="4" stdDeviation="3" floodColor="#000" floodOpacity="0.2"/>
          </filter>
          
          {/* Inner shadow for depth */}
          <filter id="innerShadow">
            <feGaussianBlur in="SourceAlpha" stdDeviation="2" result="blur"/>
            <feOffset in="blur" dx="1" dy="2" result="offsetBlur"/>
            <feComposite in="SourceGraphic" in2="offsetBlur" operator="over"/>
          </filter>
        </defs>

        {/* Body/Shirt */}
        <motion.ellipse
          cx="50"
          cy="95"
          rx="28"
          ry="15"
          fill="url(#shirtGradient)"
          filter="url(#shadow3d)"
        />
        
        {/* Neck */}
        <rect x="42" y="78" width="16" height="12" fill="url(#skinGradient)" />

        {/* Head - main shape */}
        <motion.ellipse
          cx="50"
          cy="48"
          rx="35"
          ry="38"
          fill="url(#skinGradient)"
          filter="url(#shadow3d)"
          animate={animated ? { ry: [38, 39, 38] } : {}}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Ears */}
        <ellipse cx="16" cy="52" rx="6" ry="8" fill="url(#skinGradient)" />
        <ellipse cx="17" cy="52" rx="3" ry="5" fill="#E8C4A8" />
        <ellipse cx="84" cy="52" rx="6" ry="8" fill="url(#skinGradient)" />
        <ellipse cx="83" cy="52" rx="3" ry="5" fill="#E8C4A8" />

        {/* Hair base - covers top of head */}
        <ellipse 
          cx="50" 
          cy="22" 
          rx="32" 
          ry="18" 
          fill="url(#hairGradient)"
        />
        
        {/* Spiky hair - multiple tufts */}
        <motion.g
          animate={animated ? { rotate: [-2, 2, -2] } : {}}
          transition={{ duration: 2, repeat: Infinity }}
          style={{ transformOrigin: '50px 20px' }}
        >
          {/* Center spike */}
          <path
            d="M 45 18 Q 50 2, 55 18"
            fill="url(#hairGradient)"
          />
          {/* Left spikes */}
          <path
            d="M 28 28 Q 25 12, 35 22"
            fill="url(#hairGradient)"
          />
          <path
            d="M 35 22 Q 38 8, 45 18"
            fill="url(#hairGradient)"
          />
          {/* Right spikes */}
          <path
            d="M 55 18 Q 62 8, 65 22"
            fill="url(#hairGradient)"
          />
          <path
            d="M 65 22 Q 75 12, 72 28"
            fill="url(#hairGradient)"
          />
          {/* Extra small spikes for texture */}
          <path
            d="M 40 16 Q 42 6, 48 14"
            fill="#4E342E"
          />
          <path
            d="M 52 14 Q 58 6, 60 16"
            fill="#4E342E"
          />
        </motion.g>
        
        {/* Hair highlight/shine */}
        <ellipse cx="42" cy="20" rx="6" ry="3" fill="#6D4C41" opacity="0.5" />

        {/* Eyebrows */}
        <motion.path
          d="M 24 40 Q 34 36, 42 40"
          stroke="#4E342E"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
          animate={expression === 'surprised' ? { d: "M 24 36 Q 34 30, 42 36" } : {}}
        />
        <motion.path
          d="M 58 40 Q 66 36, 76 40"
          stroke="#4E342E"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
          animate={expression === 'surprised' ? { d: "M 58 36 Q 66 30, 76 36" } : {}}
        />

        {/* Eyes */}
        {renderEyes()}

        {/* Nose */}
        <ellipse cx="50" cy="60" rx="4" ry="3" fill="#E8B898" />
        <path d="M 48 63 Q 50 65, 52 63" stroke="#D4A574" strokeWidth="1" fill="none" />

        {/* Cheeks - blush */}
        <motion.ellipse 
          cx="24" cy="62" rx="8" ry="6" 
          fill="url(#blushGradient2)"
          animate={{ opacity: [0.5, 0.7, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <motion.ellipse 
          cx="76" cy="62" rx="8" ry="6" 
          fill="url(#blushGradient2)"
          animate={{ opacity: [0.5, 0.7, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        />

        {/* Mouth */}
        {renderMouth()}

      </motion.svg>
    </div>
  );
};