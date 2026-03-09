interface DecorativeAirplaneProps {
  className?: string;
  direction?: 'right' | 'left';
  size?: 'sm' | 'md' | 'lg';
}

export const DecorativeAirplane = ({ 
  className = '', 
  direction = 'right',
  size = 'md' 
}: DecorativeAirplaneProps) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  const transform = direction === 'left' ? 'scale(-1, 1)' : '';

  return (
    <svg
      viewBox="0 0 64 64"
      className={`${sizeClasses[size]} ${className}`}
      style={{ transform }}
    >
      <defs>
        <linearGradient id="airplaneGold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="hsl(45 80% 65%)" />
          <stop offset="50%" stopColor="hsl(40 70% 50%)" />
          <stop offset="100%" stopColor="hsl(35 65% 40%)" />
        </linearGradient>
        <filter id="airplaneShadow">
          <feDropShadow dx="1" dy="2" stdDeviation="2" floodColor="hsl(0 0% 0%)" floodOpacity="0.3"/>
        </filter>
      </defs>
      
      {/* Airplane body */}
      <g fill="url(#airplaneGold)" filter="url(#airplaneShadow)">
        {/* Fuselage */}
        <ellipse cx="32" cy="32" rx="20" ry="4" />
        
        {/* Nose */}
        <path d="M52,32 L58,32 Q62,32 58,30 L52,30 Z" />
        
        {/* Tail */}
        <path d="M12,32 L8,28 L8,36 Z" />
        
        {/* Wings */}
        <path d="M28,32 L18,20 L22,20 L36,32 Z" />
        <path d="M28,32 L18,44 L22,44 L36,32 Z" />
        
        {/* Tail wings */}
        <path d="M10,32 L6,26 L8,26 L14,32 Z" />
        <path d="M10,32 L6,38 L8,38 L14,32 Z" />
      </g>
      
      {/* Engine trails */}
      <g opacity="0.4">
        <line x1="6" y1="32" x2="-10" y2="32" stroke="hsl(45 80% 60%)" strokeWidth="1" strokeDasharray="2 4" />
        <line x1="6" y1="30" x2="-8" y2="28" stroke="hsl(45 80% 60%)" strokeWidth="0.5" strokeDasharray="2 4" />
        <line x1="6" y1="34" x2="-8" y2="36" stroke="hsl(45 80% 60%)" strokeWidth="0.5" strokeDasharray="2 4" />
      </g>
    </svg>
  );
};