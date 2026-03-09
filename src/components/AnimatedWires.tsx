const AnimatedWires = () => {
  const wires = [
    // Gold wires - subtle opacity, stronger glow
    { d: "M-50,120 C200,80 400,200 600,150 S900,100 1100,180 S1400,60 1600,140", color: "hsl(var(--accent))", delay: "0s", duration: "14s", opacity: 0.3 },
    { d: "M-100,350 C150,300 350,400 550,320 S800,380 1050,300 S1300,350 1500,280 L1700,320", color: "hsl(var(--accent))", delay: "3s", duration: "16s", opacity: 0.25 },
    { d: "M-80,600 C200,550 400,650 650,580 S950,620 1200,560 S1450,610 1700,550", color: "hsl(var(--accent))", delay: "6s", duration: "13s", opacity: 0.2 },
    { d: "M-50,850 C250,800 450,900 700,830 S1000,870 1250,810 S1500,860 1750,800", color: "hsl(var(--accent))", delay: "1.5s", duration: "15s", opacity: 0.18 },
    // Turquoise wires - subtle opacity, stronger glow
    { d: "M-60,220 C180,180 380,280 580,200 S850,250 1100,190 S1350,230 1600,200", color: "hsl(var(--primary))", delay: "2s", duration: "15s", opacity: 0.28 },
    { d: "M-40,480 C200,440 400,520 650,460 S900,500 1150,440 S1400,480 1650,430", color: "hsl(var(--primary))", delay: "4.5s", duration: "14s", opacity: 0.22 },
    { d: "M-90,720 C150,680 380,760 600,700 S880,740 1100,680 S1380,720 1600,670", color: "hsl(var(--primary))", delay: "1s", duration: "17s", opacity: 0.2 },
    { d: "M-70,950 C200,910 430,980 680,920 S950,960 1200,900 S1450,940 1700,890", color: "hsl(var(--primary))", delay: "3.5s", duration: "13s", opacity: 0.18 },
  ];

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
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="wire-glow-teal" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="7" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {wires.map((wire, i) => {
          const isGold = wire.color.includes('accent');
          return (
            <path
              key={i}
              d={wire.d}
              fill="none"
              stroke={wire.color}
              strokeWidth="2"
              strokeLinecap="round"
              opacity={wire.opacity}
              filter={isGold ? "url(#wire-glow-gold)" : "url(#wire-glow-teal)"}
              strokeDasharray="250 700"
              className="animate-wire-flow"
              style={{
                animationDelay: wire.delay,
                animationDuration: wire.duration,
              }}
            />
          );
        })}

        {/* Sparkle dots along wires */}
        {[
          { cx: 300, cy: 130, fill: "hsl(var(--accent))", delay: "0s" },
          { cx: 800, cy: 200, fill: "hsl(var(--primary))", delay: "1.5s" },
          { cx: 550, cy: 330, fill: "hsl(var(--accent))", delay: "3s" },
          { cx: 1100, cy: 190, fill: "hsl(var(--primary))", delay: "0.8s" },
          { cx: 400, cy: 590, fill: "hsl(var(--accent))", delay: "2s" },
          { cx: 900, cy: 470, fill: "hsl(var(--primary))", delay: "4s" },
          { cx: 650, cy: 710, fill: "hsl(var(--primary))", delay: "3.5s" },
          { cx: 1200, cy: 560, fill: "hsl(var(--accent))", delay: "1.2s" },
        ].map((dot, i) => (
          <circle
            key={`dot-${i}`}
            cx={dot.cx}
            cy={dot.cy}
            r="2.5"
            fill={dot.fill}
            className="animate-wire-glow-pulse"
            style={{ animationDelay: dot.delay }}
          />
        ))}
      </svg>
    </div>
  );
};

export default AnimatedWires;
