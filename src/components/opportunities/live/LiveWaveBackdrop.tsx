import { useId, useMemo } from "react";

import type { TomorrowLiveState } from "./LiveParticleGlobe";

type WavePreset = {
  baseline: number;
  amplitude: number;
  speed: number;
  opacity: number;
  glow: number;
};

export interface LiveWaveBackdropProps {
  state: TomorrowLiveState;
  audioLevel?: number;
  reducedMotion?: boolean;
  lowPerformance?: boolean;
  className?: string;
}

const statePreset: Record<TomorrowLiveState, WavePreset> = {
  idle: { baseline: 0.14, amplitude: 18, speed: 8.6, opacity: 0.48, glow: 0.42 },
  listening: { baseline: 0.7, amplitude: 34, speed: 4.7, opacity: 0.82, glow: 0.78 },
  thinking: { baseline: 0.32, amplitude: 20, speed: 7.1, opacity: 0.58, glow: 0.5 },
  speaking: { baseline: 0.86, amplitude: 41, speed: 3.9, opacity: 0.9, glow: 0.9 },
  offers: { baseline: 0.45, amplitude: 25, speed: 6.3, opacity: 0.67, glow: 0.62 },
};

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

function buildWavePath(index: number, amplitude: number, phase = 0) {
  const width = 960;
  const segment = 120;
  const center = 118 + index * 13;
  const frequency = 0.84 + (index % 3) * 0.13;
  const points = Array.from({ length: 9 }, (_, pointIndex) => {
    const x = pointIndex * segment;
    const wave = Math.sin(pointIndex * frequency + phase + index * 0.62);
    const secondary = Math.sin(pointIndex * 0.47 - phase * 0.45 + index) * 0.32;
    return { x, y: center + (wave + secondary) * amplitude };
  });

  let path = `M ${points[0].x} ${points[0].y.toFixed(2)}`;
  for (let indexPoint = 0; indexPoint < points.length - 1; indexPoint += 1) {
    const current = points[indexPoint];
    const next = points[indexPoint + 1];
    const midpoint = (current.x + next.x) / 2;
    path += ` C ${midpoint.toFixed(2)} ${current.y.toFixed(2)}, ${midpoint.toFixed(2)} ${next.y.toFixed(2)}, ${next.x} ${next.y.toFixed(2)}`;
  }
  return path;
}

export function LiveWaveBackdrop({
  state,
  audioLevel,
  reducedMotion = false,
  lowPerformance = false,
  className,
}: LiveWaveBackdropProps) {
  const preset = statePreset[state];
  const effectiveLevel = clamp01(audioLevel ?? preset.baseline);
  const lineCount = lowPerformance ? 5 : 8;
  const id = useId().replace(/:/g, "");
  const cyanGradientId = `${id}-cyan`;
  const goldGradientId = `${id}-gold`;
  const glowId = `${id}-glow`;

  const waves = useMemo(() => {
    return Array.from({ length: lineCount }, (_, index) => {
      const depth = lineCount === 1 ? 1 : index / (lineCount - 1);
      const amplitude = preset.amplitude * (0.62 + effectiveLevel * 0.72) * (1 - depth * 0.18);
      const phase = index * 0.48;
      const nextPhase = phase + (state === "thinking" ? 0.18 : 0.42 + effectiveLevel * 0.22);
      return {
        index,
        d: buildWavePath(index, amplitude, phase),
        dNext: buildWavePath(index, amplitude * (0.96 + effectiveLevel * 0.1), nextPhase),
        strokeWidth: 0.72 + effectiveLevel * 0.82 + (index % 3 === 0 ? 0.35 : 0),
        opacity: Math.max(0.16, preset.opacity - depth * 0.24),
        duration: Math.max(2.9, preset.speed - effectiveLevel * 1.35 + index * 0.22),
        dash: index % 3 === 0 ? "3 8" : index % 3 === 1 ? "1 10" : "6 13",
        goldAccent: state === "offers" && (index === 1 || index === lineCount - 2),
      };
    });
  }, [effectiveLevel, lineCount, preset.amplitude, preset.opacity, preset.speed, state]);

  return (
    <div
      className={className}
      data-wave-state={state}
      data-audio-level={effectiveLevel.toFixed(2)}
      aria-hidden="true"
    >
      <svg
        className="size-full overflow-visible"
        viewBox="0 0 960 320"
        preserveAspectRatio="none"
        role="presentation"
      >
        <defs>
          <linearGradient id={cyanGradientId} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(37,193,190,0)" />
            <stop offset="16%" stopColor="rgba(53,219,213,0.3)" />
            <stop offset="48%" stopColor="rgba(118,249,240,0.96)" />
            <stop offset="76%" stopColor="rgba(55,218,211,0.42)" />
            <stop offset="100%" stopColor="rgba(37,193,190,0)" />
          </linearGradient>
          <linearGradient id={goldGradientId} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(212,175,55,0)" />
            <stop offset="36%" stopColor="rgba(230,198,105,0.22)" />
            <stop offset="62%" stopColor="rgba(239,210,132,0.78)" />
            <stop offset="100%" stopColor="rgba(212,175,55,0)" />
          </linearGradient>
          <filter id={glowId} x="-20%" y="-80%" width="140%" height="260%">
            <feGaussianBlur stdDeviation={1.7 + preset.glow * 1.8} result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <g opacity={0.38 + effectiveLevel * 0.32} filter={`url(#${glowId})`}>
          {waves.map((wave) => (
            <path
              key={`glow-${wave.index}`}
              d={wave.d}
              fill="none"
              stroke={wave.goldAccent ? `url(#${goldGradientId})` : `url(#${cyanGradientId})`}
              strokeWidth={wave.strokeWidth * 3.2}
              strokeLinecap="round"
              opacity={wave.opacity * 0.35}
            >
              {!reducedMotion ? (
                <animate
                  attributeName="d"
                  values={`${wave.d};${wave.dNext};${wave.d}`}
                  dur={`${wave.duration}s`}
                  repeatCount="indefinite"
                />
              ) : null}
            </path>
          ))}
        </g>

        <g>
          {waves.map((wave) => (
            <path
              key={`line-${wave.index}`}
              d={wave.d}
              fill="none"
              stroke={wave.goldAccent ? `url(#${goldGradientId})` : `url(#${cyanGradientId})`}
              strokeWidth={wave.strokeWidth}
              strokeLinecap="round"
              strokeDasharray={wave.dash}
              opacity={wave.opacity}
            >
              {!reducedMotion ? (
                <>
                  <animate
                    attributeName="d"
                    values={`${wave.d};${wave.dNext};${wave.d}`}
                    dur={`${wave.duration}s`}
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="stroke-dashoffset"
                    values="0;-42"
                    dur={`${Math.max(2.4, wave.duration * 0.72)}s`}
                    repeatCount="indefinite"
                  />
                </>
              ) : null}
            </path>
          ))}
        </g>

        {Array.from({ length: lowPerformance ? 9 : 16 }, (_, index) => {
          const x = 50 + ((index * 137) % 850);
          const y = 54 + ((index * 79) % 210);
          const gold = state === "offers" && index % 5 === 0;
          return (
            <circle
              key={`energy-dot-${index}`}
              cx={x}
              cy={y}
              r={gold ? 1.8 : 1.2 + (index % 3) * 0.35}
              fill={gold ? "#e9c973" : "#75eee7"}
              opacity={0.18 + effectiveLevel * (gold ? 0.64 : 0.48)}
            >
              {!reducedMotion && index % 2 === 0 ? (
                <animate
                  attributeName="opacity"
                  values={`${0.12 + effectiveLevel * 0.24};${0.38 + effectiveLevel * 0.55};${0.12 + effectiveLevel * 0.24}`}
                  dur={`${2.8 + (index % 4) * 0.7}s`}
                  repeatCount="indefinite"
                />
              ) : null}
            </circle>
          );
        })}
      </svg>
    </div>
  );
}
