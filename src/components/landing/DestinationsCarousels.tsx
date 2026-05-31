import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, MapPin, Clock, Calendar, MessageSquare } from 'lucide-react';
import anime from 'animejs';
import { destinations, type Destination } from '@/data/destinations';
import { EditorialHeading } from './EditorialHeading';

const nacionais = destinations.filter((d) => d.type === 'nacional');
const internacionais = destinations.filter((d) => d.type === 'internacional');

const DestinationCard = ({ d, index }: { d: Destination; index: number }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        anime({
          targets: el,
          opacity: [0, 1],
          translateY: [20, 0],
          duration: 1000,
          delay: (index % 4) * 100,
          easing: 'easeOutExpo'
        });
        observer.disconnect();
      }
    }, { threshold: 0.1 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [index]);

  const handleMouseEnter = () => {
    if (!cardRef.current) return;
    
    // active card focus
    anime({
      targets: cardRef.current,
      scale: 1,
      opacity: 1,
      duration: 400,
      easing: 'easeOutQuad'
    });

    // image zoom
    if (imgRef.current) {
      anime({
        targets: imgRef.current,
        scale: 1.1,
        duration: 800,
        easing: 'easeOutQuad'
      });
    }
  };

  const handleMouseLeave = () => {
    if (imgRef.current) {
      anime({
        targets: imgRef.current,
        scale: 1,
        duration: 800,
        easing: 'easeOutQuad'
      });
    }
  };

  return (
    <div
      ref={cardRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="group relative shrink-0 w-[85vw] sm:w-[320px] lg:w-[360px] snap-center md:snap-start opacity-0 transition-all duration-500 hover:z-10"
    >
      <Link
        to={`/teo?q=Quero saber mais sobre ${d.name}`}
        className="block relative aspect-[4/5] overflow-hidden rounded-3xl bg-zinc-900 border border-white/5 shadow-2xl"
      >
        <img
          ref={imgRef}
          src={d.image}
          alt={d.name}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:opacity-90 transition-opacity duration-700"
          onError={(e) => {
            const img = e.currentTarget;
            img.onerror = null;
            img.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='1000' viewBox='0 0 800 1000'%3E%3Crect width='800' height='1000' fill='%23111827'/%3E%3C/svg%3E";
            img.style.opacity = '1';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />

        {/* Category badge */}
        <div className="absolute top-5 left-5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-[10px] font-bold tracking-[0.2em] uppercase text-white border border-white/10">
          {d.category}
        </div>

        {/* Content */}
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-gold-light mb-3">
            <MapPin className="w-3.5 h-3.5" />
            {d.location}
          </div>
          <h3 className="font-editorial text-4xl text-white mb-3 leading-tight group-hover:translate-x-2 transition-transform duration-500">
            {d.name}
          </h3>
          
          <div className="flex gap-4 text-[10px] text-white/50 uppercase tracking-widest mb-6 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-500">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-gold/60" />
              {d.bestTime}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-gold/60" />
              {d.idealDuration}
            </span>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 group-hover:text-gold transition-colors duration-500">
              Consultar Téo
            </span>
            <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-gold group-hover:border-gold group-hover:text-black transition-all duration-500">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
};

const Carousel = ({
  title,
  italicWord,
  eyebrow,
  items,
  viewAllHref,
}: {
  title: string;
  italicWord: string;
  eyebrow: string;
  items: Destination[];
  viewAllHref: string;
}) => {
  return (
    <div className="mb-24 last:mb-0">
      <div className="container mx-auto px-4 lg:px-8 mb-12">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div className="max-w-2xl">
            <span
              className="text-gold tracking-[0.5em] text-[10px] md:text-xs uppercase mb-4 block font-bold"
            >
              {eyebrow}
            </span>
            <EditorialHeading size="lg">
              {title}{' '}
              <span className="font-editorial-italic gradient-text-teal italic">
                {italicWord}
              </span>
            </EditorialHeading>
          </div>
          <Link
            to={viewAllHref}
            className="group inline-flex items-center gap-3 text-xs font-bold uppercase tracking-[0.3em] text-white/40 hover:text-gold transition-all duration-500"
          >
            Explorar catálogo
            <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center group-hover:border-gold transition-all duration-500">
              <ArrowUpRight className="w-5 h-5 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
            </div>
          </Link>
        </div>
      </div>

      <div className="relative overflow-x-auto snap-x snap-mandatory scrollbar-hide overscroll-x-contain">
        <div className="flex gap-8 px-4 lg:px-8 pb-12 w-max min-w-full [&:hover>div:not(:hover)]:scale-[0.95] [&:hover>div:not(:hover)]:opacity-60 transition-all duration-500">
          {items.map((d, i) => (
            <DestinationCard key={d.id} d={d} index={i} />
          ))}
          <div className="shrink-0 w-8 md:w-32" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
};

export const DestinationsCarousels = () => {
  return (
    <section className="relative py-24 md:py-40 bg-[#020607] border-t border-white/5 overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-black to-transparent -z-10" />
      
      <Carousel
        eyebrow="Brasil Premium"
        title="O melhor do nosso"
        italicWord="território"
        items={nacionais}
        viewAllHref="/nacional"
      />
      
      <Carousel
        eyebrow="Mundo Editorial"
        title="As capitais do"
        italicWord="desejo"
        items={internacionais}
        viewAllHref="/internacional"
      />
    </section>
  );
};