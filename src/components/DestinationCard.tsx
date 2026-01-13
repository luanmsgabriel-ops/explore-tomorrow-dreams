import { Play, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

interface DestinationCardProps {
  id: string;
  name: string;
  location: string;
  image: string;
  category: string;
}

export const DestinationCard = ({ id, name, location, image, category }: DestinationCardProps) => {
  return (
    <Link to={`/destino/${id}`} className="block">
      <div className="destination-card group aspect-[2/3] min-w-[200px] md:min-w-[280px]">
        {/* Image */}
        <img
          src={image}
          alt={name}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          loading="lazy"
        />

        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent opacity-60 group-hover:opacity-90 transition-opacity duration-300" />

        {/* Play button on hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 z-10">
          <div className="w-16 h-16 rounded-full bg-primary/90 flex items-center justify-center transform scale-75 group-hover:scale-100 transition-transform duration-300">
            <Play className="w-7 h-7 text-primary-foreground ml-1" fill="currentColor" />
          </div>
        </div>

        {/* Content */}
        <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
          {/* Category badge */}
          <span className="inline-block px-2 py-1 text-xs font-medium rounded bg-primary/20 text-primary mb-2">
            {category}
          </span>

          {/* Title */}
          <h3 className="font-serif text-xl md:text-2xl font-bold text-foreground mb-1 line-clamp-2">
            {name}
          </h3>

          {/* Location */}
          <div className="flex items-center gap-1 text-muted-foreground text-sm">
            <MapPin className="w-4 h-4" />
            <span>{location}</span>
          </div>
        </div>
      </div>
    </Link>
  );
};
