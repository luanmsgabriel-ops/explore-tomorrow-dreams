import * as THREE from "three";
import { describe, expect, it } from "vitest";

import { createGlobeVisualEffects } from "./liveGlobeEffects";

describe("createGlobeVisualEffects", () => {
  it("ativa uma camada adicional de partículas durante a fala", () => {
    const effects = createGlobeVisualEffects(THREE, 100, {
      cyan: "#68e8e0",
      gold: "#ddb85c",
      lowPerformance: false,
    });
    const voiceGroup = effects.group.getObjectByName("tomorrow-live-speaking-particles") as THREE.Group;
    const cyanParticles = voiceGroup.children[0] as THREE.Points;
    const goldParticles = voiceGroup.children[1] as THREE.Points;
    const cyanMaterial = cyanParticles.material as THREE.PointsMaterial;
    const goldMaterial = goldParticles.material as THREE.PointsMaterial;
    const totalParticles =
      (cyanParticles.geometry.getAttribute("position")?.count ?? 0) +
      (goldParticles.geometry.getAttribute("position")?.count ?? 0);

    expect(totalParticles).toBe(240);
    effects.update(1, 0.2, false, false, false);
    expect(cyanMaterial.opacity).toBeLessThan(0.05);

    effects.update(2, 0.7, false, false, true);
    expect(cyanMaterial.opacity).toBeGreaterThan(0.6);
    expect(goldMaterial.opacity).toBeGreaterThan(0.7);

    effects.dispose();
  });
});
