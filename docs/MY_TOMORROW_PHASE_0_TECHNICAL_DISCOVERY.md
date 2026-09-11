# My Tomorrow + Radar Tomorrow — Fase 0: Discovery técnico

Status: CONCLUÍDA — discovery e contrato arquitetural
Data: 2026-09-11
Branch: `docs/my-tomorrow-phase-0-discovery`
Base reconfirmada: `8c34523ee3c1b0cff9ac08f4f4c562d78f550008`
PRD: `docs/MY_TOMORROW_RADAR_PRD.md`
Roadmap: `docs/MY_TOMORROW_RADAR_ROADMAP.md`

> Este documento fecha a Fase 0. Nenhuma migration, alteração funcional, mudança de prompt/tom do Téo, fluxo de WhatsApp ou publicação foi executada nesta fase.

## 1. Objetivo e fonte de verdade

A Fase 0 existia para eliminar decisões arquiteturais abertas antes da criação de migrations do My Tomorrow e do Radar pessoal.

A auditoria cruzou:

1. `main` atual do GitHub;
2. implementação atual de autenticação e área do cliente;
3. contrato público de oportunidades;
4. tipos Supabase versionados;
5. schema, foreign keys e policies do banco vivo consultados em modo somente leitura pelo Lovable Cloud/Supabase;
6. funções server-side relacionadas a planejamento de viagem.

A fonte canônica de oportunidades permanece `public.travel_offers`. O navegador não deve consumir essa tabela diretamente. O acesso público continua passando pela camada sanitizada `travel-offers-public`.

## 2. Estado atual confirmado

### 2.1 Autenticação e entrada do cliente

Rotas atuais:

- `/cliente` → `ClientLogin`;
- `/minha-area` → `ClientDashboard`.

`ClientLogin` usa Supabase Auth com e-mail e senha (`signInWithPassword`). Após autenticar, consulta `user_roles` e impede o uso da área do cliente por conta `admin`.

O modelo atual é predominantemente administrado pela agência: a Edge Function `create-user` exige usuário autenticado com role `admin`, cria a conta por `auth.admin.createUser`, confirma o e-mail e cria a linha correspondente em `profiles`.

Conclusão: **self-signup e recuperação de senha para o Tomorrow ID ainda precisam ser implementados na Fase 1**, mas devem coexistir com o fluxo administrativo atual para não quebrar clientes existentes.

### 2.2 Área do cliente atual

`ClientDashboard` já possui valor operacional e não deve ser descartado.

Ele:

- valida sessão;
- consulta `profiles`;
- consulta `account_shared_access`;
- carrega `client_trips` do titular ou do titular compartilhado;
- seleciona viagem atual/próxima;
- apresenta módulos de aéreo, hospedagem, vouchers, checklist e informações;
- mantém geradores atuais de roteiro e imagem.

Decisão: **My Tomorrow será evolução incremental da área atual, não uma substituição destrutiva**.

### 2.3 Contrato atual de `client_trips`

Schema vivo confirmado:

- `id uuid`;
- `user_id uuid`;
- `destination_id uuid` → FK para `destinations.id`;
- `destination_name text`;
- `departure_date date`;
- `return_date date`;
- campos de voo e localizador;
- campos de hospedagem e check-in/out;
- `trip_status text`;
- `notes`, `trip_tips`;
- `welcome_image_url`, `welcome_caption`;
- timestamps.

Ponto estrutural: `client_trips` exige destino e datas e está orientada à viagem operacional/pós-venda. Ela não representa bem uma intenção ainda incompleta como “quero ir ao Beto Carrero entre janeiro e fevereiro, orçamento até X”.

Decisão: **preservar `client_trips` como domínio de viagem confirmada/operacional**.

Não será convertida em tabela genérica de intenção.

## 3. Descoberta decisiva: já existe um domínio de planejamento

O banco vivo possui estruturas que não estavam consideradas explicitamente no primeiro desenho conceitual do PRD:

- `traveler_profiles`;
- `trip_sessions`;
- `trip_preferences`;
- `trip_days`;
- `trip_day_items`.

Também existem Edge Functions dedicadas:

- `trip-composer-session`;
- `trip-composer-discovery`;
- `trip-composer-planner`;
- `trip-composer-window`;
- `trip-composer-weather`;
- `trip-composer-viator`.

Portanto, **não deve ser criada uma segunda família genérica `trips`/`trip_preferences` paralela sem necessidade**.

### 3.1 `traveler_profiles`

Schema vivo:

- `id uuid`;
- `user_id uuid` nullable;
- `full_name`;
- `email`;
- `whatsapp`;
- `share_consent_at`;
- `commercial_contact_consent_at`;
- timestamps.

Uso arquitetural recomendado:

- `profiles`: identidade básica vinculada à conta autenticada;
- `traveler_profiles`: identidade de viajante/consentimentos para experiências de planejamento e personalização.

A Fase 1 deve definir vínculo e reconciliação sem duplicar e-mail/nome como duas fontes concorrentes de verdade.

### 3.2 `trip_sessions`

Schema vivo inclui:

- `traveler_profile_id`;
- `status`;
- destino e coordenadas;
- `start_date` / `end_date`;
- chegada e partida;
- base/hospedagem de referência;
- `passenger_composition jsonb`;
- `pace`;
- `experience_budget jsonb`;
- estado corrente do planejamento;
- hashes de tokens de acesso/compartilhamento;
- timestamps.

A função `trip-composer-session` cria e manipula essas sessões pelo backend com Service Role. O cliente recebe token aleatório; apenas o hash é persistido. Ela cria dias, grava preferências e itens do roteiro.

Decisão: **`trip_sessions` é o melhor candidato para representar a viagem em estágio `dreaming/researching/planning` no My Tomorrow**, após endurecimento do modelo de ownership para usuários autenticados.

### 3.3 `trip_preferences`

Cada preferência já possui:

- `trip_session_id`;
- chave/valor;
- `source`;
- `weight`;
- `is_active`;
- `evidence`;
- timestamps.

A função atual aceita fontes `EXPLICIT`, `SELECTION` e `REJECTION`.

Conclusão: essa estrutura é diretamente reutilizável para parte do Travel Match/onboarding estilo swipe. Não deve ser criada outra tabela genérica com o mesmo propósito no MVP.

A Fase 3 poderá estender o vocabulário, a proveniência e a agregação, mantendo compatibilidade.

### 3.4 `trip_days` e `trip_day_items`

Já modelam a composição diária do planejamento e devem ser preservadas para o futuro módulo de roteiro/timeline.

Elas **não são necessárias para o matching do Radar** e não devem ser acopladas ao motor de ofertas.

## 4. RLS e ownership — achado crítico

### 4.1 Domínio atual do cliente

Policies confirmadas:

- `profiles`: usuário lê/insere/atualiza o próprio perfil; admin também possui acesso administrativo;
- `user_roles`: usuário autenticado pode ver o próprio role;
- `account_shared_access`: titular ou compartilhado podem ler a relação; administração gerencia;
- `client_trips`: usuário lê a própria viagem; acesso compartilhado lê viagens do titular; admin gerencia;
- `notification_logs`: usuário lê apenas os próprios registros; admin gerencia.

### 4.2 Domínio Trip Composer

No banco vivo, `traveler_profiles`, `trip_sessions`, `trip_preferences`, `trip_days` e `trip_day_items` possuem policies administrativas, mas **não possuem policy direta de leitura/escrita pelo cliente autenticado**.

Isso é coerente com a implementação atual: `trip-composer-session` usa Service Role e autoriza a sessão por token/hash no backend.

Implicação decisiva para My Tomorrow:

**não devemos simplesmente expor essas tabelas ao frontend autenticado.**

A Fase 1 precisa definir uma das duas estratégias e congelá-la antes de UI funcional:

A. acesso sempre mediado por Edge Functions server-side; ou

B. ownership explícito + RLS de usuário autenticado, mantendo operações privilegiadas server-side.

Recomendação: **modelo híbrido**.

- leitura/escrita básica do próprio planejamento por RLS autenticada;
- matching, geração, compartilhamento, operações com inventário e ações privilegiadas via Edge Functions;
- tokens atuais preservados para sessões compartilháveis/guest quando necessário.

## 5. `account_shared_access`

Schema confirmado:

- `primary_user_id`;
- `shared_user_id`;
- `shared_email`;
- `created_by`;
- timestamps.

O dashboard atual procura uma relação em que o usuário autenticado é `shared_user_id`; quando encontra, usa `primary_user_id` como owner ao carregar `client_trips`.

A policy de `client_trips` reproduz essa regra.

Decisão para My Tomorrow:

- preservar o comportamento para viagens operacionais existentes;
- não herdar automaticamente acesso compartilhado para futuros Radars, preferências pessoais ou dados comportamentais;
- cada nova entidade deve declarar explicitamente se é `account-shared`, `trip-shared` ou estritamente pessoal.

## 6. Notificações existentes

`notification_logs` já existe com:

- `user_id`;
- `trip_id`;
- tipo;
- título;
- corpo;
- `data jsonb`;
- status/erro;
- timestamps.

Ela pode ser reutilizada como histórico operacional de entregas, mas **não deve ser automaticamente transformada na inbox do Radar** sem contrato de deduplicação, read/unread e idempotência.

Recomendação para Fase 6:

- criar uma entidade de alerta/match orientada ao produto;
- reutilizar `notification_logs` para logging de envio quando adequado;
- separar “alerta que existe para o usuário” de “tentativa de entrega em um canal”.

## 7. Roteiro IA atual versus novo My Tomorrow

`ClientItineraryGenerator` é um fluxo separado e mais antigo. Ele recebe mood, destino e preferências, chama `generate-itinerary` e pode gerar uma solicitação de cotação.

Ele não usa o domínio `trip_sessions` como fonte persistente da viagem.

Decisão:

- não remover na Fase 1;
- não usar esse componente como nova fonte de verdade;
- migrar/absorver gradualmente sua experiência quando o My Tomorrow possuir shell e ciclo de viagem estáveis;
- evitar dois planejadores persistentes independentes no estado final.

## 8. Contrato definitivo de domínio

### 8.1 Identidade

`auth.users`
→ autenticação canônica.

`profiles`
→ perfil básico da conta autenticada.

`traveler_profiles`
→ extensão de viajante/consentimentos e base de personalização, vinculada ao usuário autenticado.

### 8.2 Viagem em planejamento

`trip_sessions`
→ intenção/planejamento antes da compra.

`trip_preferences`
→ preferências contextualizadas à viagem.

`trip_days` / `trip_day_items`
→ composição de roteiro.

### 8.3 Viagem confirmada

`client_trips`
→ viagem operacional/pós-venda já confirmada.

A passagem de `trip_session` para `client_trip` deve ser explícita e auditável; **não será feita por substituição silenciosa**.

### 8.4 Radar

O domínio Radar é novo e justificado porque nenhuma tabela existente representa monitoramento contínuo de inventário e seus resultados.

Entidades previstas para a implementação, sujeitas ao DDL final da Fase 1/4:

- `travel_radars` — intenção monitorável e estado;
- `travel_radar_matches` — resultado versionado/explicável contra oferta real;
- `travel_radar_alerts` — inbox/idempotência de alerta, caso não seja possível cumprir os requisitos com estrutura existente sem misturar responsabilidades.

Não criar tabela genérica `trips` no MVP.

## 9. Contrato preliminar do Matching Engine

Entrada mínima do Radar:

- owner autenticado;
- opcional `trip_session_id`;
- origem/origem IATA quando aplicável;
- destino/destino IATA ou categoria/experiência;
- intervalo de datas;
- flexibilidade autorizada;
- passageiros;
- noites/duração quando informada;
- orçamento máximo quando informado;
- `offer_type`/subtipo/categoria quando explicitamente escolhidos;
- modo `EXACT`, `FLEXIBLE` ou `DISCOVERY`.

Fonte de candidatos:

- exclusivamente inventário canônico de `public.travel_offers` processado server-side;
- nunca `promotional_offers`;
- nenhum `raw_data`, `source_url` ou dado interno copiado para frontend/match público.

Ordem de avaliação:

1. hard filters;
2. datas e flexibilidade;
3. orçamento;
4. duração;
5. tipo/categoria;
6. preferências/afinidades apenas quando o modo permitir.

Saída mínima persistível:

- `radar_id`;
- `offer_id` público/canônico;
- `algorithm_version`;
- `match_mode`;
- score;
- fatores compatíveis;
- fatores relaxados;
- timestamps de primeira/última observação;
- estado (`active`, `expired`, `dismissed` etc.).

Regras obrigatórias:

- `EXACT` nunca relaxa hard filter;
- `FLEXIBLE` só relaxa parâmetros explicitamente autorizados;
- `DISCOVERY` nunca se apresenta como resultado exato;
- mesma entrada + mesma versão do algoritmo produz mesmo resultado;
- oferta inválida/inativa deixa de ser match elegível;
- o navegador não executa consulta direta em `travel_offers`.

## 10. Rotas propostas do My Tomorrow

Transição sem quebra:

- `/cliente` — preservada inicialmente; evolui para entrada Tomorrow ID;
- `/minha-area` — preservada e convertida em shell My Tomorrow;
- `/minha-area/viagens` — viagens planejadas + confirmadas;
- `/minha-area/viagens/:id` — detalhe contextual;
- `/minha-area/radares` — lista de radares;
- `/minha-area/radares/novo` — criação;
- `/minha-area/radares/:id` — estado e matches;
- `/minha-area/perfil` — dados básicos e Travel Profile;
- `/minha-area/alertas` — inbox futura.

As rotas públicas `/oportunidades/*` continuam independentes e podem oferecer CTA “salvar como Radar” após autenticação.

## 11. Matriz mínima de dados pessoais / LGPD

| Dado | Finalidade | Base no produto | Exposição frontend | Retenção/controle |
|---|---|---|---|---|
| e-mail | autenticação/conta | Tomorrow ID | próprio usuário | conta |
| nome | identificação | perfil | próprio usuário | editável |
| WhatsApp | contato quando consentido | traveler profile | próprio usuário/admin autorizado | consentimento explícito |
| preferências | personalização | Travel Profile/trip preferences | próprio usuário | removível/resetável |
| histórico de viagem | gestão da viagem | client trips | owner/compartilhado autorizado | política do produto |
| intenção/Radar | monitoramento | travel radars | owner | pausável/excluível |
| matches | justificar recomendações | radar matches | owner | expirar/deduplicar |
| consentimentos | prova de permissão | traveler profile | próprio usuário/admin | auditável |

Princípios:

- minimização;
- finalidade explícita;
- separação entre dado de conta, preferência e sinal comportamental;
- exclusão/reset de preferências;
- nenhum compartilhamento implícito de Radar por `account_shared_access`;
- nenhuma inferência apresentada como fato pessoal.

## 12. Plano de migração sem quebra

### Passo A — Fase 1

- manter `profiles` e `user_roles`;
- implementar self-signup/confirm/recovery sem remover criação administrativa;
- reconciliar `traveler_profiles.user_id` com conta autenticada;
- definir policies de ownership para planejamento autenticado;
- manter compatibilidade dos tokens atuais do Trip Composer;
- não tocar em `client_trips` além do necessário para integração de leitura.

### Passo B — Fase 2

- My Tomorrow passa a listar dois tipos de ciclo:
  - planejamento (`trip_sessions`);
  - confirmado (`client_trips`);
- UI apresenta uma experiência única, mas mantém as fontes distinguíveis no backend;
- conversão planejamento → confirmado passa por operação explícita.

### Passo C — Fases 3–6

- reutilizar `trip_preferences` para sinais contextuais;
- criar somente entidades específicas do Radar;
- matching sempre server-side;
- inbox e canais de entrega separados.

## 13. Lista exata prevista para a Fase 1

A Fase 1 deve permanecer focada em Tomorrow ID e ownership. Antes de escrever SQL, reconfirmar novamente `main` e banco vivo.

Arquivos previstos:

- migration nova em `supabase/migrations/<timestamp>_my_tomorrow_identity_foundation.sql`;
- `src/pages/ClientLogin.tsx`;
- novo componente/rota de cadastro do Tomorrow ID;
- novo componente/rota de recuperação de senha;
- guard autenticado reutilizável para `/minha-area/*`;
- `src/integrations/supabase/types.ts` regenerado somente após migration aplicada/sincronizada;
- testes de autenticação/guards/RLS do escopo;
- checkpoint da Fase 1.

A migration da Fase 1 deverá se limitar a:

1. ownership/vínculo seguro entre conta e `traveler_profiles`;
2. policies mínimas necessárias ao usuário autenticado;
3. constraints/índices estritamente necessários;
4. nenhum schema Radar ainda.

`travel_radars` e matching pertencem às Fases 4 e 5, não à Fase 1.

## 14. Riscos registrados

1. `profiles` e `traveler_profiles` sobrepõem nome/e-mail; é necessário definir precedência e sincronização.
2. domínio Trip Composer hoje é protegido por backend/Service Role; abrir RLS sem desenho de ownership pode vazar planejamento entre usuários.
3. `client_trips` possui semântica pós-venda; torná-la opcional demais para atender intenções degradaria o contrato existente.
4. acesso compartilhado atual não deve automaticamente conceder leitura a perfil comportamental/Radar.
5. gerador de roteiro legado e Trip Composer coexistem; unificação deve ser progressiva.
6. notificações atuais não equivalem automaticamente a inbox idempotente de Radar.
7. qualquer matching que replique `travel_offers` para o frontend viola a separação da camada pública.

## 15. Gate de saída da Fase 0

- mapa real das tabelas: concluído;
- RLS/policies: concluído com consulta ao banco vivo;
- autenticação atual: concluído;
- `account_shared_access`: concluído;
- decisão `client_trips` versus nova tabela: concluída — preservar `client_trips`, reutilizar `trip_sessions`, não criar `trips` genérica;
- domínio existente de planejamento: identificado e incorporado ao contrato;
- matching preliminar: definido;
- rotas My Tomorrow: definidas;
- matriz LGPD: definida;
- migração sem quebra: definida;
- lista de escopo da Fase 1: definida.

**Gate da Fase 0: PASS.**

## 16. Próxima ação exata

Iniciar **Fase 1 — Tomorrow ID e fundação de conta**, em branch nova derivada da `main` reconfirmada.

A primeira tarefa da Fase 1 é produzir e revisar a migration de ownership/identidade **sem criar tabelas de Radar ainda**, seguida de self-signup, confirmação/recuperação de conta, guard autenticado e testes de isolamento.

Não iniciar automaticamente Fase 2, Travel Profile, Radar CRUD, matching, WhatsApp ou mudanças no Téo antes do gate da Fase 1.
