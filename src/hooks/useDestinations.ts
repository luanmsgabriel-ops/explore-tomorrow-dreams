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
const transformDestination = (record: any): Destination => ({
  id: record.slug, // Use slug as ID for URLs
  slug: record.slug,
  name: record.name,
  location: record.location,
  image: record.image_url || '/placeholder.svg',
  category: record.category,
  type: record.type,
  description: record.description,
  bestTime: record.best_time,
  idealDuration: record.ideal_duration,
  forWho: record.for_who,
  videos: Array.isArray(record.videos) ? record.videos : [],
  isFeatured: record.is_featured || false,
  bestPricePeriods: Array.isArray(record.best_price_periods) ? record.best_price_periods : [],
});

export const useDestinations = (type?: 'explorar' | 'nacional' | 'internacional') => {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDestinations = async () => {
      setIsLoading(true);
      try {
        let query = supabase
          .from('destinations')
          .select('*')
          .eq('is_active', true)
          .order('name');

        if (type) {
          query = query.eq('type', type);
        }

        const { data, error: fetchError } = await query;

        if (fetchError) throw fetchError;

        const transformed = (data || []).map(transformDestination);
        setDestinations(transformed);
      } catch (err: any) {
        console.error('Error fetching destinations:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDestinations();
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
