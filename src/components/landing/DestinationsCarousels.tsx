import { Link } from 'react-router-dom';
import { ArrowUpRight, MapPin, Clock, Calendar, MessageSquare } from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { destinations, type Destination } from '@/data/destinations';
import { EditorialHeading } from './EditorialHeading';

const nacionais = destinations.filter((d) => d.type === 'nacional');
const internacionais = destinations.filter((d) => d.type === 'internacional');

const DestinationCard = ({ d, index }: { d: Destination; index: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay: (index % 4) * 0.1 }}
    className="group relative shrink-0 w-[85vw] sm:w-[320px] lg:w-[360px] snap-center md:snap-start"
  >
    <Link
      to={`/teo?q=Quero saber mais sobre ${d.name}`}
      className="block relative aspect-[4/5] overflow-hidden rounded-3xl bg-zinc-900 border border-white/5 transition-all duration-700 group-hover:border-gold/30 shadow-2xl"
    >
      <img
        src={d.image}
        alt={d.name}
        loading="lazy"
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1.5s] ease-out group-hover:scale-110 opacity-70 group-hover:opacity-90"
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
  </motion.div>
);

const Carousel = ({
  title,
  italicWord,
  eyebrow,
  items,
  viewAllHref,
  scrollOffset = -300,
}: {
  title: string;
  italicWord: string;
  eyebrow: string;
  items: Destination[];
  viewAllHref: string;
  scrollOffset?: number;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const x = useTransform(scrollYProgress, [0, 1], [0, scrollOffset]);

  return (
    <div ref={containerRef} className="mb-24 last:mb-0">
      <div className="container mx-auto px-4 lg:px-8 mb-12">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div className="max-w-2xl">
            <motion.span 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="text-gold tracking-[0.5em] text-[10px] md:text-xs uppercase mb-4 block font-bold"
            >
              {eyebrow}
            </motion.span>
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

      <div className="relative overflow-x-auto snap-x snap-mandatory scrollbar-hide">
        <motion.div 
          style={{ x }}
          drag="x"
          dragConstraints={{ left: -1000, right: 0 }}
          dragElastic={0.2}
          className="flex gap-8 px-4 lg:px-8 pb-12 w-max cursor-grab active:cursor-grabbing"
        >
          {items.map((d, i) => (
            <DestinationCard key={d.id} d={d} index={i} />
          ))}
          <div className="shrink-0 w-8 md:w-32" aria-hidden="true" />
        </motion.div>
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
        scrollOffset={window.innerWidth < 768 ? -80 : window.innerWidth < 1024 ? -180 : -300}
      />
      
      <Carousel
        eyebrow="Mundo Editorial"
        title="As capitais do"
        italicWord="desejo"
        items={internacionais}
        viewAllHref="/internacional"
        scrollOffset={window.innerWidth < 768 ? -80 : window.innerWidth < 1024 ? -180 : -300}
      />
    </section>
  );
};