import { useState, useEffect, useRef } from 'react';
import { Search, X, MapPin, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { trackEventStandalone } from '@/hooks/useAnalytics';

interface Destination {
  id: string;
  slug: string;
  name: string;
  location: string;
  image_url: string | null;
  category: string;
}

interface DestinationSearchProps {
  onClose?: () => void;
}

export const DestinationSearch = ({ onClose }: DestinationSearchProps) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<Destination[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const searchDestinations = async () => {
      if (query.trim().length >= 2) {
        setIsLoading(true);
        try {
          const { data, error } = await supabase
            .from('destinations')
            .select('id, slug, name, location, image_url, category')
            .eq('is_active', true)
            .or(`name.ilike.%${query}%,location.ilike.%${query}%,category.ilike.%${query}%`)
            .limit(10);

          if (error) throw error;
          setResults(data || []);
          setIsOpen(true);
        } catch (err) {
          console.error('Error searching destinations:', err);
          setResults([]);
        } finally {
          setIsLoading(false);
        }
      } else {
        setResults([]);
        setIsOpen(false);
      }
    };

    const debounce = setTimeout(searchDestinations, 300);
    return () => clearTimeout(debounce);
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (destination: Destination) => {
    trackEventStandalone('search', { query, selected_destination: destination.name, results_count: results.length });
    setQuery('');
    setIsOpen(false);
    onClose?.();
    navigate(`/destino/${destination.slug}`);
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="flex items-center gap-2 bg-secondary/50 rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-primary/50 transition-all">
        {isLoading ? (
          <Loader2 className="w-4 h-4 text-muted-foreground shrink-0 animate-spin" />
        ) : (
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
        )}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar destino..."
          className="bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground w-32 lg:w-40"
        />
        {query && (
          <button
            onClick={handleClear}
            className="p-0.5 hover:bg-secondary rounded transition-colors"
          >
            <X className="w-3 h-3 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Dropdown de resultados */}
      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-xl overflow-hidden z-50 animate-fade-in min-w-[280px]">
          <div className="p-2 border-b border-border bg-secondary/30">
            <span className="text-xs text-muted-foreground">
              {results.length} destino{results.length !== 1 ? 's' : ''} encontrado{results.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="max-h-[300px] overflow-y-auto">
            {results.map((destination) => (
              <button
                key={destination.id}
                onClick={() => handleSelect(destination)}
                className="w-full flex items-center gap-3 p-3 hover:bg-secondary/50 transition-colors text-left"
              >
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-secondary">
                  {destination.image_url ? (
                    <img
                      src={destination.image_url}
                      alt={destination.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-foreground truncate">
                    {destination.name}
                  </h4>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="w-3 h-3" />
                    <span className="truncate">{destination.location}</span>
                  </div>
                </div>
                <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full shrink-0">
                  {destination.category}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Sem resultados */}
      {isOpen && results.length === 0 && query.length >= 2 && !isLoading && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-xl p-4 z-50 animate-fade-in min-w-[280px]">
          <p className="text-sm text-muted-foreground text-center">
            Nenhum destino encontrado para "{query}"
          </p>
        </div>
      )}
    </div>
  );
};
