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

const transformDestination = (record: any): Destination => {
  let categoryValue = record.category;
  if (typeof categoryValue === 'string' && categoryValue.startsWith('[')) {
    try {
      const parsed = JSON.parse(categoryValue);
      categoryValue = Array.isArray(parsed) ? parsed[0] : categoryValue;
    } catch { }
  } else if (Array.isArray(categoryValue)) {
    categoryValue = categoryValue[0];
  }

  return {
    id: record.slug,
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

let _cachePromise: Promise<Destination[]> | null = null;
let _cache: Destination[] | null = null;

const fetchAllDestinations = async (): Promise<Destination[]> => {
  if (_cache) return _cache;
  if (_cachePromise) return _cachePromise;
  
  _cachePromise = (async () => {
    try {
      const { data, error } = await supabase
        .from('destinations')
        .select('id, slug, name, location, image_url, category, type, description, is_featured')
        .eq('is_active', true)
        .order('name')
        .limit(30);

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
  const [destinations, setDestinations] = useState<Destination[]>(() => {
    if (_cache) {
      return type ? _cache.filter((d) => d.type === type) : _cache;
    }
    return [];
  });
  const [isLoading, setIsLoading] = useState(!_cache);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    
    // Safety timeout: if DB doesn't respond in 3s, stop loading
    const timeoutId = setTimeout(() => {
      if (active) setIsLoading(false);
    }, 3000);

    fetchAllDestinations()
      .then((all) => {
        if (!active) return;
        clearTimeout(timeoutId);
        setDestinations(type ? all.filter((d) => d.type === type) : all);
        setIsLoading(false);
      })
      .catch((err: any) => {
        if (!active) return;
        clearTimeout(timeoutId);
        console.error('Error fetching destinations:', err);
        setError(err.message);
        setIsLoading(false);
      });

    return () => {
      active = false;
      clearTimeout(timeoutId);
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
        setDestination(data ? transformDestination(data) : null);
      } catch (err: any) {
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
        setDestination(data ? transformDestination(data) : null);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchFeaturedDestination();
  }, []);

  return { destination, isLoading, error };
};
