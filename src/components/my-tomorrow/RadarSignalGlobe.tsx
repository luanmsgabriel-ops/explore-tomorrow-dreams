interface RadarSignalGlobeProps {
  signals: number;
  scanning?: boolean;
}

const particles = [
  [7, 22, 1.2, 0.1, "cyan"], [12, 68, 0.9, 1.4, "gold"], [19, 12, 0.8, 2.2, "cyan"],
  [24, 84, 1.1, 0.8, "cyan"], [33, 4, 0.7, 1.8, "gold"], [41, 94, 1.3, 2.8, "cyan"],
  [53, 7, 0.9, 0.4, "cyan"], [61, 91, 0.8, 2.1, "gold"], [72, 10, 1.2, 1.1, "cyan"],
  [82, 86, 0.8, 2.6, "cyan"], [91, 26, 1.1, 1.7, "gold"], [94, 65, 0.9, 0.7, "cyan"],
  [5, 48, 0.8, 3.1, "cyan"], [95, 47, 0.7, 2.4, "gold"], [28, 53, 0.65, 1.2, "cyan"],
  [76, 57, 0.65, 2.9, "cyan"], [47, 18, 0.7, 0.9, "gold"], [56, 76, 0.75, 2.0, "cyan"],
] as const;

const signalNodes = [
  [54, 39, "gold"], [68, 46, "cyan"], [43, 56, "cyan"], [59, 66, "gold"], [72, 62, "cyan"],
] as const;

export function RadarSignalGlobe({ signals, scanning = false }: RadarSignalGlobeProps) {
  return (
    <div
      className="radar-premium relative grid aspect-square w-[min(78vw,18rem)] place-items-center sm:w-80"
      aria-label={`${signals} sinais ativos`}
      data-scanning={scanning}
    >
      <style>{`
        @keyframes radar-orbit-cw { to { transform: rotate(360deg); } }
        @keyframes radar-orbit-ccw { to { transform: rotate(-360deg); } }
        @keyframes radar-globe-turn { 0%,100% { transform: rotateY(-7deg) rotateX(4deg); } 50% { transform: rotateY(9deg) rotateX(-2deg); } }
        @keyframes radar-pulse { 0%,100% { opacity:.35; transform:scale(.92); } 50% { opacity:.95; transform:scale(1.08); } }
        @keyframes radar-float { 0%,100% { transform:translate3d(0,0,0) scale(.8); opacity:.25; } 50% { transform:translate3d(0,-5px,0) scale(1.25); opacity:1; } }
        @keyframes radar-beam { 0% { opacity:.2; } 45% { opacity:.8; } 100% { opacity:.2; } }
        @keyframes radar-number { 0%,100% { filter:drop-shadow(0 0 6px rgba(212,175,55,.35)); } 50% { filter:drop-shadow(0 0 18px rgba(212,175,55,.7)); } }
        .radar-premium .orbit-cw { animation: radar-orbit-cw 18s linear infinite; transform-origin:center; }
        .radar-premium .orbit-ccw { animation: radar-orbit-ccw 24s linear infinite; transform-origin:center; }
        .radar-premium .sweep { animation: radar-orbit-cw 6.5s linear infinite; transform-origin:center; }
        .radar-premium[data-scanning="true"] .sweep { animation-duration: 1.9s; }
        .radar-premium .globe-shell { animation: radar-globe-turn 8s ease-in-out infinite; transform-origin:center; transform-box:fill-box; }
        .radar-premium .node-pulse { animation: radar-pulse 2.4s ease-in-out infinite; transform-origin:center; transform-box:fill-box; }
        .radar-premium .dust { animation: radar-float 3.7s ease-in-out infinite; }
        .radar-premium .beam { animation: radar-beam 2.8s ease-in-out infinite; }
        .radar-premium .signal-count { animation: radar-number 3.6s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .radar-premium .orbit-cw,.radar-premium .orbit-ccw,.radar-premium .sweep,.radar-premium .globe-shell,.radar-premium .node-pulse,.radar-premium .dust,.radar-premium .beam,.radar-premium .signal-count { animation:none !important; }
        }
      `}</style>

      <div className="absolute inset-[4%] rounded-full bg-[radial-gradient(circle,rgba(34,211,238,.10)_0%,rgba(4,16,18,.02)_54%,transparent_72%)] blur-xl" aria-hidden="true" />
      <div className="absolute inset-[9%] rounded-full border border-cyan-300/10 shadow-[0_0_70px_rgba(34,211,238,.08)]" aria-hidden="true" />
      <div className="absolute inset-[16%] rounded-full border border-[#d4af37]/15 shadow-[inset_0_0_30px_rgba(212,175,55,.04)]" aria-hidden="true" />

      {particles.map(([left, top, size, delay, tone], index) => (
        <span
          key={index}
          className={`dust absolute rounded-full ${tone === "gold" ? "bg-[#f3d67a] shadow-[0_0_10px_rgba(212,175,55,.95)]" : "bg-cyan-200 shadow-[0_0_9px_rgba(103,232,249,.85)]"}`}
          style={{ left: `${left}%`, top: `${top}%`, width: size * 2.5, height: size * 2.5, animationDelay: `${delay}s` }}
          aria-hidden="true"
        />
      ))}

      <svg viewBox="0 0 320 320" className="absolute inset-0 size-full overflow-visible" aria-hidden="true">
        <defs>
          <radialGradient id="radarSphere" cx="38%" cy="31%" r="74%">
            <stop offset="0" stopColor="#67e8f9" stopOpacity=".22" />
            <stop offset=".38" stopColor="#0f7180" stopOpacity=".12" />
            <stop offset=".76" stopColor="#062c31" stopOpacity=".16" />
            <stop offset="1" stopColor="#020b0d" stopOpacity=".92" />
          </radialGradient>
          <linearGradient id="radarGold" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#fff1a8" />
            <stop offset=".4" stopColor="#d4af37" />
            <stop offset="1" stopColor="#8a6a16" />
          </linearGradient>
          <linearGradient id="radarBeam" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#67e8f9" stopOpacity="0" />
            <stop offset=".58" stopColor="#67e8f9" stopOpacity=".12" />
            <stop offset="1" stopColor="#67e8f9" stopOpacity=".75" />
          </linearGradient>
          <filter id="goldGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <filter id="cyanGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="2.4" result="blur" />
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <clipPath id="sphereClip"><circle cx="160" cy="160" r="91" /></clipPath>
        </defs>

        <g className="orbit-ccw" opacity=".7">
          <circle cx="160" cy="160" r="145" fill="none" stroke="#67e8f9" strokeOpacity=".12" strokeWidth="1" />
          <circle cx="160" cy="160" r="138" fill="none" stroke="#d4af37" strokeOpacity=".24" strokeDasharray="2 10" strokeWidth="1.2" />
          <path d="M22 160a138 138 0 0 1 276 0" fill="none" stroke="#67e8f9" strokeOpacity=".32" strokeWidth="1.4" />
          <path d="M47 79a140 140 0 0 1 228 18" fill="none" stroke="url(#radarGold)" strokeOpacity=".62" strokeWidth="1.6" strokeLinecap="round" />
          <circle cx="267" cy="72" r="3.2" fill="#ffd66b" filter="url(#goldGlow)" />
          <circle cx="50" cy="97" r="2" fill="#67e8f9" filter="url(#cyanGlow)" />
        </g>

        <g className="orbit-cw" opacity=".85">
          <circle cx="160" cy="160" r="122" fill="none" stroke="#67e8f9" strokeOpacity=".18" strokeWidth="1" />
          <path d="M44 160a116 116 0 0 0 232 0" fill="none" stroke="#d4af37" strokeOpacity=".44" strokeDasharray="42 26 8 24" strokeWidth="1.4" strokeLinecap="round" />
          <circle cx="257" cy="201" r="2.6" fill="#ffd66b" filter="url(#goldGlow)" />
          <circle cx="91" cy="65" r="2.1" fill="#67e8f9" filter="url(#cyanGlow)" />
        </g>

        <g className="globe-shell" style={{ perspective: 700 }}>
          <circle cx="160" cy="160" r="91" fill="url(#radarSphere)" stroke="#67e8f9" strokeOpacity=".48" strokeWidth="1.4" />
          <circle cx="160" cy="160" r="88" fill="none" stroke="#d4af37" strokeOpacity=".17" strokeWidth="1" />
          <g clipPath="url(#sphereClip)" opacity=".75">
            <ellipse cx="160" cy="160" rx="25" ry="91" fill="none" stroke="#67e8f9" strokeOpacity=".28" />
            <ellipse cx="160" cy="160" rx="52" ry="91" fill="none" stroke="#67e8f9" strokeOpacity=".17" />
            <ellipse cx="160" cy="160" rx="74" ry="91" fill="none" stroke="#d4af37" strokeOpacity=".10" />
            <ellipse cx="160" cy="160" rx="91" ry="25" fill="none" stroke="#67e8f9" strokeOpacity=".30" />
            <ellipse cx="160" cy="160" rx="91" ry="50" fill="none" stroke="#67e8f9" strokeOpacity=".16" />
            <ellipse cx="160" cy="160" rx="91" ry="72" fill="none" stroke="#d4af37" strokeOpacity=".10" />
            <path d="M121 77 C139 83 145 93 143 105 C139 115 148 124 151 135 C155 147 149 158 153 171 C157 184 165 196 162 211 C159 225 150 234 144 246" fill="none" stroke="#cceff2" strokeOpacity=".34" strokeWidth="1.1" />
            <path d="M174 83 C191 87 206 97 210 111 C214 124 203 131 207 145 C211 160 221 170 214 186 C207 203 188 205 183 220 C179 232 186 242 196 250" fill="none" stroke="#cceff2" strokeOpacity=".22" strokeWidth="1" />
            <path d="M175 136 C184 129 193 128 199 137 C204 145 200 153 203 160 C208 171 205 181 198 190 C192 198 188 207 185 219 C181 233 172 241 166 232 C160 224 162 211 157 204 C151 196 152 185 159 176 C166 167 166 156 164 148 C163 142 168 140 175 136 Z" fill="url(#radarGold)" fillOpacity=".28" stroke="#f3d67a" strokeOpacity=".72" strokeWidth="1.15" filter="url(#goldGlow)" />
            <path d="M102 117 C114 110 126 109 138 114" fill="none" stroke="#d4af37" strokeOpacity=".24" />
            <path d="M197 119 C210 121 219 128 225 139" fill="none" stroke="#67e8f9" strokeOpacity=".22" />
          </g>
        </g>

        <g className="sweep">
          <path className="beam" d="M160 160 L160 48 A112 112 0 0 1 237 79 Z" fill="url(#radarBeam)" />
          <line x1="160" y1="160" x2="237" y2="79" stroke="#67e8f9" strokeOpacity=".85" strokeWidth="1.3" filter="url(#cyanGlow)" />
        </g>

        <g fill="none" strokeLinecap="round">
          <path d="M83 190 C117 155 145 149 175 151 C208 153 231 138 252 112" stroke="#d4af37" strokeOpacity=".52" strokeDasharray="2 5" strokeWidth="1.1" />
          <path d="M103 123 C131 143 162 139 186 124 C207 111 227 108 246 120" stroke="#67e8f9" strokeOpacity=".44" strokeDasharray="2 4" strokeWidth="1" />
        </g>

        {signalNodes.map(([x, y, tone], index) => (
          <g key={index} className="node-pulse" style={{ animationDelay: `${index * 0.35}s` }}>
            <circle cx={x * 3.2} cy={y * 3.2} r="4.8" fill="none" stroke={tone === "gold" ? "#d4af37" : "#67e8f9"} strokeOpacity=".22" />
            <circle cx={x * 3.2} cy={y * 3.2} r="2.2" fill={tone === "gold" ? "#ffd66b" : "#67e8f9"} filter={tone === "gold" ? "url(#goldGlow)" : "url(#cyanGlow)"} />
          </g>
        ))}

        <g fontFamily="Inter, sans-serif" fontSize="10" letterSpacing="2" textAnchor="middle">
          <text x="160" y="20" fill="#f3d67a" opacity=".9">N</text>
          <text x="160" y="306" fill="#f3d67a" opacity=".9">S</text>
          <text x="17" y="164" fill="#f3d67a" opacity=".9">O</text>
          <text x="303" y="164" fill="#f3d67a" opacity=".9">L</text>
        </g>
        <g fill="#f3d67a" opacity=".85">
          <path d="M160 26 l-5 9 h10z" />
          <path d="M160 294 l5-9 h-10z" />
          <path d="M26 160 l9-5 v10z" />
          <path d="M294 160 l-9 5 v-10z" />
        </g>
      </svg>

      <div className="relative z-20 flex flex-col items-center justify-center text-center" aria-hidden="true">
        <strong className="signal-count bg-gradient-to-b from-[#fff7cf] via-[#f1d06b] to-[#a97d17] bg-clip-text text-5xl font-semibold leading-none text-transparent sm:text-6xl">
          {signals}
        </strong>
        <span className="mt-2 text-[9px] font-medium uppercase tracking-[.32em] text-cyan-100/60 sm:text-[10px]">sinais ativos</span>
        <span className="mt-3 h-px w-16 bg-gradient-to-r from-transparent via-[#d4af37]/80 to-transparent" />
      </div>

      <div className="pointer-events-none absolute inset-[1.5%] rounded-full border border-white/[.03] shadow-[inset_0_0_35px_rgba(34,211,238,.05)]" aria-hidden="true" />
    </div>
  );
}
