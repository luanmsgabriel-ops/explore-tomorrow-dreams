type ThreeModule = typeof import("three");

export interface GlobeVisualEffectOptions {
  cyan: string;
  gold: string;
  lowPerformance: boolean;
}

export interface GlobeVisualEffects {
  group: import("three").Group;
  update: (
    elapsed: number,
    audioLevel: number,
    offersActive: boolean,
    reducedMotion: boolean,
    speakingActive: boolean,
  ) => void;
  dispose: () => void;
}

type RingDefinition = {
  radiusX: number;
  radiusY: number;
  rotateX: number;
  rotateY: number;
  rotateZ: number;
  gold?: boolean;
  dashed?: boolean;
};

type ParticleCloud = {
  cyanGeometry: import("three").BufferGeometry;
  goldGeometry: import("three").BufferGeometry;
};

const TWO_PI = Math.PI * 2;
const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

function makeSeededRandom(initialSeed: number) {
  let seed = initialSeed >>> 0;
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

function buildParticleCloud(
  THREE: ThreeModule,
  globeRadius: number,
  count: number,
  mode: "halo" | "belt",
  goldRatio: number,
): ParticleCloud {
  const random = makeSeededRandom(mode === "halo" ? 0x73a2ef1 : 0xd4af37);
  const cyanPositions: number[] = [];
  const goldPositions: number[] = [];

  for (let index = 0; index < count; index += 1) {
    let x = 0;
    let y = 0;
    let z = 0;

    if (mode === "halo") {
      const vertical = random() * 2 - 1;
      const phi = random() * TWO_PI;
      const planar = Math.sqrt(Math.max(0, 1 - vertical * vertical));
      const radius = globeRadius * (1.018 + random() * 0.22);
      x = radius * planar * Math.cos(phi);
      y = radius * vertical;
      z = radius * planar * Math.sin(phi);
    } else {
      const angle = random() * TWO_PI;
      const radiusX = globeRadius * (1.08 + random() * 0.62);
      const radiusZ = globeRadius * (0.96 + random() * 0.5);
      x = Math.cos(angle) * radiusX;
      y = (random() - 0.5) * globeRadius * 0.66;
      z = Math.sin(angle) * radiusZ;
    }

    const target = random() < goldRatio ? goldPositions : cyanPositions;
    target.push(x, y, z);
  }

  const cyanGeometry = new THREE.BufferGeometry();
  cyanGeometry.setAttribute("position", new THREE.Float32BufferAttribute(cyanPositions, 3));

  const goldGeometry = new THREE.BufferGeometry();
  goldGeometry.setAttribute("position", new THREE.Float32BufferAttribute(goldPositions, 3));

  return { cyanGeometry, goldGeometry };
}

function createFresnelMaterial(
  THREE: ThreeModule,
  color: string,
  power: number,
  opacity: number,
) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(color) },
      uIntensity: { value: 0.5 },
      uPower: { value: power },
      uOpacity: { value: opacity },
    },
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vViewDirection;

      void main() {
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vNormal = normalize(normalMatrix * normal);
        vViewDirection = normalize(-mvPosition.xyz);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      uniform float uIntensity;
      uniform float uPower;
      uniform float uOpacity;
      varying vec3 vNormal;
      varying vec3 vViewDirection;

      void main() {
        float facing = max(dot(normalize(vNormal), normalize(vViewDirection)), 0.0);
        float fresnel = pow(1.0 - facing, uPower);
        float rim = smoothstep(0.04, 1.0, fresnel);
        float alpha = rim * uOpacity * (0.72 + uIntensity * 0.56);
        vec3 glow = uColor * (0.82 + uIntensity * 0.62);
        gl_FragColor = vec4(glow, alpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    depthTest: true,
    blending: THREE.AdditiveBlending,
    side: THREE.FrontSide,
  });
}

function createOrbitRing(
  THREE: ThreeModule,
  globeRadius: number,
  definition: RingDefinition,
  cyan: string,
  gold: string,
) {
  const segments = 224;
  const points: import("three").Vector3[] = [];
  for (let index = 0; index < segments; index += 1) {
    const angle = (index / segments) * TWO_PI;
    points.push(
      new THREE.Vector3(
        Math.cos(angle) * globeRadius * definition.radiusX,
        Math.sin(angle) * globeRadius * definition.radiusY,
        0,
      ),
    );
  }

  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = definition.dashed
    ? new THREE.LineDashedMaterial({
        color: definition.gold ? gold : cyan,
        transparent: true,
        opacity: definition.gold ? 0.34 : 0.24,
        dashSize: globeRadius * 0.028,
        gapSize: globeRadius * 0.042,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
    : new THREE.LineBasicMaterial({
        color: definition.gold ? gold : cyan,
        transparent: true,
        opacity: definition.gold ? 0.36 : 0.22,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });

  const ring = new THREE.LineLoop(geometry, material);
  ring.rotation.set(definition.rotateX, definition.rotateY, definition.rotateZ);
  if (definition.dashed) ring.computeLineDistances();
  return { ring, geometry, material };
}

export function createGlobeVisualEffects(
  THREE: ThreeModule,
  globeRadius: number,
  options: GlobeVisualEffectOptions,
): GlobeVisualEffects {
  const group = new THREE.Group();
  group.name = "tomorrow-live-cinematic-effects-v2";

  const sphereGeometry = new THREE.SphereGeometry(
    globeRadius,
    options.lowPerformance ? 48 : 80,
    options.lowPerformance ? 32 : 56,
  );

  // Darkens the ocean/base texture while preserving all geography layers above it.
  // This brings the visual closer to the reference: dark core + luminous coast/dots.
  const darkCoreMaterial = new THREE.MeshBasicMaterial({
    color: "#011114",
    transparent: true,
    opacity: 0.34,
    depthWrite: false,
    depthTest: true,
  });
  const darkCore = new THREE.Mesh(sphereGeometry, darkCoreMaterial);
  darkCore.scale.setScalar(1.0015);

  // Three nested Fresnel shells: broad aura, cinematic rim and a thin crisp edge.
  const innerHaloMaterial = createFresnelMaterial(THREE, options.cyan, 2.6, 0.54);
  const outerHaloMaterial = createFresnelMaterial(THREE, options.cyan, 5.4, 0.31);
  const edgeHaloMaterial = createFresnelMaterial(THREE, options.cyan, 9.2, 0.26);

  const innerHalo = new THREE.Mesh(sphereGeometry, innerHaloMaterial);
  innerHalo.scale.setScalar(1.018);
  const outerHalo = new THREE.Mesh(sphereGeometry, outerHaloMaterial);
  outerHalo.scale.setScalar(1.048);
  const edgeHalo = new THREE.Mesh(sphereGeometry, edgeHaloMaterial);
  edgeHalo.scale.setScalar(1.072);
  group.add(darkCore, innerHalo, outerHalo, edgeHalo);

  const cyanParticleMaterial = new THREE.PointsMaterial({
    color: options.cyan,
    size: options.lowPerformance ? 1.05 : 1.42,
    transparent: true,
    opacity: 0.62,
    depthWrite: false,
    sizeAttenuation: false,
    blending: THREE.AdditiveBlending,
  });

  const goldParticleMaterial = new THREE.PointsMaterial({
    color: options.gold,
    size: options.lowPerformance ? 1.5 : 2.05,
    transparent: true,
    opacity: 0.86,
    depthWrite: false,
    sizeAttenuation: false,
    blending: THREE.AdditiveBlending,
  });

  const haloCloud = buildParticleCloud(
    THREE,
    globeRadius,
    options.lowPerformance ? 120 : 320,
    "halo",
    0.14,
  );
  const beltCloud = buildParticleCloud(
    THREE,
    globeRadius,
    options.lowPerformance ? 100 : 260,
    "belt",
    0.17,
  );

  const cyanHaloParticles = new THREE.Points(haloCloud.cyanGeometry, cyanParticleMaterial);
  const goldHaloParticles = new THREE.Points(haloCloud.goldGeometry, goldParticleMaterial);
  const cyanBeltParticles = new THREE.Points(beltCloud.cyanGeometry, cyanParticleMaterial);
  const goldBeltParticles = new THREE.Points(beltCloud.goldGeometry, goldParticleMaterial);

  cyanHaloParticles.rotation.x = 0.08;
  goldHaloParticles.rotation.x = 0.08;
  cyanBeltParticles.rotation.x = -0.18;
  goldBeltParticles.rotation.x = -0.18;
  cyanBeltParticles.rotation.z = 0.12;
  goldBeltParticles.rotation.z = 0.12;
  group.add(cyanHaloParticles, goldHaloParticles, cyanBeltParticles, goldBeltParticles);

  // This additional cloud stays almost invisible while idle and becomes a fast,
  // audio-reactive energy belt while the assistant is speaking.
  const voiceCloud = buildParticleCloud(
    THREE,
    globeRadius,
    options.lowPerformance ? 90 : 240,
    "belt",
    0.2,
  );
  const voiceCyanMaterial = new THREE.PointsMaterial({
    color: options.cyan,
    size: options.lowPerformance ? 1.15 : 1.58,
    transparent: true,
    opacity: 0.025,
    depthWrite: false,
    sizeAttenuation: false,
    blending: THREE.AdditiveBlending,
  });
  const voiceGoldMaterial = new THREE.PointsMaterial({
    color: options.gold,
    size: options.lowPerformance ? 1.5 : 2.12,
    transparent: true,
    opacity: 0.025,
    depthWrite: false,
    sizeAttenuation: false,
    blending: THREE.AdditiveBlending,
  });
  const voiceBurstGroup = new THREE.Group();
  voiceBurstGroup.name = "tomorrow-live-speaking-particles";
  const voiceCyanParticles = new THREE.Points(voiceCloud.cyanGeometry, voiceCyanMaterial);
  const voiceGoldParticles = new THREE.Points(voiceCloud.goldGeometry, voiceGoldMaterial);
  voiceBurstGroup.rotation.set(-0.26, 0, -0.16);
  voiceBurstGroup.add(voiceCyanParticles, voiceGoldParticles);
  group.add(voiceBurstGroup);

  const ringDefinitions: RingDefinition[] = [
    { radiusX: 1.22, radiusY: 0.38, rotateX: 1.06, rotateY: 0.18, rotateZ: 0.12 },
    { radiusX: 1.36, radiusY: 0.5, rotateX: 1.22, rotateY: -0.2, rotateZ: -0.08, dashed: true },
    { radiusX: 1.14, radiusY: 1.14, rotateX: 0.08, rotateY: 0.78, rotateZ: 0.24 },
    { radiusX: 1.46, radiusY: 0.32, rotateX: 1.4, rotateY: 0.08, rotateZ: 0.22, gold: true, dashed: true },
    { radiusX: 1.55, radiusY: 0.58, rotateX: 1.02, rotateY: 0.46, rotateZ: -0.18, dashed: true },
    { radiusX: 1.31, radiusY: 0.28, rotateX: 1.54, rotateY: -0.12, rotateZ: 0.04, gold: true },
  ];

  const orbitGroup = new THREE.Group();
  const ringResources = ringDefinitions.map((definition) => {
    const resource = createOrbitRing(THREE, globeRadius, definition, options.cyan, options.gold);
    orbitGroup.add(resource.ring);
    return resource;
  });
  group.add(orbitGroup);

  const ringMaterials = ringResources.map((resource) => resource.material);

  return {
    group,
    update(elapsed, audioLevel, offersActive, reducedMotion, speakingActive) {
      const level = clamp01(audioLevel);
      const speakingEnergy = speakingActive ? 0.42 + level * 0.58 : 0;
      innerHaloMaterial.uniforms.uIntensity.value = 0.5 + level * 0.58;
      outerHaloMaterial.uniforms.uIntensity.value = 0.42 + level * 0.62;
      edgeHaloMaterial.uniforms.uIntensity.value = 0.62 + level * 0.72;
      darkCoreMaterial.opacity = 0.36 - level * 0.035;

      cyanParticleMaterial.opacity = 0.5 + level * 0.3;
      cyanParticleMaterial.size = (options.lowPerformance ? 1 : 1.32) + level * 0.42;
      goldParticleMaterial.opacity = 0.72 + level * 0.26;
      goldParticleMaterial.size = (options.lowPerformance ? 1.42 : 1.86) + level * 0.58;
      voiceCyanMaterial.opacity = 0.025 + speakingEnergy * 0.76;
      voiceCyanMaterial.size = (options.lowPerformance ? 1.08 : 1.48) + speakingEnergy * 0.78;
      voiceGoldMaterial.opacity = 0.025 + speakingEnergy * 0.9;
      voiceGoldMaterial.size = (options.lowPerformance ? 1.42 : 1.98) + speakingEnergy * 1.02;

      ringMaterials.forEach((material, index) => {
        const goldRing = index === 3 || index === 5;
        const base = goldRing ? 0.26 : 0.16;
        const boost = goldRing ? 0.2 : 0.16;
        material.opacity = base + level * boost + (offersActive && goldRing ? 0.12 : 0);
      });

      if (!reducedMotion) {
        const speechSpeed = speakingActive ? 0.075 + level * 0.085 : 0;
        orbitGroup.rotation.y = elapsed * (0.017 + level * 0.02 + speechSpeed * 0.24);
        orbitGroup.rotation.z = Math.sin(elapsed * 0.2) * 0.028;
        cyanHaloParticles.rotation.y = -elapsed * (0.011 + level * 0.012 + speechSpeed * 0.32);
        goldHaloParticles.rotation.y = -elapsed * (0.013 + level * 0.015 + speechSpeed * 0.4);
        cyanBeltParticles.rotation.y = elapsed * (0.023 + level * 0.02 + speechSpeed * 0.58);
        goldBeltParticles.rotation.y = elapsed * (0.028 + level * 0.024 + speechSpeed * 0.72);
        voiceBurstGroup.rotation.y = elapsed * (0.04 + speakingEnergy * 0.34);
        voiceBurstGroup.rotation.z = -0.16 + Math.sin(elapsed * (0.8 + speakingEnergy * 1.4)) * 0.08 * speakingEnergy;
        voiceBurstGroup.scale.setScalar(1 + Math.sin(elapsed * 4.2) * 0.022 * speakingEnergy);
      }
    },
    dispose() {
      sphereGeometry.dispose();
      darkCoreMaterial.dispose();
      innerHaloMaterial.dispose();
      outerHaloMaterial.dispose();
      edgeHaloMaterial.dispose();
      haloCloud.cyanGeometry.dispose();
      haloCloud.goldGeometry.dispose();
      beltCloud.cyanGeometry.dispose();
      beltCloud.goldGeometry.dispose();
      voiceCloud.cyanGeometry.dispose();
      voiceCloud.goldGeometry.dispose();
      cyanParticleMaterial.dispose();
      goldParticleMaterial.dispose();
      voiceCyanMaterial.dispose();
      voiceGoldMaterial.dispose();
      ringResources.forEach((resource) => {
        resource.geometry.dispose();
        resource.material.dispose();
      });
    },
  };
}
