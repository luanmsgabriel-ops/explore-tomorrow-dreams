import { useMemo } from "react";

import { cn } from "@/lib/utils";

export type TomorrowLiveState = "idle" | "listening" | "thinking" | "speaking" | "offers";

export interface LiveParticleGlobeProps {
  state: TomorrowLiveState;
  reducedMotion?: boolean;
  lowPerformance?: boolean;
  className?: string;
}

const stateAura: Record<TomorrowLiveState, { glow: string; ring: string; label: string }> = {
  idle: {
    glow: "rgba(75, 184, 184, 0.24)",
    ring: "rgba(121, 220, 214, 0.52)",
    label: "Aguardando",
  },
  listening: {
    glow: "rgba(58, 218, 210, 0.38)",
    ring: "rgba(112, 236, 229, 0.82)",
    label: "Ouvindo",
  },
  thinking: {
    glow: "rgba(214, 175, 74, 0.34)",
    ring: "rgba(226, 194, 102, 0.82)",
    label: "Pensando",
  },
  speaking: {
    glow: "rgba(77, 204, 196, 0.36)",
    ring: "rgba(224, 189, 91, 0.76)",
    label: "Falando",
  },
  offers: {
    glow: "rgba(214, 175, 74, 0.4)",
    ring: "rgba(103, 224, 216, 0.8)",
    label: "Apresentando oportunidades",
  },
};

function buildSpherePoints(count: number) {
  if (count <= 1) return [{ x: 180, y: 180, depth: 1, radius: 1.6 }];

  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  return Array.from({ length: count }, (_, index) => {
    const y = 1 - (index / (count - 1)) * 2;
    const planarRadius = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = goldenAngle * index;
    const x = Math.cos(theta) * planarRadius;
    const z = Math.sin(theta) * planarRadius;
    const depth = (z + 1) / 2;

    return {
      x: 180 + x * 122,
      y: 180 + y * 122,
      depth,
      radius: 0.8 + depth * 1.35,
    };
  });
}

export function LiveParticleGlobe({
  state,
  reducedMotion = false,
  lowPerformance = false,
  className,
}: LiveParticleGlobeProps) {
  const pointCount = reducedMotion || lowPerformance ? 72 : 180;
  const points = useMemo(() => buildSpherePoints(pointCount), [pointCount]);
  const aura = stateAura[state];
  const active = state !== "idle";

  return (
    <figure
      className={cn("relative mx-auto aspect-square w-full max-w-[32rem]", className)}
      aria-label={`Planeta visual do Tomorrow Live — ${aura.label}`}
      data-live-state={state}
    >
      <div
        className="pointer-events-none absolute inset-[15%] rounded-full blur-3xl transition-[background,opacity] duration-500"
        style={{
          background: `radial-gradient(circle, ${aura.glow} 0%, rgba(4, 22, 25, 0) 72%)`,
          opacity: active ? 1 : 0.74,
        }}
        aria-hidden="true"
      />

      <svg viewBox="0 0 360 360" className="relative z-10 h-full w-full overflow-visible" role="img" aria-hidden="true">
        <defs>
          <radialGradient id="live-core" cx="50%" cy="42%" r="62%">
            <stop offset="0%" stopColor="rgba(83, 204, 197, 0.12)" />
            <stop offset="62%" stopColor="rgba(8, 50, 55, 0.16)" />
            <stop offset="100%" stopColor="rgba(2, 15, 18, 0.04)" />
          </radialGradient>
          <filter id="live-soft-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3.4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <clipPath id="live-sphere-clip">
            <circle cx="180" cy="180" r="126" />
          </clipPath>
        </defs>

        <circle cx="180" cy="180" r="126" fill="url(#live-core)" stroke="rgba(98, 207, 201, 0.08)" strokeWidth="1" />

        <g
          className={cn(!reducedMotion && "animate-[spin_34s_linear_infinite]")}
          style={{ transformOrigin: "180px 180px" }}
        >
          {points.map((point, index) => {
            const gold = index % 7 === 0 || index % 11 === 0;
            const opacity = 0.18 + point.depth * (active ? 0.78 : 0.58);
            return (
              <circle
                key={`${index}-${point.x.toFixed(2)}`}
                cx={point.x}
                cy={point.y}
                r={point.radius}
                fill={gold ? "rgb(222 187 92)" : "rgb(102 219 211)"}
                opacity={opacity}
              />
            );
          })}
        </g>

        <g
          fill="none"
          stroke={aura.ring}
          className={cn(!reducedMotion && "animate-[spin_26s_linear_infinite]")}
          style={{ transformOrigin: "180px 180px" }}
          opacity="0.7"
        >
          <ellipse cx="180" cy="180" rx="150" ry="54" strokeWidth="0.9" strokeDasharray="3 9" />
          <ellipse cx="180" cy="180" rx="68" ry="150" strokeWidth="0.75" strokeDasharray="2 10" transform="rotate(28 180 180)" />
        </g>

        <g clipPath="url(#live-sphere-clip)" filter="url(#live-soft-glow)">
          <path
            d="M 102 218 C 132 132, 218 112, 270 168"
            fill="none"
            stroke={state === "thinking" || state === "offers" ? "rgb(226 190 91)" : "rgb(96 225 216)"}
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeDasharray="5 8"
            opacity={active ? 0.92 : 0.5}
          >
            {!reducedMotion ? (
              <animate attributeName="stroke-dashoffset" values="0;-52" dur="3.4s" repeatCount="indefinite" />
            ) : null}
          </path>
        </g>

        <g filter="url(#live-soft-glow)">
          <circle cx="103" cy="217" r="4.2" fill="rgb(92 222 214)" />
          <circle cx="270" cy="168" r="4.2" fill="rgb(226 190 91)" />
          {!reducedMotion ? (
            <>
              <circle cx="103" cy="217" r="7" fill="none" stroke="rgb(92 222 214)" opacity="0.52">
                <animate attributeName="r" values="5;13;5" dur="2.8s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.6;0;0.6" dur="2.8s" repeatCount="indefinite" />
              </circle>
              <circle cx="270" cy="168" r="7" fill="none" stroke="rgb(226 190 91)" opacity="0.52">
                <animate attributeName="r" values="5;13;5" dur="3.1s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.6;0;0.6" dur="3.1s" repeatCount="indefinite" />
              </circle>
            </>
          ) : null}
        </g>

        <circle
          cx="180"
          cy="180"
          r={state === "listening" ? 35 : state === "speaking" ? 30 : 24}
          fill="none"
          stroke={aura.ring}
          strokeWidth="0.8"
          opacity={active ? 0.48 : 0.22}
        >
          {!reducedMotion && active ? (
            <animate attributeName="r" values="22;38;22" dur="2.6s" repeatCount="indefinite" />
          ) : null}
        </circle>
      </svg>

      <div className="pointer-events-none absolute inset-x-0 bottom-[7%] z-20 flex justify-center" aria-hidden="true">
        <span className="rounded-full border border-tomorrow-line bg-tomorrow-background/78 px-3 py-1 text-[0.66rem] font-bold uppercase tracking-[0.2em] text-tomorrow-teal-soft backdrop-blur-md">
          {aura.label}
        </span>
      </div>
    </figure>
  );
}
