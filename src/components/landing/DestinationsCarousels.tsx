import { Link } from 'react-router-dom';
import { ArrowUpRight, MapPin, Clock, Calendar } from 'lucide-react';
import { destinations, type Destination } from '@/data/destinations';
import { EditorialHeading } from './EditorialHeading';

const nacionais = destinations.filter((d) => d.type === 'nacional');
const internacionais = destinations.filter((d) => d.type === 'internacional');

const DestinationCard = ({ d }: { d: Destination }) => (
  <Link
    to={`/destino/${d.id}`}
    className="group relative shrink-0 w-[78vw] sm:w-[340px] lg:w-[380px] snap-start overflow-hidden rounded-2xl border border-gold/15 bg-ocean-surface/40 transition-all duration-500 hover:border-gold/40 hover:-translate-y-1"
  >
    <div className="relative aspect-[3/4] overflow-hidden">
      <img
        src={d.image}
        alt={d.name}
        loading="lazy"
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1200ms] group-hover:scale-110"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-ocean-deep via-ocean-deep/40 to-transparent" />

      {/* Category badge */}
      <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full glass-gold text-[10px] font-semibold tracking-wider uppercase text-foreground">
        {d.category}
      </div>

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-5">
        <div className="flex items-center gap-1 text-[10px] uppercase tracking-[0.2em] text-gold-light/80 mb-2">
          <MapPin className="w-3 h-3" />
          {d.location}
        </div>
        <h3 className="font-editorial text-3xl text-foreground mb-2 leading-tight">
          {d.name}
        </h3>
        <p className="text-xs text-foreground/75 leading-snug mb-4 line-clamp-2">
          {d.description}
        </p>

        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-foreground/70 mb-4">
          <span className="inline-flex items-center gap-1">
            <Calendar className="w-3 h-3 text-gold-light" />
            {d.bestTime}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="w-3 h-3 text-gold-light" />
            {d.idealDuration}
          </span>
        </div>

        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-gold-light group-hover:text-gold transition-colors">
          Ver destino e roteiros
          <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </span>
      </div>
    </div>
  </Link>
);

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
}) => (
  <div className="mb-16 last:mb-0">
    <div className="container mx-auto px-4 lg:px-8 mb-8">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <EditorialHeading eyebrow={eyebrow} size="md">
          {title}{' '}
          <span className="font-editorial-italic gradient-text-teal">
            {italicWord}
          </span>
          .
        </EditorialHeading>
        <Link
          to={viewAllHref}
          className="inline-flex items-center gap-2 text-sm text-gold-light hover:text-gold transition-colors group whitespace-nowrap"
        >
          Ver todos
          <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Link>
      </div>
    </div>

    <div className="relative">
      <div className="flex gap-5 overflow-x-auto snap-x snap-mandatory scrollbar-hide px-4 lg:px-8 pb-4">
        {items.map((d) => (
          <DestinationCard key={d.id} d={d} />
        ))}
        {/* trailing spacer for snap */}
        <div className="shrink-0 w-2" aria-hidden="true" />
      </div>
    </div>
  </div>
);

export const DestinationsCarousels = () => {
  return (
    <section className="relative py-20 md:py-28 border-t border-gold/10">
      <Carousel
        eyebrow="Brasil"
        title="Nosso país"
        italicWord="encanta"
        items={nacionais}
        viewAllHref="/nacional"
      />
      <Carousel
        eyebrow="Mundo"
        title="O planeta"
        italicWord="espera"
        items={internacionais}
        viewAllHref="/internacional"
      />
    </section>
  );
};
