import { useMemo } from "react";

import { cn } from "@/lib/utils";

export type TomorrowLiveState = "idle" | "listening" | "thinking" | "speaking" | "offers";

export interface LiveParticleGlobeProps {
  state: TomorrowLiveState;
  reducedMotion?: boolean;
  lowPerformance?: boolean;
  className?: string;
}

const stateStyle: Record<
  TomorrowLiveState,
  { glow: string; ring: string; accent: string; wave: string; label: string }
> = {
  idle: {
    glow: "rgba(67, 195, 190, 0.24)",
    ring: "rgba(98, 224, 218, 0.76)",
    accent: "rgba(219, 184, 92, 0.62)",
    wave: "rgba(95, 233, 226, 0.28)",
    label: "Aguardando",
  },
  listening: {
    glow: "rgba(66, 228, 220, 0.38)",
    ring: "rgba(117, 243, 236, 0.98)",
    accent: "rgba(227, 199, 116, 0.74)",
    wave: "rgba(101, 240, 233, 0.58)",
    label: "Ouvindo",
  },
  thinking: {
    glow: "rgba(218, 179, 83, 0.3)",
    ring: "rgba(231, 203, 124, 0.92)",
    accent: "rgba(108, 232, 225, 0.7)",
    wave: "rgba(227, 201, 126, 0.38)",
    label: "Pensando",
  },
  speaking: {
    glow: "rgba(74, 212, 204, 0.4)",
    ring: "rgba(106, 237, 229, 0.94)",
    accent: "rgba(229, 197, 110, 0.82)",
    wave: "rgba(102, 239, 232, 0.62)",
    label: "Falando",
  },
  offers: {
    glow: "rgba(222, 188, 98, 0.32)",
    ring: "rgba(112, 236, 228, 0.9)",
    accent: "rgba(231, 203, 124, 0.88)",
    wave: "rgba(231, 203, 124, 0.42)",
    label: "Ofertas",
  },
};

type Particle = {
  x: number;
  y: number;
  radius: number;
  opacity: number;
  gold: boolean;
};

function buildGlobeParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, index) => {
    const phi = Math.acos(1 - (2 * (index + 0.5)) / count);
    const theta = Math.PI * (1 + Math.sqrt(5)) * index;
    const x3 = Math.cos(theta) * Math.sin(phi);
    const y3 = Math.cos(phi);
    const z3 = Math.sin(theta) * Math.sin(phi);
    const depth = (z3 + 1) / 2;

    return {
      x: 310 + x3 * 122,
      y: 238 + y3 * 122,
      radius: 0.65 + depth * 1.15,
      opacity: 0.14 + depth * 0.58,
      gold: index % 13 === 0 || index % 19 === 0,
    };
  });
}

const wavePaths = [
  "M-50 244 C35 178 92 178 170 244 S305 310 382 244 S520 178 602 244 S730 310 800 244",
  "M-50 262 C30 202 96 202 174 262 S310 322 388 262 S526 202 606 262 S732 322 800 262",
  "M-50 280 C34 220 100 220 178 280 S314 340 392 280 S530 220 610 280 S736 340 800 280",
  "M-50 298 C34 244 102 244 182 298 S318 352 396 298 S534 244 614 298 S740 352 800 298",
];

const waveformBars = [12, 18, 9, 22, 32, 16, 27, 12, 38, 18, 29, 14, 36, 20, 11, 28, 42, 19, 31, 15, 24, 10, 36, 17, 27, 12, 22];

export function LiveParticleGlobe({
  state,
  reducedMotion = false,
  lowPerformance = false,
  className,
}: LiveParticleGlobeProps) {
  const particleCount = reducedMotion || lowPerformance ? 96 : 220;
  const particles = useMemo(() => buildGlobeParticles(particleCount), [particleCount]);
  const style = stateStyle[state];
  const active = state !== "idle";
  const reactive = state === "listening" || state === "speaking";

  return (
    <figure
      className={cn("relative mx-auto aspect-[1.28] w-full max-w-[58rem]", className)}
      aria-label={`Globo visual do Tomorrow Live — ${style.label}`}
      data-live-state={state}
    >
      <div
        className="pointer-events-none absolute inset-x-[17%] top-[8%] bottom-[22%] rounded-full blur-[86px] transition-all duration-500"
        style={{ background: `radial-gradient(circle, ${style.glow} 0%, rgba(3,18,22,0) 74%)` }}
        aria-hidden="true"
      />

      <svg viewBox="0 0 620 485" className="relative z-10 h-full w-full overflow-visible" role="img" aria-hidden="true">
        <defs>
          <radialGradient id="tt-globe-fill" cx="48%" cy="39%" r="64%">
            <stop offset="0%" stopColor="rgba(75, 221, 215, 0.14)" />
            <stop offset="58%" stopColor="rgba(13, 68, 77, 0.18)" />
            <stop offset="100%" stopColor="rgba(2, 16, 20, 0.04)" />
          </radialGradient>
          <radialGradient id="tt-globe-core" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(139, 249, 243, 0.98)" />
            <stop offset="26%" stopColor="rgba(78, 223, 216, 0.74)" />
            <stop offset="62%" stopColor="rgba(18, 79, 87, 0.2)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0)" />
          </radialGradient>
          <linearGradient id="tt-globe-stroke" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={style.ring} />
            <stop offset="62%" stopColor="rgba(104, 239, 232, 0.96)" />
            <stop offset="100%" stopColor={style.accent} />
          </linearGradient>
          <linearGradient id="tt-wave" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(101,240,233,0)" />
            <stop offset="18%" stopColor={style.wave} />
            <stop offset="50%" stopColor="rgba(101,240,233,0.96)" />
            <stop offset="82%" stopColor={style.wave} />
            <stop offset="100%" stopColor="rgba(101,240,233,0)" />
          </linearGradient>
          <filter id="tt-glow" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="3.8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="tt-glow-strong" x="-90%" y="-90%" width="280%" height="280%">
            <feGaussianBlur stdDeviation="7.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <clipPath id="tt-globe-clip">
            <circle cx="310" cy="238" r="132" />
          </clipPath>
        </defs>

        <g opacity={reactive ? 0.96 : 0.62}>
          {wavePaths.map((path, index) => (
            <path
              key={path}
              d={path}
              fill="none"
              stroke="url(#tt-wave)"
              strokeWidth={index % 2 === 0 ? 2.2 : 1.25}
              strokeDasharray={index % 2 === 0 ? "2 8" : "4 10"}
              opacity={index === 1 || index === 2 ? 0.94 : 0.68}
            >
              {!reducedMotion ? (
                <animate attributeName="stroke-dashoffset" values={index % 2 === 0 ? "0;-80" : "0;80"} dur={`${5 + index * 0.75}s`} repeatCount="indefinite" />
              ) : null}
            </path>
          ))}
        </g>

        <g opacity="0.7">
          <ellipse cx="310" cy="382" rx="156" ry="31" fill="none" stroke="rgba(66,216,209,0.14)" strokeWidth="1.35" />
          <ellipse cx="310" cy="382" rx="134" ry="24" fill="none" stroke="rgba(88,232,225,0.2)" strokeWidth="1.1" strokeDasharray="3 8" />
          <ellipse cx="310" cy="382" rx="104" ry="17" fill="none" stroke="rgba(226,197,111,0.18)" strokeWidth="1" strokeDasharray="2 8" />
        </g>

        <circle cx="310" cy="238" r="151" fill="rgba(73,219,212,0.045)" filter="url(#tt-glow-strong)" />
        <circle cx="310" cy="238" r="132" fill="url(#tt-globe-fill)" stroke="url(#tt-globe-stroke)" strokeWidth="2.3" />

        <g clipPath="url(#tt-globe-clip)">
          <g
            className={cn(!reducedMotion && "animate-[spin_58s_linear_infinite]")}
            style={{ transformOrigin: "310px 238px" }}
          >
            {particles.map((particle, index) => (
              <circle
                key={`${index}-${particle.x.toFixed(1)}`}
                cx={particle.x}
                cy={particle.y}
                r={particle.radius}
                fill={particle.gold ? "rgba(229,196,107,0.94)" : "rgba(102,232,224,0.92)"}
                opacity={particle.opacity}
              />
            ))}
          </g>

          <g filter="url(#tt-glow)" opacity="0.96">
            <path d="M252 125 C230 131 217 144 214 158 C212 169 217 178 226 183 C235 188 238 197 236 207 C233 218 225 228 223 240 C220 255 224 271 232 284 C241 299 254 310 261 324 C266 334 269 344 267 354" fill="none" stroke="rgba(112,242,235,0.95)" strokeWidth="2.2" strokeLinecap="round" />
            <path d="M236 182 C248 179 259 183 267 191 C272 197 274 206 272 216 C270 226 273 237 279 246 C285 257 289 269 288 282 C286 296 280 310 274 321" fill="none" stroke="rgba(112,242,235,0.78)" strokeWidth="1.4" strokeLinecap="round" />

            <path d="M337 132 C349 124 365 121 380 124 C394 127 405 134 411 144 C416 152 416 162 411 169 C406 177 398 182 393 188 C387 196 386 205 390 215 C395 225 403 232 408 241 C414 251 416 264 413 277 C410 289 404 301 396 312 C389 322 382 333 380 345" fill="none" stroke="rgba(112,242,235,0.94)" strokeWidth="2" strokeLinecap="round" />
            <path d="M381 132 C397 127 417 129 433 137 C447 144 457 154 464 167 C469 178 470 188 466 196 C462 205 454 210 446 214 C438 218 432 225 431 234 C430 244 436 253 443 261 C451 271 456 282 456 295 C456 307 452 318 445 329" fill="none" stroke="rgba(112,242,235,0.72)" strokeWidth="1.55" strokeLinecap="round" />
            <path d="M410 148 C425 146 440 151 451 160" fill="none" stroke="rgba(229,196,107,0.88)" strokeWidth="1.7" strokeLinecap="round" />
          </g>

          <g opacity="0.22">
            <ellipse cx="310" cy="238" rx="116" ry="132" fill="none" stroke="rgba(101,238,231,0.42)" strokeWidth="1" />
            <ellipse cx="310" cy="238" rx="78" ry="132" fill="none" stroke="rgba(101,238,231,0.24)" strokeWidth="1" />
            <ellipse cx="310" cy="238" rx="40" ry="132" fill="none" stroke="rgba(101,238,231,0.18)" strokeWidth="1" />
            <ellipse cx="310" cy="238" rx="132" ry="55" fill="none" stroke="rgba(101,238,231,0.24)" strokeWidth="1" />
            <ellipse cx="310" cy="238" rx="132" ry="20" fill="none" stroke="rgba(101,238,231,0.18)" strokeWidth="1" />
          </g>
        </g>

        <g filter="url(#tt-glow)">
          <circle cx="233" cy="286" r="5.7" fill="rgba(100,236,229,0.98)" />
          <circle cx="419" cy="186" r="5.7" fill="rgba(229,196,107,0.98)" />
          <circle cx="472" cy="242" r="3.6" fill="rgba(229,196,107,0.86)" />
          <circle cx="267" cy="157" r="3.6" fill="rgba(229,196,107,0.86)" />
          {!reducedMotion ? (
            <>
              <circle cx="233" cy="286" r="8" fill="none" stroke="rgba(100,236,229,0.88)" opacity="0.42">
                <animate attributeName="r" values="8;18;8" dur="2.8s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.42;0;0.42" dur="2.8s" repeatCount="indefinite" />
              </circle>
              <circle cx="419" cy="186" r="8" fill="none" stroke="rgba(229,196,107,0.88)" opacity="0.42">
                <animate attributeName="r" values="8;18;8" dur="3.1s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.42;0;0.42" dur="3.1s" repeatCount="indefinite" />
              </circle>
            </>
          ) : null}
        </g>

        <path d="M233 286 C261 265 287 251 310 243 C350 229 385 215 419 186" fill="none" stroke="rgba(101,240,233,0.9)" strokeWidth="2" strokeLinecap="round" strokeDasharray="3 8" opacity={active ? 0.92 : 0.5}>
          {!reducedMotion ? <animate attributeName="stroke-dashoffset" values="0;-68" dur="3.5s" repeatCount="indefinite" /> : null}
        </path>

        <circle cx="310" cy="238" r="21" fill="url(#tt-globe-core)" filter="url(#tt-glow-strong)" />
        <circle cx="310" cy="238" r={reactive ? 32 : 22} fill="none" stroke={style.ring} strokeWidth="1.05" opacity={active ? 0.58 : 0.26}>
          {!reducedMotion && reactive ? (
            <animate attributeName="r" values="24;38;24" dur={state === "speaking" ? "1.6s" : "2.2s"} repeatCount="indefinite" />
          ) : null}
        </circle>

        <g transform="translate(0 433)" opacity={reactive ? 1 : 0.58}>
          <text x="310" y="-15" textAnchor="middle" fill="rgba(112,242,235,0.92)" fontSize="11" fontWeight="700" letterSpacing="3.2">
            {state === "listening" ? "OUVINDO..." : state === "speaking" ? "FALANDO..." : style.label.toUpperCase()}
          </text>
          <g transform="translate(176 0)" fill="rgba(101,240,233,0.92)">
            {waveformBars.map((height, index) => (
              <rect key={`${index}-${height}`} x={index * 10} y={(42 - height) / 2} width="2.2" height={height} rx="1.1" opacity={0.45 + (index % 4) * 0.14}>
                {!reducedMotion && reactive ? (
                  <animate attributeName="height" values={`${Math.max(6, height * 0.45)};${height};${Math.max(6, height * 0.55)}`} dur={`${0.8 + (index % 5) * 0.17}s`} repeatCount="indefinite" />
                ) : null}
              </rect>
            ))}
          </g>
        </g>
      </svg>
    </figure>
  );
}
