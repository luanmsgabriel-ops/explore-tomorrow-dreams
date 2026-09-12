interface RadarSignalGlobeProps {
  signals: number;
  scanning?: boolean;
}

const stars = [
  [4, 17, 1.1, 0.1, "cyan"], [8, 63, .8, 1.2, "gold"], [13, 84, 1.2, 2.0, "cyan"],
  [18, 11, .7, .6, "cyan"], [24, 93, 1.1, 1.6, "gold"], [30, 5, .8, 2.5, "cyan"],
  [36, 88, 1.0, .3, "cyan"], [43, 8, .8, 2.1, "gold"], [49, 96, 1.1, 1.0, "cyan"],
  [56, 6, .8, 2.4, "cyan"], [63, 91, 1.0, 1.5, "gold"], [70, 9, .8, .8, "cyan"],
  [76, 94, .9, 3.0, "cyan"], [83, 16, 1.2, 2.3, "gold"], [90, 82, .7, 1.1, "cyan"],
  [95, 33, 1.0, 2.8, "cyan"], [96, 64, .8, .9, "gold"], [10, 47, .75, 2.0, "cyan"],
  [88, 52, .65, 1.5, "cyan"], [27, 41, .7, 2.2, "gold"], [74, 36, .75, 1.3, "cyan"],
] as const;

const signalNodes = [
  [135, 126, "gold"], [191, 116, "cyan"], [232, 151, "gold"], [213, 225, "cyan"],
  [142, 237, "gold"], [104, 198, "cyan"], [258, 210, "gold"], [95, 145, "cyan"],
] as const;

export function RadarSignalGlobe({ signals, scanning = false }: RadarSignalGlobeProps) {
  return (
    <div
      className="radar-reference relative grid aspect-square w-[min(94vw,42rem)] shrink-0 place-items-center sm:w-[46rem] lg:w-[52rem] xl:w-[58rem]"
      aria-label={`${signals} sinais ativos`}
      data-scanning={scanning}
    >
      <style>{`
        @keyframes rr-spin { to { transform: rotate(360deg); } }
        @keyframes rr-spin-back { to { transform: rotate(-360deg); } }
        @keyframes rr-float { 0%,100% { opacity:.25; transform:translateY(0) scale(.75); } 50% { opacity:1; transform:translateY(-6px) scale(1.25); } }
        @keyframes rr-pulse { 0%,100% { opacity:.35; transform:scale(.82); } 50% { opacity:1; transform:scale(1.3); } }
        @keyframes rr-globe-breathe { 0%,100% { transform:scale(.992); filter:brightness(.96); } 50% { transform:scale(1.008); filter:brightness(1.08); } }
        @keyframes rr-number { 0%,100% { filter:drop-shadow(0 0 10px rgba(255,201,78,.45)); } 50% { filter:drop-shadow(0 0 28px rgba(255,218,112,.9)); } }
        .radar-reference .ring-cw { animation: rr-spin 25s linear infinite; transform-origin:center; }
        .radar-reference .ring-ccw { animation: rr-spin-back 34s linear infinite; transform-origin:center; }
        .radar-reference .orbit-fast { animation: rr-spin 15s linear infinite; transform-origin:center; }
        .radar-reference .sweep-trail { animation: rr-spin 7.2s linear infinite; transform-origin:center; }
        .radar-reference[data-scanning="true"] .sweep-trail { animation-duration: 2.15s; }
        .radar-reference .sweep-edge { animation: rr-spin 7.2s linear infinite; transform-origin:center; }
        .radar-reference[data-scanning="true"] .sweep-edge { animation-duration: 2.15s; }
        .radar-reference .dust { animation: rr-float 4s ease-in-out infinite; }
        .radar-reference .node { animation: rr-pulse 2.6s ease-in-out infinite; transform-origin:center; transform-box:fill-box; }
        .radar-reference .globe-core { animation: rr-globe-breathe 8s ease-in-out infinite; transform-origin:center; transform-box:fill-box; }
        .radar-reference .signal-count { animation: rr-number 3.8s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .radar-reference .ring-cw,.radar-reference .ring-ccw,.radar-reference .orbit-fast,.radar-reference .sweep-trail,.radar-reference .sweep-edge,.radar-reference .dust,.radar-reference .node,.radar-reference .globe-core,.radar-reference .signal-count { animation:none !important; }
        }
      `}</style>

      <div className="pointer-events-none absolute inset-[-7%] rounded-full bg-[radial-gradient(circle,rgba(26,226,241,.16)_0%,rgba(7,70,78,.08)_42%,transparent_72%)] blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-[4%] rounded-full border border-cyan-300/[.08] shadow-[0_0_120px_rgba(34,211,238,.14)]" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-[10%] rounded-full border border-[#d4af37]/16" aria-hidden="true" />

      {stars.map(([left, top, size, delay, tone], index) => (
        <span
          key={index}
          className={`dust absolute rounded-full ${tone === "gold" ? "bg-[#ffd76a] shadow-[0_0_13px_rgba(255,207,76,.95)]" : "bg-cyan-200 shadow-[0_0_11px_rgba(103,232,249,.92)]"}`}
          style={{ left: `${left}%`, top: `${top}%`, width: size * 2.8, height: size * 2.8, animationDelay: `${delay}s` }}
          aria-hidden="true"
        />
      ))}

      <div
        className="sweep-trail pointer-events-none absolute inset-[18.3%] z-[6] rounded-full opacity-80"
        style={{
          background: "conic-gradient(from -92deg, rgba(92,240,255,0) 0deg, rgba(92,240,255,0) 286deg, rgba(92,240,255,.03) 304deg, rgba(92,240,255,.10) 321deg, rgba(92,240,255,.26) 338deg, rgba(111,246,255,.58) 353deg, rgba(181,251,255,.96) 359deg, rgba(255,255,255,.98) 360deg)",
          WebkitMaskImage: "radial-gradient(circle, transparent 0 9%, black 10% 99%, transparent 100%)",
          maskImage: "radial-gradient(circle, transparent 0 9%, black 10% 99%, transparent 100%)",
          filter: "drop-shadow(0 0 14px rgba(60,230,246,.48))",
        }}
        aria-hidden="true"
      />

      <svg viewBox="0 0 640 640" className="absolute inset-0 size-full overflow-visible" aria-hidden="true">
        <defs>
          <radialGradient id="earthBase" cx="35%" cy="26%" r="78%">
            <stop offset="0" stopColor="#5de7f2" stopOpacity=".38" />
            <stop offset=".22" stopColor="#126f7d" stopOpacity=".42" />
            <stop offset=".55" stopColor="#07343d" stopOpacity=".86" />
            <stop offset=".82" stopColor="#03181d" stopOpacity=".98" />
            <stop offset="1" stopColor="#01090b" />
          </radialGradient>
          <radialGradient id="earthHighlight" cx="25%" cy="18%" r="80%">
            <stop offset="0" stopColor="#bffbff" stopOpacity=".30" />
            <stop offset=".27" stopColor="#36dfee" stopOpacity=".10" />
            <stop offset=".62" stopColor="#04181c" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="goldMetal" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#fff7c8" />
            <stop offset=".18" stopColor="#ffe58d" />
            <stop offset=".46" stopColor="#d8a936" />
            <stop offset=".72" stopColor="#f2c65d" />
            <stop offset="1" stopColor="#7c5714" />
          </linearGradient>
          <linearGradient id="cyanGold" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#54ebf8" />
            <stop offset=".55" stopColor="#8ff5fb" />
            <stop offset="1" stopColor="#f2cc63" />
          </linearGradient>
          <filter id="glowCyan" x="-150%" y="-150%" width="400%" height="400%">
            <feGaussianBlur stdDeviation="5" result="b" />
            <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <filter id="glowGold" x="-150%" y="-150%" width="400%" height="400%">
            <feGaussianBlur stdDeviation="5" result="b" />
            <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <clipPath id="earthClip"><circle cx="320" cy="320" r="210" /></clipPath>
        </defs>

        <g className="ring-ccw">
          <circle cx="320" cy="320" r="300" fill="none" stroke="#59eaf7" strokeOpacity=".18" strokeWidth="1.2" />
          <circle cx="320" cy="320" r="286" fill="none" stroke="#d4af37" strokeOpacity=".34" strokeDasharray="3 13" strokeWidth="1.3" />
          <circle cx="320" cy="320" r="273" fill="none" stroke="#59eaf7" strokeOpacity=".20" strokeDasharray="1 8" strokeWidth="1" />
          <path d="M70 189 A292 292 0 0 1 564 154" fill="none" stroke="url(#cyanGold)" strokeOpacity=".72" strokeWidth="2" strokeLinecap="round" />
          <path d="M93 496 A289 289 0 0 0 550 521" fill="none" stroke="#e7c65c" strokeOpacity=".52" strokeWidth="2" strokeDasharray="62 34 10 29" strokeLinecap="round" />
        </g>

        <g className="ring-cw">
          <circle cx="320" cy="320" r="252" fill="none" stroke="#68edf8" strokeOpacity=".22" strokeWidth="1.2" />
          <circle cx="320" cy="320" r="236" fill="none" stroke="#d4af37" strokeOpacity=".26" strokeDasharray="46 20 8 24" strokeWidth="1.5" />
          <ellipse cx="320" cy="320" rx="279" ry="103" transform="rotate(-13 320 320)" fill="none" stroke="#67e8f9" strokeOpacity=".34" strokeDasharray="2 9" strokeWidth="1.2" />
          <ellipse cx="320" cy="320" rx="266" ry="73" transform="rotate(18 320 320)" fill="none" stroke="#e8c55b" strokeOpacity=".38" strokeDasharray="68 30 8 22" strokeWidth="1.3" />
        </g>

        <g className="orbit-fast">
          <path d="M67 359 C145 236 249 213 357 224 C465 235 529 195 584 139" fill="none" stroke="#7cf0fa" strokeOpacity=".42" strokeDasharray="3 8" strokeWidth="1.2" />
          <path d="M93 179 C182 254 289 257 385 205 C462 164 526 170 588 229" fill="none" stroke="#e2bc4f" strokeOpacity=".36" strokeDasharray="3 8" strokeWidth="1.2" />
        </g>

        <g className="globe-core">
          <circle cx="320" cy="320" r="210" fill="url(#earthBase)" stroke="#7bf1fb" strokeOpacity=".72" strokeWidth="2.4" filter="url(#glowCyan)" />
          <circle cx="320" cy="320" r="208" fill="url(#earthHighlight)" />
          <g clipPath="url(#earthClip)">
            <ellipse cx="320" cy="320" rx="54" ry="210" fill="none" stroke="#70ecf6" strokeOpacity=".20" />
            <ellipse cx="320" cy="320" rx="108" ry="210" fill="none" stroke="#70ecf6" strokeOpacity=".14" />
            <ellipse cx="320" cy="320" rx="164" ry="210" fill="none" stroke="#d7ba4d" strokeOpacity=".10" />
            <ellipse cx="320" cy="320" rx="210" ry="48" fill="none" stroke="#70ecf6" strokeOpacity=".20" />
            <ellipse cx="320" cy="320" rx="210" ry="94" fill="none" stroke="#70ecf6" strokeOpacity=".13" />
            <ellipse cx="320" cy="320" rx="210" ry="150" fill="none" stroke="#d7ba4d" strokeOpacity=".09" />

            <path d="M210 185 C237 163 276 154 310 158 C336 161 352 176 371 185 C389 193 417 189 435 201 C451 211 448 228 433 239 C414 252 391 249 375 257 C362 264 356 278 344 284 C331 291 314 286 304 296 C294 306 298 321 283 328 C269 334 252 327 243 316 C230 300 232 279 222 265 C213 251 196 241 193 226 C190 211 197 196 210 185 Z" fill="#bfeef2" fillOpacity=".16" stroke="#d9fafc" strokeOpacity=".45" strokeWidth="1.2" />
            <path d="M278 299 C296 286 322 286 338 297 C355 309 357 328 368 341 C379 353 397 360 400 377 C404 395 393 411 382 425 C369 442 361 461 348 479 C337 493 326 511 311 505 C297 499 297 478 287 465 C277 452 258 444 253 428 C248 413 258 399 255 385 C252 370 240 358 243 342 C246 326 261 310 278 299 Z" fill="url(#goldMetal)" fillOpacity=".48" stroke="#ffe292" strokeOpacity=".88" strokeWidth="1.5" filter="url(#glowGold)" />
            <path d="M187 249 C204 236 223 234 239 242 M390 230 C412 230 432 241 444 259 M181 355 C203 345 228 346 245 358 M392 392 C413 384 438 389 452 405" fill="none" stroke="#8cf3fb" strokeOpacity=".30" strokeWidth="1.2" />

            {[...Array(22)].map((_, index) => {
              const points = [
                [243,214],[265,202],[288,217],[307,199],[337,211],[365,221],[392,237],[421,258],
                [225,277],[259,267],[292,280],[329,267],[356,285],[391,296],[435,315],
                [223,348],[265,337],[296,355],[341,349],[378,365],[418,381],[277,410],[324,401]
              ];
              const [x,y] = points[index];
              return <circle key={index} cx={x} cy={y} r={index % 5 === 0 ? 2.4 : 1.35} fill={index % 4 === 0 ? "#ffd36b" : "#9af6fb"} opacity={index % 3 === 0 ? .9 : .55} />;
            })}
          </g>
        </g>

        {signalNodes.map(([x, y, tone], index) => (
          <g key={index} className="node" style={{ animationDelay: `${index * .28}s` }}>
            <circle cx={x + 160} cy={y + 160} r="8" fill="none" stroke={tone === "gold" ? "#f0c85e" : "#6cebf7"} strokeOpacity=".20" />
            <circle cx={x + 160} cy={y + 160} r="3.1" fill={tone === "gold" ? "#ffd36b" : "#91f6fb"} filter={tone === "gold" ? "url(#glowGold)" : "url(#glowCyan)"} />
          </g>
        ))}

        <g fill="none" strokeLinecap="round">
          <path d="M106 363 C180 287 252 279 323 299 C401 321 469 291 531 221" stroke="#72ecf7" strokeOpacity=".46" strokeDasharray="2 6" strokeWidth="1.5" />
          <path d="M131 228 C214 280 290 273 350 236 C405 202 474 198 529 243" stroke="#e8c85f" strokeOpacity=".45" strokeDasharray="2 6" strokeWidth="1.4" />
        </g>

        <g className="sweep-edge">
          <line x1="320" y1="320" x2="320" y2="118" stroke="#c5fcff" strokeOpacity=".98" strokeWidth="3.1" filter="url(#glowCyan)" />
          <circle cx="320" cy="118" r="4.2" fill="#d8feff" filter="url(#glowCyan)" />
        </g>

        <g fontFamily="Inter, sans-serif" textAnchor="middle">
          <text x="320" y="36" fontSize="18" letterSpacing="2" fill="#f2ce63">N</text>
          <text x="320" y="617" fontSize="18" letterSpacing="2" fill="#f2ce63">S</text>
          <text x="28" y="326" fontSize="18" letterSpacing="2" fill="#f2ce63">O</text>
          <text x="612" y="326" fontSize="18" letterSpacing="2" fill="#f2ce63">L</text>
        </g>
        <g fill="url(#goldMetal)" filter="url(#glowGold)">
          <path d="M320 49 l-9 16 h18z" />
          <path d="M320 591 l9-16 h-18z" />
          <path d="M49 320 l16-9 v18z" />
          <path d="M591 320 l-16 9 v-18z" />
        </g>

        <g fill="#f5d36f" opacity=".90" filter="url(#glowGold)">
          <path d="M537 390 l16 4 -8 5 7 12 -5 3 -9-11 -8 7 2-16z" />
          <path d="M561 333 l13 3 -6 4 6 10 -4 2 -7-9 -7 6 1-13z" />
        </g>
      </svg>

      <div className="relative z-20 flex flex-col items-center justify-center text-center" aria-hidden="true">
        <div className="mb-3 h-[7.8rem] w-[7.8rem] rounded-full border border-cyan-100/20 bg-black/45 shadow-[0_0_44px_rgba(0,0,0,.65),inset_0_0_28px_rgba(71,234,247,.05)] sm:h-[9.6rem] sm:w-[9.6rem]" />
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <div className="-translate-y-1 text-center">
            <strong className="signal-count bg-gradient-to-b from-[#fff8d6] via-[#f1c95c] to-[#9b6c16] bg-clip-text text-[4.6rem] font-medium leading-none text-transparent sm:text-[6.6rem]">
              {signals}
            </strong>
            <span className="mt-1 block text-[10px] uppercase tracking-[.42em] text-cyan-100/80 sm:text-xs">sinais ativos</span>
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-[5%] left-1/2 h-16 w-[64%] -translate-x-1/2 rounded-[50%] bg-cyan-300/[.05] blur-2xl" aria-hidden="true" />
    </div>
  );
}
