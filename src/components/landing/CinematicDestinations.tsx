import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, Play } from 'lucide-react';
import anime from 'animejs';
import { CompassBar } from './CompassBar';


// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

interface Destination {
  name: string;
  country: string;
  tag: string;
  tagColor: string;
  description: string;
  video: string;
  poster: string;
  size: 'normal' | 'wide';
}

const DESTINATIONS: Destination[] = [
  {
    name: 'Fernando de Noronha',
    country: 'Brasil',
    tag: 'Exclusivo',
    tagColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    description: 'Um santuário ecológico onde o azul do mar desafia a realidade.',
    video: '/videos/destinations/noronha.mp4',
    poster: '/images/posters/noronha.jpg',
    size: 'wide',
  },
  {
    name: 'Lençóis Maranhenses',
    country: 'Brasil',
    tag: 'Único',
    tagColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    description: 'Dunas brancas e lagoas de água doce num deserto que não existe no mapa.',
    video: '/videos/destinations/lencois.mp4',
    poster: '/images/posters/lencois.jpg',
    size: 'normal',
  },
  {
    name: 'Jericoacoara',
    country: 'Brasil',
    tag: 'Aventura',
    tagColor: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
    description: 'Ventos, dunas e o pôr do sol mais bonito do Nordeste.',
    video: '/videos/destinations/jeri.mp4',
    poster: '/images/posters/jeri.jpg',
    size: 'normal',
  },
  {
    name: 'Rio de Janeiro',
    country: 'Brasil',
    tag: 'Icônico',
    tagColor: 'bg-green-500/20 text-green-300 border-green-500/30',
    description: 'A cidade maravilhosa onde a natureza e a cultura se fundem em beleza.',
    video: '/videos/destinations/rio.mp4',
    poster: '/images/posters/rio.jpg',
    size: 'normal',
  },
  {
    name: 'Santorini',
    country: 'Grécia',
    tag: 'Romântico',
    tagColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    description: 'Onde o pôr do sol encontra as cúpulas azuis do Egeu.',
    video: '/videos/destinations/santorini.mp4',
    poster: '/images/posters/santorini.jpg',
    size: 'normal',
  },
  {
    name: 'Maldivas',
    country: 'Oceano Índico',
    tag: 'Luxe',
    tagColor: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
    description: 'Bangalôs sobre águas cristalinas e o luxo da desconexão.',
    video: '/videos/destinations/maldivas.mp4',
    poster: '/images/posters/maldivas.jpg',
    size: 'normal',
  },
  {
    name: 'Bali',
    country: 'Indonésia',
    tag: 'Paraíso',
    tagColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    description: 'Terraços de arroz, templos milenares e praias de tirar o fôlego.',
    video: '/videos/destinations/bali.mp4',
    poster: '/images/posters/bali.jpg',
    size: 'normal',
  },
  {
    name: 'Dubai',
    country: 'Emirados Árabes',
    tag: 'Moderno',
    tagColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    description: 'Onde o deserto encontra o futuro em arranha-céus deslumbrantes.',
    video: '/videos/destinations/dubai.mp4',
    poster: '/images/posters/dubai.jpg',
    size: 'normal',
  },
];


// ---------------------------------------------------------------------------
// Lazy video hook
// ---------------------------------------------------------------------------

function useLazyVideo(threshold = 0.25) {
  const ref = useRef<HTMLVideoElement | null>(null);
  const [isInView, setIsInView] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Vídeos desabilitados — causavam travamento e flicker ao carregar 6 simultaneamente.
  // Posters de alta qualidade entregam a mesma experiência visual sem custo de performance.
  const shouldLoadVideo = false;

  // Step 1 — detect entry into viewport
  useEffect(() => {
    if (!shouldLoadVideo) return;
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, shouldLoadVideo]);

  // Step 2 — load & play only after entering viewport
  useEffect(() => {
    const el = ref.current;
    if (!el || !isInView) return;

    el.load();

    const tryPlay = () => {
      setIsLoaded(true);
      el.play().catch(() => {});
    };

    const onError = () => setHasError(true);

    el.addEventListener('canplay', tryPlay, { once: true });
    el.addEventListener('error', onError, { once: true });

    let progressHandler: (() => void) | null = null;

    const fallback = window.setTimeout(() => {
      if (el.readyState >= 2) {
        tryPlay();
      } else {
        progressHandler = () => {
          if (el.readyState >= 2) {
            tryPlay();
            if (progressHandler) {
              el.removeEventListener('progress', progressHandler);
              progressHandler = null;
            }
          }
        };
        el.addEventListener('progress', progressHandler);
      }
    }, 3000);

    return () => {
      el.removeEventListener('canplay', tryPlay);
      el.removeEventListener('error', onError);
      if (progressHandler) {
        el.removeEventListener('progress', progressHandler);
      }
      window.clearTimeout(fallback);
    };
  }, [isInView]);

  return { ref, isInView, isLoaded, hasError, shouldLoadVideo };
}


// ---------------------------------------------------------------------------
// Card
// ---------------------------------------------------------------------------

const DestinationCard = ({ 
  destination, 
  index, 
  onRatioUpdate 
}: { 
  destination: Destination; 
  index: number;
  onRatioUpdate: (name: string, ratio: number) => void;
}) => {
  const { ref: videoRef, isInView, isLoaded, hasError, shouldLoadVideo } = useLazyVideo(0.2);
  const cardRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;

    // Observer leve: 3 thresholds apenas, sem rootMargin agressivo.
    // Evita o re-render constante que causava flicker nos 6 cards simultâneos.
    let hasEntered = false;
    const observer = new IntersectionObserver(
      ([entry]) => {
        onRatioUpdate(destination.name, entry.intersectionRatio);

        if (entry.isIntersecting && !hasEntered) {
          hasEntered = true;
          anime({
            targets: el,
            opacity: [0, 1],
            translateY: [48, 0],
            duration: 1200,
            delay: (index % 3) * 150,
            easing: 'easeOutExpo'
          });

          if (titleRef.current) {
            anime({
              targets: titleRef.current,
              translateX: [20, 0],
              opacity: [0, 1],
              duration: 1000,
              delay: (index % 3) * 150 + 400,
              easing: 'easeOutExpo'
            });
          }
        }
      },
      { threshold: [0, 0.5, 1] }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [destination.name, onRatioUpdate, index]);

  const handleMouseEnter = () => {
    if (!cardRef.current) return;
    
    // Zoom image
    anime({
      targets: videoRef.current,
      scale: 1.05,
      duration: 800,
      easing: 'easeOutQuad'
    });

    // Fade in text
    if (contentRef.current) {
      anime({
        targets: contentRef.current.querySelector('p'),
        opacity: [0, 1],
        translateY: [10, 0],
        duration: 500,
        easing: 'easeOutQuad'
      });
    }
  };

  const handleMouseLeave = () => {
    anime({
      targets: videoRef.current,
      scale: 1,
      duration: 800,
      easing: 'easeOutQuad'
    });

    if (contentRef.current) {
      anime({
        targets: contentRef.current.querySelector('p'),
        opacity: 0,
        translateY: 10,
        duration: 400,
        easing: 'easeOutQuad'
      });
    }
  };

  const isWide = destination.size === 'wide';

  return (
    <div
      ref={cardRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`group relative overflow-hidden rounded-2xl bg-zinc-900 opacity-0 ${
        isWide ? 'md:col-span-2 aspect-[4/5] md:aspect-[16/9]' : 'aspect-[4/5] md:aspect-[3/4]'
      }`}
    >
      {/* Poster — sempre visível em mobile; fade out em desktop quando vídeo toca */}
      <img
        src={destination.poster}
        alt={destination.name}
        loading="lazy"
        decoding="async"
        className={`absolute inset-0 w-full h-full object-cover ${
          isWide ? 'object-[center_40%]' : 'object-center'
        } transition-opacity duration-1000 ${
          !shouldLoadVideo ? 'opacity-100' : isLoaded ? 'opacity-0' : 'opacity-60'
        }`}
        aria-hidden="true"
      />

      {/* Video — só monta em desktop com boa conexão */}
      {shouldLoadVideo && (
        <video
          ref={videoRef}
          muted
          loop
          playsInline
          preload="none"
          className={`absolute inset-0 w-full h-full object-cover ${
            isWide ? 'object-[center_40%]' : 'object-center'
          } transition-all duration-1000 ${
            isLoaded ? 'opacity-65 group-hover:opacity-85' : 'opacity-0'
          }`}
          aria-hidden="true"
        >
          {isInView && <source src={destination.video} type="video/mp4" />}
        </video>
      )}

      {/* Buffering indicator */}
      {shouldLoadVideo && isInView && !isLoaded && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center animate-pulse">
            <Play className="w-5 h-5 text-white ml-0.5" />
          </div>
        </div>
      )}


      {/* Cinematic overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent" />

      {/* Content */}
      <div 
        ref={contentRef}
        className={`absolute inset-0 flex flex-col justify-end p-7 md:p-10 ${isWide ? 'md:p-14' : ''}`}
      >
        <div className="flex items-center gap-3 mb-4">
          <span className={`px-3 py-1 rounded-full text-[10px] uppercase tracking-widest border backdrop-blur-md font-semibold ${destination.tagColor}`}>
            {destination.tag}
          </span>
          <span className="text-white/40 text-xs tracking-widest uppercase">
            {destination.country}
          </span>
        </div>

        <h3 
          ref={titleRef}
          className={`font-editorial text-white mb-3 leading-none opacity-0 ${
            isWide ? 'text-4xl md:text-6xl' : 'text-3xl md:text-4xl'
          }`}
        >
          {destination.name}
        </h3>

        <p className="text-white/55 text-sm md:text-base max-w-lg mb-7 opacity-0 translate-y-2">
          {destination.description}
        </p>

        <Link
          to={`/teo?q=Quero planejar uma viagem para ${destination.name}`}
          className="inline-flex items-center gap-3 w-fit group/btn"
          aria-label={`Consultar Téo sobre ${destination.name}`}
        >
          <span className="text-[11px] uppercase tracking-[0.25em] text-gold-light font-semibold">
            Consultar Téo
          </span>
          <div className="w-9 h-9 rounded-full border border-gold/30 flex items-center justify-center group-hover/btn:bg-gold group-hover/btn:border-gold group-hover/btn:text-black transition-all duration-300">
            <MessageCircle className="w-4 h-4" />
          </div>
        </Link>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Section
// ---------------------------------------------------------------------------

export const CinematicDestinations = ({ 
  onStateChange 
}: { 
  onStateChange?: (state: { destination: string; direction: string; angle: number }) => void 
}) => {
  const [activeDestination, setActiveDestination] = useState(DESTINATIONS[0].name);
  const [ratios, setRatios] = useState<Record<string, number>>({});
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const updateActiveDestination = useCallback((name: string, ratio: number) => {
    setRatios(prev => {
      if (prev[name] === ratio) return prev;
      return { ...prev, [name]: ratio };
    });
  }, []);

  useEffect(() => {
    // Section entrance animation
    const section = document.getElementById('cinematic-destinations');
    if (section) {
      const observer = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) {
          const targets = [
            section.querySelector('[data-anime-eyebrow]'),
            section.querySelector('[data-anime-title]'),
            section.querySelector('[data-anime-desc]')
          ].filter(Boolean);

          anime({
            targets,
            opacity: [0, 1],
            translateY: [20, 0],
            delay: anime.stagger(150),
            duration: 1000,
            easing: 'easeOutExpo'
          });
          observer.disconnect();
        }
      }, { threshold: 0.1 });
      observer.observe(section);
      return () => observer.disconnect();
    }
  }, []);

  useEffect(() => {
    let winner = activeDestination;
    let maxRatio = 0;

    Object.entries(ratios).forEach(([destName, destRatio]) => {
      if (destRatio > maxRatio) {
        maxRatio = destRatio;
        winner = destName;
      }
    });

    // Clear winner threshold (60%) and stability check
    if (maxRatio >= 0.6 && winner !== activeDestination) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      
      timeoutRef.current = setTimeout(() => {
        setActiveDestination(winner);
      }, 300);
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [ratios, activeDestination]);

  const destinationMap: Record<string, { angle: number; direction: string; x: number; y: number }> = {
    'Fernando de Noronha': { angle: 45, direction: 'Nordeste do Brasil', x: 85, y: 20 },
    'Lençóis Maranhenses': { angle: 0, direction: 'Maranhão, Brasil', x: 75, y: 15 },
    'Jericoacoara': { angle: 35, direction: 'Ceará, Brasil', x: 80, y: 25 },
    'Rio de Janeiro': { angle: 135, direction: 'Sudeste do Brasil', x: 65, y: 70 },
    'Santorini': { angle: 90, direction: 'Ilhas Cíclades, Grécia', x: 15, y: 30 },
    'Maldivas': { angle: 110, direction: 'Oceano Índico', x: 25, y: 55 },
  };

  const [prevDestination, setPrevDestination] = useState(DESTINATIONS[0].name);
  const pathRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    if (activeDestination !== prevDestination) {
      const start = destinationMap[prevDestination];
      const end = destinationMap[activeDestination];
      
      if (start && end && pathRef.current) {
        // Draw flight path
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const midX = (start.x + end.x) / 2 + (dy * 0.2);
        const midY = (start.y + end.y) / 2 - (dx * 0.2);
        
        const d = `M ${start.x} ${start.y} Q ${midX} ${midY} ${end.x} ${end.y}`;
        pathRef.current.setAttribute('d', d);
        
        const length = pathRef.current.getTotalLength();
        pathRef.current.style.strokeDasharray = length.toString();
        pathRef.current.style.strokeDashoffset = length.toString();
        
        anime({
          targets: pathRef.current,
          strokeDashoffset: [length, 0],
          opacity: [0, 1, 1, 0],
          duration: 1500,
          easing: 'easeInOutQuad'
        });
      }
      setPrevDestination(activeDestination);
    }
  }, [activeDestination, prevDestination]);

  const currentData = useMemo(() => 
    destinationMap[activeDestination] || { angle: 0, direction: 'Explorando...', x: 50, y: 50 },
    [activeDestination]
  );

  useEffect(() => {
    if (onStateChange) {
      onStateChange({
        destination: activeDestination,
        direction: currentData.direction,
        angle: currentData.angle
      });
    }
  }, [activeDestination, currentData, onStateChange]);

  return (
    <section id="cinematic-destinations" className="bg-black py-24 md:py-40 relative">
      <div className="container mx-auto px-4 lg:px-8 mb-16 text-center">
        <span
          data-anime-eyebrow
          className="text-gold tracking-[0.4em] text-xs uppercase mb-4 block opacity-0"
        >
          Curadoria Tomorrow
        </span>

        <h2
          data-anime-title
          className="font-editorial text-4xl md:text-7xl text-white opacity-0"
        >
          Destinos que{' '}
          <span className="font-editorial-italic gradient-text-teal italic">respiram</span>{' '}
          arte.
        </h2>

        <p
          data-anime-desc
          className="text-white/40 mt-6 max-w-2xl mx-auto text-sm md:text-lg opacity-0"
        >
          A curadoria definitiva para quem busca não apenas viajar, mas viver uma experiência estética transcendental.
        </p>
      </div>

      <div className="container mx-auto px-4 lg:px-8 mt-16 relative">
        {/* SVG Overlay for Flight Paths */}
        <svg 
          className="absolute inset-0 w-full h-full pointer-events-none z-10 opacity-40 overflow-visible"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="flight-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="transparent" />
              <stop offset="50%" stopColor="#D4AF37" />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          <path
            ref={pathRef}
            fill="none"
            stroke="url(#flight-gradient)"
            strokeWidth="0.5"
            strokeLinecap="round"
            filter="url(#glow)"
            className="drop-shadow-[0_0_8px_rgba(212,175,55,0.6)]"
          />
          {/* Active points */}
          {Object.entries(destinationMap).map(([name, pos]) => (
            <circle
              key={name}
              cx={pos.x}
              cy={pos.y}
              r={activeDestination === name ? "0.8" : "0.3"}
              fill={activeDestination === name ? "#D4AF37" : "rgba(255,255,255,0.1)"}
              className="transition-all duration-700"
            />
          ))}
        </svg>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {DESTINATIONS.map((dest, idx) => (
            <DestinationCard 
              key={dest.name} 
              destination={dest} 
              index={idx} 
              onRatioUpdate={updateActiveDestination}
            />
          ))}
        </div>
      </div>
    </section>
  );
};