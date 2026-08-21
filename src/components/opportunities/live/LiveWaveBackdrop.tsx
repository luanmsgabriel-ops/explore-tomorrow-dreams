import { useEffect, useRef } from "react";

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
  idle: { baseline: 0.14, amplitude: 20, speed: 0.72, opacity: 0.38, glow: 0.38 },
  listening: { baseline: 0.7, amplitude: 38, speed: 1.16, opacity: 0.82, glow: 0.84 },
  thinking: { baseline: 0.32, amplitude: 24, speed: 0.84, opacity: 0.54, glow: 0.5 },
  speaking: { baseline: 0.86, amplitude: 46, speed: 1.42, opacity: 0.92, glow: 0.96 },
  offers: { baseline: 0.45, amplitude: 30, speed: 0.94, opacity: 0.68, glow: 0.68 },
};

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

function waveY(
  x: number,
  centerY: number,
  amplitude: number,
  frequency: number,
  phase: number,
  index: number,
) {
  const primary = Math.sin(x * frequency + phase + index * 0.66);
  const secondary = Math.sin(x * frequency * 0.43 - phase * 0.58 + index * 1.07) * 0.34;
  const tertiary = Math.sin(x * frequency * 1.72 + phase * 0.28 + index * 0.31) * 0.12;
  return centerY + (primary + secondary + tertiary) * amplitude;
}

export function LiveWaveBackdrop({
  state,
  audioLevel,
  reducedMotion = false,
  lowPerformance = false,
  className,
}: LiveWaveBackdropProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const levelRef = useRef(0);
  const preset = statePreset[state];
  const effectiveLevel = clamp01(audioLevel ?? preset.baseline);
  const lineCount = lowPerformance ? 7 : 12;
  levelRef.current = effectiveLevel;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let context: CanvasRenderingContext2D | null = null;
    try {
      context = canvas.getContext("2d", { alpha: true });
    } catch {
      return;
    }
    if (!context) return;

    let animationFrame = 0;
    let resizeObserver: ResizeObserver | null = null;
    let width = 960;
    let height = 320;
    let dpr = 1;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = Math.max(320, rect.width || 960);
      height = Math.max(160, rect.height || 320);
      dpr = Math.min(lowPerformance ? 1 : 1.5, window.devicePixelRatio || 1);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      context?.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = (timestamp: number) => {
      if (!context) return;
      const level = levelRef.current;
      const time = reducedMotion ? 0 : timestamp / 1000;
      const midLine = (lineCount - 1) / 2;
      const scale = height / 320;
      const step = lowPerformance ? 12 : 7;
      const backgroundAlpha = 0.12 + level * 0.18;

      context.clearRect(0, 0, width, height);
      context.save();
      context.globalCompositeOperation = "lighter";

      for (let index = 0; index < lineCount; index += 1) {
        const depth = Math.abs(index - midLine) / Math.max(1, midLine);
        const centerY = height * 0.5 + (index - midLine) * height * 0.027;
        const amplitude = preset.amplitude * scale * (0.62 + level * 0.74) * (1 - depth * 0.28);
        const frequency = 0.0094 + (index % 4) * 0.0015;
        const phase = time * preset.speed * (0.9 + index * 0.026);
        const goldLine = state === "offers" && (index === 2 || index === lineCount - 3);
        const color = goldLine ? "233,201,115" : "103,241,233";
        const alpha = Math.max(0.12, preset.opacity * (1 - depth * 0.38));

        context.beginPath();
        for (let x = -24; x <= width + 24; x += step) {
          const y = waveY(x, centerY, amplitude, frequency, phase, index);
          if (x === -24) context.moveTo(x, y);
          else context.lineTo(x, y);
        }
        context.strokeStyle = `rgba(${color},${alpha * 0.2})`;
        context.lineWidth = 5.5 + level * 4.2;
        context.shadowColor = `rgba(${color},${0.26 + preset.glow * 0.46})`;
        context.shadowBlur = lowPerformance ? 4 : 10 + level * 10;
        context.stroke();

        context.beginPath();
        for (let x = -24; x <= width + 24; x += step) {
          const y = waveY(x, centerY, amplitude, frequency, phase, index);
          if (x === -24) context.moveTo(x, y);
          else context.lineTo(x, y);
        }
        context.strokeStyle = `rgba(${color},${alpha})`;
        context.lineWidth = 0.75 + level * 0.9 + (index % 4 === 0 ? 0.35 : 0);
        context.shadowBlur = 0;
        context.setLineDash(index % 3 === 0 ? [2, 8] : index % 3 === 1 ? [1, 11] : [6, 14]);
        context.lineDashOffset = reducedMotion ? 0 : -time * (12 + level * 24) * (index % 2 === 0 ? 1 : -1);
        context.stroke();
        context.setLineDash([]);

        const nodeCount = lowPerformance ? 1 : 2;
        for (let node = 0; node < nodeCount; node += 1) {
          const travel = reducedMotion ? 0 : time * (22 + level * 34) * (index % 2 === 0 ? 1 : -1);
          const nodeX = ((index * 137 + node * 281 + travel) % (width + 120) + (width + 120)) % (width + 120) - 60;
          const nodeY = waveY(nodeX, centerY, amplitude, frequency, phase, index);
          const goldNode = goldLine || (index + node) % 11 === 0;
          context.beginPath();
          context.arc(nodeX, nodeY, goldNode ? 1.9 : 1.25 + level * 0.7, 0, Math.PI * 2);
          context.fillStyle = goldNode
            ? `rgba(239,205,119,${0.42 + level * 0.48})`
            : `rgba(112,247,238,${0.32 + level * 0.56})`;
          context.shadowColor = goldNode ? "rgba(239,205,119,0.75)" : "rgba(112,247,238,0.72)";
          context.shadowBlur = lowPerformance ? 2 : 5 + level * 5;
          context.fill();
        }
      }

      context.shadowBlur = 0;
      context.globalCompositeOperation = "source-over";
      context.fillStyle = `rgba(47,201,196,${backgroundAlpha})`;
      for (let index = 0; index < (lowPerformance ? 9 : 18); index += 1) {
        const x = ((index * 173 + (reducedMotion ? 0 : time * 9)) % (width + 80)) - 40;
        const y = height * (0.18 + ((index * 47) % 66) / 100);
        context.beginPath();
        context.arc(x, y, 0.7 + (index % 3) * 0.35, 0, Math.PI * 2);
        context.fill();
      }
      context.restore();

      if (!reducedMotion) animationFrame = requestAnimationFrame(draw);
    };

    resize();
    draw(0);

    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(() => resize());
      resizeObserver.observe(canvas);
    } else {
      window.addEventListener("resize", resize);
    }

    return () => {
      cancelAnimationFrame(animationFrame);
      resizeObserver?.disconnect();
      if (!resizeObserver) window.removeEventListener("resize", resize);
    };
  }, [lineCount, lowPerformance, preset.amplitude, preset.glow, preset.opacity, preset.speed, reducedMotion, state]);

  return (
    <div
      className={className}
      data-wave-state={state}
      data-wave-engine="canvas2d"
      data-wave-lines={lineCount}
      data-audio-level={effectiveLevel.toFixed(2)}
      aria-hidden="true"
    >
      <canvas ref={canvasRef} className="size-full" role="presentation" />
    </div>
  );
}
