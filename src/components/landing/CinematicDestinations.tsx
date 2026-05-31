import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { MessageCircle, Play } from 'lucide-react';

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
    video: 'https://videos.pexels.com/video-files/1739011/1739011-hd_1280_720_25fps.mp4',
    poster: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=70',
    size: 'wide',
  },
  {
    name: 'Lençóis Maranhenses',
    country: 'Brasil',
    tag: 'Único',
    tagColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    description: 'Dunas brancas e lagoas de água doce num deserto que não existe no mapa.',
    video: 'https://videos.pexels.com/video-files/4763824/4763824-hd_1280_720_30fps.mp4',
    poster: 'https://images.unsplash.com/photo-1599413985389-fe8e2e7beb88?auto=format&fit=crop&w=900&q=70',
    size: 'normal',
  },
  {
    name: 'Jericoacoara',
    country: 'Brasil',
    tag: 'Aventura',
    tagColor: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
    description: 'Ventos, dunas e o pôr do sol mais bonito do Nordeste.',
    video: 'https://videos.pexels.com/video-files/2169307/2169307-hd_1280_720_30fps.mp4',
    poster: 'https://images.unsplash.com/photo-1596522354195-e84ae3c98731?auto=format&fit=crop&w=900&q=70',
    size: 'normal',
  },
  {
    name: 'Rio de Janeiro',
    country: 'Brasil',
    tag: 'Icônico',
    tagColor: 'bg-green-500/20 text-green-300 border-green-500/30',
    description: 'A cidade maravilhosa onde a natureza e a cultura se fundem em beleza.',
    video: 'https://videos.pexels.com/video-files/1448735/1448735-hd_1280_720_30fps.mp4',
    poster: 'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?auto=format&fit=crop&w=900&q=70',
    size: 'normal',
  },
  {
    name: 'Santorini',
    country: 'Grécia',
    tag: 'Romântico',
    tagColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    description: 'Onde o pôr do sol encontra as cúpulas azuis do Egeu.',
    video: 'https://videos.pexels.com/video-files/3571264/3571264-hd_1280_720_30fps.mp4',
    poster: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=900&q=70',
    size: 'normal',
  },
  {
    name: 'Maldivas',
    country: 'Oceano Índico',
    tag: 'Luxe',
    tagColor: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
    description: 'Bangalôs sobre águas cristalinas e o luxo da desconexão.',
    video: 'https://videos.pexels.com/video-files/1093662/1093662-hd_1280_720_30fps.mp4',
    poster: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=900&q=70',
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

const DestinationCard = ({ destination, index }: { destination: Destination; index: number }) => {
  const { ref: videoRef, isInView, isLoaded, hasError } = useLazyVideo(0.2);
  const isWide = destination.size === 'wide';

  return (
    <motion.div
      initial={{ opacity: 0, y: 48 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.85, delay: (index % 3) * 0.12, ease: [0.22, 1, 0.36, 1] }}
      className={`group relative overflow-hidden rounded-2xl bg-zinc-900 ${
        isWide ? 'md:col-span-2 aspect-[16/9]' : 'aspect-[4/5] md:aspect-[3/4]'
      }`}
    >
      {/* Poster — fades out once video is playing */}
      <img
        src={destination.poster}
        alt={destination.name}
        loading="lazy"
        decoding="async"
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
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
        className={`absolute inset-0 w-full h-full object-cover scale-105 group-hover:scale-100 transition-all duration-[1200ms] ease-out ${
          isLoaded ? 'opacity-60 group-hover:opacity-80' : 'opacity-0'
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
      <div className={`absolute inset-0 flex flex-col justify-end p-7 md:p-10 ${isWide ? 'md:p-14' : ''}`}>
        <div className="flex items-center gap-3 mb-4">
          <span className={`px-3 py-1 rounded-full text-[10px] uppercase tracking-widest border backdrop-blur-md font-semibold ${destination.tagColor}`}>
            {destination.tag}
          </span>
          <span className="text-white/40 text-xs tracking-widest uppercase">
            {destination.country}
          </span>
        </div>

        <h3 className={`font-editorial text-white mb-3 leading-none group-hover:translate-x-2 transition-transform duration-500 ${
          isWide ? 'text-4xl md:text-6xl' : 'text-3xl md:text-4xl'
        }`}>
          {destination.name}
        </h3>

        <p className="text-white/55 text-sm md:text-base max-w-lg mb-7 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-500">
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
    </motion.div>
  );
};

// ---------------------------------------------------------------------------
// Section
// ---------------------------------------------------------------------------

export const CinematicDestinations = () => {
  return (
    <section className="bg-black py-24 md:py-40">
      <div className="container mx-auto px-4 lg:px-8 mb-16 text-center">
        <motion.span
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-gold tracking-[0.4em] text-xs uppercase mb-4 block"
        >
          Curadoria Tomorrow
        </motion.span>

        <motion.h2
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.15 }}
          className="font-editorial text-4xl md:text-7xl text-white"
        >
          Destinos que{' '}
          <span className="font-editorial-italic gradient-text-teal italic">respiram</span>{' '}
          arte.
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="text-white/40 mt-6 max-w-2xl mx-auto text-sm md:text-lg"
        >
          A curadoria definitiva para quem busca não apenas viajar, mas viver uma experiência estética transcendental.
        </motion.p>
      </div>

      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {DESTINATIONS.map((dest, idx) => (
            <DestinationCard key={dest.name} destination={dest} index={idx} />
          ))}
        </div>
      </div>
    </section>
  );
};