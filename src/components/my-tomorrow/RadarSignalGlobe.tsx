import { useEffect, useRef } from "react";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";

interface RadarSignalGlobeProps {
  signals: number;
  scanning?: boolean;
}

const EARTH_DAY = "https://cdn.jsdelivr.net/npm/three-globe@2.45.2/example/img/earth-blue-marble.jpg";
const EARTH_NIGHT = "https://cdn.jsdelivr.net/npm/three-globe@2.45.2/example/img/earth-night.jpg";
const EARTH_BUMP = "https://cdn.jsdelivr.net/npm/three-globe@2.45.2/example/img/earth-topology.png";

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

const HUD_STARS = [
  [8, 20, 1.0, "cyan"], [11, 72, .8, "gold"], [17, 89, 1.2, "cyan"], [24, 10, .7, "cyan"],
  [31, 94, .9, "gold"], [43, 6, .75, "cyan"], [52, 95, 1.1, "cyan"], [63, 8, .75, "gold"],
  [72, 92, 1.0, "cyan"], [83, 12, .8, "gold"], [90, 78, .7, "cyan"], [94, 35, .9, "cyan"],
] as const;

function supportsWebGL() {
  if (typeof window === "undefined" || typeof document === "undefined") return false;
  if (typeof window.WebGLRenderingContext === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl"));
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

function makeRoute(a: THREE.Vector3, b: THREE.Vector3, lift: number) {
  const mid = a.clone().add(b).multiplyScalar(0.5).normalize().multiplyScalar(lift);
  return new THREE.QuadraticBezierCurve3(a, mid, b);
}

export function RadarSignalGlobe({ signals, scanning = false }: RadarSignalGlobeProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount || !supportsWebGL()) return;

    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    let frame = 0;
    let disposed = false;
    const clock = new THREE.Clock();
    const geometries: THREE.BufferGeometry[] = [];
    const materials: THREE.Material[] = [];
    const textures: THREE.Texture[] = [];
    const routePulses: Array<{ mesh: THREE.Mesh; curve: THREE.QuadraticBezierCurve3; offset: number }> = [];

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(27, 1, 0.1, 100);
    camera.position.set(0, 0.02, 3.62);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.55));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.92;
    mount.appendChild(renderer.domElement);

    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.9, 0.72, 0.66);
    composer.addPass(bloomPass);
    composer.addPass(new OutputPass());

    const world = new THREE.Group();
    world.rotation.x = -0.02;
    world.rotation.y = -0.82;
    scene.add(world);

    const sphereGeometry = new THREE.SphereGeometry(1.08, 112, 112);
    geometries.push(sphereGeometry);
    const fallbackMaterial = new THREE.MeshStandardMaterial({
      color: 0x082e34,
      emissive: 0x03151a,
      emissiveIntensity: 0.3,
      roughness: 0.78,
      metalness: 0.04,
    });
    materials.push(fallbackMaterial);
    const earth = new THREE.Mesh(sphereGeometry, fallbackMaterial);
    world.add(earth);

    const nightGlowGeometry = new THREE.SphereGeometry(1.086, 112, 112);
    geometries.push(nightGlowGeometry);
    const nightGlowMaterial = new THREE.MeshBasicMaterial({
      color: 0xffc969,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    });
    materials.push(nightGlowMaterial);
    const nightGlow = new THREE.Mesh(nightGlowGeometry, nightGlowMaterial);
    world.add(nightGlow);

    const gridGeometry = new THREE.WireframeGeometry(new THREE.SphereGeometry(1.091, 34, 20));
    geometries.push(gridGeometry);
    const gridMaterial = new THREE.LineBasicMaterial({ color: 0x5ce8ef, transparent: true, opacity: 0.075 });
    materials.push(gridMaterial);
    world.add(new THREE.LineSegments(gridGeometry, gridMaterial));

    const atmosphereGeometry = new THREE.SphereGeometry(1.16, 80, 80);
    geometries.push(atmosphereGeometry);
    const atmosphereMaterial = new THREE.ShaderMaterial({
      transparent: true,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
      uniforms: {
        uCyan: { value: new THREE.Color(0x32e4ef) },
        uGold: { value: new THREE.Color(0xffc85f) },
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vWorld;
        void main(){
          vNormal = normalize(normalMatrix * normal);
          vec4 world = modelMatrix * vec4(position, 1.0);
          vWorld = world.xyz;
          gl_Position = projectionMatrix * viewMatrix * world;
        }
      `,
      fragmentShader: `
        uniform vec3 uCyan;
        uniform vec3 uGold;
        varying vec3 vNormal;
        varying vec3 vWorld;
        void main(){
          vec3 V = normalize(cameraPosition - vWorld);
          float fresnel = pow(1.0 - max(dot(vNormal, V), 0.0), 3.1);
          float warm = smoothstep(-0.3, 0.7, vNormal.x * .55 + vNormal.y * .25);
          vec3 color = mix(uCyan, uGold, warm * .22);
          gl_FragColor = vec4(color * 1.55, fresnel * .72);
        }
      `,
    });
    materials.push(atmosphereMaterial);
    world.add(new THREE.Mesh(atmosphereGeometry, atmosphereMaterial));

    const cloudGeometry = new THREE.SphereGeometry(1.10, 72, 72);
    geometries.push(cloudGeometry);
    const cloudMaterial = new THREE.ShaderMaterial({
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
      uniforms: { uTime: { value: 0 } },
      vertexShader: `
        varying vec3 vPos;
        varying vec3 vNormal;
        void main(){
          vPos = position;
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        varying vec3 vPos;
        varying vec3 vNormal;
        float hash(vec3 p){ return fract(sin(dot(p, vec3(127.1,311.7,74.7))) * 43758.5453); }
        float noise(vec3 p){
          vec3 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
          return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);
        }
        void main(){
          vec3 p = normalize(vPos) * 5.2 + vec3(uTime*.018,0.0,-uTime*.011);
          float n = noise(p) * .64 + noise(p*2.1) * .24 + noise(p*4.2) * .12;
          float cloud = smoothstep(.64,.83,n);
          float rim = pow(1.0 - abs(vNormal.z), 2.0);
          gl_FragColor = vec4(vec3(.25,.95,1.0) * (cloud*.42 + rim*.04), cloud*.23);
        }
      `,
    });
    materials.push(cloudMaterial);
    const cloudShell = new THREE.Mesh(cloudGeometry, cloudMaterial);
    world.add(cloudShell);

    const cityGeometry = new THREE.BufferGeometry();
    const cityPositions = new Float32Array(CITY_POINTS.length * 3);
    CITY_POINTS.forEach(([lat, lon], i) => {
      const p = latLonToVector3(lat, lon, 1.105);
      cityPositions[i * 3] = p.x;
      cityPositions[i * 3 + 1] = p.y;
      cityPositions[i * 3 + 2] = p.z;
    });
    cityGeometry.setAttribute("position", new THREE.BufferAttribute(cityPositions, 3));
    geometries.push(cityGeometry);
    const cityMaterial = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
      uniforms: { uPixelRatio: { value: renderer.getPixelRatio() } },
      vertexShader: `
        uniform float uPixelRatio;
        void main(){
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = 7.5 * uPixelRatio * (3.6 / -mv.z);
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: `
        void main(){
          float d = distance(gl_PointCoord, vec2(.5));
          float core = smoothstep(.28,0.0,d);
          float halo = smoothstep(.5,.08,d) * .6;
          gl_FragColor = vec4(vec3(2.9,1.65,.42) * (core + halo), smoothstep(.5,.02,d));
        }
      `,
    });
    materials.push(cityMaterial);
    world.add(new THREE.Points(cityGeometry, cityMaterial));

    ROUTES.forEach(([[lat1, lon1], [lat2, lon2]], index) => {
      const a = latLonToVector3(lat1, lon1, 1.11);
      const b = latLonToVector3(lat2, lon2, 1.11);
      const curve = makeRoute(a, b, 1.36 + index * 0.028);
      const tube = new THREE.TubeGeometry(curve, 72, 0.0036, 5, false);
      geometries.push(tube);
      const routeMaterial = new THREE.MeshBasicMaterial({
        color: index % 2 === 0 ? new THREE.Color().setRGB(2.2, 1.48, .38) : new THREE.Color().setRGB(.35, 2.0, 2.25),
        transparent: true,
        opacity: index % 2 === 0 ? .64 : .46,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      });
      materials.push(routeMaterial);
      world.add(new THREE.Mesh(tube, routeMaterial));

      const pulseGeometry = new THREE.SphereGeometry(0.013, 10, 10);
      geometries.push(pulseGeometry);
      const pulseMaterial = new THREE.MeshBasicMaterial({
        color: new THREE.Color().setRGB(3.2, 2.1, .65),
        transparent: true,
        opacity: .92,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      });
      materials.push(pulseMaterial);
      const pulse = new THREE.Mesh(pulseGeometry, pulseMaterial);
      world.add(pulse);
      routePulses.push({ mesh: pulse, curve, offset: index / ROUTES.length });
    });

    const sweepGeometry = new THREE.PlaneGeometry(2.22, 2.22);
    geometries.push(sweepGeometry);
    const sweepMaterial = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
      uniforms: {
        uTime: { value: 0 },
        uSpeed: { value: scanning ? 2.6 : .72 },
      },
      vertexShader: `varying vec2 vUv; void main(){vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
      fragmentShader: `
        uniform float uTime;
        uniform float uSpeed;
        varying vec2 vUv;
        const float PI = 3.14159265359;
        void main(){
          vec2 p = vUv - .5;
          float r = length(p) * 2.0;
          if(r > .99 || r < .17) discard;
          float angle = atan(p.y,p.x);
          float head = mod(uTime*uSpeed, PI*2.0) - PI;
          float delta = mod(head-angle+PI*2.0,PI*2.0);
          float blade = exp(-pow(delta/.014,2.0)) * .95;
          float tail = exp(-delta*4.8) * step(delta, 1.08) * .26;
          float radial = smoothstep(.99,.78,r) * smoothstep(.18,.28,r);
          float rings = .035 * (sin(r*72.0)*.5+.5);
          vec3 cyan = vec3(.20,1.65,1.92);
          float alpha = (blade + tail + rings*tail) * radial;
          gl_FragColor = vec4(cyan * (blade*1.7 + tail*.6), alpha);
        }
      `,
    });
    materials.push(sweepMaterial);
    const sweep = new THREE.Mesh(sweepGeometry, sweepMaterial);
    sweep.position.z = 1.205;
    scene.add(sweep);

    const innerHud = new THREE.Group();
    innerHud.position.z = 1.235;
    scene.add(innerHud);
    [0.41, 0.49].forEach((radius, i) => {
      const geo = new THREE.RingGeometry(radius, radius + .006, 128, 1, i ? Math.PI * .18 : Math.PI * .58, Math.PI * 1.35);
      geometries.push(geo);
      const mat = new THREE.MeshBasicMaterial({
        color: i ? new THREE.Color().setRGB(.28,2.0,2.18) : new THREE.Color().setRGB(2.5,1.65,.42),
        transparent: true,
        opacity: .82,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        depthWrite: false,
        toneMapped: false,
      });
      materials.push(mat);
      const ring = new THREE.Mesh(geo, mat);
      innerHud.add(ring);
    });

    const starCount = 520;
    const starGeometry = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i += 1) {
      const r = 5.5 + Math.random() * 4.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = r * Math.cos(phi);
      starPositions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta) - 2.0;
    }
    starGeometry.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
    geometries.push(starGeometry);
    const starMaterial = new THREE.PointsMaterial({ color: 0x63e8ef, size: 0.012, transparent: true, opacity: .28, blending: THREE.AdditiveBlending, depthWrite: false });
    materials.push(starMaterial);
    scene.add(new THREE.Points(starGeometry, starMaterial));

    scene.add(new THREE.AmbientLight(0x09262b, 0.75));
    const key = new THREE.DirectionalLight(0x72eff7, 3.6);
    key.position.set(-4.0, 3.3, 4.8);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xffbd52, 1.85);
    fill.position.set(3.4, -2.3, 3.1);
    scene.add(fill);

    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin("anonymous");
    Promise.all([loader.loadAsync(EARTH_DAY), loader.loadAsync(EARTH_NIGHT), loader.loadAsync(EARTH_BUMP)])
      .then(([day, night, bump]) => {
        if (disposed) {
          day.dispose(); night.dispose(); bump.dispose();
          return;
        }
        [day, night].forEach((texture) => { texture.colorSpace = THREE.SRGBColorSpace; });
        const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();
        [day, night, bump].forEach((texture) => {
          texture.anisotropy = Math.min(maxAnisotropy, 8);
          textures.push(texture);
        });

        const earthMaterial = new THREE.MeshStandardMaterial({
          map: day,
          color: 0x2b5f63,
          emissiveMap: night,
          emissive: new THREE.Color(0xffa83e),
          emissiveIntensity: 1.18,
          bumpMap: bump,
          bumpScale: .018,
          roughness: .76,
          metalness: .03,
        });
        materials.push(earthMaterial);
        earth.material = earthMaterial;

        nightGlowMaterial.map = night;
        nightGlowMaterial.alphaMap = night;
        nightGlowMaterial.opacity = .15;
        nightGlowMaterial.needsUpdate = true;
      })
      .catch(() => undefined);

    const resize = () => {
      const width = Math.max(1, mount.clientWidth);
      const height = Math.max(1, mount.clientHeight || width);
      renderer.setSize(width, height, false);
      composer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(mount);

    const render = () => {
      if (disposed) return;
      const elapsed = clock.getElapsedTime();
      sweepMaterial.uniforms.uTime.value = elapsed;
      sweepMaterial.uniforms.uSpeed.value = scanning ? 2.65 : .72;
      cloudMaterial.uniforms.uTime.value = elapsed;
      if (!reducedMotion) {
        world.rotation.y += scanning ? .00018 : .000045;
        cloudShell.rotation.y += .000055;
        innerHud.rotation.z += scanning ? .0015 : .0004;
        routePulses.forEach(({ mesh, curve, offset }, i) => {
          const t = (elapsed * (.045 + i * .003) + offset) % 1;
          mesh.position.copy(curve.getPointAt(t));
        });
      }
      composer.render();
      frame = requestAnimationFrame(render);
    };
    render();

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      geometries.forEach((geometry) => geometry.dispose());
      materials.forEach((material) => material.dispose());
      textures.forEach((texture) => texture.dispose());
      composer.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [scanning]);

  return (
    <div
      className="radar-cinematic relative grid aspect-square w-[min(92vw,40rem)] shrink-0 place-items-center sm:w-[43rem] lg:w-[47rem] xl:w-[49rem]"
      aria-label={`${signals} sinais ativos`}
      data-scanning={scanning}
    >
      <style>{`
        @keyframes rc-spin { to { transform: rotate(360deg); } }
        @keyframes rc-spin-back { to { transform: rotate(-360deg); } }
        @keyframes rc-pulse { 0%,100% { opacity:.42; transform:scale(.94); } 50% { opacity:1; transform:scale(1.08); } }
        @keyframes rc-number { 0%,100% { filter:drop-shadow(0 0 10px rgba(255,198,72,.35)); } 50% { filter:drop-shadow(0 0 28px rgba(255,215,112,.88)); } }
        .radar-cinematic .rc-cw { animation:rc-spin 38s linear infinite; transform-origin:center; }
        .radar-cinematic .rc-ccw { animation:rc-spin-back 52s linear infinite; transform-origin:center; }
        .radar-cinematic .rc-pulse { animation:rc-pulse 4.8s ease-in-out infinite; }
        .radar-cinematic .rc-number { animation:rc-number 4.2s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) { .radar-cinematic .rc-cw,.radar-cinematic .rc-ccw,.radar-cinematic .rc-pulse,.radar-cinematic .rc-number { animation:none !important; } }
      `}</style>

      <div className="pointer-events-none absolute inset-[-9%] rounded-full bg-[radial-gradient(circle,rgba(34,211,238,.12)_0%,rgba(7,71,79,.07)_42%,transparent_72%)] blur-3xl" aria-hidden="true" />
      <div className="absolute inset-[7%] z-[2] overflow-hidden rounded-full bg-[#02090b] shadow-[0_0_0_1px_rgba(89,234,244,.35),0_0_78px_rgba(34,211,238,.12),inset_0_0_75px_rgba(0,0,0,.84)]" aria-hidden="true">
        <div ref={mountRef} className="absolute inset-0" />
      </div>

      {HUD_STARS.map(([left, top, size, tone], index) => (
        <span
          key={index}
          className={`rc-pulse absolute z-[6] rounded-full ${tone === "gold" ? "bg-[#ffd36c] shadow-[0_0_12px_rgba(255,204,86,.8)]" : "bg-cyan-200 shadow-[0_0_10px_rgba(103,232,249,.7)]"}`}
          style={{ left: `${left}%`, top: `${top}%`, width: size * 2.5, height: size * 2.5, animationDelay: `${index * .18}s` }}
          aria-hidden="true"
        />
      ))}

      <svg viewBox="0 0 640 640" className="pointer-events-none absolute inset-0 z-[8] size-full overflow-visible" aria-hidden="true">
        <defs>
          <linearGradient id="rcGold" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#fff2af"/><stop offset=".33" stopColor="#e3bc54"/><stop offset=".68" stopColor="#8f6721"/><stop offset="1" stopColor="#f6d373"/>
          </linearGradient>
          <filter id="rcGlow"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        </defs>
        <g className="rc-cw" opacity=".9">
          <circle cx="320" cy="320" r="294" fill="none" stroke="rgba(91,232,241,.28)" strokeWidth="1.2" strokeDasharray="2 9" />
          <path d="M84 158 A294 294 0 0 1 181 65" fill="none" stroke="url(#rcGold)" strokeWidth="3.2" strokeLinecap="round"/>
          <path d="M465 63 A294 294 0 0 1 557 157" fill="none" stroke="url(#rcGold)" strokeWidth="3.2" strokeLinecap="round"/>
          <path d="M77 468 A294 294 0 0 0 177 574" fill="none" stroke="rgba(85,229,240,.55)" strokeWidth="2.1" strokeLinecap="round"/>
        </g>
        <g className="rc-ccw" opacity=".82">
          <circle cx="320" cy="320" r="274" fill="none" stroke="rgba(212,175,55,.5)" strokeWidth="1.1" strokeDasharray="36 17 6 21" />
          <circle cx="320" cy="320" r="257" fill="none" stroke="rgba(84,230,241,.22)" strokeWidth="1" strokeDasharray="4 7" />
        </g>
        <g fill="url(#rcGold)" filter="url(#rcGlow)" fontFamily="sans-serif" fontSize="17" textAnchor="middle">
          <text x="320" y="29">N</text><text x="320" y="625">S</text><text x="20" y="326">O</text><text x="620" y="326">L</text>
          <path d="M320 42 l-8 14 h16z"/><path d="M320 599 l-8 -14 h16z"/><path d="M42 320 l14 -8 v16z"/><path d="M598 320 l-14 -8 v16z"/>
        </g>
      </svg>

      <div className="pointer-events-none absolute z-[12] grid size-[28%] place-items-center rounded-full border border-[#d4af37]/30 bg-[radial-gradient(circle,rgba(2,12,15,.92)_0%,rgba(1,8,10,.88)_58%,rgba(1,8,10,.55)_100%)] shadow-[0_0_0_1px_rgba(91,232,241,.16),0_0_45px_rgba(212,175,55,.12),inset_0_0_35px_rgba(0,0,0,.62)]" aria-hidden="true">
        <div className="absolute inset-[10%] rounded-full border border-cyan-200/14" />
        <div className="absolute inset-[18%] rounded-full border border-[#d4af37]/26" />
      </div>

      <div className="pointer-events-none absolute z-[16] flex flex-col items-center justify-center" aria-hidden="true">
        <span
          className="rc-number bg-clip-text text-[clamp(3.55rem,9vw,6.25rem)] font-semibold leading-none text-transparent"
          style={{ backgroundImage: "linear-gradient(180deg,#fff2ba 0%,#f0c55d 30%,#a56f20 62%,#ffe190 100%)", WebkitTextStroke: "1px rgba(255,231,145,.34)" }}
        >
          {signals}
        </span>
        <span className="mt-2 text-[clamp(.48rem,1vw,.72rem)] font-medium uppercase tracking-[.38em] text-cyan-50/78">Sinais ativos</span>
      </div>
    </div>
  );
}
