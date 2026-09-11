import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { TeoHeroConversation } from '@/components/landing/TeoHeroConversation';
import { HowItWorksTimeline } from '@/components/landing/HowItWorksTimeline';
import { ClosingCTA } from '@/components/landing/ClosingCTA';
import { FloatingTeoButton } from '@/components/landing/FloatingTeoButton';
import { LandingFAQ } from '@/components/landing/LandingFAQ';
import { TrustBar } from '@/components/landing/TrustBar';
import { RealStories } from '@/components/landing/RealStories';
import { GoogleReviews } from '@/components/landing/GoogleReviews';
import { HomeOpportunityShowcase } from '@/components/landing/HomeOpportunityShowcase';
import { RadarAccess } from '@/components/landing/RadarAccess';

const Index = () => {
  return (
    <div className="min-h-screen bg-background relative selection:bg-gold/30">
      <Header />

      <main>
        <TeoHeroConversation />
        <TrustBar />
        <HomeOpportunityShowcase />
        <RadarAccess />
        <HowItWorksTimeline />
        <RealStories />
        <GoogleReviews />
        <LandingFAQ />
        <ClosingCTA />
      </main>

      <Footer />
      <FloatingTeoButton />
    </div>
  );
};

export default Index;
