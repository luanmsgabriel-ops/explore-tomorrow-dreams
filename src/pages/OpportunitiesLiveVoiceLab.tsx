import { ArrowLeft } from "lucide-react";

import { OpportunityButton, OpportunityHeader } from "@/components/opportunities";
import { LiveVoiceLab } from "@/components/opportunities/live/LiveVoiceLab";

const navItems = [
  { label: "Catálogo", href: "/oportunidades/catalogo" },
  { label: "Live", href: "/oportunidades/live" },
  { label: "Comparar", href: "/oportunidades/comparar" },
];

export default function OpportunitiesLiveVoiceLab() {
  return (
    <div className="opportunities-theme min-h-screen bg-tomorrow-background text-tomorrow-text">
      <OpportunityHeader activeHref="/oportunidades/live" navItems={navItems} ctaHref="/oportunidades/live" ctaLabel="Voltar ao Live" />
      <main className="border-t border-tomorrow-line bg-[radial-gradient(circle_at_50%_0%,rgba(50,159,158,.13),transparent_38%),linear-gradient(180deg,#041315_0%,#041012_100%)] py-5 sm:py-8">
        <div className="mx-auto flex w-full max-w-[90rem] items-center px-4 sm:px-6 lg:px-8">
          <OpportunityButton asChild variant="ghost"><a href="/oportunidades/live"><ArrowLeft aria-hidden="true" />Tomorrow Live</a></OpportunityButton>
        </div>
        <LiveVoiceLab />
      </main>
    </div>
  );
}
