import { useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

// Generate a unique session ID
const getSessionId = () => {
  let sessionId = sessionStorage.getItem('analytics_session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('analytics_session_id', sessionId);
  }
  return sessionId;
};

// Cache geolocation data per session
let geoDataCache: { city?: string; region?: string; country?: string; lat?: number; lon?: number } | null = null;
let geoFetchPromise: Promise<typeof geoDataCache> | null = null;

const fetchGeoData = async () => {
  if (geoDataCache) return geoDataCache;
  if (geoFetchPromise) return geoFetchPromise;
  
  geoFetchPromise = fetch('https://ipapi.co/json/')
    .then(res => res.json())
    .then(data => {
      geoDataCache = {
        city: data.city || null,
        region: data.region || null,
        country: data.country_name || null,
        lat: data.latitude || null,
        lon: data.longitude || null,
      };
      return geoDataCache;
    })
    .catch(() => {
      geoDataCache = {};
      return geoDataCache;
    });
  
  return geoFetchPromise;
};

// Hash function for IP (we don't store raw IPs)
const hashString = async (str: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 16);
};

interface TrackEventOptions {
  eventType: string;
  eventData?: Record<string, unknown>;
  pagePath?: string;
}

export const useAnalytics = () => {
  const location = useLocation();
  const lastTrackedPath = useRef<string>('');
  const sessionId = useRef(getSessionId());

  const trackEvent = useCallback(async ({ eventType, eventData = {}, pagePath }: TrackEventOptions) => {
    try {
      const [{ data: { user } }, geo] = await Promise.all([
        supabase.auth.getUser(),
        fetchGeoData(),
      ]);
      
      await (supabase.from('analytics_events') as any).insert({
        event_type: eventType,
        event_data: { ...eventData, geo_city: geo?.city, geo_region: geo?.region, geo_country: geo?.country },
        page_path: pagePath || location.pathname,
        referrer: document.referrer || null,
        user_agent: navigator.userAgent,
        session_id: sessionId.current,
        user_id: user?.id || null,
        ip_hash: await hashString(sessionId.current + navigator.userAgent),
      });
    } catch (error) {
      console.debug('Analytics tracking error:', error);
    }
  }, [location.pathname]);

  // Track page views automatically
  useEffect(() => {
    // Avoid tracking the same path multiple times in quick succession
    if (location.pathname !== lastTrackedPath.current) {
      lastTrackedPath.current = location.pathname;
      trackEvent({ 
        eventType: 'page_view',
        pagePath: location.pathname,
        eventData: {
          search: location.search,
          hash: location.hash,
        }
      });
    }
  }, [location.pathname, location.search, trackEvent]);

  // Convenience methods for common events
  const trackDestinationView = useCallback((destinationId: string, destinationName: string) => {
    trackEvent({
      eventType: 'destination_view',
      eventData: { destination_id: destinationId, destination_name: destinationName }
    });
  }, [trackEvent]);

  const trackQuoteStart = useCallback((destinationName?: string) => {
    trackEvent({
      eventType: 'quote_start',
      eventData: { destination_name: destinationName }
    });
  }, [trackEvent]);

  const trackQuoteSubmit = useCallback((destinationName?: string) => {
    trackEvent({
      eventType: 'quote_submit',
      eventData: { destination_name: destinationName }
    });
  }, [trackEvent]);

  const trackOfferView = useCallback((offerId: string, offerTitle: string) => {
    trackEvent({
      eventType: 'offer_view',
      eventData: { offer_id: offerId, offer_title: offerTitle }
    });
  }, [trackEvent]);

  const trackSearch = useCallback((query: string, resultsCount: number) => {
    trackEvent({
      eventType: 'search',
      eventData: { query, results_count: resultsCount }
    });
  }, [trackEvent]);

  const trackWhatsAppClick = useCallback((context?: string) => {
    trackEvent({
      eventType: 'whatsapp_click',
      eventData: { context }
    });
  }, [trackEvent]);

  const trackItineraryGenerate = useCallback((destinationName: string) => {
    trackEvent({
      eventType: 'itinerary_generate',
      eventData: { destination_name: destinationName }
    });
  }, [trackEvent]);

  const trackImageGenerate = useCallback((destinationName: string) => {
    trackEvent({
      eventType: 'image_generate',
      eventData: { destination_name: destinationName }
    });
  }, [trackEvent]);

  return {
    trackEvent,
    trackDestinationView,
    trackQuoteStart,
    trackQuoteSubmit,
    trackOfferView,
    trackSearch,
    trackWhatsAppClick,
    trackItineraryGenerate,
    trackImageGenerate,
  };
};

// Standalone tracker for components outside Router context
export const trackEventStandalone = async (eventType: string, eventData: Record<string, unknown> = {}) => {
  try {
    const sessionId = getSessionId();
    const [{ data: { user } }, geo] = await Promise.all([
      supabase.auth.getUser(),
      fetchGeoData(),
    ]);
    
    await (supabase.from('analytics_events') as any).insert({
      event_type: eventType,
      event_data: { ...eventData, geo_city: geo?.city, geo_region: geo?.region, geo_country: geo?.country },
      page_path: window.location.pathname,
      referrer: document.referrer || null,
      user_agent: navigator.userAgent,
      session_id: sessionId,
      user_id: user?.id || null,
      ip_hash: sessionId.slice(0, 16),
    });
  } catch (error) {
    console.debug('Analytics tracking error:', error);
  }
};