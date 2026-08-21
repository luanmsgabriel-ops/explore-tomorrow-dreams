import { useEffect, useMemo, useRef, useState } from "react";
import { Mic } from "lucide-react";

import { cn } from "@/lib/utils";

export type TomorrowLiveState = "idle" | "listening" | "thinking" | "speaking" | "offers";

export interface LiveParticleGlobeProps {
  state: TomorrowLiveState;
  reducedMotion?: boolean;
  lowPerformance?: boolean;
  className?: string;
}

const EARTH_TEXTURE = "https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-dark.jpg";
const EARTH_BUMP = "https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-topology.png";
const COUNTRIES_GEOJSON =
  "https://cdn.jsdelivr.net/npm/three-globe/example/country-polygons/ne_110m_admin_0_countries.geojson";

const stateStyle: Record<
  TomorrowLiveState,
  { label: string; cyan: string; gold: string; glow: string; rotation: number; pulse: number }
> = {
  idle: {
    label: "Aguardando",
    cyan: "#68e8e0",
    gold: "#ddb85c",
    glow: "rgba(72, 214, 207, 0.24)",
    rotation: 0.0007,
    pulse: 0.004,
  },
  listening: {
    label: "Ouvindo...",
    cyan: "#7df7ef",
    gold: "#e6c778",
    glow: "rgba(84, 239, 230, 0.42)",
    rotation: 0.0015,
    pulse: 0.014,
  },
  thinking: {
    label: "Pensando...",
    cyan: "#72e8e2",
    gold: "#efd384",
    glow: "rgba(218, 179, 83, 0.32)",
    rotation: 0.00095,
    pulse: 0.008,
  },
  speaking: {
    label: "Falando...",
    cyan: "#7cf2eb",
    gold: "#e7c66d",
    glow: "rgba(79, 225, 216, 0.44)",
    rotation: 0.0017,
    pulse: 0.017,
  },
  offers: {
    label: "Ofertas",
    cyan: "#73e9e2",
    gold: "#efd283",
    glow: "rgba(222, 188, 98, 0.34)",
    rotation: 0.00085,
    pulse: 0.007,
  },
};

type GlobePoint = {
  lat: number;
  lng: number;
  color: string;
  radius: number;
  altitude: number;
};

type GlobeRing = {
  lat: number;
  lng: number;
  color: string;
};

type GlobeArc = {
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
};

const routeArc: GlobeArc[] = [
  { startLat: -23.55, startLng: -46.63, endLat: 38.72, endLng: -9.14 },
];

const routeRings: GlobeRing[] = [
  { lat: -23.55, lng: -46.63, color: "cyan" },
  { lat: 38.72, lng: -9.14, color: "gold" },
];

function buildSurfacePoints(count: number, cyan: string, gold: string): GlobePoint[] {
  return Array.from({ length: count }, (_, index) => {
    const y = 1 - (index / Math.max(1, count - 1)) * 2;
    const radius = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = Math.PI * (3 - Math.sqrt(5)) * index;
    const lat = Math.asin(y) * (180 / Math.PI);
    const lng = Math.atan2(Math.sin(theta) * radius, Math.cos(theta) * radius) * (180 / Math.PI);

    return {
      lat,
      lng,
      color: index % 11 === 0 || index % 17 === 0 ? gold : cyan,
      radius: index % 7 === 0 ? 0.23 : 0.15,
      altitude: index % 9 === 0 ? 0.006 : 0.0035,
    };
  });
}

function hasWebGL2() {
  if (typeof window === "undefined" || typeof document === "undefined") return false;
  if (!("WebGL2RenderingContext" in window)) return false;

  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2"));
  } catch {
    return false;
  }
}

const wavePaths = [
  "M-20 72 C44 22 95 22 160 72 S278 122 344 72 S462 22 528 72 S646 122 712 72",
  "M-20 94 C46 46 99 46 164 94 S282 142 348 94 S466 46 532 94 S650 142 716 94",
  "M-20 118 C45 72 100 72 166 118 S284 164 350 118 S468 72 534 118 S652 164 718 118",
  "M-20 142 C46 100 102 100 168 142 S286 184 352 142 S470 100 536 142 S654 184 720 142",
];

const waveformBars = [12, 22, 10, 30, 44, 18, 36, 14, 50, 24, 38, 16, 54, 28, 14, 40, 58, 22, 45, 17, 34, 12, 48, 20, 36, 15, 26];

function StaticGlobeFallback({ state }: { state: TomorrowLiveState }) {
  const style = stateStyle[state];

  return (
    <div className="relative mx-auto flex size-[19rem] max-w-[76vw] items-center justify-center sm:size-[27rem]">
      <div
        className="absolute inset-0 rounded-full blur-3xl"
        style={{ background: `radial-gradient(circle, ${style.glow}, transparent 68%)` }}
      />
      <div
        className="relative size-[82%] overflow-hidden rounded-full border border-cyan-200/70 shadow-[0_0_70px_rgba(89,234,226,0.28),inset_-35px_-25px_70px_rgba(0,0,0,0.72)]"
        style={{
          backgroundImage: `linear-gradient(rgba(4,38,43,.18),rgba(4,38,43,.18)),url(${EARTH_TEXTURE})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_42%_34%,rgba(100,244,236,0.18),transparent_36%),radial-gradient(circle_at_50%_50%,transparent_58%,rgba(3,13,16,0.48)_100%)]" />
      </div>
    </div>
  );
}

export function LiveParticleGlobe({
  state,
  reducedMotion = false,
  lowPerformance = false,
  className,
}: LiveParticleGlobeProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [rendererState, setRendererState] = useState<"loading" | "ready" | "fallback">("loading");
  const style = stateStyle[state];
  const particleCount = lowPerformance ? 180 : 360;
  const surfacePoints = useMemo(
    () => buildSurfacePoints(particleCount, style.cyan, style.gold),
    [particleCount, style.cyan, style.gold],
  );

  useEffect(() => {
    const host = hostRef.current;
    if (!host || !hasWebGL2()) {
      setRendererState("fallback");
      return;
    }

    let disposed = false;
    let animationFrame = 0;
    let resizeObserver: ResizeObserver | null = null;
    let renderer: import("three").WebGLRenderer | null = null;
    let globeObject: import("three").Object3D | null = null;
    let abortController: AbortController | null = null;

    const start = async () => {
      try {
        const [THREE, threeGlobeModule] = await Promise.all([import("three"), import("three-globe")]);
        if (disposed) return;

        const ThreeGlobe = threeGlobeModule.default;
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 1200);
        camera.position.set(0, 0, 355);

        renderer = new THREE.WebGLRenderer({
          alpha: true,
          antialias: !lowPerformance,
          powerPreference: lowPerformance ? "low-power" : "high-performance",
        });
        renderer.setClearColor(0x000000, 0);
        renderer.setPixelRatio(Math.min(lowPerformance ? 1.35 : 2, window.devicePixelRatio || 1));
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.2;
        renderer.domElement.className = "absolute inset-0 size-full";
        renderer.domElement.setAttribute("aria-hidden", "true");
        host.replaceChildren(renderer.domElement);

        const Globe = new ThreeGlobe({ waitForGlobeReady: true, animateIn: false })
          .globeImageUrl(EARTH_TEXTURE)
          .bumpImageUrl(EARTH_BUMP)
          .showAtmosphere(true)
          .atmosphereColor(style.cyan)
          .atmosphereAltitude(0.18)
          .showGraticules(false)
          .pointsData(surfacePoints)
          .pointLat("lat")
          .pointLng("lng")
          .pointColor("color")
          .pointRadius("radius")
          .pointAltitude("altitude")
          .pointsMerge(true)
          .arcsData(routeArc)
          .arcStartLat("startLat")
          .arcStartLng("startLng")
          .arcEndLat("endLat")
          .arcEndLng("endLng")
          .arcColor(() => [style.cyan, style.gold])
          .arcAltitude(0.24)
          .arcStroke(0.48)
          .arcDashLength(0.26)
          .arcDashGap(0.08)
          .arcDashAnimateTime(reducedMotion ? 0 : state === "listening" || state === "speaking" ? 950 : 1700)
          .ringsData(routeRings)
          .ringLat("lat")
          .ringLng("lng")
          .ringColor((ring: GlobeRing) => (ring.color === "gold" ? [style.gold, "rgba(229,199,112,0)"] : [style.cyan, "rgba(102,232,224,0)"]))
          .ringMaxRadius(state === "listening" || state === "speaking" ? 7 : 4.5)
          .ringPropagationSpeed(state === "listening" || state === "speaking" ? 2.6 : 1.4)
          .ringRepeatPeriod(reducedMotion ? 0 : state === "listening" || state === "speaking" ? 700 : 1200);

        globeObject = Globe;
        globeObject.rotation.y = -0.42;
        globeObject.rotation.x = 0.06;
        globeObject.scale.setScalar(1.12);
        scene.add(globeObject);

        const globeMaterial = Globe.globeMaterial() as import("three").MeshPhongMaterial;
        globeMaterial.color = new THREE.Color("#0a5960");
        globeMaterial.emissive = new THREE.Color("#062a2f");
        globeMaterial.emissiveIntensity = 0.72;
        globeMaterial.shininess = 18;
        globeMaterial.specular = new THREE.Color("#75eee7");

        scene.add(new THREE.AmbientLight(0x8fe9e3, 1.8));
        const cyanLight = new THREE.DirectionalLight(0x8ffff7, 2.7);
        cyanLight.position.set(-160, 120, 210);
        scene.add(cyanLight);
        const goldLight = new THREE.PointLight(0xe4c269, 55, 500);
        goldLight.position.set(170, 70, 180);
        scene.add(goldLight);

        abortController = new AbortController();
        fetch(COUNTRIES_GEOJSON, { signal: abortController.signal, cache: "force-cache" })
          .then((response) => (response.ok ? response.json() : Promise.reject(new Error("countries fetch failed"))))
          .then((countries) => {
            if (disposed) return;
            const features = Array.isArray(countries?.features)
              ? countries.features.filter((feature: { properties?: { ISO_A2?: string } }) => feature.properties?.ISO_A2 !== "AQ")
              : [];

            Globe.polygonsData(features)
              .polygonAltitude(0.006)
              .polygonCapColor(() => "rgba(0,0,0,0)")
              .polygonSideColor(() => "rgba(0,0,0,0)")
              .polygonStrokeColor(() => "rgba(105,241,233,0.58)")
              .polygonsTransitionDuration(0);
          })
          .catch(() => undefined);

        const resize = () => {
          if (!renderer || disposed) return;
          const rect = host.getBoundingClientRect();
          const width = Math.max(280, rect.width || 560);
          const height = Math.max(300, rect.height || width * 0.78);
          renderer.setSize(width, height, false);
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
        };

        resizeObserver = new ResizeObserver(resize);
        resizeObserver.observe(host);
        resize();

        const startedAt = performance.now();
        const animate = (now: number) => {
          if (disposed || !renderer || !globeObject) return;
          const elapsed = (now - startedAt) / 1000;

          if (!reducedMotion) {
            globeObject.rotation.y += style.rotation;
            const scale = 1.12 + Math.sin(elapsed * (state === "listening" || state === "speaking" ? 3.1 : 1.7)) * style.pulse;
            globeObject.scale.setScalar(scale);
          }

          renderer.render(scene, camera);
          animationFrame = requestAnimationFrame(animate);
        };

        setRendererState("ready");
        animationFrame = requestAnimationFrame(animate);
      } catch {
        if (!disposed) setRendererState("fallback");
      }
    };

    void start();

    return () => {
      disposed = true;
      abortController?.abort();
      resizeObserver?.disconnect();
      cancelAnimationFrame(animationFrame);
      renderer?.dispose();
      if (host) host.replaceChildren();
    };
  }, [lowPerformance, reducedMotion, state, style.cyan, style.gold, style.pulse, style.rotation, surfacePoints]);

  const reactive = state === "listening" || state === "speaking";

  return (
    <figure
      className={cn("relative mx-auto w-full max-w-[66rem] overflow-visible", className)}
      aria-label={`Globo visual do Tomorrow Live — ${style.label.replace("...", "")}`}
      data-live-state={state}
      data-renderer={rendererState}
    >
      <div className="relative min-h-[28rem] sm:min-h-[36rem] lg:min-h-[41rem]">
        <div
          className="pointer-events-none absolute inset-x-[12%] top-[8%] bottom-[18%] rounded-full blur-[95px] transition-all duration-500"
          style={{ background: `radial-gradient(circle, ${style.glow} 0%, rgba(3,18,22,0) 72%)` }}
          aria-hidden="true"
        />

        <svg
          viewBox="0 0 720 210"
          className="pointer-events-none absolute inset-x-[-10%] top-[33%] z-0 h-[38%] w-[120%] overflow-visible opacity-90"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="live-webgl-wave" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(99,240,232,0)" />
              <stop offset="18%" stopColor="rgba(99,240,232,0.32)" />
              <stop offset="50%" stopColor={reactive ? "rgba(115,250,241,0.95)" : "rgba(95,229,221,0.62)"} />
              <stop offset="82%" stopColor="rgba(225,193,105,0.28)" />
              <stop offset="100%" stopColor="rgba(225,193,105,0)" />
            </linearGradient>
          </defs>
          {wavePaths.map((path, index) => (
            <path
              key={path}
              d={path}
              fill="none"
              stroke="url(#live-webgl-wave)"
              strokeWidth={index % 2 === 0 ? 2 : 1.15}
              strokeDasharray={index % 2 === 0 ? "2 8" : "3 10"}
              opacity={reactive ? 0.98 : 0.68}
            >
              {!reducedMotion ? (
                <animate
                  attributeName="stroke-dashoffset"
                  values={index % 2 === 0 ? "0;-90" : "0;90"}
                  dur={`${4.6 + index * 0.7}s`}
                  repeatCount="indefinite"
                />
              ) : null}
            </path>
          ))}
        </svg>

        <div className="pointer-events-none absolute inset-x-[13%] bottom-[14%] z-[1] h-24" aria-hidden="true">
          <div className="absolute inset-x-0 bottom-0 h-16 rounded-[50%] border border-cyan-300/15" />
          <div className="absolute inset-x-[9%] bottom-2 h-12 rounded-[50%] border border-cyan-300/20" />
          <div className="absolute inset-x-[19%] bottom-4 h-9 rounded-[50%] border border-amber-200/15" />
        </div>

        <div ref={hostRef} className="absolute inset-0 z-10" aria-hidden="true" />

        {rendererState !== "ready" ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center">
            <StaticGlobeFallback state={state} />
          </div>
        ) : null}

        <div className="pointer-events-none absolute inset-x-0 bottom-1 z-20 flex flex-col items-center" aria-hidden="true">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-tomorrow-teal-soft sm:text-sm">
            {style.label}
          </p>
          <div className="mt-3 flex h-14 items-center gap-[3px] sm:h-16 sm:gap-1">
            {waveformBars.map((height, index) => {
              const scale = reactive ? 1.05 + ((index * 7) % 6) * 0.09 : 0.72;
              return (
                <span
                  key={`${index}-${height}`}
                  className={cn(
                    "w-[2px] rounded-full bg-tomorrow-teal-soft/70 transition-all duration-300 sm:w-[3px]",
                    !reducedMotion && reactive && "animate-pulse",
                  )}
                  style={{ height: `${Math.round(height * scale)}%`, animationDelay: `${index * 35}ms` }}
                />
              );
            })}
            <span
              className={cn(
                "mx-3 flex size-11 items-center justify-center rounded-full border border-tomorrow-teal/55 bg-tomorrow-teal/10 text-tomorrow-teal-soft shadow-[0_0_28px_rgba(89,234,226,0.22)] sm:size-14",
                !reducedMotion && reactive && "animate-pulse",
              )}
            >
              <Mic className="size-5 sm:size-6" />
            </span>
            {waveformBars.slice().reverse().map((height, index) => {
              const scale = reactive ? 1.05 + ((index * 5) % 6) * 0.09 : 0.72;
              return (
                <span
                  key={`r-${index}-${height}`}
                  className={cn(
                    "w-[2px] rounded-full bg-tomorrow-teal-soft/70 transition-all duration-300 sm:w-[3px]",
                    !reducedMotion && reactive && "animate-pulse",
                  )}
                  style={{ height: `${Math.round(height * scale)}%`, animationDelay: `${index * 35}ms` }}
                />
              );
            })}
          </div>
        </div>
      </div>

      <figcaption className="sr-only">
        Globo terrestre digital do Tomorrow Live com visualização WebGL, continentes iluminados, rota e ondas de contexto.
      </figcaption>
    </figure>
  );
}
