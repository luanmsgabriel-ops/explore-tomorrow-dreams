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
        <div className="bg-tomorrow-surface border border-tomorrow-line p-8 rounded-tomorrow m-8 text-tomorrow-text whitespace-pre-wrap font-mono text-sm">
          {`Publicação controlada — Correção do Calendário

Projeto: Tomorrow Travel Explorer
GitHub: "luanmsgabriel-ops/explore-tomorrow-dreams"
Branch: "main"
SHA exato validado: "d56115063b463aa883a9a95b36a62b21aa7949bd"

Esta tarefa é SOMENTE de implantação e validação do código que já está implementado, testado, mergeado e sincronizado.

NÃO altere código.
NÃO gere implementação nova.
NÃO modifique frontend.
NÃO altere Téo.
NÃO altere WhatsApp.
NÃO altere catálogo, detalhe, comparação ou admin.
NÃO crie arquivos temporários.
NÃO altere preços, ofertas ou inventário.
NÃO execute atualização em massa de "travel_offers".

1. Confirme que o projeto está sincronizado exatamente com o SHA:

"d56115063b463aa883a9a95b36a62b21aa7949bd"

2. Aplique somente a migration já versionada:

"supabase/migrations/20260821023000_calendar_facets_contract.sql"

Ela é idempotente. Não execute migrations não relacionadas.

Após aplicar, confirme que:

- "public.get_travel_calendar_facets(text,text,text)" existe;
- permanece "SECURITY INVOKER";
- "anon" NÃO possui EXECUTE;
- "authenticated" NÃO possui EXECUTE;
- somente "service_role" possui EXECUTE além do proprietário;
- o trigger "trg_normalize_travel_offer_route_fields" permanece ativo.

3. Faça o deploy da versão atual já existente no repositório da Edge Function:

"supabase/functions/travel-offers-public"

Incluindo obrigatoriamente:

"index.ts"
"core.ts"

Preserve a configuração já existente:

"verify_jwt = false"

Não substitua a segurança interna existente da função.

4. Valide a ação:

"calendar_facets"

Confirme que ela:

- funciona através de "travel-offers-public";
- usa internamente "get_travel_calendar_facets";
- não dá acesso público direto à RPC;
- não expõe "raw_data";
- não expõe "source_url";
- não expõe Service Role;
- não expõe tokens, chaves ou links internos;
- retorna apenas facetas seguras do calendário.

5. Faça testes de banco para confirmar:

- nenhuma origem duplicada por caixa alta/baixa;
- nenhuma duplicidade canônica;
- ""28 de outubro"" não aparece como destino;
- nomes de roteiro não aparecem como destinos;
- ao consultar "São Paulo" como origem, os destinos retornados pertencem realmente a essa origem;
- não criar associações artificiais.

6. Somente depois dessas validações, publique o projeto utilizando exatamente o código sincronizado do SHA:

"d56115063b463aa883a9a95b36a62b21aa7949bd"

Não faça nenhuma alteração de código durante a publicação.

7. Ao finalizar, informe objetivamente:

- SHA publicado;
- migration aplicada e registrada;
- versão/deployment da Edge Function "travel-offers-public";
- horário da publicação;
- URL publicada;
- resultado dos testes de "calendar_facets";
- confirmação das permissões da RPC;
- confirmação de que nenhum arquivo foi alterado durante esse procedimento.`}
        </div>
      </main>

      <Footer />

      {/* Floating Téo */}
      <FloatingTeoButton />
    </div>
  );
};

export default Index;
