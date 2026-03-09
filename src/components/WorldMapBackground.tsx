import { useEffect, useState } from 'react';

interface SparkleProps {
  style: React.CSSProperties;
  delay: number;
}

const Sparkle = ({ style, delay }: SparkleProps) => (
  <div
    className="absolute w-1 h-1 rounded-full bg-gold-light animate-sparkle"
    style={{ ...style, animationDelay: `${delay}s` }}
  />
);

export const WorldMapBackground = () => {
  const [sparkles] = useState(() => 
    Array.from({ length: 15 }, (_, i) => ({
      id: i,
      style: {
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
      },
      delay: Math.random() * 3,
    }))
  );

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Ocean gradient base */}
      <div className="absolute inset-0 bg-gradient-to-b from-ocean via-ocean-mid to-ocean-deep" />
      
      {/* World map SVG overlay */}
      <svg
        className="absolute inset-0 w-full h-full opacity-20"
        viewBox="0 0 1200 600"
        preserveAspectRatio="xMidYMid slice"
      >
        {/* Stylized continents */}
        <defs>
          <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(45 80% 60%)" stopOpacity="0.6" />
            <stop offset="50%" stopColor="hsl(40 70% 50%)" stopOpacity="0.4" />
            <stop offset="100%" stopColor="hsl(35 65% 40%)" stopOpacity="0.3" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        {/* North America */}
        <path
          fill="url(#goldGradient)"
          filter="url(#glow)"
          d="M120,80 Q180,60 240,70 T340,65 Q400,55 460,75 T560,70 
             L580,120 Q540,130 480,125 T380,140 Q320,135 260,150 T160,145 
             L120,80Z"
        />
        
        {/* South America */}
        <path
          fill="url(#goldGradient)"
          filter="url(#glow)"
          d="M220,280 Q280,265 340,275 T420,270 
             L440,380 Q410,400 360,420 T280,430 
             L240,350 Q220,320 220,280Z"
        />
        
        {/* Europe */}
        <path
          fill="url(#goldGradient)"
          filter="url(#glow)"
          d="M520,60 Q580,50 640,55 T740,50 
             L760,100 Q720,105 660,100 T560,110 
             L520,60Z"
        />
        
        {/* Africa */}
        <path
          fill="url(#goldGradient)"
          filter="url(#glow)"
          d="M520,140 Q580,130 640,140 T720,135 
             L740,280 Q700,310 640,340 T540,350 
             L500,240 Q510,190 520,140Z"
        />
        
        {/* Asia */}
        <path
          fill="url(#goldGradient)"
          filter="url(#glow)"
          d="M760,40 Q840,30 920,35 T1040,30 L1080,40 
             L1100,160 Q1040,170 960,165 T820,180 
             L780,100 Q770,70 760,40Z"
        />
        
        {/* Australia */}
        <path
          fill="url(#goldGradient)"
          filter="url(#glow)"
          d="M940,340 Q1000,330 1060,340 T1120,335 
             L1130,400 Q1080,410 1020,405 T940,415 
             L940,340Z"
        />
        
        {/* Grid lines */}
        <g stroke="hsl(40 70% 50%)" strokeOpacity="0.1" strokeWidth="0.5" fill="none">
          {/* Horizontal lines */}
          <line x1="0" y1="100" x2="1200" y2="100" />
          <line x1="0" y1="200" x2="1200" y2="200" />
          <line x1="0" y1="300" x2="1200" y2="300" />
          <line x1="0" y1="400" x2="1200" y2="400" />
          <line x1="0" y1="500" x2="1200" y2="500" />
          {/* Vertical lines */}
          <line x1="200" y1="0" x2="200" y2="600" />
          <line x1="400" y1="0" x2="400" y2="600" />
          <line x1="600" y1="0" x2="600" y2="600" />
          <line x1="800" y1="0" x2="800" y2="600" />
          <line x1="1000" y1="0" x2="1000" y2="600" />
        </g>
        
        {/* Equator line - more prominent */}
        <line 
          x1="0" y1="300" x2="1200" y2="300" 
          stroke="hsl(40 70% 50%)" 
          strokeOpacity="0.25" 
          strokeWidth="1" 
          strokeDasharray="8 4"
        />
      </svg>
      
      {/* Sparkles */}
      {sparkles.map((sparkle) => (
        <Sparkle key={sparkle.id} style={sparkle.style} delay={sparkle.delay} />
      ))}
      
      {/* Decorative airplane paths */}
      <svg className="absolute inset-0 w-full h-full opacity-30" viewBox="0 0 1200 600">
        {/* Flight path 1 */}
        <path
          d="M100,400 Q400,200 700,300 T1100,150"
          stroke="hsl(40 70% 50%)"
          strokeWidth="1"
          strokeDasharray="4 8"
          fill="none"
          opacity="0.4"
        />
        {/* Flight path 2 */}
        <path
          d="M50,200 Q300,350 600,250 T1150,400"
          stroke="hsl(45 80% 60%)"
          strokeWidth="1"
          strokeDasharray="4 8"
          fill="none"
          opacity="0.3"
        />
      </svg>
      
      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </div>
  );
};