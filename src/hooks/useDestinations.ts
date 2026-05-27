import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface DestinationVideo {
  id: string;
  title: string;
  youtubeId: string;
}

export interface BestPricePeriod {
  period: string;
  reason: string;
}

export interface Destination {
  id: string;
  slug: string;
  name: string;
  location: string;
  image: string;
  category: string;
  type: 'explorar' | 'nacional' | 'internacional';
  description: string;
  bestTime: string;
  idealDuration: string;
  forWho: string;
  videos: DestinationVideo[];
  isFeatured?: boolean;
  bestPricePeriods?: BestPricePeriod[];
}

// Transform database record to frontend format
const transformDestination = (record: any): Destination => {
  // Handle category that might be stored as JSON array
  let categoryValue = record.category;
  if (typeof categoryValue === 'string' && categoryValue.startsWith('[')) {
    try {
      const parsed = JSON.parse(categoryValue);
      categoryValue = Array.isArray(parsed) ? parsed[0] : categoryValue;
    } catch {
      // Keep original if parse fails
    }
  } else if (Array.isArray(categoryValue)) {
    categoryValue = categoryValue[0];
  }

  return {
    id: record.slug, // Use slug as ID for URLs
    slug: record.slug,
    name: record.name,
    location: record.location,
    image: record.image_url || '/placeholder.svg',
    category: categoryValue || 'Destino',
    type: record.type,
    description: record.description,
    bestTime: record.best_time,
    idealDuration: record.ideal_duration,
    forWho: record.for_who,
    videos: Array.isArray(record.videos) ? record.videos : [],
    isFeatured: record.is_featured || false,
    bestPricePeriods: Array.isArray(record.best_price_periods) ? record.best_price_periods : [],
  };
};

// In-memory cache shared by all useDestinations() calls in the page lifecycle.
// Prevents the home page from firing 3 parallel "SELECT *" queries against
// the destinations table (which was causing 57014 statement timeouts).
let _cachePromise: Promise<Destination[]> | null = null;
let _cache: Destination[] | null = null;

const fetchAllDestinations = async (): Promise<Destination[]> => {
  if (_cache) return _cache;
  if (_cachePromise) return _cachePromise;
  
  _cachePromise = (async () => {
    try {
      const { data, error } = await supabase
        .from('destinations')
        .select('id, slug, name, location, image_url, category, type, is_featured')
        .eq('is_active', true)
        .order('name')
        .limit(100);

      if (error) throw error;
      
      _cache = (data || []).map(transformDestination);
      return _cache;
    } catch (err) {
      _cachePromise = null;
      throw err;
    }
  })();
  
  return _cachePromise;
};

export const useDestinations = (type?: 'explorar' | 'nacional' | 'internacional') => {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetchAllDestinations()
      .then((all) => {
        if (!active) return;
        setDestinations(type ? all.filter((d) => d.type === type) : all);
      })
      .catch((err: any) => {
        if (!active) return;
        console.error('Error fetching destinations:', err);
        setError(err.message);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [type]);

  return { destinations, isLoading, error };
};

export const useDestinationById = (id: string) => {
  const [destination, setDestination] = useState<Destination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDestination = async () => {
      if (!id) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const { data, error: fetchError } = await supabase
          .from('destinations')
          .select('*')
          .eq('slug', id)
          .eq('is_active', true)
          .maybeSingle();

        if (fetchError) throw fetchError;

        if (data) {
          setDestination(transformDestination(data));
        } else {
          setDestination(null);
        }
      } catch (err: any) {
        console.error('Error fetching destination:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDestination();
  }, [id]);

  return { destination, isLoading, error };
};

export const useFeaturedDestination = () => {
  const [destination, setDestination] = useState<Destination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFeaturedDestination = async () => {
      setIsLoading(true);
      try {
        const { data, error: fetchError } = await supabase
          .from('destinations')
          .select('*')
          .eq('is_featured', true)
          .eq('is_active', true)
          .maybeSingle();

        if (fetchError) throw fetchError;

        if (data) {
          setDestination(transformDestination(data));
        } else {
          setDestination(null);
        }
      } catch (err: any) {
        console.error('Error fetching featured destination:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFeaturedDestination();
  }, []);

  return { destination, isLoading, error };
};
