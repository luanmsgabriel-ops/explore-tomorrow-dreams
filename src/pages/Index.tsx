import { Header } from '@/components/Header';
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
import { CinematicDestinations } from '@/components/landing/CinematicDestinations';
import { LandingFAQ } from '@/components/landing/LandingFAQ';
import { ExploreTheWorld } from '@/components/landing/ExploreTheWorld';

const JourneyConnector = () => (
  <div className="h-32 w-full flex justify-center items-center pointer-events-none relative overflow-hidden">
    <div className="w-px h-full bg-gradient-to-b from-transparent via-gold/40 to-transparent relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-gold rounded-full blur-[2px] animate-pulse" />
    </div>
  </div>
);

const Index = () => {
  return (
    <div className="min-h-screen bg-background relative selection:bg-gold/30">
      <Header />
      
      <main>
        {/* 1 — Hero: Téo as protagonist */}
        <TeoHeroConversation />

        {/* 2 — Live Téo demo (Mover para posição 2 para antecipar conversão) */}
        <TeoLiveDemo />

        <JourneyConnector />

        {/* 3 — Cinematic Destinations Section */}
        <CinematicDestinations />

        <JourneyConnector />

        {/* 4 — Real Itineraries Showcase */}
        <RealItinerariesShowcase />

        <JourneyConnector />

        {/* 5 — Destinos nacionais e internacionais */}
        <DestinationsCarousels />

        {/* 6 — How it works */}
        <HowItWorksTimeline />

        {/* 7 — Social proof strip */}
        <SocialProofStrip />

        {/* 8 — Comparison */}
        <ComparisonTable />

        {/* 9 — Conditional offers */}
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

      {/* Floating Téo */}
      <FloatingTeoButton />
    </div>
  );
};

export default Index;
