import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { MapPin, Calendar, Users, Clock, Loader2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

interface Destination {
  id: string;
  name: string;
  description: string;
  location: string;
  best_time: string;
  ideal_duration: string;
  for_who: string;
  image_url: string | null;
}

interface ClientExploreDestinationProps {
  destinationId: string | null;
  destinationName: string;
}

export const ClientExploreDestination = ({ destinationId, destinationName }: ClientExploreDestinationProps) => {
  const [destination, setDestination] = useState<Destination | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (destinationId) {
      fetchDestination();
    } else {
      setIsLoading(false);
    }
  }, [destinationId]);

  const fetchDestination = async () => {
    if (!destinationId) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('destinations')
        .select('*')
        .eq('id', destinationId)
        .single();

      if (error) throw error;
      setDestination(data);
    } catch (error) {
      console.error('Error fetching destination:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!destination) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="font-serif text-2xl font-bold text-foreground">
            Explore {destinationName}
          </h2>
          <p className="text-muted-foreground mt-1">
            Descubra o que fazer no seu destino
          </p>
        </div>

        <div className="glass rounded-2xl p-8 text-center">
          <MapPin className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="font-serif text-xl font-bold text-foreground mb-2">
            Informações do destino em breve
          </h3>
          <p className="text-muted-foreground mb-6">
            Estamos preparando dicas e atividades especiais para {destinationName}.
          </p>
          <a
            href={`https://www.google.com/search?q=o+que+fazer+em+${encodeURIComponent(destinationName)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 btn-primary"
          >
            <ExternalLink className="w-4 h-4" />
            Pesquisar sobre {destinationName}
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl font-bold text-foreground">
          Explore {destination.name}
        </h2>
        <p className="text-muted-foreground mt-1">
          Descubra o que fazer no seu destino
        </p>
      </div>

      {/* Destination Hero */}
      {destination.image_url && (
        <div className="relative h-64 rounded-2xl overflow-hidden">
          <img
            src={destination.image_url}
            alt={destination.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
          <div className="absolute bottom-4 left-4">
            <h3 className="font-serif text-3xl font-bold text-foreground">
              {destination.name}
            </h3>
            <p className="flex items-center gap-1 text-muted-foreground">
              <MapPin className="w-4 h-4" />
              {destination.location}
            </p>
          </div>
        </div>
      )}

      {/* Quick Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="w-5 h-5 text-primary" />
            <span className="font-medium text-foreground">Melhor Época</span>
          </div>
          <p className="text-muted-foreground text-sm">{destination.best_time}</p>
        </div>

        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-5 h-5 text-primary" />
            <span className="font-medium text-foreground">Duração Ideal</span>
          </div>
          <p className="text-muted-foreground text-sm">{destination.ideal_duration}</p>
        </div>

        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-5 h-5 text-primary" />
            <span className="font-medium text-foreground">Ideal Para</span>
          </div>
          <p className="text-muted-foreground text-sm">{destination.for_who}</p>
        </div>
      </div>

      {/* Description */}
      <div className="glass rounded-2xl p-6">
        <h3 className="font-serif text-lg font-bold text-foreground mb-4">
          Sobre o Destino
        </h3>
        <p className="text-muted-foreground leading-relaxed">
          {destination.description}
        </p>
      </div>

      {/* External Links */}
      <div className="glass rounded-2xl p-6">
        <h3 className="font-serif text-lg font-bold text-foreground mb-4">
          Pesquise Mais
        </h3>
        <div className="flex flex-wrap gap-3">
          <a
            href={`https://www.google.com/search?q=passeios+em+${encodeURIComponent(destination.name)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Passeios
          </a>
          <a
            href={`https://www.google.com/search?q=restaurantes+em+${encodeURIComponent(destination.name)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent/10 text-accent hover:bg-accent/20 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Restaurantes
          </a>
          <a
            href={`https://www.tripadvisor.com/Search?q=${encodeURIComponent(destination.name)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary text-foreground hover:bg-secondary/80 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            TripAdvisor
          </a>
        </div>
      </div>
    </div>
  );
};
