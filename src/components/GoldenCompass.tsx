interface GoldenCompassProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const GoldenCompass = ({ className = '', size = 'md' }: GoldenCompassProps) => {
  const sizeClasses = {
    sm: 'w-24 h-24',
    md: 'w-40 h-40',
    lg: 'w-64 h-64',
  };

  return (
    <div className={`relative ${sizeClasses[size]} ${className}`}>
      <svg
        viewBox="0 0 200 200"
        className="w-full h-full animate-float drop-shadow-2xl"
      >
        <defs>
          {/* Gold metallic gradient */}
          <linearGradient id="goldMetallic" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(45 80% 70%)" />
            <stop offset="25%" stopColor="hsl(40 75% 55%)" />
            <stop offset="50%" stopColor="hsl(35 70% 45%)" />
            <stop offset="75%" stopColor="hsl(40 75% 55%)" />
            <stop offset="100%" stopColor="hsl(45 80% 65%)" />
          </linearGradient>
          
          {/* Teal gradient for center */}
          <linearGradient id="tealCenter" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(185 60% 40%)" />
            <stop offset="100%" stopColor="hsl(185 65% 30%)" />
          </linearGradient>
          
          {/* Glow filter */}
          <filter id="compassGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur"/>
            <feFlood floodColor="hsl(40 75% 50%)" floodOpacity="0.5" result="color"/>
            <feComposite in="color" in2="blur" operator="in" result="glow"/>
            <feMerge>
              <feMergeNode in="glow"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          
          {/* Shadow */}
          <filter id="compassShadow">
            <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="hsl(0 0% 0%)" floodOpacity="0.4"/>
          </filter>
        </defs>
        
        {/* Outer ring */}
        <circle
          cx="100"
          cy="100"
          r="90"
          fill="none"
          stroke="url(#goldMetallic)"
          strokeWidth="6"
          filter="url(#compassShadow)"
        />
        
        {/* Inner decorative ring */}
        <circle
          cx="100"
          cy="100"
          r="80"
          fill="none"
          stroke="url(#goldMetallic)"
          strokeWidth="2"
          strokeDasharray="4 2"
        />
        
        {/* Direction markers */}
        <g fill="url(#goldMetallic)" filter="url(#compassGlow)">
          {/* N */}
          <text x="100" y="28" textAnchor="middle" fontSize="16" fontWeight="bold" fontFamily="Playfair Display">N</text>
          {/* S */}
          <text x="100" y="182" textAnchor="middle" fontSize="14" fontWeight="bold" fontFamily="Playfair Display">S</text>
          {/* E */}
          <text x="178" y="105" textAnchor="middle" fontSize="14" fontWeight="bold" fontFamily="Playfair Display">E</text>
          {/* W */}
          <text x="22" y="105" textAnchor="middle" fontSize="14" fontWeight="bold" fontFamily="Playfair Display">W</text>
        </g>
        
        {/* Tick marks */}
        <g stroke="url(#goldMetallic)" strokeWidth="2">
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => {
            const rad = (angle * Math.PI) / 180;
            const x1 = 100 + 70 * Math.sin(rad);
            const y1 = 100 - 70 * Math.cos(rad);
            const x2 = 100 + (angle % 90 === 0 ? 60 : 65) * Math.sin(rad);
            const y2 = 100 - (angle % 90 === 0 ? 60 : 65) * Math.cos(rad);
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} />;
          })}
        </g>
        
        {/* Center decorative circle */}
        <circle
          cx="100"
          cy="100"
          r="50"
          fill="url(#tealCenter)"
          stroke="url(#goldMetallic)"
          strokeWidth="3"
          filter="url(#compassShadow)"
        />
        
        {/* Compass needle - North (gold) */}
        <polygon
          points="100,40 95,100 100,85 105,100"
          fill="url(#goldMetallic)"
          filter="url(#compassGlow)"
        />
        
        {/* Compass needle - South (teal) */}
        <polygon
          points="100,160 95,100 100,115 105,100"
          fill="url(#tealCenter)"
        />
        
        {/* Center pin */}
        <circle
          cx="100"
          cy="100"
          r="8"
          fill="url(#goldMetallic)"
          filter="url(#compassGlow)"
        />
        <circle
          cx="100"
          cy="100"
          r="4"
          fill="hsl(45 80% 70%)"
        />
      </svg>
      
      {/* Glow effect behind */}
      <div className="absolute inset-0 -z-10 animate-pulse-glow rounded-full blur-xl opacity-30 bg-gold" />
    </div>
  );
};