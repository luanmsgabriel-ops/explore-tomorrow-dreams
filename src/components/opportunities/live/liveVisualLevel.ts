import type { TomorrowLiveState } from "./LiveParticleGlobe";

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

export function resolveGlobeVisualLevel(
  state: TomorrowLiveState,
  audioLevel: number | undefined,
  fallbackLevel: number,
) {
  if (audioLevel === undefined) return fallbackLevel;

  const level = clamp01(audioLevel);
  const reactiveFloor = state === "speaking"
    ? 0.44
    : state === "listening"
      ? 0.32
      : state === "thinking"
        ? 0.16
        : state === "offers"
          ? 0.22
          : 0.08;

  return clamp01(reactiveFloor + level * (1 - reactiveFloor));
}
