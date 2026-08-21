import { describe, expect, it } from "vitest";

import { resolveGlobeVisualLevel } from "./liveVisualLevel";

describe("resolveGlobeVisualLevel", () => {
  it("mantém energia visual perceptível durante a fala sem perder a reação ao áudio real", () => {
    expect(resolveGlobeVisualLevel("speaking", 0, 0.86)).toBeCloseTo(0.44);
    expect(resolveGlobeVisualLevel("speaking", 0.5, 0.86)).toBeCloseTo(0.72);
    expect(resolveGlobeVisualLevel("speaking", 1, 0.86)).toBe(1);
  });

  it("preserva os níveis demonstrativos e limita entradas externas", () => {
    expect(resolveGlobeVisualLevel("idle", undefined, 0.14)).toBe(0.14);
    expect(resolveGlobeVisualLevel("listening", -2, 0.7)).toBeCloseTo(0.32);
    expect(resolveGlobeVisualLevel("speaking", 4, 0.86)).toBe(1);
  });
});
