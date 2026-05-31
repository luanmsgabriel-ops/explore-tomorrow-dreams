import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { GoldenCompass } from '@/components/GoldenCompass';
import { Footer } from '@/components/Footer';
import { TeoHeroConversation } from '@/components/landing/TeoHeroConversation';
import { SocialProofStrip } from '@/components/landing/SocialProofStrip';
import { TeoLiveDemo } from '@/components/landing/TeoLiveDemo';
import { DestinationsCarousels } from '@/components/landing/DestinationsCarousels';
import { HowItWorksTimeline } from '@/components/landing/HowItWorksTimeline';
import { ComparisonTable } from '@/components/landing/ComparisonTable';
import { TestimonialsWall } from '@/components/landing/TestimonialsWall';
import { ClosingCTA } from '@/components/landing/ClosingCTA';
import { FloatingTeoButton } from '@/components/landing/FloatingTeoButton';
import { ActiveOffersCarousel } from '@/components/ActiveOffersCarousel';
import { RealItinerariesShowcase } from '@/components/landing/RealItinerariesShowcase';
import { HeroBackgroundVideo } from '@/components/landing/HeroBackgroundVideo';
import { CinematicDestinations } from '@/components/landing/CinematicDestinations';
import { LandingFAQ } from '@/components/landing/LandingFAQ';
import { ExploreTheWorld } from '@/components/landing/ExploreTheWorld';
import { CompassBar } from '@/components/landing/CompassBar';

const JourneyConnector = () => (
  <div className="h-32 w-full flex justify-center items-center pointer-events-none relative overflow-hidden">
    <div className="w-px h-full bg-gradient-to-b from-transparent via-gold/40 to-transparent relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-gold rounded-full blur-[2px] animate-pulse" />
    </div>
  </div>
);

const Index = () => {
  const [navState, setNavState] = useState({
    destination: 'Explorando',
    direction: 'Comece sua jornada',
    angle: 0,
    visible: false
  });

  useEffect(() => {
    const handleScroll = () => {
      const scrollPos = window.scrollY;
      const heroHeight = window.innerHeight;
      
      if (scrollPos > heroHeight * 0.5) {
        setNavState(prev => ({ ...prev, visible: true }));
      } else {
        setNavState(prev => ({ ...prev, visible: false }));
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-background relative selection:bg-gold/30">
      <Header />
      
      {/* Global Navigator - The Journey Guide */}
      <div 
        className={`fixed top-0 left-0 right-0 z-[60] pointer-events-none transition-all duration-700 transform ${
          navState.visible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
        }`}
      >
        <CompassBar 
          destination={navState.destination} 
          direction={navState.direction} 
          angle={navState.angle} 
        />
      </div>

      <main>
        {/* 1 — Hero: Téo as protagonist */}
        <TeoHeroConversation />

        {/* 2 — Cinematic Destinations Section */}
        <CinematicDestinations onStateChange={(state) => setNavState(prev => ({ ...prev, ...state }))} />

        <JourneyConnector />

        {/* 3 — Live Téo demo */}
        <TeoLiveDemo />

        {/* 4 — Real Itineraries Showcase */}
        <RealItinerariesShowcase />

        <JourneyConnector />

        {/* 5 — Destinos nacionais e internacionais (carrosséis horizontais) */}
        <DestinationsCarousels 
          onStateChange={(state) => setNavState(prev => ({ ...prev, ...state }))} 
        />

        {/* 6 — How it works */}
        <HowItWorksTimeline />

        {/* 7 — Social proof strip */}
        <SocialProofStrip />

        {/* 8 — Comparison */}
        <ComparisonTable />

        {/* 9 — Conditional offers (only renders if there are active offers) */}
        <ActiveOffersCarousel />

        {/* 10 — Testimonials */}
        <TestimonialsWall />

        {/* 11 — FAQ */}
        <LandingFAQ />
        
        <JourneyConnector />
        
        {/* 11.5 — Explore the World Cinematic Experience */}
        <ExploreTheWorld />

        {/* 12 — Closing CTA */}
        <ClosingCTA />
      </main>

      <Footer />

      {/* Floating Téo (replaces generic WhatsApp on home) */}
      <FloatingTeoButton />
    </div>
  );
};

export default Index;
