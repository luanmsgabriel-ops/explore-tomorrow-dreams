import { useEffect, useMemo, useRef, useState } from "react";
import { Mic } from "lucide-react";

import { cn } from "@/lib/utils";
import { createGlobeVisualEffects } from "./liveGlobeEffects";
import { resolveGlobeVisualLevel } from "./liveVisualLevel";
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
    glow: "rgba(72,214,207,0.22)",
    rotation: 0.00058,
    pulse: 0.004,
    baseline: 0.14,
  },
  listening: {
    label: "Ouvindo...",
    cyan: "#7df7ef",
    gold: "#e6c778",
    glow: "rgba(84,239,230,0.38)",
    rotation: 0.00125,
    pulse: 0.011,
    baseline: 0.7,
  },
  thinking: {
    label: "Pensando...",
    cyan: "#72e8e2",
    gold: "#efd384",
    glow: "rgba(72,208,204,0.24)",
    rotation: 0.00078,
    pulse: 0.006,
    baseline: 0.32,
  },
  speaking: {
    label: "Falando...",
    cyan: "#7cf2eb",
    gold: "#e7c66d",
    glow: "rgba(79,225,216,0.42)",
    rotation: 0.00142,
    pulse: 0.013,
    baseline: 0.86,
  },
  offers: {
    label: "Ofertas",
    cyan: "#73e9e2",
    gold: "#efd283",
    glow: "rgba(222,188,98,0.25)",
    rotation: 0.00072,
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

const waveformBars = [12, 22, 10, 30, 44, 18, 36, 14, 50, 24, 38, 16, 54, 28, 14, 40, 58, 22, 45, 17, 34, 12, 48, 20, 36, 15];
const waveformLeft = waveformBars.slice(0, waveformBars.length / 2);
const waveformRight = waveformBars.slice(waveformBars.length / 2).reverse();

const GLOBE_CYAN = "#68e8e0";
const GLOBE_GOLD = "#ddb85c";

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
      color: index % 13 === 0 || index % 19 === 0 ? gold : cyan,
      radius: index % 7 === 0 ? 0.2 : 0.12,
      altitude: index % 9 === 0 ? 0.009 : 0.005,
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

function waveformHeight(height: number, index: number, level: number) {
  const variation = 0.84 + ((index * 7) % 5) * 0.07;
  return Math.max(4, height * (0.28 + level * 0.86) * variation);
}

function StaticGlobeFallback({ state }: { state: TomorrowLiveState }) {
  const style = stateStyle[state];

  return (
    <div className="relative mx-auto flex size-[15.5rem] max-w-[64vw] items-center justify-center sm:size-[23rem] lg:size-[27rem]">
      <div
        className="absolute -inset-[5%] rounded-full blur-3xl"
        style={{ background: `radial-gradient(circle, ${style.glow}, transparent 68%)` }}
      />
      <div
        className="relative size-[86%] overflow-hidden rounded-full border border-cyan-200/70 shadow-[0_0_58px_rgba(89,234,226,0.3),inset_-35px_-25px_70px_rgba(0,0,0,0.82)]"
        style={{
          backgroundImage: `linear-gradient(rgba(2,27,31,.28),rgba(2,27,31,.34)),url(${EARTH_TEXTURE})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_30%_24%,rgba(103,246,237,0.14),transparent_28%),radial-gradient(circle_at_50%_50%,transparent_54%,rgba(2,10,12,0.62)_100%)]" />
        <div className="absolute inset-[5%] rounded-full opacity-45 [background-image:radial-gradient(circle,rgba(111,247,239,0.7)_0_1px,transparent_1.2px)] [background-size:8px_8px] [mask-image:radial-gradient(circle,black_0_72%,transparent_90%)]" />
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
  const visualLevel = resolveGlobeVisualLevel(state, audioLevel, style.baseline);
  const stateRef = useRef(state);
  stateRef.current = state;
  const audioLevelRef = useRef(visualLevel);
  audioLevelRef.current = visualLevel;

  const particleCount = lowPerformance ? 110 : 230;
  const surfacePoints = useMemo(
    () => buildSurfacePoints(particleCount, GLOBE_CYAN, GLOBE_GOLD),
    [particleCount],
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
    let visualEffects: ReturnType<typeof createGlobeVisualEffects> | null = null;
    let baseScale = 1.02;

    setRendererState("loading");

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
        renderer.setPixelRatio(Math.min(lowPerformance ? 1.2 : 1.8, window.devicePixelRatio || 1));
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 0.94;
        renderer.domElement.className = "absolute inset-0 size-full";
        renderer.domElement.setAttribute("aria-hidden", "true");
        host.replaceChildren(renderer.domElement);

        const Globe = new ThreeGlobe({ waitForGlobeReady: true, animateIn: false })
          .globeImageUrl(EARTH_TEXTURE)
          .bumpImageUrl(EARTH_BUMP)
          .showAtmosphere(false)
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
          .arcColor(() => [GLOBE_CYAN, GLOBE_GOLD])
          .arcAltitude(0.25)
          .arcStroke(0.38)
          .arcDashLength(0.2)
          .arcDashGap(0.08)
          .arcDashAnimateTime(reducedMotion ? 0 : stateRef.current === "listening" || stateRef.current === "speaking" ? 760 : 1450)
          .ringsData(routeRings)
          .ringLat("lat")
          .ringLng("lng")
          .ringColor((ring: GlobeRing) => (ring.color === "gold" ? [GLOBE_GOLD, "rgba(229,199,112,0)"] : [GLOBE_CYAN, "rgba(102,232,224,0)"]))
          .ringMaxRadius(stateRef.current === "listening" || stateRef.current === "speaking" ? 7.2 : 4.8)
          .ringPropagationSpeed(stateRef.current === "listening" || stateRef.current === "speaking" ? 2.8 : 1.45)
          .ringRepeatPeriod(reducedMotion ? 0 : stateRef.current === "listening" || stateRef.current === "speaking" ? 620 : 1120);

        globeObject = Globe;
        globeObject.rotation.y = 0.96;
        globeObject.rotation.x = 0.04;
        globeObject.scale.setScalar(baseScale);
        scene.add(globeObject);

        const globeMaterial = Globe.globeMaterial() as import("three").MeshPhongMaterial;
        globeMaterial.color = new THREE.Color("#07535a");
        globeMaterial.emissive = new THREE.Color("#063940");
        globeMaterial.emissiveIntensity = 0.58;
        globeMaterial.shininess = 11;
        globeMaterial.specular = new THREE.Color("#2a9a9d");

        scene.add(new THREE.AmbientLight(0x6bb9b6, 0.52));

        const cyanRim = new THREE.DirectionalLight(0x7efff6, 0.94);
        cyanRim.position.set(-230, 160, 15);
        scene.add(cyanRim);

        const goldRim = new THREE.DirectionalLight(0xd8b85b, stateRef.current === "offers" ? 0.52 : 0.24);
        goldRim.position.set(180, -90, -45);
        scene.add(goldRim);

        visualEffects = createGlobeVisualEffects(THREE, Globe.getGlobeRadius(), {
          cyan: GLOBE_CYAN,
          gold: GLOBE_GOLD,
          lowPerformance,
        });
        globeObject.add(visualEffects.group);

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
              .polygonStrokeColor(() => "rgba(121,255,246,0.84)")
              .polygonsTransitionDuration(0)
              .hexPolygonsData(features)
              .hexPolygonResolution(lowPerformance ? 1 : 2)
              .hexPolygonMargin(lowPerformance ? 0.52 : 0.38)
              .hexPolygonUseDots(true)
              .hexPolygonDotResolution(lowPerformance ? 4 : 6)
              .hexPolygonAltitude(0.009)
              .hexPolygonColor(() => GLOBE_CYAN)
              .hexPolygonsTransitionDuration(0);
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
          Globe.rendererSize(new THREE.Vector2(width, height));
          Globe.setPointOfView(camera);
        };

        resizeObserver = new ResizeObserver(resize);
        resizeObserver.observe(host);
        resize();

        const startedAt = performance.now();
        let appliedState = stateRef.current;

        const applyStateDynamics = (nextState: TomorrowLiveState) => {
          const activeAudioState = nextState === "listening" || nextState === "speaking";
          Globe.arcDashAnimateTime(reducedMotion ? 0 : activeAudioState ? 760 : 1450)
            .ringMaxRadius(activeAudioState ? 7.2 : 4.8)
            .ringPropagationSpeed(activeAudioState ? 2.8 : 1.45)
            .ringRepeatPeriod(reducedMotion ? 0 : activeAudioState ? 620 : 1120);
          goldRim.intensity = nextState === "offers" ? 0.52 : nextState === "speaking" ? 0.34 : 0.24;
        };

        const animate = (now: number) => {
          if (disposed || !renderer || !globeObject) return;
          const elapsed = (now - startedAt) / 1000;
          const currentLevel = audioLevelRef.current;
          const currentState = stateRef.current;
          const currentStyle = stateStyle[currentState];

          if (appliedState !== currentState) {
            appliedState = currentState;
            applyStateDynamics(currentState);
          }

          if (!reducedMotion) {
            globeObject.rotation.y += currentStyle.rotation * (0.82 + currentLevel * 0.38);
            const reactivePulse = currentStyle.pulse * (0.34 + currentLevel * 0.94);
            const pulseSpeed = currentState === "speaking" ? 3.8 : currentState === "listening" ? 3 : currentState === "thinking" ? 1.3 : 1.65;
            globeObject.scale.setScalar(baseScale + Math.sin(elapsed * pulseSpeed) * reactivePulse);
          }

          visualEffects?.update(elapsed, currentLevel, currentState === "offers", reducedMotion, currentState === "speaking");
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
      visualEffects?.dispose();
      renderer?.dispose();
      if (host) host.replaceChildren();
    };
  }, [lowPerformance, reducedMotion, surfacePoints]);

  const activeWaveform = state === "listening" || state === "speaking";

  return (
    <figure
      className={cn("relative mx-auto w-full max-w-[66rem] overflow-visible", className)}
      aria-label={`Globo visual do Tomorrow Live — ${style.label.replace("...", "")}`}
      data-live-state={state}
      data-renderer={rendererState}
      data-audio-ready="true"
      data-audio-level={visualLevel.toFixed(2)}
      data-visual-engine="webgl-fresnel-dotted-land"
    >
      <div className="relative min-h-[25rem] sm:min-h-[33rem] lg:min-h-[38rem]">
        <LiveWaveBackdrop
          state={state}
          audioLevel={audioLevel}
          reducedMotion={reducedMotion}
          lowPerformance={lowPerformance}
          className="pointer-events-none absolute -inset-x-[31%] top-[19%] bottom-[28%] z-0 opacity-100 [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)]"
        />

        <div
          className="pointer-events-none absolute inset-x-[19%] top-[9%] bottom-[19%] z-[1] rounded-full blur-[82px] transition-opacity duration-500"
          style={{
            background: `radial-gradient(circle, ${style.glow} 0%, rgba(3,18,22,0.06) 48%, rgba(3,18,22,0) 72%)`,
            opacity: 0.5 + visualLevel * 0.28,
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

        <div className="pointer-events-none absolute inset-x-[12%] bottom-[11%] z-[12] h-24 sm:inset-x-[17%]" aria-hidden="true">
          <div className="absolute inset-x-[2%] bottom-2 h-11 rounded-[50%] border border-tomorrow-teal/20 shadow-[0_0_28px_rgba(76,225,216,0.14)]" />
          <div className="absolute inset-x-[10%] bottom-4 h-9 rounded-[50%] border border-tomorrow-teal/38 bg-tomorrow-teal/5 shadow-[0_0_32px_rgba(76,225,216,0.2)]" />
          <div className="absolute inset-x-[21%] bottom-7 h-6 rounded-[50%] border border-tomorrow-gold/32 bg-transparent shadow-[0_0_18px_rgba(212,175,55,0.14)]" />
          <div className="absolute inset-x-[31%] bottom-9 h-4 rounded-[50%] border border-tomorrow-teal/35" />
          <div className="absolute left-1/2 bottom-1 h-16 w-px -translate-x-1/2 bg-gradient-to-t from-tomorrow-teal/48 to-transparent" />
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex flex-col items-center" aria-hidden="true">
          <p className="text-xs font-bold uppercase tracking-[0.32em] text-tomorrow-teal-soft drop-shadow-[0_0_8px_rgba(104,232,224,0.5)] sm:text-sm">
            {style.label}
          </p>
          <div className="mt-2 flex h-14 items-center justify-center gap-[3px] sm:h-16 sm:gap-1">
            <div className="flex h-full items-center gap-[3px] sm:gap-1">
              {waveformLeft.map((height, index) => (
                <span
                  key={`left-${index}-${height}`}
                  className={cn(
                    "block w-[2px] rounded-full bg-tomorrow-teal-soft/85 shadow-[0_0_7px_rgba(104,232,224,0.45)] transition-[height,opacity] duration-300 sm:w-[3px]",
                    activeWaveform && !reducedMotion && "animate-pulse",
                  )}
                  style={{
                    height: `${waveformHeight(height, index, visualLevel)}px`,
                    opacity: 0.46 + visualLevel * 0.5,
                    animationDuration: `${0.86 + (index % 5) * 0.12}s`,
                    animationDelay: `${(index % 7) * -0.07}s`,
                  }}
                />
              ))}
            </div>

            <span
              className={cn(
                "mx-2 flex size-11 items-center justify-center rounded-full border border-tomorrow-teal/55 bg-[#062d32]/90 text-tomorrow-teal-soft shadow-[0_0_20px_rgba(83,238,229,0.28),inset_0_0_16px_rgba(83,238,229,0.08)] sm:mx-3 sm:size-14",
                activeWaveform && "border-tomorrow-teal-soft/85 shadow-[0_0_34px_rgba(83,238,229,0.48),inset_0_0_20px_rgba(83,238,229,0.12)]",
                activeWaveform && !reducedMotion && "animate-pulse",
              )}
            >
              <Mic className="size-5 sm:size-6" />
            </span>

            <div className="flex h-full items-center gap-[3px] sm:gap-1">
              {waveformRight.map((height, index) => (
                <span
                  key={`right-${index}-${height}`}
                  className={cn(
                    "block w-[2px] rounded-full bg-tomorrow-teal-soft/85 shadow-[0_0_7px_rgba(104,232,224,0.45)] transition-[height,opacity] duration-300 sm:w-[3px]",
                    activeWaveform && !reducedMotion && "animate-pulse",
                    state === "offers" && index % 6 === 0 && "bg-tomorrow-gold-soft/85 shadow-[0_0_7px_rgba(221,184,92,0.38)]",
                  )}
                  style={{
                    height: `${waveformHeight(height, index + waveformLeft.length, visualLevel)}px`,
                    opacity: 0.46 + visualLevel * 0.5,
                    animationDuration: `${0.92 + (index % 5) * 0.11}s`,
                    animationDelay: `${(index % 7) * -0.08}s`,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </figure>
  );
}
