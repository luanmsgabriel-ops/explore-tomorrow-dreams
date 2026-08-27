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
  idle: { baseline: 0.14, amplitude: 31, speed: 0.72, opacity: 0.46, glow: 0.46 },
  listening: { baseline: 0.7, amplitude: 58, speed: 1.18, opacity: 0.9, glow: 0.94 },
  thinking: { baseline: 0.32, amplitude: 39, speed: 0.86, opacity: 0.62, glow: 0.58 },
  speaking: { baseline: 0.86, amplitude: 68, speed: 1.46, opacity: 0.96, glow: 1 },
  offers: { baseline: 0.45, amplitude: 48, speed: 0.98, opacity: 0.76, glow: 0.78 },
};

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

function waveY(
  x: number,
  centerY: number,
  amplitude: number,
  frequency: number,
  phase: number,
  index: number,
  depth: number,
) {
  const primary = Math.sin(x * frequency + phase + index * 0.66);
  const secondary = Math.sin(x * frequency * 0.47 - phase * 0.54 + index * 1.07) * 0.42;
  const tertiary = Math.sin(x * frequency * 1.86 + phase * 0.31 + index * 0.31) * 0.16;
  const slowEnvelope = 0.78 + Math.sin(x * 0.0022 - phase * 0.18 + index) * 0.22;
  return centerY + (primary + secondary + tertiary) * amplitude * slowEnvelope * (1 - depth * 0.12);
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
      const step = lowPerformance ? 11 : 6;

      context.clearRect(0, 0, width, height);
      context.save();
      context.globalCompositeOperation = "lighter";

      for (let index = 0; index < lineCount; index += 1) {
        const depth = Math.abs(index - midLine) / Math.max(1, midLine);
        const layer = index % 3;
        const centerY = height * 0.5 + (index - midLine) * height * 0.021;
        const amplitude =
          preset.amplitude *
          scale *
          (0.74 + level * 0.78) *
          (layer === 0 ? 1.08 : layer === 1 ? 0.88 : 0.7) *
          (1 - depth * 0.18);
        const frequency = 0.0108 + (index % 4) * 0.00155;
        const phase = time * preset.speed * (0.9 + index * 0.032) * (index % 2 === 0 ? 1 : -1);
        const goldLine = index % 3 === 1 || index === lineCount - 2;
        const color = goldLine ? "235,201,112" : "96,243,234";
        const alpha = Math.max(0.13, preset.opacity * (1 - depth * 0.32));

        context.beginPath();
        for (let x = -32; x <= width + 32; x += step) {
          const y = waveY(x, centerY, amplitude, frequency, phase, index, depth);
          if (x === -32) context.moveTo(x, y);
          else context.lineTo(x, y);
        }
        context.strokeStyle = `rgba(${color},${alpha * (layer === 0 ? 0.23 : 0.14)})`;
        context.lineWidth = (layer === 0 ? 8 : 5) + level * (layer === 0 ? 5 : 3.4);
        context.shadowColor = `rgba(${color},${0.3 + preset.glow * 0.48})`;
        context.shadowBlur = lowPerformance ? 4 : 13 + level * 12;
        context.stroke();

        context.beginPath();
        for (let x = -32; x <= width + 32; x += step) {
          const y = waveY(x, centerY, amplitude, frequency, phase, index, depth);
          if (x === -32) context.moveTo(x, y);
          else context.lineTo(x, y);
        }
        context.strokeStyle = `rgba(${color},${alpha * (layer === 2 ? 0.76 : 1)})`;
        context.lineWidth = 0.7 + level * 0.82 + (layer === 0 ? 0.45 : 0);
        context.shadowBlur = 0;
        context.setLineDash(layer === 0 ? [2, 8] : layer === 1 ? [1, 10] : [5, 13]);
        context.lineDashOffset = reducedMotion
          ? 0
          : -time * (15 + level * 31) * (index % 2 === 0 ? 1 : -1);
        context.stroke();
        context.setLineDash([]);

        const nodeCount = lowPerformance ? 1 : layer === 0 ? 3 : 2;
        for (let node = 0; node < nodeCount; node += 1) {
          const travel = reducedMotion
            ? 0
            : time * (25 + level * 42) * (index % 2 === 0 ? 1 : -1);
          const nodeX =
            ((index * 137 + node * 251 + travel) % (width + 140) + (width + 140)) % (width + 140) - 70;
          const nodeY = waveY(nodeX, centerY, amplitude, frequency, phase, index, depth);
          const goldNode = goldLine || (index + node) % 5 === 0;
          const nodeRadius = goldNode ? 2.15 + level * 0.55 : 1.2 + level * 0.72;

          context.beginPath();
          context.arc(nodeX, nodeY, nodeRadius, 0, Math.PI * 2);
          context.fillStyle = goldNode
            ? `rgba(239,205,119,${0.58 + level * 0.4})`
            : `rgba(112,247,238,${0.36 + level * 0.58})`;
          context.shadowColor = goldNode ? "rgba(239,205,119,0.94)" : "rgba(112,247,238,0.78)";
          context.shadowBlur = lowPerformance ? 2 : goldNode ? 10 + level * 8 : 6 + level * 6;
          context.fill();
        }
      }

      context.shadowBlur = 0;
      context.globalCompositeOperation = "source-over";

      const ambientCount = lowPerformance ? 14 : 30;
      for (let index = 0; index < ambientCount; index += 1) {
        const travel = reducedMotion ? 0 : time * (index % 2 === 0 ? 7 : -5);
        const x = ((index * 173 + travel) % (width + 100) + (width + 100)) % (width + 100) - 50;
        const y = height * (0.12 + ((index * 47) % 76) / 100);
        const goldParticle = index % 4 === 0 || index % 7 === 0;
        const radius = goldParticle ? 1.25 + (index % 3) * 0.24 : 0.65 + (index % 3) * 0.3;

        context.beginPath();
        context.arc(x, y, radius, 0, Math.PI * 2);
        context.fillStyle = goldParticle
          ? `rgba(232,196,99,${0.46 + level * 0.28})`
          : `rgba(67,214,208,${0.22 + level * 0.24})`;
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
