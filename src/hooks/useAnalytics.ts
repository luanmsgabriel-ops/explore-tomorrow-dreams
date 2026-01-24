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
      const { data: { user } } = await supabase.auth.getUser();
      
      // Use type assertion since analytics_events may not be in generated types yet
      await (supabase.from('analytics_events') as any).insert({
        event_type: eventType,
        event_data: eventData,
        page_path: pagePath || location.pathname,
        referrer: document.referrer || null,
        user_agent: navigator.userAgent,
        session_id: sessionId.current,
        user_id: user?.id || null,
        ip_hash: await hashString(sessionId.current + navigator.userAgent),
      });
    } catch (error) {
      // Silently fail - analytics shouldn't break the app
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
    const { data: { user } } = await supabase.auth.getUser();
    
    // Use type assertion since analytics_events may not be in generated types yet
    await (supabase.from('analytics_events') as any).insert({
      event_type: eventType,
      event_data: eventData,
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