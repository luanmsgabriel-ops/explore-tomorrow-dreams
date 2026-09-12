import { useEffect, useRef } from "react";
import * as THREE from "three";

interface RadarSignalGlobeProps {
  signals: number;
  scanning?: boolean;
}

const EARTH_DAY = "https://cdn.jsdelivr.net/npm/three-globe@2.45.2/example/img/earth-day.jpg";
const EARTH_NIGHT = "https://cdn.jsdelivr.net/npm/three-globe@2.45.2/example/img/earth-night.jpg";
const EARTH_BUMP = "https://cdn.jsdelivr.net/npm/three-globe@2.45.2/example/img/earth-topology.png";

const stars = [
  [5, 20, 1.1, 0.1, "cyan"], [9, 62, .8, 1.2, "gold"], [14, 84, 1.2, 2.0, "cyan"],
  [18, 10, .7, .6, "cyan"], [25, 93, 1.1, 1.6, "gold"], [31, 6, .8, 2.5, "cyan"],
  [38, 91, 1.0, .3, "cyan"], [44, 8, .8, 2.1, "gold"], [50, 96, 1.1, 1.0, "cyan"],
  [57, 7, .8, 2.4, "cyan"], [64, 91, 1.0, 1.5, "gold"], [71, 9, .8, .8, "cyan"],
  [77, 94, .9, 3.0, "cyan"], [84, 16, 1.2, 2.3, "gold"], [91, 82, .7, 1.1, "cyan"],
  [95, 33, 1.0, 2.8, "cyan"], [96, 64, .8, .9, "gold"], [11, 47, .75, 2.0, "cyan"],
  [88, 52, .65, 1.5, "cyan"], [28, 41, .7, 2.2, "gold"], [74, 36, .75, 1.3, "cyan"],
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

export function RadarSignalGlobe({ signals, scanning = false }: RadarSignalGlobeProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount || !supportsWebGL()) return;

    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    let frame = 0;
    let disposed = false;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(31, 1, 0.1, 100);
    camera.position.set(0, 0.03, 3.35);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.65));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.28;
    mount.appendChild(renderer.domElement);

    const globe = new THREE.Group();
    globe.rotation.x = 0.08;
    globe.rotation.y = -1.58;
    scene.add(globe);

    const fallbackMaterial = new THREE.MeshStandardMaterial({
      color: 0x062f37,
      emissive: 0x063d45,
      emissiveIntensity: 0.5,
      roughness: 0.72,
      metalness: 0.08,
    });
    const sphereGeometry = new THREE.SphereGeometry(1.13, 96, 96);
    const earth = new THREE.Mesh(sphereGeometry, fallbackMaterial);
    globe.add(earth);

    const wireGeometry = new THREE.WireframeGeometry(new THREE.SphereGeometry(1.136, 24, 16));
    const wireMaterial = new THREE.LineBasicMaterial({ color: 0x60edf7, transparent: true, opacity: 0.055 });
    const wire = new THREE.LineSegments(wireGeometry, wireMaterial);
    globe.add(wire);

    const atmosphereGeometry = new THREE.SphereGeometry(1.17, 64, 64);
    const atmosphereMaterial = new THREE.ShaderMaterial({
      transparent: true,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      uniforms: { glowColor: { value: new THREE.Color(0x5ff3ff) } },
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
          float fresnel = pow(1.0 - max(dot(vNormal, viewDirection), 0.0), 2.45);
          gl_FragColor = vec4(glowColor, fresnel * 0.58);
        }
      `,
    });
    const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    globe.add(atmosphere);

    scene.add(new THREE.AmbientLight(0x8bd9df, 0.95));
    const cyanLight = new THREE.DirectionalLight(0x6af5ff, 4.6);
    cyanLight.position.set(-3.4, 2.8, 4.0);
    scene.add(cyanLight);
    const goldLight = new THREE.DirectionalLight(0xffc856, 3.1);
    goldLight.position.set(3.2, -1.6, 2.7);
    scene.add(goldLight);
    const rimLight = new THREE.PointLight(0x4defff, 3.3, 8);
    rimLight.position.set(-2.1, 1.7, 2.4);
    scene.add(rimLight);

    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin("anonymous");
    Promise.all([
      loader.loadAsync(EARTH_DAY),
      loader.loadAsync(EARTH_NIGHT),
      loader.loadAsync(EARTH_BUMP),
    ]).then(([dayTexture, nightTexture, bumpTexture]) => {
      if (disposed) {
        dayTexture.dispose();
        nightTexture.dispose();
        bumpTexture.dispose();
        return;
      }
      dayTexture.colorSpace = THREE.SRGBColorSpace;
      nightTexture.colorSpace = THREE.SRGBColorSpace;
      const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();
      dayTexture.anisotropy = Math.min(maxAnisotropy, 8);
      nightTexture.anisotropy = Math.min(maxAnisotropy, 8);
      bumpTexture.anisotropy = Math.min(maxAnisotropy, 8);
      const material = new THREE.MeshStandardMaterial({
        map: dayTexture,
        emissiveMap: nightTexture,
        emissive: new THREE.Color(0xffcc68),
        emissiveIntensity: 1.05,
        bumpMap: bumpTexture,
        bumpScale: 0.025,
        roughness: 0.68,
        metalness: 0.04,
      });
      earth.material = material;
      fallbackMaterial.dispose();
    }).catch(() => {
      // Fallback material remains visible if a CDN texture cannot load.
    });

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
      if (!reducedMotion) globe.rotation.y += scanning ? 0.00055 : 0.00018;
      renderer.render(scene, camera);
      frame = requestAnimationFrame(render);
    };
    render();

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      sphereGeometry.dispose();
      wireGeometry.dispose();
      wireMaterial.dispose();
      atmosphereGeometry.dispose();
      atmosphereMaterial.dispose();
      if (earth.material instanceof THREE.Material) earth.material.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [scanning]);

  return (
    <div
      className="radar-reference relative grid aspect-square w-[min(96vw,45rem)] shrink-0 place-items-center sm:w-[48rem] lg:w-[55rem] xl:w-[61rem]"
      aria-label={`${signals} sinais ativos`}
      data-scanning={scanning}
    >
      <style>{`
        @keyframes rr-spin { to { transform: rotate(360deg); } }
        @keyframes rr-spin-back { to { transform: rotate(-360deg); } }
        @keyframes rr-float { 0%,100% { opacity:.22; transform:translateY(0) scale(.72); } 50% { opacity:1; transform:translateY(-7px) scale(1.28); } }
        @keyframes rr-number { 0%,100% { filter:drop-shadow(0 0 11px rgba(255,201,78,.5)); } 50% { filter:drop-shadow(0 0 30px rgba(255,222,123,.96)); } }
        @keyframes rr-breathe { 0%,100% { opacity:.68; transform:scale(.99); } 50% { opacity:1; transform:scale(1.015); } }
        .radar-reference .ring-cw { animation: rr-spin 24s linear infinite; transform-origin:center; }
        .radar-reference .ring-ccw { animation: rr-spin-back 35s linear infinite; transform-origin:center; }
        .radar-reference .orbit-fast { animation: rr-spin 16s linear infinite; transform-origin:center; }
        .radar-reference .sweep { animation: rr-spin 7.2s linear infinite; transform-origin:center; }
        .radar-reference[data-scanning="true"] .sweep { animation-duration: 2.05s; }
        .radar-reference .dust { animation: rr-float 4s ease-in-out infinite; }
        .radar-reference .signal-count { animation: rr-number 3.8s ease-in-out infinite; }
        .radar-reference .core-breathe { animation: rr-breathe 4.8s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .radar-reference .ring-cw,.radar-reference .ring-ccw,.radar-reference .orbit-fast,.radar-reference .sweep,.radar-reference .dust,.radar-reference .signal-count,.radar-reference .core-breathe { animation:none !important; }
        }
      `}</style>

      <div className="pointer-events-none absolute inset-[-8%] rounded-full bg-[radial-gradient(circle,rgba(36,224,240,.17)_0%,rgba(7,67,75,.09)_43%,transparent_73%)] blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-[2%] rounded-full border border-cyan-300/[.09] shadow-[0_0_130px_rgba(34,211,238,.15)]" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-[6.2%] rounded-full border border-[#d4af37]/20" aria-hidden="true" />
      <div
        className="pointer-events-none absolute inset-[3.1%] rounded-full"
        style={{
          background: "repeating-conic-gradient(from 0deg, rgba(103,232,249,.34) 0deg 0.55deg, transparent .55deg 2.7deg)",
          WebkitMaskImage: "radial-gradient(circle, transparent 0 91.8%, black 92.2% 93.1%, transparent 93.5%)",
          maskImage: "radial-gradient(circle, transparent 0 91.8%, black 92.2% 93.1%, transparent 93.5%)",
        }}
        aria-hidden="true"
      />

      {stars.map(([left, top, size, delay, tone], index) => (
        <span
          key={index}
          className={`dust absolute z-[2] rounded-full ${tone === "gold" ? "bg-[#ffd76a] shadow-[0_0_14px_rgba(255,207,76,.95)]" : "bg-cyan-200 shadow-[0_0_12px_rgba(103,232,249,.92)]"}`}
          style={{ left: `${left}%`, top: `${top}%`, width: size * 2.8, height: size * 2.8, animationDelay: `${delay}s` }}
          aria-hidden="true"
        />
      ))}

      <div className="absolute inset-[11.3%] z-[4] overflow-hidden rounded-full bg-[#031416] shadow-[0_0_0_1px_rgba(93,237,248,.48),0_0_42px_rgba(40,215,230,.16)]" aria-hidden="true">
        <div ref={mountRef} className="absolute inset-0" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_28%_19%,rgba(77,238,251,.20),transparent_27%),linear-gradient(90deg,rgba(2,26,30,.10),rgba(2,13,16,.06)_55%,rgba(2,10,12,.28))] mix-blend-screen" />
      </div>

      <div
        className="sweep pointer-events-none absolute inset-[11.3%] z-[8] rounded-full"
        style={{
          background: "conic-gradient(from -36deg, rgba(85,239,252,0) 0deg, rgba(85,239,252,0) 286deg, rgba(85,239,252,.018) 296deg, rgba(85,239,252,.045) 307deg, rgba(85,239,252,.095) 318deg, rgba(85,239,252,.17) 329deg, rgba(85,239,252,.30) 339deg, rgba(85,239,252,.52) 348deg, rgba(117,246,255,.78) 355deg, rgba(221,254,255,.98) 360deg)",
          WebkitMaskImage: "radial-gradient(circle, transparent 0 4%, black 5% 99%, transparent 100%)",
          maskImage: "radial-gradient(circle, transparent 0 4%, black 5% 99%, transparent 100%)",
          filter: "drop-shadow(0 0 18px rgba(67,232,247,.55))",
          mixBlendMode: "screen",
        }}
        aria-hidden="true"
      >
        <span className="absolute left-1/2 top-1/2 h-[2px] w-[49%] origin-left -translate-y-1/2 bg-gradient-to-r from-cyan-200/5 via-cyan-200/50 to-white shadow-[0_0_12px_rgba(139,247,255,.95)]" />
      </div>

      <svg viewBox="0 0 640 640" className="absolute inset-0 z-[10] size-full overflow-visible" aria-hidden="true">
        <defs>
          <linearGradient id="rrGoldV6" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#fff5bd" />
            <stop offset=".38" stopColor="#efca61" />
            <stop offset=".7" stopColor="#d4af37" />
            <stop offset="1" stopColor="#7b5713" />
          </linearGradient>
          <linearGradient id="rrCyanGoldV6" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#62eef9" />
            <stop offset=".58" stopColor="#a7f8fc" />
            <stop offset="1" stopColor="#eec95d" />
          </linearGradient>
          <filter id="rrGoldGlowV6" x="-120%" y="-120%" width="340%" height="340%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <filter id="rrCyanGlowV6" x="-120%" y="-120%" width="340%" height="340%">
            <feGaussianBlur stdDeviation="3.2" result="blur" />
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        <g className="ring-ccw">
          <circle cx="320" cy="320" r="300" fill="none" stroke="#62ecf8" strokeOpacity=".20" strokeWidth="1.3" />
          <circle cx="320" cy="320" r="287" fill="none" stroke="#d4af37" strokeOpacity=".37" strokeDasharray="3 13" strokeWidth="1.35" />
          <path d="M68 187 A294 294 0 0 1 565 151" fill="none" stroke="url(#rrCyanGoldV6)" strokeOpacity=".78" strokeWidth="2.1" strokeLinecap="round" />
          <path d="M89 499 A290 290 0 0 0 551 524" fill="none" stroke="#e7c65c" strokeOpacity=".60" strokeWidth="2.1" strokeDasharray="65 33 10 29" strokeLinecap="round" />
          <circle cx="557" cy="169" r="3.2" fill="#ffd766" filter="url(#rrGoldGlowV6)" />
          <circle cx="104" cy="167" r="2.4" fill="#71f0fa" filter="url(#rrCyanGlowV6)" />
        </g>

        <g className="ring-cw">
          <circle cx="320" cy="320" r="260" fill="none" stroke="#6aedf8" strokeOpacity=".22" strokeWidth="1.2" />
          <circle cx="320" cy="320" r="246" fill="none" stroke="#d4af37" strokeOpacity=".28" strokeDasharray="47 21 8 24" strokeWidth="1.45" />
          <ellipse cx="320" cy="320" rx="281" ry="105" transform="rotate(-13 320 320)" fill="none" stroke="#67e8f9" strokeOpacity=".40" strokeDasharray="2 9" strokeWidth="1.2" />
          <ellipse cx="320" cy="320" rx="268" ry="76" transform="rotate(18 320 320)" fill="none" stroke="#e8c55b" strokeOpacity=".44" strokeDasharray="70 30 8 22" strokeWidth="1.3" />
        </g>

        <g className="orbit-fast">
          <path d="M67 359 C145 236 249 213 357 224 C465 235 529 195 584 139" fill="none" stroke="#7cf0fa" strokeOpacity=".46" strokeDasharray="3 8" strokeWidth="1.25" />
          <path d="M93 179 C182 254 289 257 385 205 C462 164 526 170 588 229" fill="none" stroke="#e2bc4f" strokeOpacity=".42" strokeDasharray="3 8" strokeWidth="1.25" />
        </g>

        <g fontFamily="Inter, sans-serif" fontSize="16" letterSpacing="2" textAnchor="middle" fill="#f1d36c">
          <text x="320" y="32">N</text>
          <text x="320" y="619">S</text>
          <text x="26" y="326">O</text>
          <text x="614" y="326">L</text>
        </g>
        <g fill="#f4d36b" filter="url(#rrGoldGlowV6)">
          <path d="M320 45 l-8 14 h16z" />
          <path d="M320 595 l8-14 h-16z" />
          <path d="M45 320 l14-8 v16z" />
          <path d="M595 320 l-14 8 v-16z" />
        </g>

        <g fill="#f2ca5b" filter="url(#rrGoldGlowV6)" opacity=".95">
          <path d="M531 405 l15 -5 10 3 -7 5 8 3 -4 4 -11 -2 -7 8 -5 -2 3 -9 -7 -3z" />
          <path d="M566 366 l14 -6 10 3 -7 5 8 3 -4 4 -10 -2 -8 7 -5 -2 3 -8 -7 -3z" />
        </g>
      </svg>

      <div className="core-breathe absolute z-[18] grid aspect-square w-[31%] place-items-center rounded-full border border-cyan-200/12 bg-[radial-gradient(circle,rgba(2,13,15,.91)_0%,rgba(2,11,13,.82)_58%,rgba(2,10,12,.46)_76%,transparent_78%)] shadow-[0_0_54px_rgba(0,0,0,.56),inset_0_0_36px_rgba(39,218,233,.035)]">
        <div className="pointer-events-none absolute -inset-[17%] rounded-full border border-[#d4af37]/18" aria-hidden="true" />
        <div className="pointer-events-none absolute -inset-[11%] rounded-full border border-cyan-200/10" aria-hidden="true" />
        <div className="relative z-10 flex flex-col items-center text-center">
          <strong className="signal-count bg-gradient-to-b from-[#fff7d1] via-[#f0cd64] to-[#b98218] bg-clip-text text-6xl font-semibold leading-none text-transparent sm:text-7xl lg:text-8xl">{signals}</strong>
          <span className="mt-3 text-[10px] font-medium uppercase tracking-[.38em] text-cyan-50/80 sm:text-xs">sinais ativos</span>
        </div>
        <span className="pointer-events-none absolute -inset-[7%] rounded-full border-t-[3px] border-r-[3px] border-t-cyan-100/75 border-r-[#e7c75d]/80 border-b-transparent border-l-transparent rotate-[24deg]" aria-hidden="true" />
        <span className="pointer-events-none absolute -inset-[7%] rounded-full border-b-[3px] border-l-[3px] border-b-[#e7c75d]/80 border-l-cyan-100/70 border-t-transparent border-r-transparent rotate-[24deg]" aria-hidden="true" />
      </div>
    </div>
  );
}
