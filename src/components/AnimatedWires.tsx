const AnimatedWires = () => {
  const wires = [
    // Gold wires - bright and vivid
    { d: "M-50,80 C200,40 400,160 600,100 S900,60 1100,140 S1400,30 1600,110", color: "hsl(var(--accent))", delay: "0s", duration: "10s", opacity: 0.7 },
    { d: "M-100,200 C150,160 350,260 550,180 S800,240 1050,160 S1300,200 1500,140 L1700,180", color: "hsl(var(--accent))", delay: "2s", duration: "12s", opacity: 0.6 },
    { d: "M-80,350 C200,300 400,400 650,330 S950,370 1200,310 S1450,360 1700,300", color: "hsl(var(--accent))", delay: "4s", duration: "11s", opacity: 0.55 },
    { d: "M-50,500 C250,450 450,550 700,480 S1000,520 1250,460 S1500,510 1750,450", color: "hsl(var(--accent))", delay: "1s", duration: "13s", opacity: 0.65 },
    { d: "M-70,650 C180,600 400,700 620,640 S880,680 1100,620 S1380,660 1600,610", color: "hsl(var(--accent))", delay: "3s", duration: "10s", opacity: 0.5 },
    { d: "M-40,800 C200,760 430,840 680,780 S950,820 1200,760 S1450,800 1700,750", color: "hsl(var(--accent))", delay: "5s", duration: "12s", opacity: 0.6 },
    { d: "M-90,920 C150,880 380,960 600,900 S880,940 1100,880 S1380,920 1600,870", color: "hsl(var(--accent))", delay: "1.5s", duration: "11s", opacity: 0.5 },
    // Turquoise wires - bright and vivid
    { d: "M-60,140 C180,100 380,200 580,120 S850,170 1100,110 S1350,150 1600,120", color: "hsl(var(--primary))", delay: "1s", duration: "11s", opacity: 0.65 },
    { d: "M-40,280 C200,240 400,320 650,260 S900,300 1150,240 S1400,280 1650,230", color: "hsl(var(--primary))", delay: "3s", duration: "10s", opacity: 0.6 },
    { d: "M-90,430 C150,390 380,470 600,410 S880,450 1100,390 S1380,430 1600,380", color: "hsl(var(--primary))", delay: "0.5s", duration: "13s", opacity: 0.55 },
    { d: "M-70,570 C200,530 430,610 680,550 S950,590 1200,530 S1450,570 1700,520", color: "hsl(var(--primary))", delay: "2.5s", duration: "12s", opacity: 0.7 },
    { d: "M-50,720 C250,680 450,760 700,700 S1000,740 1250,680 S1500,720 1750,670", color: "hsl(var(--primary))", delay: "4.5s", duration: "10s", opacity: 0.5 },
    { d: "M-80,860 C200,820 400,900 650,840 S900,880 1150,820 S1400,860 1650,810", color: "hsl(var(--primary))", delay: "1.5s", duration: "11s", opacity: 0.6 },
    { d: "M-60,960 C180,920 380,990 580,940 S850,970 1100,920 S1350,960 1600,910", color: "hsl(var(--primary))", delay: "3.5s", duration: "12s", opacity: 0.55 },
  ];

  const sparkles = [
    { cx: 200, cy: 80, fill: "hsl(var(--accent))", delay: "0s" },
    { cx: 500, cy: 160, fill: "hsl(var(--primary))", delay: "1s" },
    { cx: 800, cy: 120, fill: "hsl(var(--accent))", delay: "2s" },
    { cx: 1100, cy: 140, fill: "hsl(var(--primary))", delay: "0.5s" },
    { cx: 300, cy: 300, fill: "hsl(var(--accent))", delay: "3s" },
    { cx: 650, cy: 350, fill: "hsl(var(--primary))", delay: "1.5s" },
    { cx: 950, cy: 280, fill: "hsl(var(--accent))", delay: "4s" },
    { cx: 1300, cy: 200, fill: "hsl(var(--primary))", delay: "2.5s" },
    { cx: 400, cy: 500, fill: "hsl(var(--accent))", delay: "0.8s" },
    { cx: 750, cy: 470, fill: "hsl(var(--primary))", delay: "3.5s" },
    { cx: 1050, cy: 530, fill: "hsl(var(--accent))", delay: "1.2s" },
    { cx: 250, cy: 700, fill: "hsl(var(--primary))", delay: "4.5s" },
    { cx: 600, cy: 650, fill: "hsl(var(--accent))", delay: "2.2s" },
    { cx: 900, cy: 720, fill: "hsl(var(--primary))", delay: "0.3s" },
    { cx: 1200, cy: 800, fill: "hsl(var(--accent))", delay: "3.8s" },
  ];

  // Complex airplane flight path - crosses screen in many directions
  const airplanePath = "M-50,500 C100,200 300,100 500,300 S700,600 800,400 C900,200 1000,100 1100,350 S1300,700 1400,500 C1500,300 1600,200 1650,400 C1700,600 1500,800 1300,700 S1000,500 800,700 C600,900 400,800 300,600 S100,300 -50,500";

  return (
    <div className="fixed inset-0 z-[1] pointer-events-none overflow-hidden">
      <svg
        viewBox="0 0 1600 1000"
        preserveAspectRatio="none"
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <filter id="wire-glow-gold" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="10" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="blur" />
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="wire-glow-teal" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="12" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="blur" />
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="airplane-glow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id="gold-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(45 85% 65%)" />
            <stop offset="50%" stopColor="hsl(40 80% 55%)" />
            <stop offset="100%" stopColor="hsl(35 75% 45%)" />
          </linearGradient>
          <linearGradient id="trail-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(45 80% 60%)" stopOpacity="0" />
            <stop offset="100%" stopColor="hsl(45 80% 60%)" stopOpacity="0.6" />
          </linearGradient>
        </defs>

        {/* Wires */}
        {wires.map((wire, i) => {
          const isGold = wire.color.includes('accent');
          return (
            <path
              key={i}
              d={wire.d}
              fill="none"
              stroke={wire.color}
              strokeWidth={isGold ? "2.5" : "3"}
              strokeLinecap="round"
              opacity={wire.opacity}
              filter={isGold ? "url(#wire-glow-gold)" : "url(#wire-glow-teal)"}
              strokeDasharray="300 600"
              className="animate-wire-flow"
              style={{
                animationDelay: wire.delay,
                animationDuration: wire.duration,
              }}
            />
          );
        })}

        {/* Sparkle dots */}
        {sparkles.map((dot, i) => (
          <circle
            key={`dot-${i}`}
            cx={dot.cx}
            cy={dot.cy}
            r="3"
            fill={dot.fill}
            className="animate-wire-glow-pulse"
            style={{ animationDelay: dot.delay }}
          />
        ))}

        {/* Light trail behind airplane */}
        <path
          d={airplanePath}
          fill="none"
          stroke="url(#trail-gradient)"
          strokeWidth="3"
          strokeLinecap="round"
          opacity="0.5"
          strokeDasharray="80 400"
        >
          <animate
            attributeName="stroke-dashoffset"
            from="0"
            to="-4800"
            dur="22s"
            repeatCount="indefinite"
          />
        </path>

        {/* Golden airplane */}
        <g filter="url(#airplane-glow)" className="animate-airplane-glow">
          <g>
            <animateMotion
              dur="20s"
              repeatCount="indefinite"
              rotate="auto"
              path={airplanePath}
            />
            {/* Airplane body */}
            <g transform="scale(0.7) translate(-20, -10)">
              <path
                d="M0,10 L8,6 L30,4 L35,0 L37,4 L40,5 L37,7 L35,10 L30,8 L8,14 Z"
                fill="url(#gold-gradient)"
                stroke="hsl(45 80% 70%)"
                strokeWidth="0.5"
              />
              {/* Wing */}
              <path
                d="M15,7 L22,0 L25,0 L20,7"
                fill="url(#gold-gradient)"
                opacity="0.9"
              />
              <path
                d="M15,10 L22,17 L25,17 L20,10"
                fill="url(#gold-gradient)"
                opacity="0.9"
              />
              {/* Tail */}
              <path
                d="M4,8 L0,4 L2,4 L6,8"
                fill="url(#gold-gradient)"
                opacity="0.8"
              />
              <path
                d="M4,12 L0,16 L2,16 L6,12"
                fill="url(#gold-gradient)"
                opacity="0.8"
              />
              {/* Engine glow */}
              <circle cx="40" cy="5" r="2" fill="hsl(45 90% 75%)" opacity="0.8">
                <animate attributeName="r" values="1.5;3;1.5" dur="1s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.6;1;0.6" dur="1s" repeatCount="indefinite" />
              </circle>
            </g>
          </g>
        </g>
      </svg>
    </div>
  );
};

export default AnimatedWires;
