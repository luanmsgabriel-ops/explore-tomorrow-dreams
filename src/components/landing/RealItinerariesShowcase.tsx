import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { EditorialHeading } from './EditorialHeading';

interface Itinerary {
  destination: string;
  country: string;
  days: number;
  travelers: string;
  highlight: string;
  image: string;
}

const ITINERARIES: Itinerary[] = [
  {
    destination: 'Santorini',
    country: 'Grécia',
    days: 7,
    travelers: 'Casal · Romântico',
    highlight: 'Pôr do sol em Oia + Jantar privativo',
    image:
      'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=800&q=70',
  },
  {
    destination: 'Maldivas',
    country: 'Atol de Malé',
    days: 8,
    travelers: 'Casal · Lua de mel',
    highlight: 'Overwater bungalow + snorkel privativo',
    image:
      'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=1200&q=70',
  },
  {
    destination: 'Noronha',
    country: 'Brasil',
    days: 6,
    travelers: 'Casal · Aventura',
    highlight: 'Mergulho com golfinhos + Baía do Sancho',
    image:
      'https://images.unsplash.com/photo-1544550581-5f7ceaf7f992?auto=format&fit=crop&w=1200&q=70',
  },
  {
    destination: 'Paris',
    country: 'França',
    days: 5,
    travelers: 'Solo · Cultural',
    highlight: 'Louvre VIP + Piquenique no Sena',
    image:
      'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=70',
  },
];

export const RealItinerariesShowcase = () => {
  return (
    <section className="relative py-20 md:py-28 border-t border-gold/10">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
          <EditorialHeading eyebrow="Roteiros reais" size="lg">
            Viagens que o Téo
            <br />
            <span className="font-editorial-italic gradient-text-teal">
              já montou
            </span>
            .
          </EditorialHeading>

          <Link
            to="/teo"
            className="inline-flex items-center gap-2 text-sm text-gold-light hover:text-gold transition-colors group whitespace-nowrap"
          >
            Conversar com o Téo
            <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {ITINERARIES.map((it) => (
            <Link
              key={it.destination}
              to={`/teo?q=Quero um roteiro como este de ${it.destination}`}
              className="group relative overflow-hidden rounded-2xl border border-gold/15 bg-ocean-surface/40 transition-all duration-500 hover:border-gold/40 hover:-translate-y-1"
            >
              <div className="relative aspect-[3/4] overflow-hidden">
                <img
                  src={it.image}
                  alt={it.destination}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ocean-deep via-ocean-deep/40 to-transparent" />

                {/* Days badge */}
                <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full glass-gold text-[10px] font-semibold text-foreground">
                  {it.days} dias
                </div>

                {/* Content overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-gold-light/80 mb-1">
                    {it.country}
                  </p>
                  <h3 className="font-editorial text-2xl text-foreground mb-2 leading-tight">
                    {it.destination}
                  </h3>
                  <p className="text-xs text-foreground/70 mb-1">
                    {it.travelers}
                  </p>
                  <p className="text-xs text-foreground/90 leading-snug">
                    {it.highlight}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};
