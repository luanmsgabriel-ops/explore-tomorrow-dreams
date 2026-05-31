import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, Play } from 'lucide-react';
import * as anime_module from 'animejs';
const anime = (anime_module as any).default || anime_module;
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
];

// ---------------------------------------------------------------------------
// Lazy video hook
// ---------------------------------------------------------------------------

function useLazyVideo(threshold = 0.25) {
  const ref = useRef<HTMLVideoElement | null>(null);
  const [isInView, setIsInView] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Step 1 — detect entry into viewport
  useEffect(() => {
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
  }, [threshold]);

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

  return { ref, isInView, isLoaded, hasError };
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
  const { ref: videoRef, isInView, isLoaded, hasError } = useLazyVideo(0.2);
  const cardRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        onRatioUpdate(destination.name, entry.intersectionRatio);
        
        if (entry.isIntersecting) {
          // Entry animation with anime.js
          anime({
            targets: el,
            opacity: [0, 1],
            translateY: [48, 0],
            duration: 1200,
            delay: (index % 3) * 150,
            easing: 'easeOutExpo'
          });

          // Stagger title letters/entrance
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
      { 
        threshold: Array.from({ length: 11 }, (_, i) => i * 0.1),
        rootMargin: "-10% 0px -10% 0px"
      }
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
      {/* Poster — fades out once video is playing */}
      <img
        src={destination.poster}
        alt={destination.name}
        loading="lazy"
        decoding="async"
        className={`absolute inset-0 w-full h-full object-cover ${
          isWide ? 'object-[center_40%]' : 'object-center'
        } transition-opacity duration-1000 ${
          isLoaded ? 'opacity-0' : 'opacity-60'
        }`}
        aria-hidden="true"
      />

      {/* Video — <source> injected only after IntersectionObserver fires */}
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

      {/* Buffering indicator */}
      {isInView && !isLoaded && !hasError && (
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

export const CinematicDestinations = () => {
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

  const destinationMap: Record<string, { angle: number; direction: string }> = {
    'Fernando de Noronha': { angle: 45, direction: 'Nordeste do Brasil' },
    'Lençóis Maranhenses': { angle: 0, direction: 'Maranhão, Brasil' },
    'Jericoacoara': { angle: 35, direction: 'Ceará, Brasil' },
    'Rio de Janeiro': { angle: 135, direction: 'Sudeste do Brasil' },
    'Santorini': { angle: 90, direction: 'Ilhas Cíclades, Grécia' },
    'Maldivas': { angle: 110, direction: 'Oceano Índico' },
  };

  const currentData = useMemo(() => 
    destinationMap[activeDestination] || { angle: 0, direction: 'Explorando...' },
    [activeDestination]
  );

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

      <div className="sticky top-0 z-50 pointer-events-none">
        <CompassBar 
          destination={activeDestination} 
          direction={currentData.direction} 
          angle={currentData.angle} 
        />
      </div>

      <div className="container mx-auto px-4 lg:px-8 mt-16">
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