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

const Index = () => {
  return (
    <div className="min-h-screen bg-background relative">
      <Header />

      <main>
        {/* 1 — Hero: Téo as protagonist */}
        <TeoHeroConversation />

        {/* 2 — Social proof strip */}
        <SocialProofStrip />

        {/* 3 — Live Téo demo */}
        <TeoLiveDemo />

        {/* 4 — Destinos nacionais e internacionais (carrosséis horizontais) */}
        <DestinationsCarousels />

        {/* 5 — How it works */}
        <HowItWorksTimeline />

        {/* 6 — Comparison */}
        <ComparisonTable />

        {/* 7 — Conditional offers (only renders if there are active offers) */}
        <ActiveOffersCarousel />

        {/* 8 — Testimonials */}
        <TestimonialsWall />

        {/* 9 — Closing CTA */}
        <ClosingCTA />
      </main>

      <Footer />

      {/* Floating Téo (replaces generic WhatsApp on home) */}
      <FloatingTeoButton />
    </div>
  );
};

export default Index;
