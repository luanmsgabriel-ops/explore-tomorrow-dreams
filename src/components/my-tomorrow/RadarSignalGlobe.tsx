import { useEffect, useRef } from "react";
import * as THREE from "three";

interface RadarSignalGlobeProps {
  signals: number;
  scanning?: boolean;
}

const EARTH_NIGHT = "https://cdn.jsdelivr.net/npm/three-globe@2.45.2/example/img/earth-night.jpg";
const EARTH_BUMP = "https://cdn.jsdelivr.net/npm/three-globe@2.45.2/example/img/earth-topology.png";

const stars = [
  [6, 18, 1.0, 0.2, "cyan"], [10, 67, .75, 1.1, "gold"], [15, 83, 1.1, 2.0, "cyan"],
  [21, 12, .8, .6, "cyan"], [27, 92, .9, 1.7, "gold"], [34, 7, .65, 2.5, "cyan"],
  [42, 94, .9, .3, "cyan"], [47, 9, .75, 2.2, "gold"], [53, 96, 1.0, 1.0, "cyan"],
  [61, 8, .8, 2.4, "cyan"], [68, 91, .9, 1.5, "gold"], [74, 11, .7, .8, "cyan"],
  [81, 93, .8, 3.0, "cyan"], [87, 17, 1.0, 2.3, "gold"], [92, 80, .65, 1.1, "cyan"],
  [95, 36, .9, 2.8, "cyan"], [96, 63, .7, .9, "gold"], [12, 49, .65, 2.0, "cyan"],
] as const;

const CITY_POINTS = [
  [-23.55, -46.63], [-22.91, -43.17], [-34.60, -58.38], [-12.05, -77.04], [-33.45, -70.67],
  [4.71, -74.07], [19.43, -99.13], [25.76, -80.19], [40.71, -74.01], [34.05, -118.24],
  [41.88, -87.63], [43.65, -79.38], [-3.12, -60.02], [-8.05, -34.88], [-9.65, -35.71],
] as const;

const ROUTES = [
  [[-23.55, -46.63], [40.71, -74.01]],
  [[-23.55, -46.63], [25.76, -80.19]],
  [[-23.55, -46.63], [-34.60, -58.38]],
  [[-23.55, -46.63], [-9.65, -35.71]],
  [[-22.91, -43.17], [19.43, -99.13]],
] as const;

function supportsWebGL() {
  if (typeof window === "undefined" || typeof document === "undefined") return false;
  if (typeof window.WebGLRenderingContext === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl") || canvas.getContext("experimental-webgl"));
  } catch {
    return false;
  }
}

function latLonToVector3(lat: number, lon: number, radius: number) {
  const phi = (90 - lat) * Math.PI / 180;
  const theta = (lon + 180) * Math.PI / 180;
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  );
}

export function RadarSignalGlobe({ signals, scanning = false }: RadarSignalGlobeProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount || !supportsWebGL()) return;

    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    let frame = 0;
    let disposed = false;
    const disposables: THREE.Material[] = [];
    const geometries: THREE.BufferGeometry[] = [];

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
    camera.position.set(0, 0.02, 3.42);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.68;
    mount.appendChild(renderer.domElement);

    const globe = new THREE.Group();
    globe.rotation.x = 0.08;
    globe.rotation.y = 0.18;
    scene.add(globe);

    const sphereGeometry = new THREE.SphereGeometry(1.12, 96, 96);
    geometries.push(sphereGeometry);
    const fallbackMaterial = new THREE.MeshStandardMaterial({
      color: 0x041b21,
      emissive: 0x03242c,
      emissiveIntensity: 0.35,
      roughness: 0.9,
      metalness: 0.06,
    });
    disposables.push(fallbackMaterial);
    const earth = new THREE.Mesh(sphereGeometry, fallbackMaterial);
    globe.add(earth);

    const wireGeometry = new THREE.WireframeGeometry(new THREE.SphereGeometry(1.128, 30, 18));
    geometries.push(wireGeometry);
    const wireMaterial = new THREE.LineBasicMaterial({ color: 0x55e6ef, transparent: true, opacity: 0.08 });
    disposables.push(wireMaterial);
    globe.add(new THREE.LineSegments(wireGeometry, wireMaterial));

    const atmosphereGeometry = new THREE.SphereGeometry(1.18, 64, 64);
    geometries.push(atmosphereGeometry);
    const atmosphereMaterial = new THREE.ShaderMaterial({
      transparent: true,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      uniforms: { glowColor: { value: new THREE.Color(0x48e7f2) } },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vWorldPosition;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          gl_Position = projectionMatrix * viewMatrix * worldPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 glowColor;
        varying vec3 vNormal;
        varying vec3 vWorldPosition;
        void main() {
          vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
          float fresnel = pow(1.0 - max(dot(vNormal, viewDirection), 0.0), 2.8);
          gl_FragColor = vec4(glowColor, fresnel * 0.82);
        }
      `,
    });
    disposables.push(atmosphereMaterial);
    globe.add(new THREE.Mesh(atmosphereGeometry, atmosphereMaterial));

    const pointGeometry = new THREE.SphereGeometry(0.014, 10, 10);
    geometries.push(pointGeometry);
    const cityMaterial = new THREE.MeshBasicMaterial({ color: 0xffc95d, transparent: true, opacity: 0.96 });
    disposables.push(cityMaterial);
    CITY_POINTS.forEach(([lat, lon], index) => {
      const point = new THREE.Mesh(pointGeometry, cityMaterial.clone());
      disposables.push(point.material as THREE.Material);
      point.position.copy(latLonToVector3(lat, lon, 1.145));
      point.scale.setScalar(index % 3 === 0 ? 1.35 : 1);
      globe.add(point);
    });

    ROUTES.forEach(([[lat1, lon1], [lat2, lon2]], index) => {
      const a = latLonToVector3(lat1, lon1, 1.15);
      const b = latLonToVector3(lat2, lon2, 1.15);
      const mid = a.clone().add(b).multiplyScalar(0.5).normalize().multiplyScalar(1.45 + index * 0.035);
      const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
      const geometry = new THREE.BufferGeometry().setFromPoints(curve.getPoints(72));
      geometries.push(geometry);
      const material = new THREE.LineBasicMaterial({
        color: index % 2 === 0 ? 0xffcf6a : 0x6ceef7,
        transparent: true,
        opacity: index % 2 === 0 ? 0.7 : 0.5,
        blending: THREE.AdditiveBlending,
      });
      disposables.push(material);
      globe.add(new THREE.Line(geometry, material));
    });

    scene.add(new THREE.AmbientLight(0x0c2830, 0.35));
    const cyanRim = new THREE.DirectionalLight(0x4defff, 2.6);
    cyanRim.position.set(-3.2, 2.5, 4.4);
    scene.add(cyanRim);
    const goldRim = new THREE.DirectionalLight(0xffc961, 1.35);
    goldRim.position.set(2.7, -1.2, 3.2);
    scene.add(goldRim);

    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin("anonymous");
    Promise.all([loader.loadAsync(EARTH_NIGHT), loader.loadAsync(EARTH_BUMP)])
      .then(([nightTexture, bumpTexture]) => {
        if (disposed) {
          nightTexture.dispose();
          bumpTexture.dispose();
          return;
        }
        nightTexture.colorSpace = THREE.SRGBColorSpace;
        const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();
        nightTexture.anisotropy = Math.min(maxAnisotropy, 8);
        bumpTexture.anisotropy = Math.min(maxAnisotropy, 8);
        const material = new THREE.MeshStandardMaterial({
          map: nightTexture,
          emissiveMap: nightTexture,
          emissive: new THREE.Color(0xffbb58),
          emissiveIntensity: 0.78,
          color: new THREE.Color(0x0c3036),
          bumpMap: bumpTexture,
          bumpScale: 0.018,
          roughness: 0.92,
          metalness: 0.03,
        });
        disposables.push(material);
        earth.material = material;
      })
      .catch(() => undefined);

    const resize = () => {
      const size = Math.max(1, mount.clientWidth);
      renderer.setSize(size, size, false);
      camera.aspect = 1;
      camera.updateProjectionMatrix();
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(mount);

    const render = () => {
      if (disposed) return;
      if (!reducedMotion) globe.rotation.y += scanning ? 0.00014 : 0.000045;
      renderer.render(scene, camera);
      frame = requestAnimationFrame(render);
    };
    render();

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      geometries.forEach((geometry) => geometry.dispose());
      disposables.forEach((material) => material.dispose());
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [scanning]);

  return (
    <div
      className="radar-reference relative grid aspect-square w-[min(94vw,42rem)] shrink-0 place-items-center sm:w-[45rem] lg:w-[49rem] xl:w-[52rem]"
      aria-label={`${signals} sinais ativos`}
      data-scanning={scanning}
    >
      <style>{`
        @keyframes rr-spin { to { transform: rotate(360deg); } }
        @keyframes rr-spin-back { to { transform: rotate(-360deg); } }
        @keyframes rr-float { 0%,100% { opacity:.2; transform:translateY(0) scale(.75); } 50% { opacity:1; transform:translateY(-5px) scale(1.2); } }
        @keyframes rr-number { 0%,100% { filter:drop-shadow(0 0 12px rgba(255,205,91,.42)); } 50% { filter:drop-shadow(0 0 28px rgba(255,222,128,.95)); } }
        @keyframes rr-breathe { 0%,100% { transform:scale(.992); opacity:.9; } 50% { transform:scale(1.008); opacity:1; } }
        .radar-reference .ring-cw { animation: rr-spin 30s linear infinite; transform-origin:center; }
        .radar-reference .ring-ccw { animation: rr-spin-back 42s linear infinite; transform-origin:center; }
        .radar-reference .orbit-fast { animation: rr-spin 18s linear infinite; transform-origin:center; }
        .radar-reference .sweep { animation: rr-spin 8.6s linear infinite; transform-origin:center; }
        .radar-reference[data-scanning="true"] .sweep { animation-duration: 2.45s; }
        .radar-reference .dust { animation: rr-float 4.6s ease-in-out infinite; }
        .radar-reference .signal-count { animation: rr-number 4s ease-in-out infinite; }
        .radar-reference .core-breathe { animation: rr-breathe 5s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .radar-reference .ring-cw,.radar-reference .ring-ccw,.radar-reference .orbit-fast,.radar-reference .sweep,.radar-reference .dust,.radar-reference .signal-count,.radar-reference .core-breathe { animation:none !important; }
        }
      `}</style>

      <div className="pointer-events-none absolute inset-[-10%] rounded-full bg-[radial-gradient(circle,rgba(29,211,226,.12)_0%,rgba(5,62,70,.07)_42%,transparent_72%)] blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-[1.5%] rounded-full border border-cyan-300/[.10] shadow-[0_0_110px_rgba(34,211,238,.12)]" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-[5.2%] rounded-full border border-[#d4af37]/25" aria-hidden="true" />
      <div className="ring-ccw pointer-events-none absolute inset-[7.4%] rounded-full border border-dashed border-cyan-200/[.18]" aria-hidden="true" />
      <div className="ring-cw pointer-events-none absolute inset-[9.3%] rounded-full border border-[#d4af37]/22" aria-hidden="true" />

      {stars.map(([left, top, size, delay, tone], index) => (
        <span
          key={index}
          className={`dust absolute z-[2] rounded-full ${tone === "gold" ? "bg-[#ffd56f] shadow-[0_0_14px_rgba(255,207,76,.8)]" : "bg-cyan-200 shadow-[0_0_12px_rgba(103,232,249,.75)]"}`}
          style={{ left: `${left}%`, top: `${top}%`, width: size * 2.6, height: size * 2.6, animationDelay: `${delay}s` }}
          aria-hidden="true"
        />
      ))}

      <div className="absolute inset-[11.7%] z-[4] overflow-hidden rounded-full bg-[#020d10] shadow-[0_0_0_1px_rgba(93,237,248,.42),0_0_52px_rgba(40,215,230,.14),inset_0_0_42px_rgba(0,0,0,.72)]" aria-hidden="true">
        <div ref={mountRef} className="absolute inset-0" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_24%_16%,rgba(71,235,247,.13),transparent_27%),linear-gradient(90deg,rgba(0,14,17,.38),rgba(0,7,9,.16)_48%,rgba(0,8,10,.32))]" />
      </div>

      <div
        className="sweep pointer-events-none absolute inset-[11.7%] z-[7] rounded-full"
        style={{
          background: "conic-gradient(from -18deg, rgba(87,239,250,0) 0deg, rgba(87,239,250,0) 274deg, rgba(87,239,250,.012) 292deg, rgba(87,239,250,.028) 309deg, rgba(87,239,250,.055) 325deg, rgba(87,239,250,.11) 339deg, rgba(87,239,250,.22) 350deg, rgba(122,246,255,.44) 357deg, rgba(218,254,255,.82) 360deg)",
          WebkitMaskImage: "radial-gradient(circle, transparent 0 7%, black 12% 99%, transparent 100%)",
          maskImage: "radial-gradient(circle, transparent 0 7%, black 12% 99%, transparent 100%)",
          filter: "drop-shadow(0 0 14px rgba(65,228,242,.4))",
          mixBlendMode: "screen",
        }}
        aria-hidden="true"
      >
        <span className="absolute left-1/2 top-1/2 h-px w-[49%] origin-left -translate-y-1/2 bg-gradient-to-r from-transparent via-cyan-100/40 to-cyan-50/90 shadow-[0_0_10px_rgba(127,244,252,.76)]" />
      </div>

      <svg viewBox="0 0 640 640" className="absolute inset-0 z-[10] size-full overflow-visible" aria-hidden="true">
        <defs>
          <linearGradient id="rrGoldV7" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#fff4bc" />
            <stop offset=".33" stopColor="#d9b34e" />
            <stop offset=".68" stopColor="#8f6920" />
            <stop offset="1" stopColor="#f3ce6a" />
          </linearGradient>
          <filter id="rrGlowGoldV7"><feGaussianBlur stdDeviation="3.4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
          <filter id="rrGlowCyanV7"><feGaussianBlur stdDeviation="2.6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        </defs>

        <g className="ring-cw" opacity=".9">
          <circle cx="320" cy="320" r="286" fill="none" stroke="rgba(83,229,239,.34)" strokeWidth="1.2" strokeDasharray="2 10" />
          <path d="M93 170 A286 286 0 0 1 179 79" fill="none" stroke="url(#rrGoldV7)" strokeWidth="3.2" strokeLinecap="round" />
          <path d="M467 77 A286 286 0 0 1 552 166" fill="none" stroke="url(#rrGoldV7)" strokeWidth="3.2" strokeLinecap="round" />
          <path d="M88 466 A286 286 0 0 0 171 557" fill="none" stroke="rgba(103,232,249,.55)" strokeWidth="2.2" strokeLinecap="round" />
        </g>
        <g className="ring-ccw" opacity=".85">
          <circle cx="320" cy="320" r="264" fill="none" stroke="rgba(212,175,55,.5)" strokeWidth="1.1" strokeDasharray="34 18 6 22" />
          <circle cx="320" cy="320" r="247" fill="none" stroke="rgba(90,231,241,.22)" strokeWidth="1" strokeDasharray="4 7" />
        </g>
        <g className="orbit-fast" opacity=".9" fill="none">
          <ellipse cx="320" cy="320" rx="238" ry="92" transform="rotate(-16 320 320)" stroke="rgba(255,205,99,.72)" strokeWidth="1.15" strokeDasharray="2 7" />
          <ellipse cx="320" cy="320" rx="228" ry="82" transform="rotate(19 320 320)" stroke="rgba(93,232,242,.60)" strokeWidth="1.05" strokeDasharray="3 7" />
        </g>

        <g fill="url(#rrGoldV7)" filter="url(#rrGlowGoldV7)" fontFamily="sans-serif" fontSize="18" textAnchor="middle">
          <text x="320" y="32">N</text><text x="320" y="620">S</text><text x="25" y="326">O</text><text x="615" y="326">L</text>
          <path d="M320 43 l-8 14 h16z"/><path d="M320 597 l-8 -14 h16z"/><path d="M42 320 l14 -8 v16z"/><path d="M598 320 l-14 -8 v16z"/>
        </g>

        <g opacity=".85" filter="url(#rrGlowGoldV7)">
          <circle cx="498" cy="163" r="4.5" fill="#ffd66b"/><circle cx="546" cy="379" r="4" fill="#ffd66b"/><circle cx="172" cy="215" r="3.5" fill="#6feef7"/><circle cx="133" cy="451" r="3.5" fill="#6feef7"/>
        </g>
      </svg>

      <div className="core-breathe pointer-events-none absolute z-[14] grid size-[31%] place-items-center rounded-full border border-[#d4af37]/34 bg-[radial-gradient(circle,rgba(3,16,20,.96)_0%,rgba(2,13,16,.92)_63%,rgba(2,12,15,.72)_100%)] shadow-[0_0_0_1px_rgba(83,232,241,.20),0_0_44px_rgba(212,175,55,.14),inset_0_0_36px_rgba(0,0,0,.55)]" aria-hidden="true">
        <div className="absolute inset-[9%] rounded-full border border-cyan-200/16" />
        <div className="absolute inset-[17%] rounded-full border border-[#d4af37]/30" />
      </div>

      <div className="pointer-events-none absolute z-[18] flex flex-col items-center justify-center" aria-hidden="true">
        <span
          className="signal-count bg-clip-text text-[clamp(4rem,10vw,7.2rem)] font-semibold leading-none text-transparent"
          style={{ backgroundImage: "linear-gradient(180deg,#fff0b0 0%,#efc65f 28%,#b47d24 63%,#ffe08a 100%)", WebkitTextStroke: "1px rgba(255,232,157,.38)" }}
        >
          {signals}
        </span>
        <span className="mt-2 text-[clamp(.52rem,1.2vw,.78rem)] font-medium uppercase tracking-[.42em] text-cyan-50/78">Sinais ativos</span>
      </div>
    </div>
  );
}
