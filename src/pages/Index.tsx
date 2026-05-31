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

const Index = () => {
  return (
    <div className="min-h-screen bg-background relative">
      <Header />

      <main>
        {/* 1 — Hero: Téo as protagonist */}
        <TeoHeroConversation />

        {/* 2 — Cinematic Destinations Section */}
        <CinematicDestinations />

        {/* 3 — Live Téo demo */}
        <TeoLiveDemo />

        {/* 4 — Real Itineraries Showcase */}
        <RealItinerariesShowcase />

        {/* 5 — Destinos nacionais e internacionais (carrosséis horizontais) */}
        <DestinationsCarousels />

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
