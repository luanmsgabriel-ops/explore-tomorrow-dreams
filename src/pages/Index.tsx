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
import { HeroBackgroundVideo } from '@/components/landing/HeroBackgroundVideo';

const Index = () => {
  return (
    <div className="min-h-screen bg-background relative">
      <Header />

      <main>
        {/* 1 — Hero: Téo as protagonist */}
        <TeoHeroConversation />

        {/* 2 — Cinematic Video Section (Desktop) */}
        <section className="relative h-[60vh] md:h-[80vh] overflow-hidden hidden md:block border-y border-gold/10">
          <HeroBackgroundVideo />
          <div className="absolute inset-0 flex items-center justify-center text-center px-4">
            <div className="max-w-4xl">
              <h2 className="font-editorial text-5xl md:text-7xl text-foreground mb-6 drop-shadow-2xl">
                O mundo como você <br/>
                <span className="font-editorial-italic gradient-text-teal">nunca viu</span>.
              </h2>
              <p className="text-lg md:text-xl text-foreground/90 max-w-2xl mx-auto font-medium drop-shadow-lg">
                Destinos curados com o olhar de quem entende que viajar é colecionar memórias inesquecíveis.
              </p>
            </div>
          </div>
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce opacity-50">
            <div className="w-px h-12 bg-gold-light" />
          </div>
        </section>

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

        {/* 11 — Closing CTA */}
        <ClosingCTA />
      </main>

      <Footer />

      {/* Floating Téo (replaces generic WhatsApp on home) */}
      <FloatingTeoButton />
    </div>
  );
};

export default Index;
