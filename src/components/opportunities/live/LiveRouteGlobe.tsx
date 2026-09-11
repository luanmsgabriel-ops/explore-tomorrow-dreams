import { memo, useEffect, useRef, useState } from "react";
import { LoaderCircle, Mic, MicOff, Navigation } from "lucide-react";

import type { LiveGlobeRoute } from "@/lib/liveRoute";
import { liveRouteSummary } from "@/lib/liveRoute";
import { cn } from "@/lib/utils";
import { LiveWaveBackdrop } from "./LiveWaveBackdrop";
import { resolveGlobeVisualLevel } from "./liveVisualLevel";

export type TomorrowLiveState = "idle" | "listening" | "thinking" | "speaking" | "offers";
export type LiveGlobeMicrophoneState = "idle" | "connecting" | "active" | "muted";

interface LiveRouteGlobeProps {
  state: TomorrowLiveState;
  routes: LiveGlobeRoute[];
  audioLevel?: number;
  reducedMotion?: boolean;
  lowPerformance?: boolean;
  className?: string;
  microphoneState?: LiveGlobeMicrophoneState;
  onMicrophoneClick?: () => void;
}

type StateStyle = {
  label: string;
  glow: string;
  rotation: number;
  pulse: number;
  baseline: number;
};

type ThreeModule = typeof import("three");

type GlobeRuntime = {
  THREE: ThreeModule;
  renderer: import("three").WebGLRenderer;
  camera: import("three").PerspectiveCamera;
  scene: import("three").Scene;
  globeGroup: import("three").Group;
  routeLayer: import("three").Group | null;
  pointMaterial: import("three").PointsMaterial;
  sphereMaterial: import("three").MeshPhongMaterial;
};

const stateStyle: Record<TomorrowLiveState, StateStyle> = {
  idle: {
    label: "Aguardando",
    glow: "rgba(213,175,72,0.22)",
    rotation: 0.00058,
    pulse: 0.004,
    baseline: 0.14,
  },
  listening: {
    label: "Ouvindo...",
    glow: "rgba(104,232,224,0.32)",
    rotation: 0.00115,
    pulse: 0.011,
    baseline: 0.7,
  },
  thinking: {
    label: "Pensando...",
    glow: "rgba(225,193,103,0.28)",
    rotation: 0.00078,
    pulse: 0.006,
    baseline: 0.32,
  },
  speaking: {
    label: "Falando...",
    glow: "rgba(231,198,109,0.4)",
    rotation: 0.00132,
    pulse: 0.013,
    baseline: 0.86,
  },
  offers: {
    label: "Ofertas",
    glow: "rgba(239,210,131,0.34)",
    rotation: 0.00072,
    pulse: 0.006,
    baseline: 0.45,
  },
};

const GLOBE_RADIUS = 100;
const GLOBE_CYAN = "#68e8e0";
const GLOBE_GOLD = "#ddb85c";
const ROUTE_COLORS = [GLOBE_GOLD, GLOBE_CYAN, "#a4ddd8"] as const;
const waveformBars = [12, 22, 10, 30, 44, 18, 36, 14, 50, 24, 38, 16, 54, 28, 14, 40, 58, 22, 45, 17, 34, 12, 48, 20, 36, 15];
const waveformLeft = waveformBars.slice(0, waveformBars.length / 2);
const waveformRight = waveformBars.slice(waveformBars.length / 2).reverse();

function supportsWebGL() {
  if (typeof window === "undefined" || typeof document === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

function waveformHeight(height: number, index: number, level: number) {
  const variation = 0.84 + ((index * 7) % 5) * 0.07;
  return Math.max(4, height * (0.28 + level * 0.86) * variation);
}

function responsiveCameraDistance(width: number) {
  if (width < 480) return 355;
  if (width < 640) return 342;
  if (width < 900) return 330;
  return 318;
}

function disposeObject(object: import("three").Object3D) {
  object.traverse((child) => {
    const disposable = child as import("three").Object3D & {
      geometry?: import("three").BufferGeometry;
      material?: import("three").Material | import("three").Material[];
    };
    disposable.geometry?.dispose();
    if (Array.isArray(disposable.material)) disposable.material.forEach((material) => material.dispose());
    else disposable.material?.dispose();
  });
}

function latLngToVector(THREE: ThreeModule, lat: number, lng: number, radius = GLOBE_RADIUS) {
  const phi = THREE.MathUtils.degToRad(90 - lat);
  const theta = THREE.MathUtils.degToRad(lng + 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  );
}

function greatCirclePoints(
  THREE: ThreeModule,
  route: LiveGlobeRoute,
  segments: number,
) {
  const start = latLngToVector(THREE, route.origin.lat, route.origin.lng, 1).normalize();
  const end = latLngToVector(THREE, route.destination.lat, route.destination.lng, 1).normalize();
  const dot = THREE.MathUtils.clamp(start.dot(end), -1, 1);
  const angle = Math.acos(dot);
  const sinAngle = Math.sin(angle);

  return Array.from({ length: segments + 1 }, (_, index) => {
    const t = index / segments;
    let vector: import("three").Vector3;
    if (sinAngle < 0.00001) {
      vector = start.clone().lerp(end, t).normalize();
    } else {
      const firstWeight = Math.sin((1 - t) * angle) / sinAngle;
      const secondWeight = Math.sin(t * angle) / sinAngle;
      vector = start.clone().multiplyScalar(firstWeight).add(end.clone().multiplyScalar(secondWeight)).normalize();
    }
    const elevation = 1.018 + Math.sin(Math.PI * t) * (0.11 + Math.min(0.09, angle / Math.PI * 0.09));
    return vector.multiplyScalar(GLOBE_RADIUS * elevation);
  });
}

function endpointMarker(
  THREE: ThreeModule,
  point: LiveGlobeRoute["origin"],
  color: string,
  lowPerformance: boolean,
) {
  const group = new THREE.Group();
  const normal = latLngToVector(THREE, point.lat, point.lng, 1).normalize();
  const position = normal.clone().multiplyScalar(GLOBE_RADIUS * 1.022);
  const dot = new THREE.Mesh(
    new THREE.SphereGeometry(lowPerformance ? 1.15 : 1.35, lowPerformance ? 10 : 16, lowPerformance ? 8 : 12),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.95, toneMapped: false }),
  );
  dot.position.copy(position);
  group.add(dot);

  const ring = new THREE.Mesh(
    new THREE.RingGeometry(2.2, 2.75, lowPerformance ? 24 : 40),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.72, side: THREE.DoubleSide, depthWrite: false, toneMapped: false }),
  );
  ring.position.copy(normal.clone().multiplyScalar(GLOBE_RADIUS * 1.026));
  ring.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
  group.add(ring);

  return group;
}

function createRouteLayer(
  THREE: ThreeModule,
  routes: LiveGlobeRoute[],
  lowPerformance: boolean,
) {
  const layer = new THREE.Group();
  layer.name = "tomorrow-live-real-routes";

  routes.slice(0, 3).forEach((route, index) => {
    const color = ROUTE_COLORS[index % ROUTE_COLORS.length];
    const curve = new THREE.CatmullRomCurve3(greatCirclePoints(THREE, route, lowPerformance ? 30 : 52));
    const glow = new THREE.Mesh(
      new THREE.TubeGeometry(curve, lowPerformance ? 36 : 64, lowPerformance ? 0.38 : 0.48, 6, false),
      new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: index === 0 ? 0.22 : 0.12,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      }),
    );
    const core = new THREE.Mesh(
      new THREE.TubeGeometry(curve, lowPerformance ? 36 : 64, lowPerformance ? 0.14 : 0.19, 5, false),
      new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: index === 0 ? 0.98 : 0.72,
        depthWrite: false,
        toneMapped: false,
      }),
    );
    layer.add(glow, core);
    layer.add(endpointMarker(THREE, route.origin, GLOBE_CYAN, lowPerformance));
    layer.add(endpointMarker(THREE, route.destination, color, lowPerformance));
  });

  return layer;
}

function replaceRoutes(runtime: GlobeRuntime, routes: LiveGlobeRoute[], lowPerformance: boolean) {
  if (runtime.routeLayer) {
    runtime.globeGroup.remove(runtime.routeLayer);
    disposeObject(runtime.routeLayer);
  }
  runtime.routeLayer = routes.length ? createRouteLayer(runtime.THREE, routes, lowPerformance) : null;
  if (runtime.routeLayer) runtime.globeGroup.add(runtime.routeLayer);
}

function StaticGlobeFallback({ state, routes }: { state: TomorrowLiveState; routes: LiveGlobeRoute[] }) {
  const style = stateStyle[state];
  return (
    <div className="relative mx-auto flex size-[15.5rem] max-w-[64vw] items-center justify-center sm:size-[23rem] lg:size-[27rem]">
      <div className="absolute -inset-[5%] rounded-full blur-3xl" style={{ background: `radial-gradient(circle, ${style.glow}, transparent 68%)` }} />
      <div className="relative size-[86%] overflow-hidden rounded-full border border-tomorrow-gold/55 bg-[radial-gradient(circle_at_30%_22%,rgba(104,232,224,0.22),transparent_27%),radial-gradient(circle_at_56%_55%,#07535a_0%,#052d32_54%,#02090b_100%)] shadow-[0_0_58px_rgba(221,184,92,0.24),inset_-35px_-25px_70px_rgba(0,0,0,0.82)]">
        <div className="absolute inset-[4%] rounded-full opacity-70 [background-image:radial-gradient(circle,rgba(104,232,224,0.82)_0_1px,transparent_1.25px)] [background-size:8px_8px] [mask-image:radial-gradient(circle,black_0_72%,transparent_91%)]" />
        <div className="absolute inset-0 rounded-full border border-tomorrow-teal/20 [background-image:linear-gradient(rgba(104,232,224,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(104,232,224,0.08)_1px,transparent_1px)] [background-size:28px_28px] [mask-image:radial-gradient(circle,black_0_70%,transparent_91%)]" />
        {routes.length ? <div className="absolute left-[18%] top-[48%] h-px w-[64%] -rotate-[18deg] bg-gradient-to-r from-tomorrow-teal-soft via-tomorrow-gold-soft to-tomorrow-teal-soft shadow-[0_0_12px_rgba(221,184,92,0.85)]" /> : null}
      </div>
    </div>
  );
}

function LiveRouteGlobeComponent({
  state,
  routes,
  audioLevel,
  reducedMotion = false,
  lowPerformance = false,
  className,
  microphoneState = "idle",
  onMicrophoneClick,
}: LiveRouteGlobeProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const runtimeRef = useRef<GlobeRuntime | null>(null);
  const routesRef = useRef(routes);
  const stateRef = useRef(state);
  const levelRef = useRef(0);
  const [rendererState, setRendererState] = useState<"loading" | "ready" | "fallback">("loading");
  const style = stateStyle[state];
  const visualLevel = resolveGlobeVisualLevel(state, audioLevel, style.baseline);
  stateRef.current = state;
  levelRef.current = visualLevel;
  routesRef.current = routes;

  useEffect(() => {
    if (runtimeRef.current) replaceRoutes(runtimeRef.current, routes, lowPerformance);
  }, [lowPerformance, routes]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || !supportsWebGL()) {
      setRendererState("fallback");
      return;
    }

    let disposed = false;
    let frame = 0;
    let resizeObserver: ResizeObserver | null = null;
    let intersectionObserver: IntersectionObserver | null = null;
    let visible = true;
    let onContextLost: ((event: Event) => void) | null = null;

    const start = async () => {
      try {
        const THREE = await import("three");
        if (disposed) return;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 1200);
        camera.position.set(0, 0, 318);
        const renderer = new THREE.WebGLRenderer({
          alpha: true,
          antialias: !lowPerformance,
          powerPreference: lowPerformance ? "low-power" : "high-performance",
        });
        renderer.setClearColor(0x000000, 0);
        renderer.setPixelRatio(Math.min(lowPerformance ? 1.15 : 1.75, window.devicePixelRatio || 1));
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1;
        renderer.domElement.className = "absolute inset-0 size-full";
        renderer.domElement.setAttribute("aria-hidden", "true");
        host.replaceChildren(renderer.domElement);

        const globeGroup = new THREE.Group();
        globeGroup.rotation.set(0.05, 0.82, 0);
        scene.add(globeGroup);

        const sphereMaterial = new THREE.MeshPhongMaterial({
          color: "#07535a",
          emissive: "#063940",
          emissiveIntensity: 0.52,
          shininess: 14,
          specular: "#b9923e",
          transparent: true,
          opacity: 0.91,
        });
        const sphere = new THREE.Mesh(
          new THREE.SphereGeometry(GLOBE_RADIUS, lowPerformance ? 32 : 52, lowPerformance ? 22 : 36),
          sphereMaterial,
        );
        globeGroup.add(sphere);

        const wireGeometry = new THREE.WireframeGeometry(
          new THREE.SphereGeometry(GLOBE_RADIUS * 1.008, lowPerformance ? 18 : 28, lowPerformance ? 12 : 18),
        );
        const wire = new THREE.LineSegments(
          wireGeometry,
          new THREE.LineBasicMaterial({ color: GLOBE_CYAN, transparent: true, opacity: 0.085, depthWrite: false }),
        );
        globeGroup.add(wire);

        const positions: number[] = [];
        const colors: number[] = [];
        const particleCount = lowPerformance ? 460 : 920;
        const teal = new THREE.Color(GLOBE_CYAN);
        const gold = new THREE.Color(GLOBE_GOLD);
        for (let index = 0; index < particleCount; index += 1) {
          const y = 1 - (index / Math.max(1, particleCount - 1)) * 2;
          const radius = Math.sqrt(Math.max(0, 1 - y * y));
          const theta = Math.PI * (3 - Math.sqrt(5)) * index;
          const point = new THREE.Vector3(
            Math.cos(theta) * radius,
            y,
            Math.sin(theta) * radius,
          ).multiplyScalar(GLOBE_RADIUS * 1.014);
          positions.push(point.x, point.y, point.z);
          const color = index % 7 === 0 || index % 13 === 0 ? gold : teal;
          colors.push(color.r, color.g, color.b);
        }
        const pointGeometry = new THREE.BufferGeometry();
        pointGeometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
        pointGeometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
        const pointMaterial = new THREE.PointsMaterial({
          size: lowPerformance ? 0.72 : 0.88,
          vertexColors: true,
          transparent: true,
          opacity: 0.78,
          sizeAttenuation: true,
          depthWrite: false,
        });
        globeGroup.add(new THREE.Points(pointGeometry, pointMaterial));

        const atmosphere = new THREE.Mesh(
          new THREE.SphereGeometry(GLOBE_RADIUS * 1.065, lowPerformance ? 24 : 40, lowPerformance ? 16 : 28),
          new THREE.MeshBasicMaterial({ color: GLOBE_CYAN, transparent: true, opacity: 0.045, side: THREE.BackSide, depthWrite: false }),
        );
        globeGroup.add(atmosphere);

        scene.add(new THREE.AmbientLight(0x79c8c2, 0.48));
        const cyanLight = new THREE.DirectionalLight(0x7efff6, 0.76);
        cyanLight.position.set(-220, 150, 30);
        scene.add(cyanLight);
        const goldLight = new THREE.DirectionalLight(0xe2bd61, 0.52);
        goldLight.position.set(180, -90, -40);
        scene.add(goldLight);

        const runtime: GlobeRuntime = {
          THREE,
          renderer,
          camera,
          scene,
          globeGroup,
          routeLayer: null,
          pointMaterial,
          sphereMaterial,
        };
        runtimeRef.current = runtime;
        replaceRoutes(runtime, routesRef.current, lowPerformance);

        const resize = () => {
          if (disposed) return;
          const rect = host.getBoundingClientRect();
          const width = Math.max(280, rect.width || 560);
          const height = Math.max(290, rect.height || width * 0.78);
          renderer.setSize(width, height, false);
          camera.position.z = responsiveCameraDistance(width);
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
        };
        resizeObserver = new ResizeObserver(resize);
        resizeObserver.observe(host);
        resize();

        if (typeof IntersectionObserver !== "undefined") {
          intersectionObserver = new IntersectionObserver(([entry]) => {
            visible = entry?.isIntersecting ?? true;
          }, { rootMargin: "120px" });
          intersectionObserver.observe(host);
        }

        onContextLost = (event) => {
          event.preventDefault();
          if (!disposed) setRendererState("fallback");
        };
        renderer.domElement.addEventListener("webglcontextlost", onContextLost);

        const startedAt = performance.now();
        let previousAt = startedAt;
        let smoothLevel = levelRef.current;
        let smoothRotation = stateStyle[stateRef.current].rotation;
        let smoothPulse = stateStyle[stateRef.current].pulse;

        const animate = (now: number) => {
          if (disposed) return;
          const delta = Math.min(0.05, Math.max(0.001, (now - previousAt) / 1000));
          previousAt = now;
          const currentStyle = stateStyle[stateRef.current];
          const blend = 1 - Math.exp(-delta * 7.5);
          smoothLevel += (levelRef.current - smoothLevel) * blend;
          smoothRotation += (currentStyle.rotation - smoothRotation) * blend;
          smoothPulse += (currentStyle.pulse - smoothPulse) * blend;

          if (!reducedMotion) {
            globeGroup.rotation.y += smoothRotation * (0.82 + smoothLevel * 0.4);
            globeGroup.rotation.x = 0.05 + Math.sin((now - startedAt) / 2400) * 0.012;
            const scale = 1 + Math.sin((now - startedAt) / 1000 * (stateRef.current === "speaking" ? 3.6 : 1.8)) * smoothPulse * (0.35 + smoothLevel);
            globeGroup.scale.setScalar(scale);
          }
          pointMaterial.opacity = 0.66 + smoothLevel * 0.28;
          pointMaterial.size = (lowPerformance ? 0.7 : 0.86) + smoothLevel * (lowPerformance ? 0.22 : 0.38);
          sphereMaterial.emissiveIntensity = 0.48 + smoothLevel * 0.24;
          goldLight.intensity = stateRef.current === "offers" ? 0.74 : 0.48 + smoothLevel * 0.18;

          if (visible && document.visibilityState !== "hidden") renderer.render(scene, camera);
          frame = requestAnimationFrame(animate);
        };

        setRendererState("ready");
        frame = requestAnimationFrame(animate);
      } catch {
        if (!disposed) setRendererState("fallback");
      }
    };

    setRendererState("loading");
    void start();

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      resizeObserver?.disconnect();
      intersectionObserver?.disconnect();
      const runtime = runtimeRef.current;
      if (runtime) {
        if (onContextLost) runtime.renderer.domElement.removeEventListener("webglcontextlost", onContextLost);
        disposeObject(runtime.scene);
        runtime.renderer.dispose();
        runtime.renderer.forceContextLoss();
      }
      runtimeRef.current = null;
      host.replaceChildren();
    };
  }, [lowPerformance, reducedMotion]);

  const activeWaveform = state === "listening" || state === "speaking";
  const microphoneLabel = microphoneState === "connecting"
    ? "Conectando conversa por voz pelo microfone do planeta"
    : microphoneState === "active"
      ? "Pausar microfone pelo controle do planeta"
      : microphoneState === "muted"
        ? "Reativar microfone pelo controle do planeta"
        : "Iniciar conversa por voz pelo microfone do planeta";
  const routeSummary = liveRouteSummary(routes);

  return (
    <figure
      className={cn("relative mx-auto w-full max-w-[74rem] overflow-visible", className)}
      aria-label={`Globo visual do Tomorrow Live — ${style.label.replace("...", "")}${routeSummary ? ` — rota ${routeSummary}` : ""}`}
      data-live-state={state}
      data-renderer={rendererState}
      data-route-count={routes.length}
      data-audio-level={visualLevel.toFixed(2)}
      data-visual-engine="webgl-semantic-route-globe"
    >
      <div className="relative min-h-[25rem] sm:min-h-[34rem] lg:min-h-[40rem]">
        <LiveWaveBackdrop
          state={state}
          audioLevel={audioLevel}
          reducedMotion={reducedMotion}
          lowPerformance={lowPerformance}
          className="pointer-events-none absolute -inset-x-[34%] top-[18%] bottom-[27%] z-0 opacity-100 [mask-image:linear-gradient(to_right,transparent,black_5%,black_95%,transparent)]"
        />

        <div
          className="pointer-events-none absolute inset-x-[17%] top-[7%] bottom-[18%] z-[1] rounded-full blur-[88px] transition-opacity duration-700 ease-out"
          style={{
            background: `radial-gradient(circle, ${style.glow} 0%, rgba(3,18,22,0.07) 48%, rgba(3,18,22,0) 72%)`,
            opacity: 0.56 + visualLevel * 0.28,
          }}
          aria-hidden="true"
        />

        {routeSummary ? (
          <div className="pointer-events-none absolute left-1/2 top-[4%] z-20 flex max-w-[88%] -translate-x-1/2 items-center gap-2 rounded-full border border-tomorrow-gold/25 bg-[#061b1e]/76 px-3 py-1.5 text-[0.62rem] font-bold uppercase tracking-[0.13em] text-tomorrow-gold-soft backdrop-blur-md sm:text-[0.68rem]">
            <Navigation className="size-3.5 shrink-0 text-tomorrow-teal-soft" aria-hidden="true" />
            <span className="truncate">{routeSummary}</span>
          </div>
        ) : null}

        <div ref={hostRef} className="absolute inset-x-[4%] top-[1%] bottom-[13%] z-10 sm:inset-x-[2%] lg:inset-x-0" aria-hidden="true" />

        {rendererState !== "ready" ? (
          <div className="absolute inset-x-0 top-[7%] bottom-[20%] z-10 flex items-center justify-center">
            <StaticGlobeFallback state={state} routes={routes} />
          </div>
        ) : null}

        <div className="pointer-events-none absolute inset-x-[12%] bottom-[11%] z-[12] h-24 sm:inset-x-[17%]" aria-hidden="true">
          <div className="absolute inset-x-[2%] bottom-2 h-11 rounded-[50%] border border-tomorrow-gold/24 shadow-[0_0_28px_rgba(212,175,55,0.16)]" />
          <div className="absolute inset-x-[10%] bottom-4 h-9 rounded-[50%] border border-tomorrow-teal/32 bg-tomorrow-teal/5 shadow-[0_0_32px_rgba(76,225,216,0.17)]" />
          <div className="absolute inset-x-[21%] bottom-7 h-6 rounded-[50%] border border-tomorrow-gold/48 shadow-[0_0_22px_rgba(212,175,55,0.22)]" />
          <div className="absolute inset-x-[31%] bottom-9 h-4 rounded-[50%] border border-tomorrow-gold/34" />
        </div>

        <div className="absolute inset-x-0 bottom-0 z-20 flex flex-col items-center">
          <p className="pointer-events-none text-xs font-bold uppercase tracking-[0.32em] text-tomorrow-gold-soft drop-shadow-[0_0_8px_rgba(221,184,92,0.48)] sm:text-sm" aria-hidden="true">
            {style.label}
          </p>
          <div className="mt-2 flex h-14 items-center justify-center gap-[3px] sm:h-16 sm:gap-1">
            <div className="pointer-events-none flex h-full items-center gap-[3px] sm:gap-1" aria-hidden="true">
              {waveformLeft.map((height, index) => (
                <span
                  key={`left-${index}-${height}`}
                  className={cn(
                    "block w-[2px] rounded-full bg-tomorrow-teal-soft/85 shadow-[0_0_7px_rgba(104,232,224,0.45)] transition-[height,opacity] duration-500 ease-out sm:w-[3px]",
                    index % 4 === 1 && "bg-tomorrow-gold-soft/90 shadow-[0_0_8px_rgba(221,184,92,0.5)]",
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

            <button
              type="button"
              aria-label={microphoneLabel}
              aria-pressed={microphoneState === "muted"}
              disabled={!onMicrophoneClick || microphoneState === "connecting"}
              onClick={onMicrophoneClick}
              className={cn(
                "opportunity-focus mx-2 flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full border border-tomorrow-gold/55 bg-[#062d32]/90 text-tomorrow-gold-soft shadow-[0_0_22px_rgba(221,184,92,0.24),inset_0_0_16px_rgba(83,238,229,0.08)] transition-[transform,border-color,box-shadow,opacity] duration-300 ease-out active:scale-95 disabled:cursor-wait disabled:opacity-70 sm:mx-3 sm:size-14 motion-safe:hover:scale-105 motion-safe:hover:border-tomorrow-gold-soft/90",
                activeWaveform && "border-tomorrow-teal-soft/80 text-tomorrow-teal-soft shadow-[0_0_34px_rgba(83,238,229,0.38),0_0_20px_rgba(221,184,92,0.2),inset_0_0_20px_rgba(83,238,229,0.12)]",
                activeWaveform && !reducedMotion && "animate-pulse",
                microphoneState === "muted" && "border-tomorrow-gold/70 text-tomorrow-gold-soft shadow-[0_0_26px_rgba(212,175,55,0.32)]",
              )}
            >
              {microphoneState === "connecting" ? (
                <LoaderCircle className="size-5 animate-spin sm:size-6" aria-hidden="true" />
              ) : microphoneState === "muted" ? (
                <MicOff className="size-5 sm:size-6" aria-hidden="true" />
              ) : (
                <Mic className="size-5 sm:size-6" aria-hidden="true" />
              )}
            </button>

            <div className="pointer-events-none flex h-full items-center gap-[3px] sm:gap-1" aria-hidden="true">
              {waveformRight.map((height, index) => (
                <span
                  key={`right-${index}-${height}`}
                  className={cn(
                    "block w-[2px] rounded-full bg-tomorrow-teal-soft/85 shadow-[0_0_7px_rgba(104,232,224,0.45)] transition-[height,opacity] duration-500 ease-out sm:w-[3px]",
                    index % 4 === 2 && "bg-tomorrow-gold-soft/90 shadow-[0_0_8px_rgba(221,184,92,0.5)]",
                    activeWaveform && !reducedMotion && "animate-pulse",
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

export const LiveRouteGlobe = memo(LiveRouteGlobeComponent);
