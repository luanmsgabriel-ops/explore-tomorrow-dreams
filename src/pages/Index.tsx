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

        {/* 2 — Live Téo demo */}
        <TeoLiveDemo />

        <JourneyConnector />

        {/* 3 — Social proof strip (Replaced avatars with silhuetas premium in component) */}
        <SocialProofStrip />

        <JourneyConnector />

        {/* 4 — How it works */}
        <HowItWorksTimeline />

        <JourneyConnector />

        {/* 5 — Cinematic Destinations Section */}
        <CinematicDestinations />

        <JourneyConnector />

        {/* 6 — Real Itineraries Showcase */}
        <RealItinerariesShowcase />

        <JourneyConnector />

        {/* 7 — Comparison */}
        <ComparisonTable />

        {/* 8 — Conditional offers (Mantido por ser conversão direta) */}
        <ActiveOffersCarousel />

        {/* 9 — Testimonials */}
        <TestimonialsWall />

        {/* 10 — FAQ */}
        <LandingFAQ />
        
        <JourneyConnector />

        {/* 11 — Closing CTA */}
        <ClosingCTA />
      </main>

      <Footer />

      {/* Floating Téo */}
      <FloatingTeoButton />
    </div>
  );
};

export default Index;
