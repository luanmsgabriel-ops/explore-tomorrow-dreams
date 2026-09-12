interface RadarSignalGlobeProps {
  signals: number;
  scanning?: boolean;
}

const particles = [
  [4, 18, 1.1, 0.1, "cyan"], [8, 43, 0.8, 1.4, "gold"], [12, 76, 1.2, 2.2, "cyan"],
  [18, 8, 0.8, 0.8, "cyan"], [22, 91, 1.1, 1.8, "gold"], [29, 26, 0.7, 2.8, "cyan"],
  [34, 70, 1.0, 0.4, "cyan"], [40, 5, 0.8, 2.1, "gold"], [46, 94, 1.2, 1.1, "cyan"],
  [54, 11, 0.8, 2.6, "cyan"], [61, 88, 1.0, 1.7, "gold"], [67, 5, 0.8, 0.7, "cyan"],
  [74, 93, 0.8, 3.1, "cyan"], [81, 17, 1.2, 2.4, "gold"], [88, 82, 0.7, 1.2, "cyan"],
  [94, 34, 1.0, 2.9, "cyan"], [96, 63, 0.8, 0.9, "gold"], [15, 58, 0.75, 2.0, "cyan"],
  [84, 55, 0.65, 1.6, "cyan"], [26, 40, 0.7, 2.3, "gold"], [72, 36, 0.75, 1.3, "cyan"],
] as const;

const signalNodes = [
  [55, 40, "gold"], [68, 47, "cyan"], [43, 56, "cyan"], [59, 67, "gold"], [72, 62, "cyan"], [39, 45, "gold"],
] as const;

export function RadarSignalGlobe({ signals, scanning = false }: RadarSignalGlobeProps) {
  return (
    <div
      className="radar-premium relative grid aspect-square w-[min(84vw,21rem)] shrink-0 place-items-center sm:w-[27rem] lg:w-[31rem]"
      aria-label={`${signals} sinais ativos`}
      data-scanning={scanning}
    >
      <style>{`
        @keyframes radar-orbit-cw { to { transform: rotate(360deg); } }
        @keyframes radar-orbit-ccw { to { transform: rotate(-360deg); } }
        @keyframes radar-globe-turn { 0%,100% { transform: rotateY(-8deg) rotateX(4deg) scale(.985); } 50% { transform: rotateY(10deg) rotateX(-3deg) scale(1.015); } }
        @keyframes radar-pulse { 0%,100% { opacity:.28; transform:scale(.84); } 50% { opacity:1; transform:scale(1.22); } }
        @keyframes radar-float { 0%,100% { transform:translate3d(0,0,0) scale(.72); opacity:.20; } 50% { transform:translate3d(0,-7px,0) scale(1.3); opacity:1; } }
        @keyframes radar-beam { 0% { opacity:.16; } 45% { opacity:.92; } 100% { opacity:.16; } }
        @keyframes radar-number { 0%,100% { filter:drop-shadow(0 0 7px rgba(212,175,55,.38)); } 50% { filter:drop-shadow(0 0 22px rgba(255,218,105,.78)); } }
        @keyframes radar-horizon { 0%,100% { opacity:.24; transform:scaleX(.92); } 50% { opacity:.62; transform:scaleX(1.04); } }
        .radar-premium .orbit-cw { animation: radar-orbit-cw 18s linear infinite; transform-origin:center; }
        .radar-premium .orbit-ccw { animation: radar-orbit-ccw 27s linear infinite; transform-origin:center; }
        .radar-premium .orbit-fast { animation: radar-orbit-cw 12s linear infinite; transform-origin:center; }
        .radar-premium .sweep { animation: radar-orbit-cw 6.5s linear infinite; transform-origin:center; }
        .radar-premium[data-scanning="true"] .sweep { animation-duration: 1.65s; }
        .radar-premium .globe-shell { animation: radar-globe-turn 8s ease-in-out infinite; transform-origin:center; transform-box:fill-box; }
        .radar-premium .node-pulse { animation: radar-pulse 2.4s ease-in-out infinite; transform-origin:center; transform-box:fill-box; }
        .radar-premium .dust { animation: radar-float 3.7s ease-in-out infinite; }
        .radar-premium .beam { animation: radar-beam 2.8s ease-in-out infinite; }
        .radar-premium .signal-count { animation: radar-number 3.6s ease-in-out infinite; }
        .radar-premium .horizon-glow { animation: radar-horizon 5s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .radar-premium .orbit-cw,.radar-premium .orbit-ccw,.radar-premium .orbit-fast,.radar-premium .sweep,.radar-premium .globe-shell,.radar-premium .node-pulse,.radar-premium .dust,.radar-premium .beam,.radar-premium .signal-count,.radar-premium .horizon-glow { animation:none !important; }
        }
      `}</style>

      <div className="absolute inset-[-5%] rounded-full bg-[radial-gradient(circle,rgba(36,219,235,.11)_0%,rgba(12,96,103,.045)_42%,transparent_72%)] blur-2xl" aria-hidden="true" />
      <div className="absolute inset-[1%] rounded-full border border-cyan-300/[.08] shadow-[0_0_90px_rgba(34,211,238,.11)]" aria-hidden="true" />
      <div className="absolute inset-[8%] rounded-full border border-[#d4af37]/16 shadow-[inset_0_0_45px_rgba(212,175,55,.045)]" aria-hidden="true" />
      <div className="absolute inset-[14%] rounded-full border border-cyan-200/[.08]" aria-hidden="true" />

      {particles.map(([left, top, size, delay, tone], index) => (
        <span
          key={index}
          className={`dust absolute rounded-full ${tone === "gold" ? "bg-[#f5d875] shadow-[0_0_14px_rgba(212,175,55,.95)]" : "bg-cyan-200 shadow-[0_0_11px_rgba(103,232,249,.9)]"}`}
          style={{ left: `${left}%`, top: `${top}%`, width: size * 2.7, height: size * 2.7, animationDelay: `${delay}s` }}
          aria-hidden="true"
        />
      ))}

      <svg viewBox="0 0 360 360" className="absolute inset-0 size-full overflow-visible" aria-hidden="true">
        <defs>
          <radialGradient id="radarSphereV4" cx="37%" cy="29%" r="76%">
            <stop offset="0" stopColor="#b8f7ff" stopOpacity=".20" />
            <stop offset=".24" stopColor="#1c9bab" stopOpacity=".14" />
            <stop offset=".60" stopColor="#0a525b" stopOpacity=".12" />
            <stop offset="1" stopColor="#02090b" stopOpacity=".96" />
          </radialGradient>
          <linearGradient id="radarGoldV4" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#fff6c4" />
            <stop offset=".36" stopColor="#f0cf64" />
            <stop offset=".68" stopColor="#d4af37" />
            <stop offset="1" stopColor="#7b5811" />
          </linearGradient>
          <linearGradient id="radarBeamV4" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#67e8f9" stopOpacity="0" />
            <stop offset=".52" stopColor="#67e8f9" stopOpacity=".08" />
            <stop offset="1" stopColor="#67e8f9" stopOpacity=".82" />
          </linearGradient>
          <linearGradient id="radarArcV4" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#67e8f9" stopOpacity=".06" />
            <stop offset=".55" stopColor="#67e8f9" stopOpacity=".7" />
            <stop offset="1" stopColor="#f1d16c" stopOpacity=".9" />
          </linearGradient>
          <filter id="goldGlowV4" x="-120%" y="-120%" width="340%" height="340%">
            <feGaussianBlur stdDeviation="3.4" result="blur" />
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <filter id="cyanGlowV4" x="-120%" y="-120%" width="340%" height="340%">
            <feGaussianBlur stdDeviation="2.7" result="blur" />
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <clipPath id="sphereClipV4"><circle cx="180" cy="180" r="103" /></clipPath>
        </defs>

        <g className="orbit-ccw" opacity=".82">
          <circle cx="180" cy="180" r="164" fill="none" stroke="#67e8f9" strokeOpacity=".09" strokeWidth="1" />
          <circle cx="180" cy="180" r="157" fill="none" stroke="#d4af37" strokeOpacity=".24" strokeDasharray="2 11" strokeWidth="1.2" />
          <path d="M22 180a158 158 0 0 1 316 0" fill="none" stroke="#67e8f9" strokeOpacity=".28" strokeWidth="1.3" />
          <path d="M47 83a158 158 0 0 1 264 23" fill="none" stroke="url(#radarGoldV4)" strokeOpacity=".70" strokeWidth="1.7" strokeLinecap="round" />
          <circle cx="299" cy="83" r="3.3" fill="#ffd96d" filter="url(#goldGlowV4)" />
          <circle cx="51" cy="109" r="2.1" fill="#67e8f9" filter="url(#cyanGlowV4)" />
        </g>

        <g className="orbit-cw" opacity=".88">
          <circle cx="180" cy="180" r="142" fill="none" stroke="#67e8f9" strokeOpacity=".16" strokeWidth="1" />
          <path d="M43 180a137 137 0 0 0 274 0" fill="none" stroke="#d4af37" strokeOpacity=".48" strokeDasharray="47 28 9 25" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="294" cy="227" r="2.8" fill="#ffd66b" filter="url(#goldGlowV4)" />
          <circle cx="99" cy="71" r="2.2" fill="#67e8f9" filter="url(#cyanGlowV4)" />
        </g>

        <g className="orbit-fast" opacity=".55">
          <ellipse cx="180" cy="180" rx="154" ry="63" transform="rotate(-17 180 180)" fill="none" stroke="url(#radarArcV4)" strokeDasharray="92 26 12 33" strokeWidth="1.1" />
          <circle cx="318" cy="130" r="2.4" fill="#f3d67a" filter="url(#goldGlowV4)" />
        </g>

        <g className="globe-shell" style={{ perspective: 760 }}>
          <circle cx="180" cy="180" r="103" fill="url(#radarSphereV4)" stroke="#67e8f9" strokeOpacity=".55" strokeWidth="1.6" />
          <circle cx="180" cy="180" r="99" fill="none" stroke="#d4af37" strokeOpacity=".20" strokeWidth="1" />
          <g clipPath="url(#sphereClipV4)" opacity=".82">
            <ellipse cx="180" cy="180" rx="29" ry="103" fill="none" stroke="#67e8f9" strokeOpacity=".29" />
            <ellipse cx="180" cy="180" rx="58" ry="103" fill="none" stroke="#67e8f9" strokeOpacity=".19" />
            <ellipse cx="180" cy="180" rx="84" ry="103" fill="none" stroke="#d4af37" strokeOpacity=".12" />
            <ellipse cx="180" cy="180" rx="103" ry="29" fill="none" stroke="#67e8f9" strokeOpacity=".31" />
            <ellipse cx="180" cy="180" rx="103" ry="56" fill="none" stroke="#67e8f9" strokeOpacity=".18" />
            <ellipse cx="180" cy="180" rx="103" ry="82" fill="none" stroke="#d4af37" strokeOpacity=".11" />
            <path d="M134 84 C156 88 164 103 160 118 C157 132 169 139 171 153 C174 169 166 179 172 195 C178 212 187 224 181 242 C176 257 166 267 158 279" fill="none" stroke="#d7f8fb" strokeOpacity=".31" strokeWidth="1.15" />
            <path d="M197 91 C218 94 234 106 239 122 C244 139 231 148 236 164 C242 181 251 192 243 210 C235 229 214 231 209 248 C205 261 213 270 224 278" fill="none" stroke="#d7f8fb" strokeOpacity=".22" strokeWidth="1" />
            <path d="M198 151 C208 143 219 143 226 152 C232 162 227 172 231 181 C237 194 233 205 225 215 C217 225 214 237 211 251 C207 267 196 277 188 266 C181 256 184 242 178 233 C171 223 173 210 181 200 C189 189 189 177 187 168 C185 160 190 156 198 151 Z" fill="url(#radarGoldV4)" fillOpacity=".38" stroke="#ffe392" strokeOpacity=".86" strokeWidth="1.3" filter="url(#goldGlowV4)" />
            <path d="M116 129 C131 120 145 120 160 126" fill="none" stroke="#d4af37" strokeOpacity=".26" />
            <path d="M221 132 C236 134 247 143 254 156" fill="none" stroke="#67e8f9" strokeOpacity=".23" />
            <path d="M109 190 C139 173 158 174 181 182 C207 192 226 188 252 170" fill="none" stroke="#67e8f9" strokeOpacity=".19" strokeDasharray="2 5" />
          </g>
        </g>

        <g className="sweep">
          <path className="beam" d="M180 180 L180 50 A130 130 0 0 1 269 86 Z" fill="url(#radarBeamV4)" />
          <line x1="180" y1="180" x2="269" y2="86" stroke="#67e8f9" strokeOpacity=".95" strokeWidth="1.45" filter="url(#cyanGlowV4)" />
        </g>

        <g fill="none" strokeLinecap="round">
          <path d="M86 215 C124 176 155 169 192 171 C229 174 258 157 286 124" stroke="#d4af37" strokeOpacity=".56" strokeDasharray="2 5" strokeWidth="1.15" />
          <path d="M114 136 C146 158 181 152 210 136 C234 122 257 120 281 134" stroke="#67e8f9" strokeOpacity=".47" strokeDasharray="2 4" strokeWidth="1.05" />
        </g>

        {signalNodes.map(([x, y, tone], index) => (
          <g key={index} className="node-pulse" style={{ animationDelay: `${index * 0.34}s` }}>
            <circle cx={x * 3.6} cy={y * 3.6} r="5.3" fill="none" stroke={tone === "gold" ? "#d4af37" : "#67e8f9"} strokeOpacity=".24" />
            <circle cx={x * 3.6} cy={y * 3.6} r="2.35" fill={tone === "gold" ? "#ffdc73" : "#67e8f9"} filter={tone === "gold" ? "url(#goldGlowV4)" : "url(#cyanGlowV4)"} />
          </g>
        ))}

        <g fontFamily="Inter, sans-serif" fontSize="10" letterSpacing="2" textAnchor="middle">
          <text x="180" y="17" fill="#f3d67a" opacity=".92">N</text>
          <text x="180" y="348" fill="#f3d67a" opacity=".92">S</text>
          <text x="14" y="184" fill="#f3d67a" opacity=".92">O</text>
          <text x="347" y="184" fill="#f3d67a" opacity=".92">L</text>
        </g>
        <g fill="#f3d67a" opacity=".9">
          <path d="M180 23 l-6 10 h12z" />
          <path d="M180 337 l6-10 h-12z" />
          <path d="M23 180 l10-6 v12z" />
          <path d="M337 180 l-10 6 v-12z" />
        </g>
      </svg>

      <div className="relative z-20 flex flex-col items-center justify-center text-center" aria-hidden="true">
        <strong className="signal-count bg-gradient-to-b from-[#fff9dd] via-[#f4d776] to-[#a77a13] bg-clip-text text-[3.75rem] font-semibold leading-none text-transparent sm:text-[4.6rem]">
          {signals}
        </strong>
        <span className="mt-2 text-[9px] font-medium uppercase tracking-[.34em] text-cyan-100/65 sm:text-[10px]">sinais ativos</span>
        <span className="mt-3 h-px w-20 bg-gradient-to-r from-transparent via-[#e0bd4d]/90 to-transparent" />
      </div>

      <div className="horizon-glow pointer-events-none absolute bottom-[4%] left-1/2 h-px w-[72%] -translate-x-1/2 bg-gradient-to-r from-transparent via-[#d4af37]/45 to-transparent shadow-[0_0_16px_rgba(212,175,55,.22)]" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-[.5%] rounded-full border border-white/[.035] shadow-[inset_0_0_48px_rgba(34,211,238,.055)]" aria-hidden="true" />
    </div>
  );
}
