import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ChevronLeft, ChevronRight, MapPin, Sparkles } from 'lucide-react';
import { useDestinations } from '@/hooks/useDestinations';

gsap.registerPlugin(ScrollTrigger);

// Per-slide scroll distance as a fraction of the viewport height.
// Lower = faster slide-to-slide transition while keeping smoothness via Lenis.
const SLIDE_VH = 0.45;

interface Slide {
  id: string;
  slug: string;
  name: string;
  location: string;
  image: string;
  category: string;
  description: string;
}

export const ImmersiveScrollHero = () => {
  const navigate = useNavigate();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  // Reuse the shared destinations cache (no extra Supabase round-trip).
  const { destinations, isLoading } = useDestinations();

  // Prefer featured ones; fall back to first 5 active.
  const slides: Slide[] = (() => {
    const featured = destinations.filter((d) => d.isFeatured).slice(0, 5);
    const pool = featured.length >= 3 ? featured : destinations.slice(0, 5);
    return pool.map((d) => ({
      id: d.id,
      slug: d.slug,
      name: d.name,
      location: d.location,
      image: d.image,
      category: d.category,
      description: d.description || '',
    }));
  })();

  const loading = isLoading;

  // ScrollTrigger pinned timeline
  useLayoutEffect(() => {
    if (loading || slides.length === 0 || !wrapperRef.current) return;

    let lastIdx = -1;
    const ctx = gsap.context(() => {
      const total = slides.length;
      const st = ScrollTrigger.create({
        trigger: wrapperRef.current!,
        start: 'top top',
        end: () => `+=${(total - 1) * window.innerHeight * SLIDE_VH}`,
        pin: stageRef.current!,
        scrub: 0.5,
        anticipatePin: 1,
        onUpdate: (self) => {
          const idx = Math.min(total - 1, Math.round(self.progress * (total - 1)));
          if (idx !== lastIdx) {
            lastIdx = idx;
            setActive(idx);
          }
        },
      });

      return () => st.kill();
    }, wrapperRef);

    return () => ctx.revert();
  }, [loading, slides.length]);

  // Animate text on active change
  useEffect(() => {
    if (loading) return;
    gsap.fromTo(
      '.slide-text-anim',
      { y: 40, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, stagger: 0.08, ease: 'power3.out', overwrite: true }
    );
  }, [active, loading]);

  const scrollToSlide = (idx: number) => {
    if (!wrapperRef.current) return;
    const rect = wrapperRef.current.getBoundingClientRect();
    const top = window.scrollY + rect.top;
    const perSlide = window.innerHeight * SLIDE_VH;
    window.scrollTo({ top: top + idx * perSlide, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <div className="text-gold-light text-sm">Carregando experiência…</div>
      </div>
    );
  }

  if (slides.length === 0) return null;

  const current = slides[active];
  const total = slides.length;

  return (
    <div
      ref={wrapperRef}
      className="relative w-full"
      style={{ height: `${100 + (total - 1) * 55}vh` }}
    >
      
      <div
        ref={stageRef}
        className="relative w-full h-screen overflow-hidden bg-background"
      >
        {/* Background image stack with crossfade */}
        <div className="absolute inset-0">
          {slides.map((s, i) => (
            <div
              key={s.id}
              className="absolute inset-0 transition-opacity duration-700 ease-out"
              style={{ opacity: i === active ? 1 : 0 }}
            >
              <img
                src={s.image}
                alt={s.name}
                className="w-full h-full object-cover"
                style={{
                  transform: i === active ? 'scale(1.05)' : 'scale(1.15)',
                  transition: 'transform 6s ease-out',
                }}
              />
              {/* Subtle gradient only on left for text legibility — keep image sharp */}
              <div className="absolute inset-0 bg-gradient-to-r from-background/70 via-background/10 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background/60 to-transparent" />
            </div>
          ))}
        </div>

        {/* Content layer */}
        <div className="relative z-10 h-full container mx-auto px-4 lg:px-8 flex flex-col">
          {/* Top filler for header */}
          <div className="h-24" />

          {/* Main row */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Left: text */}
            <div key={current.id} className="max-w-xl">
              <div className="slide-text-anim inline-flex items-center gap-2 px-4 py-2 rounded-full glass-gold mb-6">
                <MapPin className="w-4 h-4 text-gold-light" />
                <span className="text-sm font-medium text-gold-light">
                  {current.location}
                </span>
              </div>

              <h1 className="slide-text-anim font-serif text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-[0.95]">
                <span className="text-gold-embossed block">{current.name}</span>
              </h1>

              <p className="slide-text-anim text-base md:text-lg text-white/85 mb-8 leading-relaxed line-clamp-4">
                {current.description}
              </p>

              <div className="slide-text-anim flex flex-wrap gap-3">
                <button
                  onClick={() => navigate(`/destino/${current.slug}`)}
                  className="btn-gold flex items-center gap-2 text-sm uppercase tracking-wider px-6 py-3"
                >
                  <Sparkles className="w-4 h-4" />
                  Descobrir destino
                </button>
              </div>
            </div>

            {/* Right: card carousel preview */}
            <div className="hidden lg:flex justify-end items-end h-full pb-12 pr-4">
              <div className="flex gap-4 overflow-visible">
                {slides.map((s, i) => {
                  const offset = i - active;
                  // Show next 3 cards to the right of current
                  if (offset < 0 || offset > 3) return null;
                  const isPeek = offset === 0;
                  return (
                    <button
                      key={s.id}
                      onClick={() => scrollToSlide(i)}
                      className="group relative shrink-0 rounded-2xl overflow-hidden border border-gold/30 shadow-2xl transition-all duration-700 ease-out hover:border-gold/70"
                      style={{
                        width: isPeek ? '0px' : '160px',
                        height: '220px',
                        opacity: isPeek ? 0 : 1 - offset * 0.15,
                        transform: `translateY(${offset * 6}px) scale(${1 - offset * 0.05})`,
                      }}
                    >
                      <img
                        src={s.image}
                        alt={s.name}
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-3 text-left">
                        <p className="text-[10px] uppercase tracking-wider text-gold-light/80 mb-1 truncate">
                          {s.location}
                        </p>
                        <p className="font-serif text-sm font-bold text-white leading-tight line-clamp-2">
                          {s.name}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Bottom bar: arrows + counter + heart */}
          <div className="pb-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => scrollToSlide(Math.max(0, active - 1))}
                disabled={active === 0}
                className="w-11 h-11 rounded-full border border-gold/40 flex items-center justify-center text-gold-light hover:bg-gold/10 transition disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Anterior"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => scrollToSlide(Math.min(total - 1, active + 1))}
                disabled={active === total - 1}
                className="w-11 h-11 rounded-full border border-gold/40 flex items-center justify-center text-gold-light hover:bg-gold/10 transition disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Próximo"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

          </div>
        </div>

        {/* Scroll hint (only on first slide) */}
        {active === 0 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 text-[10px] uppercase tracking-[0.3em] text-gold-light/70 animate-pulse">
            Role para explorar
          </div>
        )}
      </div>
    </div>
  );
};
