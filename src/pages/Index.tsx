import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { TeoHeroConversation } from '@/components/landing/TeoHeroConversation';
import { SocialProofStrip } from '@/components/landing/SocialProofStrip';
import { TeoLiveDemo } from '@/components/landing/TeoLiveDemo';
import { DestinationsCarousels } from '@/components/landing/DestinationsCarousels';
import { HowItWorksTimeline } from '@/components/landing/HowItWorksTimeline';
import { ComparisonTable } from '@/components/landing/ComparisonTable';
import { ClosingCTA } from '@/components/landing/ClosingCTA';
import { FloatingTeoButton } from '@/components/landing/FloatingTeoButton';
import { ImmersiveVideoShowcase } from '@/components/landing/ImmersiveVideoShowcase';
import { RealItinerariesShowcase } from '@/components/landing/RealItinerariesShowcase';
import { CinematicDestinations } from '@/components/landing/CinematicDestinations';
import { LandingFAQ } from '@/components/landing/LandingFAQ';
import { ExploreTheWorld } from '@/components/landing/ExploreTheWorld';
import { TrustBar } from '@/components/landing/TrustBar';
import { RealStories } from '@/components/landing/RealStories';
import { PostTravelCare } from '@/components/landing/PostTravelCare';
import { GoogleReviews } from '@/components/landing/GoogleReviews';
import { MetricsStrip } from '@/components/landing/MetricsStrip';

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

        {/* 2 — Trust Bar */}
        <TrustBar />

        {/* 3 — Live Téo demo */}
        <TeoLiveDemo />

        <JourneyConnector />

        {/* 4 — Social proof strip */}
        <SocialProofStrip />

        {/* 5 — Real Stories (Trust Building) */}
        <RealStories />
        
        {/* 6 — Real Metrics */}
        <MetricsStrip />

        <JourneyConnector />

        {/* 7 — How it works */}
        <HowItWorksTimeline />

        <JourneyConnector />

        {/* 8 — Cinematic Destinations Section */}
        <CinematicDestinations />

        <JourneyConnector />

        {/* 9 — Real Itineraries Showcase */}
        <RealItinerariesShowcase />

        {/* 10 — Post Travel Care (Emotional) */}
        <PostTravelCare />

        <JourneyConnector />

        {/* 11 — Comparison */}
        <ComparisonTable />

        {/* 12 — Immersive video showcase */}
        <ImmersiveVideoShowcase />

        {/* 13 — Google Reviews */}
        <GoogleReviews />

        {/* 14 — FAQ */}
        <LandingFAQ />
        
        <JourneyConnector />

        {/* 15 — Closing CTA */}
        <ClosingCTA />
      </main>

      <Footer />

      {/* Floating Téo */}
      <FloatingTeoButton />
    </div>
  );
};

export default Index;
