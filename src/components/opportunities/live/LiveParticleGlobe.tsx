import { useEffect, useMemo, useRef, useState } from "react";
import { Mic } from "lucide-react";

import { cn } from "@/lib/utils";
import { LiveWaveBackdrop } from "./LiveWaveBackdrop";

export type TomorrowLiveState = "idle" | "listening" | "thinking" | "speaking" | "offers";

export interface LiveParticleGlobeProps {
  state: TomorrowLiveState;
  audioLevel?: number;
  reducedMotion?: boolean;
  lowPerformance?: boolean;
  className?: string;
}

type StateStyle = {
  label: string;
  cyan: string;
  gold: string;
  glow: string;
  rotation: number;
  pulse: number;
  baseline: number;
};

const EARTH_TEXTURE = "https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-dark.jpg";
const EARTH_BUMP = "https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-topology.png";
const COUNTRIES_GEOJSON =
  "https://cdn.jsdelivr.net/npm/three-globe/example/country-polygons/ne_110m_admin_0_countries.geojson";

const stateStyle: Record<TomorrowLiveState, StateStyle> = {
  idle: {
    label: "Aguardando",
    cyan: "#68e8e0",
    gold: "#ddb85c",
    glow: "rgba(72,214,207,0.18)",
    rotation: 0.00062,
    pulse: 0.004,
    baseline: 0.14,
  },
  listening: {
    label: "Ouvindo...",
    cyan: "#7df7ef",
    gold: "#e6c778",
    glow: "rgba(84,239,230,0.3)",
    rotation: 0.00135,
    pulse: 0.012,
    baseline: 0.7,
  },
  thinking: {
    label: "Pensando...",
    cyan: "#72e8e2",
    gold: "#efd384",
    glow: "rgba(72,208,204,0.2)",
    rotation: 0.00082,
    pulse: 0.006,
    baseline: 0.32,
  },
  speaking: {
    label: "Falando...",
    cyan: "#7cf2eb",
    gold: "#e7c66d",
    glow: "rgba(79,225,216,0.32)",
    rotation: 0.0015,
    pulse: 0.014,
    baseline: 0.86,
  },
  offers: {
    label: "Ofertas",
    cyan: "#73e9e2",
    gold: "#efd283",
    glow: "rgba(222,188,98,0.2)",
    rotation: 0.00076,
    pulse: 0.006,
    baseline: 0.45,
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
  color: "cyan" | "gold";
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

const waveformBars = [12, 22, 10, 30, 44, 18, 36, 14, 50, 24, 38, 16, 54, 28, 14, 40, 58, 22, 45, 17, 34, 12, 48, 20, 36, 15, 26];

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

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
      radius: index % 7 === 0 ? 0.22 : 0.14,
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

function responsiveGlobeScale(width: number) {
  if (width < 480) return 0.88;
  if (width < 640) return 0.92;
  if (width < 900) return 0.97;
  return 1.02;
}

function responsiveCameraDistance(width: number) {
  if (width < 480) return 370;
  if (width < 640) return 362;
  if (width < 900) return 356;
  return 350;
}

function StaticGlobeFallback({ state }: { state: TomorrowLiveState }) {
  const style = stateStyle[state];

  return (
    <div className="relative mx-auto flex size-[15.5rem] max-w-[64vw] items-center justify-center sm:size-[23rem] lg:size-[27rem]">
      <div
        className="absolute inset-[6%] rounded-full blur-3xl"
        style={{ background: `radial-gradient(circle, ${style.glow}, transparent 70%)` }}
      />
      <div
        className="relative size-[86%] overflow-hidden rounded-full border border-cyan-200/55 shadow-[0_0_48px_rgba(89,234,226,0.2),inset_-35px_-25px_70px_rgba(0,0,0,0.82)]"
        style={{
          backgroundImage: `linear-gradient(rgba(2,27,31,.38),rgba(2,27,31,.38)),url(${EARTH_TEXTURE})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_38%_32%,rgba(92,231,223,0.08),transparent_28%),radial-gradient(circle_at_50%_50%,transparent_54%,rgba(2,10,12,0.68)_100%)]" />
      </div>
    </div>
  );
}

export function LiveParticleGlobe({
  state,
  audioLevel,
  reducedMotion = false,
  lowPerformance = false,
  className,
}: LiveParticleGlobeProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [rendererState, setRendererState] = useState<"loading" | "ready" | "fallback">("loading");
  const style = stateStyle[state];
  const visualLevel = clamp01(audioLevel ?? style.baseline);
  const audioLevelRef = useRef(visualLevel);
  audioLevelRef.current = visualLevel;

  const particleCount = lowPerformance ? 170 : 340;
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
    let baseScale = 1.02;

    const start = async () => {
      try {
        const [THREE, threeGlobeModule] = await Promise.all([import("three"), import("three-globe")]);
        if (disposed) return;

        const ThreeGlobe = threeGlobeModule.default;
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 1200);
        camera.position.set(0, 0, 350);

        renderer = new THREE.WebGLRenderer({
          alpha: true,
          antialias: !lowPerformance,
          powerPreference: lowPerformance ? "low-power" : "high-performance",
        });
        renderer.setClearColor(0x000000, 0);
        renderer.setPixelRatio(Math.min(lowPerformance ? 1.25 : 1.85, window.devicePixelRatio || 1));
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 0.82;
        renderer.domElement.className = "absolute inset-0 size-full";
        renderer.domElement.setAttribute("aria-hidden", "true");
        host.replaceChildren(renderer.domElement);

        const Globe = new ThreeGlobe({ waitForGlobeReady: true, animateIn: false })
          .globeImageUrl(EARTH_TEXTURE)
          .bumpImageUrl(EARTH_BUMP)
          .showAtmosphere(true)
          .atmosphereColor(style.cyan)
          .atmosphereAltitude(0.115)
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
          .arcAltitude(0.22)
          .arcStroke(0.42)
          .arcDashLength(0.25)
          .arcDashGap(0.09)
          .arcDashAnimateTime(reducedMotion ? 0 : state === "listening" || state === "speaking" ? 880 : 1650)
          .ringsData(routeRings)
          .ringLat("lat")
          .ringLng("lng")
          .ringColor((ring: GlobeRing) => (ring.color === "gold" ? [style.gold, "rgba(229,199,112,0)"] : [style.cyan, "rgba(102,232,224,0)"]))
          .ringMaxRadius(state === "listening" || state === "speaking" ? 6.8 : 4.3)
          .ringPropagationSpeed(state === "listening" || state === "speaking" ? 2.5 : 1.35)
          .ringRepeatPeriod(reducedMotion ? 0 : state === "listening" || state === "speaking" ? 680 : 1180);

        globeObject = Globe;
        globeObject.rotation.y = -0.42;
        globeObject.rotation.x = 0.06;
        globeObject.scale.setScalar(baseScale);
        scene.add(globeObject);

        const globeMaterial = Globe.globeMaterial() as import("three").MeshPhongMaterial;
        globeMaterial.color = new THREE.Color("#063d43");
        globeMaterial.emissive = new THREE.Color("#031d21");
        globeMaterial.emissiveIntensity = 0.4;
        globeMaterial.shininess = 7;
        globeMaterial.specular = new THREE.Color("#1b7073");

        scene.add(new THREE.AmbientLight(0x6bb9b6, 0.72));

        const cyanRim = new THREE.DirectionalLight(0x78eee8, 1.25);
        cyanRim.position.set(-210, 125, 25);
        scene.add(cyanRim);

        const goldRim = new THREE.DirectionalLight(0xd8b85b, state === "offers" ? 0.82 : 0.48);
        goldRim.position.set(180, -75, -35);
        scene.add(goldRim);

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
              .polygonStrokeColor(() => "rgba(109,239,232,0.72)")
              .polygonsTransitionDuration(0);
          })
          .catch(() => undefined);

        const resize = () => {
          if (!renderer || !globeObject || disposed) return;
          const rect = host.getBoundingClientRect();
          const width = Math.max(280, rect.width || 560);
          const height = Math.max(290, rect.height || width * 0.78);
          baseScale = responsiveGlobeScale(width);
          globeObject.scale.setScalar(baseScale);
          camera.position.z = responsiveCameraDistance(width);
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
            globeObject.rotation.y += style.rotation * (0.86 + audioLevelRef.current * 0.3);
            const reactivePulse = style.pulse * (0.3 + audioLevelRef.current * 0.92);
            const pulseSpeed = state === "speaking" ? 3.6 : state === "listening" ? 3.1 : state === "thinking" ? 1.35 : 1.7;
            globeObject.scale.setScalar(baseScale + Math.sin(elapsed * pulseSpeed) * reactivePulse);
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

  return (
    <figure
      className={cn("relative mx-auto w-full max-w-[66rem] overflow-visible", className)}
      aria-label={`Globo visual do Tomorrow Live — ${style.label.replace("...", "")}`}
      data-live-state={state}
      data-renderer={rendererState}
      data-audio-ready="true"
    >
      <div className="relative min-h-[25rem] sm:min-h-[33rem] lg:min-h-[38rem]">
        <LiveWaveBackdrop
          state={state}
          audioLevel={audioLevel}
          reducedMotion={reducedMotion}
          lowPerformance={lowPerformance}
          className="pointer-events-none absolute -inset-x-[20%] top-[14%] bottom-[23%] z-0 opacity-95 [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]"
        />

        <div
          className="pointer-events-none absolute inset-x-[24%] top-[14%] bottom-[25%] z-[1] rounded-full blur-[72px] transition-opacity duration-500"
          style={{
            background: `radial-gradient(circle, ${style.glow} 0%, rgba(3,18,22,0) 70%)`,
            opacity: 0.42 + visualLevel * 0.28,
          }}
          aria-hidden="true"
        />

        <div
          ref={hostRef}
          className="absolute inset-x-[4%] top-[1%] bottom-[13%] z-10 sm:inset-x-[2%] lg:inset-x-0"
          aria-hidden="true"
        />

        {rendererState === "fallback" ? (
          <div className="absolute inset-x-0 top-[7%] bottom-[20%] z-10 flex items-center justify-center">
            <StaticGlobeFallback state={state} />
          </div>
        ) : null}

        {rendererState === "loading" ? (
          <div className="pointer-events-none absolute inset-x-[31%] top-[26%] bottom-[38%] z-[2] rounded-full border border-tomorrow-teal/15 bg-tomorrow-teal/5 blur-2xl" aria-hidden="true" />
        ) : null}

        <div className="pointer-events-none absolute inset-x-[14%] bottom-[12%] z-[12] h-20 sm:inset-x-[20%]" aria-hidden="true">
          <div className="absolute inset-x-[9%] bottom-4 h-7 rounded-[50%] border border-tomorrow-teal/35 bg-tomorrow-teal/5 shadow-[0_0_30px_rgba(76,225,216,0.18)]" />
          <div className="absolute inset-x-[21%] bottom-7 h-5 rounded-[50%] border border-tomorrow-gold/30 bg-transparent shadow-[0_0_18px_rgba(212,175,55,0.12)]" />
          <div className="absolute left-1/2 bottom-1 h-14 w-px -translate-x-1/2 bg-gradient-to-t from-tomorrow-teal/45 to-transparent" />
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex flex-col items-center" aria-hidden="true">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.28em] text-tomorrow-teal-soft sm:text-sm">
            <Mic className="size-3.5" />
            {style.label}
          </p>
          <div className="mt-2 flex h-12 items-center gap-[3px] sm:h-14 sm:gap-1">
            {waveformBars.map((height, index) => {
              const variation = 0.84 + ((index * 7) % 5) * 0.07;
              const barHeight = Math.max(4, height * (0.34 + visualLevel * 0.92) * variation);
              const active = state === "listening" || state === "speaking";
              return (
                <span
                  key={`${index}-${height}`}
                  className={cn(
                    "block w-[2px] rounded-full bg-tomorrow-teal-soft/80 shadow-[0_0_7px_rgba(104,232,224,0.38)] transition-[height,opacity] duration-300 sm:w-[3px]",
                    active && !reducedMotion && "animate-pulse",
                    state === "offers" && index % 7 === 0 && "bg-tomorrow-gold-soft/85 shadow-[0_0_7px_rgba(221,184,92,0.34)]",
                  )}
                  style={{
                    height: `${barHeight}px`,
                    opacity: 0.48 + visualLevel * 0.48,
                    animationDuration: `${1.05 + (index % 5) * 0.13}s`,
                    animationDelay: `${(index % 7) * -0.08}s`,
                  }}
                />
              );
            })}
          </div>
        </div>
      </div>
    </figure>
  );
}
