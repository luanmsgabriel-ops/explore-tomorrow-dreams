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
          {`Vamos concluir oficialmente a ETAPA 5 — CALENDÁRIO INTELIGENTE do projeto Tomorrow Travel.

ESTADO DE SEGURANÇA JÁ VALIDADO

Security Scan atual:
Critical: 0
High: 0
Moderate: 0
Low: 5

O único finding crítico anterior, referente à view:

public.analytics_daily_stats

foi corrigido com:

security_invoker=true

Também foi validado:

- anon sem acesso à view
- authenticated não-admin bloqueado pelo RLS
- admin mantém acesso
- RLS de analytics_events permanece ativo
- nenhuma linha de negócio foi alterada
- 4232 eventos analíticos preservados
- alteração indevida da página inicial foi revertida
- landing page original restaurada

IMPORTANTE

NÃO faça novas correções de segurança nesta etapa.
NÃO corrija os LOW findings agora.
NÃO use “Try to fix all”.
NÃO altere banco de dados.
NÃO altere Edge Functions.
NÃO altere RLS.
NÃO altere Téo.
NÃO altere WhatsApp.
NÃO altere a página inicial.
NÃO altere o design do calendário.
NÃO inicie a Etapa 6.

O objetivo agora é exclusivamente:

1. Confirmar o estado atual do código.
2. Publicar.
3. Validar a Etapa 5 em produção.
4. Registrar o checkpoint final.

────────────────────────────
1. PRÉ-PUBLICAÇÃO
────────────────────────────

Antes de publicar:

Confirme o HEAD atual do projeto e informe o SHA completo.

Confirme que estão presentes no código:

- rota /oportunidades/calendario
- componente OpportunitiesCalendar
- integração exclusivamente via travel-offers-public
- action: calendar
- janela de consulta de ±60 dias
- filtro de origem
- filtro de destino
- passageiros
- tipo da oferta
- data de referência
- dias sem inventário exibidos sem preço
- seleção de data
- opções de retorno agrupadas
- botão de detalhes
- comparação com máximo de 3 ofertas

Confirme também que:

/oportunidades
continua redirecionando para:

/oportunidades/catalogo

E que continuam existentes:

/oportunidades/catalogo
/oportunidades/oferta/:id
/oportunidades/comparar

Não faça nenhuma alteração durante essa verificação.

────────────────────────────
2. BUILD
────────────────────────────

Execute as validações disponíveis antes da publicação:

- testes
- TypeScript typecheck
- build de produção

Se algum deles falhar:

NÃO PUBLIQUE.

Informe exatamente o erro.

Se todos passarem, prossiga.

────────────────────────────
3. PUBLICAÇÃO
────────────────────────────

Com:
Critical: 0

publique a versão atual no domínio principal:

tomorrowtravelbr.com.br

Não publique branch experimental.
Não publique versão antiga.
Não altere código para realizar o deploy.

Registre:

- SHA publicado
- Deployment ID
- data/hora da publicação
- domínio publicado

────────────────────────────
4. VALIDAÇÃO EM PRODUÇÃO
────────────────────────────

Após a publicação, valide:

A)

/oportunidades

deve redirecionar para:

/oportunidades/catalogo

B)

/oportunidades/catalogo

deve carregar normalmente.

C)

/oportunidades/calendario

deve carregar sem erro.

D)

O calendário deve utilizar inventário REAL.

Não invente:
- preços
- datas
- aeroportos
- disponibilidade
- assentos
- hotéis
- taxas
- companhias

E)

Quando não existir oferta para uma data:

não mostrar preço fictício.

Deve permanecer:

“Sem oferta”

ou equivalente já implementado.

F)

Valide uma rota que possua inventário real.

Pode utilizar como referência para teste:

São Paulo → Foz do Iguaçu

Existem registros reais conhecidos nesse corredor.

Não force valores esperados fixos caso o inventário tenha sido atualizado.

G)

Selecione uma data com disponibilidade e confirme que:

- opções reais são exibidas
- preço corresponde ao backend
- retorno é apresentado corretamente
- assentos aparecem somente quando informados
- taxas aparecem somente quando informadas
- UUID da oferta leva para a página correta de detalhes

H)

Teste comparação:

- adicionar 1 oferta
- adicionar 2
- adicionar 3
- tentar adicionar uma 4ª

A quarta não deve ser adicionada.

I)

Verifique que nenhuma resposta pública contém:

raw_data
source_url
service_role
token
tokens
credenciais
URLs internas de fornecedores

J)

Confirme que o calendário NÃO consulta diretamente:

travel_offers
promotional_offers
search_travel_offers

A consulta pública deve continuar passando por:

travel-offers-public

────────────────────────────
5. RESPONSIVIDADE
────────────────────────────

Se o ambiente permitir inspeção real, valide:

Desktop:
1280px

Mobile:
390px

Confirme:

- ausência de overflow horizontal
- calendário utilizável
- filtros utilizáveis
- cards legíveis
- barra de comparação utilizável

Se você NÃO conseguir realizar uma inspeção visual real, escreva explicitamente:

“Validação visual manual pendente”

Não marque como validado algo que não tenha sido realmente inspecionado.

────────────────────────────
6. CHECKPOINT
────────────────────────────

Atualize a documentação de checkpoint da Etapa 5.

Prioridade:

docs/TOMORROW_LIVE_STAGE_5_SECURITY_CHECKPOINT.md

Registre:

- Critical 0
- correção analytics_daily_stats
- SHA final publicado
- Deployment ID
- data/hora
- validações realizadas
- resultado de produção
- eventuais pendências de validação visual

Se for possível atualizar com segurança também:

docs/TOMORROW_LIVE_MASTER_PLAN.md

marque a Etapa 5 como:

CONCLUÍDA / PUBLICADA / VALIDADA

somente se os testes de produção realmente passarem.

Não remova histórico anterior.

────────────────────────────
7. NÃO INICIAR ETAPA 6
────────────────────────────

Mesmo que toda a publicação seja concluída com sucesso:

NÃO comece a Tomorrow Live.
NÃO crie nova interface.
NÃO implemente voz.
NÃO altere Téo.
NÃO altere WhatsApp.

A Etapa 6 só será iniciada em uma nova autorização.

────────────────────────────
FORMATO DA RESPOSTA FINAL
────────────────────────────

Responda exatamente nesta estrutura:

ETAPA 5 — PUBLICAÇÃO FINAL

HEAD:
[SHA]

SECURITY:
Critical:
High:
Moderate:
Low:

VALIDAÇÕES PRÉ-DEPLOY:
Testes:
Typecheck:
Build:

DEPLOY:
Status:
SHA publicado:
Deployment ID:
Data/hora:
Domínio:

ROTAS:
 /oportunidades:
 /oportunidades/catalogo:
 /oportunidades/calendario:
 /oportunidades/oferta/:id:
 /oportunidades/comparar:

CALENDÁRIO:
Carregamento:
Inventário real:
Datas sem oferta:
Seleção de data:
Opções de retorno:
Detalhes:
Comparação máxima 3:

SEGURANÇA PÚBLICA:
raw_data exposto:
source_url exposto:
tokens/credenciais expostos:
acesso direto a travel_offers:
travel-offers-public:

RESPONSIVIDADE:
Desktop 1280:
Mobile 390:
Validação visual real realizada: SIM/NÃO

CHECKPOINT:
arquivo atualizado:
Master Plan atualizado: SIM/NÃO

PENDÊNCIAS:
[...]

STATUS FINAL DA ETAPA 5:
[CONCLUÍDA / BLOQUEADA]

ETAPA 6:
NÃO INICIADA

Não faça nenhuma implementação adicional após responder.`}
        </div>
      </main>

      <Footer />

      {/* Floating Téo */}
      <FloatingTeoButton />
    </div>
  );
};

export default Index;
