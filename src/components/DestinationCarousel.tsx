import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DestinationCard } from './DestinationCard';

interface Destination {
  id: string;
  name: string;
  location: string;
  image: string;
  category: string;
}

interface DestinationCarouselProps {
  title: string;
  destinations: Destination[];
  accentColor?: 'teal' | 'gold';
}

export const DestinationCarousel = ({ title, destinations, accentColor = 'teal' }: DestinationCarouselProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 320;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  return (
    <section className="py-8 md:py-12">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className={`font-serif text-2xl md:text-3xl font-bold ${accentColor === 'gold' ? 'gradient-text-gold' : 'gradient-text-teal'}`}>
            {title}
          </h2>

          {/* Navigation buttons */}
          <div className="hidden md:flex items-center gap-2">
            <button
              onClick={() => scroll('left')}
              className="p-2 rounded-full bg-secondary hover:bg-muted transition-colors duration-300"
              aria-label="Anterior"
            >
              <ChevronLeft className="w-5 h-5 text-foreground" />
            </button>
            <button
              onClick={() => scroll('right')}
              className="p-2 rounded-full bg-secondary hover:bg-muted transition-colors duration-300"
              aria-label="Próximo"
            >
              <ChevronRight className="w-5 h-5 text-foreground" />
            </button>
          </div>
        </div>
      </div>

      {/* Carousel */}
      <div
        ref={scrollRef}
        className="carousel-scroll flex gap-4 overflow-x-auto px-4 lg:px-8 pb-4"
      >
        {/* Left padding spacer for container alignment */}
        <div className="shrink-0 w-0 lg:w-[calc((100vw-1400px)/2)]" />
        
        {destinations.map((destination) => (
          <div key={destination.id} className="shrink-0">
            <DestinationCard {...destination} />
          </div>
        ))}
        
        {/* Right padding spacer */}
        <div className="shrink-0 w-4 lg:w-[calc((100vw-1400px)/2)]" />
      </div>
    </section>
  );
};
