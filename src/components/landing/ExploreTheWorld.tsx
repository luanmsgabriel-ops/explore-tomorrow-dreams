import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, ArrowRight } from 'lucide-react';
import * as anime_module from 'animejs';
const anime = (anime_module as any).default || anime_module;

const FEATURED_DESTINATIONS = [
  {
    name: 'Suíça',
    region: 'Alpes Central',
    description: 'A grandiosidade dos picos nevados e a serenidade dos lagos de cristal.',
    link: '/teo?q=Quero planejar uma viagem para a Suíça'
  },
  {
    name: 'Kyoto',
    region: 'Coração do Japão',
    description: 'Onde o tempo silencia entre templos milenares e jardins zen.',
    link: '/teo?q=Quero planejar uma viagem para Kyoto'
  },
  {
    name: 'Maldivas',
    region: 'Oceano Índico',
    description: 'O luxo da desconexão absoluta em águas que desafiam o azul.',
    link: '/teo?q=Quero planejar uma viagem para as Maldivas'
  },
  {
    name: 'Santorini',
    region: 'Mar Egeu',
    description: 'A poesia das vilas brancas debruçadas sobre o infinito azul.',
    link: '/teo?q=Quero planejar uma viagem para Santorini'
  }
];

export const ExploreTheWorld = ({ 
  onStateChange 
}: { 
  onStateChange?: (state: { destination: string; direction: string; angle: number }) => void 
}) => {
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const subheadlineRef = useRef<HTMLParagraphElement>(null);
  const destinationsRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          if (onStateChange) {
            onStateChange({
              destination: 'Grandeza do Mundo',
              direction: 'Inspiração infinita',
              angle: 320
            });
          }
          // Main entrance animation
          anime.timeline({
            easing: 'easeOutExpo',
          })
          .add({
            targets: headlineRef.current,
            opacity: [0, 1],
            translateY: [40, 0],
            duration: 1500,
            delay: 300
          })
          .add({
            targets: subheadlineRef.current,
            opacity: [0, 1],
            translateY: [20, 0],
            duration: 1200,
          }, '-=1000')
          .add({
            targets: '.featured-dest-item',
            opacity: [0, 1],
            translateY: [30, 0],
            delay: anime.stagger(200),
            duration: 1000,
          }, '-=800')
          .add({
            targets: ctaRef.current,
            opacity: [0, 1],
            scale: [0.95, 1],
            duration: 1000,
          }, '-=500');

          observer.unobserve(section);
        }
      });
    }, { threshold: 0.2 });

    observer.observe(section);

    // Parallax effect on scroll
    const handleScroll = () => {
      if (!section) return;
      const scrollPos = window.scrollY;
      const sectionTop = section.offsetTop;
      const offset = scrollPos - sectionTop;
      
      if (videoRef.current && Math.abs(offset) < window.innerHeight) {
        videoRef.current.style.transform = `translateY(${offset * 0.2}px)`;
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <section 
      ref={sectionRef}
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-black py-24 px-6 md:px-12"
    >
      {/* Cinematic Background Video */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-[120%] object-cover opacity-50 transition-opacity duration-1000"
          poster="https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?auto=format&fit=crop&w=1920&q=80"
        >
          <source 
            src="https://player.vimeo.com/external/434045526.sd.mp4?s=c27bc3707621625a4c05f5420262dd033c94971d&profile_id=164&oauth2_token_id=57447761" 
            type="video/mp4" 
          />
        </video>
        {/* Elegant Overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-black via-black/20 to-black z-10" />
        <div className="absolute inset-0 bg-black/40 z-10" />
      </div>

      {/* Content Layer */}
      <div className="relative z-20 container mx-auto text-center">
        <div className="max-w-4xl mx-auto mb-20">
          <h2 
            ref={headlineRef}
            className="font-editorial text-4xl md:text-7xl lg:text-8xl text-white mb-8 leading-tight opacity-0"
          >
            Alguns destinos você escolhe.<br />
            <span className="font-editorial-italic italic text-gold-light">Outros parecem escolher você.</span>
          </h2>
          <p 
            ref={subheadlineRef}
            className="text-white/60 text-lg md:text-2xl max-w-2xl mx-auto font-light tracking-wide opacity-0"
          >
            Existe um mundo inteiro para explorar. Deixe que a curiosidade seja sua única bússola.
          </p>
        </div>

        {/* Editorial Featured Destinations */}
        <div 
          ref={destinationsRef}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-24"
        >
          {FEATURED_DESTINATIONS.map((dest) => (
            <div 
              key={dest.name} 
              className="featured-dest-item text-left border-l border-white/10 pl-6 opacity-0"
            >
              <span className="text-gold text-xs tracking-[0.3em] uppercase mb-2 block font-bold">
                {dest.region}
              </span>
              <h3 className="font-editorial text-3xl text-white mb-4">
                {dest.name}
              </h3>
              <p className="text-white/40 text-sm leading-relaxed mb-6">
                {dest.description}
              </p>
              <Link 
                to={dest.link}
                className="inline-flex items-center gap-2 text-[10px] uppercase tracking-widest text-white/60 hover:text-gold transition-colors duration-300"
              >
                Descobrir <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          ))}
        </div>

        {/* Final CTA */}
        <div ref={ctaRef} className="opacity-0">
          <p className="text-white/50 text-sm mb-8 tracking-[0.2em] uppercase">
            Descobriu um destino que despertou sua curiosidade?
          </p>
          <Link
            to="/teo"
            className="inline-flex items-center gap-4 bg-white text-black px-10 py-5 rounded-full font-bold uppercase tracking-widest hover:bg-gold hover:text-black transition-all duration-500 group"
          >
            <MessageSquare className="w-5 h-5" />
            Conversar com o Téo
          </Link>
        </div>
      </div>
    </section>
  );
};