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
  { glow: string; ring: string; accent: string; pulse: string; label: string }
> = {
  idle: {
    glow: "rgba(67, 195, 190, 0.26)",
    ring: "rgba(98, 224, 218, 0.7)",
    accent: "rgba(219, 184, 92, 0.62)",
    pulse: "rgba(67, 195, 190, 0.2)",
    label: "Aguardando",
  },
  listening: {
    glow: "rgba(72, 229, 221, 0.34)",
    ring: "rgba(120, 241, 234, 0.92)",
    accent: "rgba(221, 194, 112, 0.7)",
    pulse: "rgba(72, 229, 221, 0.3)",
    label: "Ouvindo",
  },
  thinking: {
    glow: "rgba(218, 179, 83, 0.34)",
    ring: "rgba(231, 203, 124, 0.92)",
    accent: "rgba(108, 232, 225, 0.68)",
    pulse: "rgba(218, 179, 83, 0.24)",
    label: "Pensando",
  },
  speaking: {
    glow: "rgba(79, 211, 203, 0.36)",
    ring: "rgba(227, 192, 101, 0.8)",
    accent: "rgba(102, 232, 224, 0.74)",
    pulse: "rgba(79, 211, 203, 0.28)",
    label: "Falando",
  },
  offers: {
    glow: "rgba(222, 188, 98, 0.36)",
    ring: "rgba(102, 232, 224, 0.88)",
    accent: "rgba(231, 203, 124, 0.82)",
    pulse: "rgba(222, 188, 98, 0.26)",
    label: "Apresentando oportunidades",
  },
};

type Particle = {
  x: number;
  y: number;
  radius: number;
  opacity: number;
  gold: boolean;
};

function buildCommandParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, index) => {
    const angle = ((index * 137.508) % 360) * (Math.PI / 180);
    const band = index % 4;
    const baseRadius = [46, 68, 92, 116][band];
    const variance = ((index * 17) % 31) - 15;
    const radius = baseRadius + variance;
    const verticalScale = band === 3 ? 0.58 : band === 2 ? 0.68 : 0.76;
    const driftX = Math.cos(angle * 1.83) * (band >= 2 ? 11 : 6);
    const driftY = Math.sin(angle * 1.41) * (band === 0 ? 8 : 5);

    return {
      x: 180 + Math.cos(angle) * radius + driftX,
      y: 180 + Math.sin(angle) * radius * verticalScale + driftY,
      radius: 0.8 + ((index * 7) % 10) / 10,
      opacity: 0.24 + ((index * 11) % 56) / 100,
      gold: index % 5 === 0 || index % 13 === 0,
    };
  });
}

const energyRoutes = [
  "M96 208 C124 178 142 165 168 160 S226 152 268 156",
  "M102 214 C140 232 168 248 198 250 S218 252 228 258",
  "M136 120 C161 100 202 98 228 116",
  "M124 258 C157 283 208 287 249 256",
];

const orbitNodes = [
  { x: 100, y: 208, radius: 5.4, gold: false },
  { x: 268, y: 156, radius: 5.8, gold: true },
  { x: 228, y: 258, radius: 4.4, gold: false },
];

export function LiveParticleGlobe({
  state,
  reducedMotion = false,
  lowPerformance = false,
  className,
}: LiveParticleGlobeProps) {
  const particleCount = reducedMotion || lowPerformance ? 58 : 126;
  const particles = useMemo(() => buildCommandParticles(particleCount), [particleCount]);
  const style = stateStyle[state];
  const active = state !== "idle";

  return (
    <figure
      className={cn("relative mx-auto aspect-square w-full max-w-[32rem]", className)}
      aria-label={`Núcleo visual do Tomorrow Live — ${style.label}`}
      data-live-state={state}
    >
      <div
        className="pointer-events-none absolute inset-[13%] rounded-full blur-3xl transition-all duration-500"
        style={{ background: `radial-gradient(circle, ${style.glow} 0%, rgba(4,18,20,0) 72%)` }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-[24%] rounded-full blur-2xl transition-all duration-500"
        style={{ background: `radial-gradient(circle, ${style.pulse} 0%, rgba(4,18,20,0) 75%)` }}
        aria-hidden="true"
      />

      <svg viewBox="0 0 360 360" className="relative z-10 h-full w-full overflow-visible" role="img" aria-hidden="true">
        <defs>
          <radialGradient id="live-command-core" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(121, 245, 238, 0.95)" />
            <stop offset="24%" stopColor="rgba(64, 184, 178, 0.58)" />
            <stop offset="62%" stopColor="rgba(17, 69, 75, 0.18)" />
            <stop offset="100%" stopColor="rgba(4, 18, 20, 0)" />
          </radialGradient>
          <radialGradient id="live-command-gold" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(232, 205, 130, 0.82)" />
            <stop offset="58%" stopColor="rgba(232, 205, 130, 0.12)" />
            <stop offset="100%" stopColor="rgba(4,18,20,0)" />
          </radialGradient>
          <linearGradient id="live-command-ring" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={style.ring} />
            <stop offset="62%" stopColor={style.accent} />
            <stop offset="100%" stopColor="rgba(85, 227, 219, 0.24)" />
          </linearGradient>
          <linearGradient id="live-command-route" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(90, 234, 226, 0.08)" />
            <stop offset="34%" stopColor="rgba(110, 238, 230, 0.78)" />
            <stop offset="72%" stopColor="rgba(223, 196, 118, 0.72)" />
            <stop offset="100%" stopColor="rgba(223, 196, 118, 0.08)" />
          </linearGradient>
          <filter id="live-command-soft" x="-70%" y="-70%" width="240%" height="240%">
            <feGaussianBlur stdDeviation="3.4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="live-command-hard" x="-70%" y="-70%" width="240%" height="240%">
            <feGaussianBlur stdDeviation="1.7" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <g opacity="0.42">
          <ellipse cx="180" cy="180" rx="126" ry="88" fill="none" stroke="rgba(71,217,209,0.1)" strokeWidth="1.1" strokeDasharray="3 9" />
          <ellipse cx="180" cy="180" rx="102" ry="120" fill="none" stroke="rgba(219,184,92,0.08)" strokeWidth="1.1" strokeDasharray="4 11" transform="rotate(18 180 180)" />
        </g>

        <circle cx="180" cy="180" r="78" fill="url(#live-command-core)" opacity="0.95" />
        <circle cx="180" cy="180" r="31" fill="url(#live-command-gold)" opacity="0.6" />

        <g
          filter="url(#live-command-soft)"
          className={cn(!reducedMotion && "animate-[spin_24s_linear_infinite]")}
          style={{ transformOrigin: "180px 180px" }}
        >
          <path d="M114 162 C132 128 176 112 220 125 C248 133 268 151 276 177" fill="none" stroke="url(#live-command-ring)" strokeWidth="3" strokeLinecap="round" />
          <path d="M248 188 C241 224 215 248 178 254 C146 258 116 245 94 220" fill="none" stroke="url(#live-command-ring)" strokeWidth="2.8" strokeLinecap="round" />
        </g>

        <g filter="url(#live-command-soft)" opacity="0.88">
          <path d="M136 112 C164 94 203 94 232 110" fill="none" stroke="rgba(103,231,224,0.5)" strokeWidth="2" strokeLinecap="round" />
          <path d="M120 247 C151 271 207 275 248 247" fill="none" stroke="rgba(224,193,105,0.46)" strokeWidth="2" strokeLinecap="round" />
        </g>

        <g filter="url(#live-command-hard)">
          {energyRoutes.map((route, index) => (
            <path
              key={route}
              d={route}
              fill="none"
              stroke="url(#live-command-route)"
              strokeWidth={index < 2 ? 2.15 : 1.55}
              strokeLinecap="round"
              strokeDasharray={index < 2 ? "3 5" : "2 7"}
              opacity={index < 2 ? 0.9 : 0.6}
            >
              {!reducedMotion ? (
                <animate attributeName="stroke-dashoffset" values="0;-48" dur={`${3.1 + index * 0.45}s`} repeatCount="indefinite" />
              ) : null}
            </path>
          ))}
        </g>

        <g
          className={cn(!reducedMotion && "animate-[spin_38s_linear_infinite_reverse]")}
          style={{ transformOrigin: "180px 180px" }}
        >
          {particles.map((particle, index) => (
            <circle
              key={`${index}-${particle.x.toFixed(2)}`}
              cx={particle.x}
              cy={particle.y}
              r={particle.radius}
              fill={particle.gold ? "rgba(226, 194, 105, 0.96)" : "rgba(102, 232, 224, 0.96)"}
              opacity={particle.opacity * (active ? 1 : 0.78)}
            />
          ))}
        </g>

        <g filter="url(#live-command-hard)">
          {orbitNodes.map((node) => {
            const fill = node.gold ? "rgba(226,194,105,0.98)" : "rgba(102,232,224,0.98)";
            const aura = node.gold ? "rgba(226,194,105,0.28)" : "rgba(102,232,224,0.3)";
            return (
              <g key={`${node.x}-${node.y}`}>
                <circle cx={node.x} cy={node.y} r={node.radius * 2.8} fill={aura} opacity="0.55" />
                <circle cx={node.x} cy={node.y} r={node.radius} fill={fill} />
                <circle cx={node.x} cy={node.y} r={node.radius + 2.2} fill="none" stroke={fill} strokeOpacity="0.55" strokeWidth="1.15" />
                {!reducedMotion ? (
                  <circle cx={node.x} cy={node.y} r={node.radius + 4} fill="none" stroke={fill} opacity="0.36">
                    <animate attributeName="r" values={`${node.radius + 3};${node.radius + 12};${node.radius + 3}`} dur={node.gold ? "3s" : "2.7s"} repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.42;0;0.42" dur={node.gold ? "3s" : "2.7s"} repeatCount="indefinite" />
                  </circle>
                ) : null}
              </g>
            );
          })}
        </g>

        <g filter="url(#live-command-hard)">
          <circle cx="180" cy="180" r="8" fill="rgba(113,237,230,0.94)" />
          <circle cx="180" cy="180" r="16" fill="none" stroke="rgba(108,231,224,0.34)" strokeWidth="1.35" />
          <circle cx="180" cy="180" r="30" fill="none" stroke="rgba(226,197,118,0.22)" strokeWidth="1.05" strokeDasharray="3 7" />
          {!reducedMotion && active ? (
            <circle cx="180" cy="180" r="35" fill="none" stroke={style.ring} strokeWidth="0.8" opacity="0.42">
              <animate attributeName="r" values="28;44;28" dur="2.6s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.5;0.12;0.5" dur="2.6s" repeatCount="indefinite" />
            </circle>
          ) : null}
        </g>
      </svg>

      <div className="pointer-events-none absolute inset-x-0 bottom-[7%] z-20 flex justify-center" aria-hidden="true">
        <span className="rounded-full border border-tomorrow-line bg-tomorrow-background/78 px-3 py-1 text-[0.66rem] font-bold uppercase tracking-[0.2em] text-tomorrow-teal-soft backdrop-blur-md">
          {style.label}
        </span>
      </div>
    </figure>
  );
}
