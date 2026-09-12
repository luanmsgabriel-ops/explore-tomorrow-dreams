interface RadarSignalGlobeProps {
  signals: number;
  scanning?: boolean;
}

const particles = [
  [8, 22, 1.5, 0.2], [17, 72, 1, 1.1], [28, 9, 1.2, 1.8], [36, 88, 1.6, 0.7],
  [49, 4, 1, 2.2], [57, 94, 1.4, 1.4], [69, 13, 1.7, 0.4], [78, 82, 1.1, 2.6],
  [90, 31, 1.5, 1.7], [93, 66, 1, 0.9], [12, 49, 1.2, 2.9], [84, 52, 1.3, 2.1],
] as const;

export function RadarSignalGlobe({ signals, scanning = false }: RadarSignalGlobeProps) {
  return (
    <div
      className="radar-signal-globe relative grid size-44 place-items-center sm:size-52"
      aria-label={`${signals} sinais ativos`}
      data-scanning={scanning}
    >
      <style>{`
        @keyframes radar-sweep { to { transform: rotate(360deg); } }
        @keyframes radar-dust { 0%,100% { opacity:.18; transform:scale(.8) translateY(0) } 50% { opacity:.95; transform:scale(1.35) translateY(-3px) } }
        @keyframes radar-breathe { 0%,100% { opacity:.32; transform:scale(.94) } 50% { opacity:.72; transform:scale(1.04) } }
        .radar-signal-globe .radar-sweep { animation: radar-sweep 5.8s linear infinite; transform-origin:center; }
        .radar-signal-globe[data-scanning="true"] .radar-sweep { animation-duration: 1.8s; }
        .radar-signal-globe .radar-dust { animation: radar-dust 3.2s ease-in-out infinite; }
        .radar-signal-globe .radar-halo { animation: radar-breathe 4.2s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .radar-signal-globe .radar-sweep,.radar-signal-globe .radar-dust,.radar-signal-globe .radar-halo { animation:none !important; }
        }
      `}</style>
      <div className="radar-halo absolute inset-[4%] rounded-full bg-cyan-300/[.055] blur-xl" />
      <div className="absolute inset-[10%] rounded-full border border-cyan-300/20 shadow-[0_0_32px_rgba(34,211,238,.09)]" />
      <div className="absolute inset-[23%] rounded-full border border-cyan-200/10" />
      <div className="absolute inset-[36%] rounded-full border border-[#d4af37]/20" />

      {particles.map(([left, top, size, delay], index) => (
        <span
          key={index}
          className="radar-dust absolute rounded-full bg-cyan-200 shadow-[0_0_8px_rgba(103,232,249,.9)]"
          style={{ left: `${left}%`, top: `${top}%`, width: size * 2, height: size * 2, animationDelay: `${delay}s` }}
          aria-hidden="true"
        />
      ))}

      <svg viewBox="0 0 160 160" className="absolute inset-[18%] size-[64%] overflow-visible" aria-hidden="true">
        <defs>
          <radialGradient id="radarGlobeCore" cx="42%" cy="35%">
            <stop offset="0" stopColor="#67e8f9" stopOpacity=".18" />
            <stop offset=".72" stopColor="#0e7490" stopOpacity=".07" />
            <stop offset="1" stopColor="#041012" stopOpacity=".2" />
          </radialGradient>
          <linearGradient id="radarSweepBeam" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#67e8f9" stopOpacity="0" />
            <stop offset="1" stopColor="#67e8f9" stopOpacity=".48" />
          </linearGradient>
        </defs>
        <circle cx="80" cy="80" r="57" fill="url(#radarGlobeCore)" stroke="#67e8f9" strokeOpacity=".34" />
        <ellipse cx="80" cy="80" rx="27" ry="57" fill="none" stroke="#67e8f9" strokeOpacity=".18" />
        <ellipse cx="80" cy="80" rx="45" ry="57" fill="none" stroke="#67e8f9" strokeOpacity=".10" />
        <ellipse cx="80" cy="80" rx="57" ry="22" fill="none" stroke="#67e8f9" strokeOpacity=".18" />
        <ellipse cx="80" cy="80" rx="57" ry="40" fill="none" stroke="#67e8f9" strokeOpacity=".10" />
        <path d="M24 80h112M80 23v114" stroke="#67e8f9" strokeOpacity=".08" />
        <g className="radar-sweep">
          <path d="M80 80 L80 22 A58 58 0 0 1 121 39 Z" fill="url(#radarSweepBeam)" />
          <line x1="80" y1="80" x2="121" y2="39" stroke="#67e8f9" strokeOpacity=".72" strokeWidth="1.2" />
        </g>
        <circle cx="111" cy="61" r="2.2" fill="#d4af37" opacity=".9" />
        <circle cx="52" cy="96" r="1.7" fill="#67e8f9" opacity=".85" />
        <circle cx="95" cy="108" r="1.5" fill="#67e8f9" opacity=".65" />
      </svg>

      <span className="relative z-10 rounded-full bg-[#041012]/70 px-3 py-2 text-center backdrop-blur-sm">
        <strong className="block text-3xl leading-none text-white">{signals}</strong>
        <small className="mt-1 block text-[9px] uppercase tracking-[.19em] text-white/40">sinais ativos</small>
      </span>
      <div className="pointer-events-none absolute inset-[2%] rounded-full border border-white/[.04]" aria-hidden="true" />
      <div className="pointer-events-none absolute bottom-[5%] left-1/2 h-px w-[54%] -translate-x-1/2 bg-gradient-to-r from-transparent via-[#d4af37]/40 to-transparent" aria-hidden="true" />
    </div>
  );
}
