type ThreeModule = typeof import("three");

export interface GlobeVisualEffectOptions {
  cyan: string;
  gold: string;
  lowPerformance: boolean;
}

export interface GlobeVisualEffects {
  group: import("three").Group;
  update: (elapsed: number, audioLevel: number, offersActive: boolean, reducedMotion: boolean) => void;
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
  cyan: string,
  gold: string,
  mode: "halo" | "belt",
) {
  const random = makeSeededRandom(mode === "halo" ? 0x73a2ef1 : 0xd4af37);
  const positions: number[] = [];
  const colors: number[] = [];
  const cyanColor = new THREE.Color(cyan);
  const goldColor = new THREE.Color(gold);

  for (let index = 0; index < count; index += 1) {
    if (mode === "halo") {
      const vertical = random() * 2 - 1;
      const phi = random() * TWO_PI;
      const planar = Math.sqrt(Math.max(0, 1 - vertical * vertical));
      const radius = globeRadius * (1.025 + random() * 0.16);
      positions.push(
        radius * planar * Math.cos(phi),
        radius * vertical,
        radius * planar * Math.sin(phi),
      );
    } else {
      const angle = random() * TWO_PI;
      const radiusX = globeRadius * (1.12 + random() * 0.5);
      const radiusZ = globeRadius * (0.98 + random() * 0.42);
      positions.push(
        Math.cos(angle) * radiusX,
        (random() - 0.5) * globeRadius * 0.55,
        Math.sin(angle) * radiusZ,
      );
    }

    const chosen = random() < 0.09 ? goldColor : cyanColor;
    colors.push(chosen.r, chosen.g, chosen.b);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  return geometry;
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
        float rim = smoothstep(0.06, 1.0, fresnel);
        float alpha = rim * uOpacity * (0.72 + uIntensity * 0.58);
        vec3 glow = uColor * (0.78 + uIntensity * 0.65);
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
  const segments = 192;
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
        opacity: definition.gold ? 0.26 : 0.22,
        dashSize: globeRadius * 0.035,
        gapSize: globeRadius * 0.055,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
    : new THREE.LineBasicMaterial({
        color: definition.gold ? gold : cyan,
        transparent: true,
        opacity: definition.gold ? 0.3 : 0.2,
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
  group.name = "tomorrow-live-cinematic-effects";

  const sphereGeometry = new THREE.SphereGeometry(
    globeRadius,
    options.lowPerformance ? 48 : 72,
    options.lowPerformance ? 32 : 48,
  );
  const innerHaloMaterial = createFresnelMaterial(THREE, options.cyan, 2.2, 0.72);
  const outerHaloMaterial = createFresnelMaterial(THREE, options.cyan, 4.1, 0.36);

  const innerHalo = new THREE.Mesh(sphereGeometry, innerHaloMaterial);
  innerHalo.scale.setScalar(1.026);
  const outerHalo = new THREE.Mesh(sphereGeometry, outerHaloMaterial);
  outerHalo.scale.setScalar(1.072);
  group.add(innerHalo, outerHalo);

  const particleMaterial = new THREE.PointsMaterial({
    size: options.lowPerformance ? 1.15 : 1.55,
    transparent: true,
    opacity: 0.72,
    vertexColors: true,
    depthWrite: false,
    sizeAttenuation: false,
    blending: THREE.AdditiveBlending,
  });

  const haloGeometry = buildParticleCloud(
    THREE,
    globeRadius,
    options.lowPerformance ? 90 : 230,
    options.cyan,
    options.gold,
    "halo",
  );
  const beltGeometry = buildParticleCloud(
    THREE,
    globeRadius,
    options.lowPerformance ? 80 : 190,
    options.cyan,
    options.gold,
    "belt",
  );
  const haloParticles = new THREE.Points(haloGeometry, particleMaterial);
  const beltParticles = new THREE.Points(beltGeometry, particleMaterial);
  haloParticles.rotation.x = 0.08;
  beltParticles.rotation.x = -0.18;
  beltParticles.rotation.z = 0.12;
  group.add(haloParticles, beltParticles);

  const ringDefinitions: RingDefinition[] = [
    { radiusX: 1.28, radiusY: 0.42, rotateX: 1.08, rotateY: 0.18, rotateZ: 0.12 },
    { radiusX: 1.42, radiusY: 0.52, rotateX: 1.26, rotateY: -0.2, rotateZ: -0.08, dashed: true },
    { radiusX: 1.18, radiusY: 1.18, rotateX: 0.1, rotateY: 0.82, rotateZ: 0.26 },
    { radiusX: 1.5, radiusY: 0.34, rotateX: 1.42, rotateY: 0.08, rotateZ: 0.22, gold: true, dashed: true },
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
    update(elapsed, audioLevel, offersActive, reducedMotion) {
      const level = clamp01(audioLevel);
      innerHaloMaterial.uniforms.uIntensity.value = 0.54 + level * 0.72;
      outerHaloMaterial.uniforms.uIntensity.value = 0.28 + level * 0.58;
      particleMaterial.opacity = 0.5 + level * 0.42;
      particleMaterial.size = (options.lowPerformance ? 1.05 : 1.42) + level * 0.5;

      ringMaterials.forEach((material, index) => {
        const base = index === 3 ? 0.22 : 0.16;
        material.opacity = base + level * (index === 3 || offersActive ? 0.22 : 0.18);
      });

      if (!reducedMotion) {
        orbitGroup.rotation.y = elapsed * (0.018 + level * 0.018);
        orbitGroup.rotation.z = Math.sin(elapsed * 0.18) * 0.025;
        haloParticles.rotation.y = -elapsed * (0.012 + level * 0.012);
        beltParticles.rotation.y = elapsed * (0.024 + level * 0.018);
      }
    },
    dispose() {
      sphereGeometry.dispose();
      innerHaloMaterial.dispose();
      outerHaloMaterial.dispose();
      haloGeometry.dispose();
      beltGeometry.dispose();
      particleMaterial.dispose();
      ringResources.forEach((resource) => {
        resource.geometry.dispose();
        resource.material.dispose();
      });
    },
  };
}
