import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, MessageCircle } from 'lucide-react';

const DESTINATIONS = [
  {
    name: "Fernando de Noronha",
    country: "Brasil",
    video: "https://player.vimeo.com/external/459389137.hd.mp4?s=9939ee9f18a6a6828f73169727581a62&profile_id=175",
    description: "Um santuário ecológico onde o azul do mar desafia a realidade.",
    tag: "Exclusivo"
  },
  {
    name: "Santorini",
    country: "Grécia",
    video: "https://player.vimeo.com/external/369796796.hd.mp4?s=1f744e2b02a2a2f8b5a0b7b1b5e5e1b5&profile_id=175",
    description: "Onde o pôr do sol encontra as cúpulas azuis do Egeu.",
    tag: "Romântico"
  },
  {
    name: "Maldivas",
    country: "Oceano Índico",
    video: "https://player.vimeo.com/external/370331493.hd.mp4?s=1f1e1e1e1e1e1e1e1e1e1e1e1e1e1e1e&profile_id=175",
    description: "Bangalôs sobre águas cristalinas e o luxo da desconexão.",
    tag: "Luxe"
  },
  {
    name: "Kyoto",
    country: "Japão",
    video: "https://player.vimeo.com/external/517042550.hd.mp4?s=8b7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f&profile_id=175",
    description: "A tradição milenar sob as cerejeiras em flor.",
    tag: "Cultural"
  }
];

export const CinematicDestinations = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  return (
    <section ref={containerRef} className="bg-black py-24 md:py-40">
      <div className="container mx-auto px-4 mb-20 text-center">
        <motion.span 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-gold tracking-[0.4em] text-xs uppercase mb-4 block"
        >
          Curadoria Tomorrow
        </motion.span>
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="font-editorial text-4xl md:text-7xl text-white mb-8"
        >
          Destinos que <span className="font-editorial-italic gradient-text-teal italic">respiram</span> arte.
        </motion.h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 container mx-auto px-4">
        {DESTINATIONS.map((dest, idx) => (
          <DestinationCard key={dest.name} destination={dest} index={idx} />
        ))}
      </div>
    </section>
  );
};

const DestinationCard = ({ destination, index }: { destination: typeof DESTINATIONS[0], index: number }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  
  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8, delay: (index % 2) * 0.2 }}
      className="group relative aspect-[4/5] md:aspect-[16/10] overflow-hidden rounded-2xl bg-zinc-900"
    >
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity duration-1000 scale-105 group-hover:scale-100 transition-transform duration-1000"
      >
        <source src={destination.video} type="video/mp4" />
      </video>

      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

      <div className="absolute inset-0 p-8 md:p-12 flex flex-col justify-end">
        <div className="flex items-center gap-3 mb-4">
          <span className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-[10px] uppercase tracking-widest text-white border border-white/20">
            {destination.tag}
          </span>
          <span className="text-white/40 text-xs tracking-widest uppercase">{destination.country}</span>
        </div>

        <h3 className="font-editorial text-3xl md:text-5xl text-white mb-4 group-hover:translate-x-2 transition-transform duration-500">
          {destination.name}
        </h3>

        <p className="text-white/60 text-sm md:text-lg max-w-md mb-8 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          {destination.description}
        </p>

        <Link
          to={`/teo?q=Quero planejar uma viagem para ${destination.name}`}
          className="flex items-center gap-3 text-gold-light font-medium group/btn"
        >
          <span className="text-sm uppercase tracking-widest">Consultar Téo</span>
          <div className="w-10 h-10 rounded-full border border-gold/30 flex items-center justify-center group-hover/btn:bg-gold group-hover/btn:text-black transition-all">
            <MessageCircle className="w-4 h-4" />
          </div>
        </Link>
      </div>
    </motion.div>
  );
};