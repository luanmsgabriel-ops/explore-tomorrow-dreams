# Checkpoint — My Tomorrow Fase 2 — Shell + ciclo de viagens

Data: 2026-09-11
Branch: `feat/my-tomorrow-phase-2-trip-shell`
Base: `1a885ccaa34d5b5b87e74a2a1aaf5c7e79eeaa7c`
PR: #109
Estado: IMPLEMENTADA E TESTADA EM CI — banco não aplicado

## Autorização que altera o gate anterior

O checkpoint da Fase 1 bloqueava a Fase 2 até aplicação/validação E2E da migration de ownership. Em 11/09/2026 o proprietário do projeto autorizou explicitamente acumular três migrations e iniciar a Fase 2 antes da aplicação do lote.

Consequência:

- a Fase 2 foi implementada e testada estaticamente;
- nenhuma migration foi executada;
- nenhum estado que dependa do banco foi marcado como validado;
- as migrations serão aplicadas juntas somente quando o lote atingir três migrations e houver autorização de execução.

## Lote de migrations

1. `20260911162000_my_tomorrow_identity_ownership.sql` — Fase 1 — pendente de aplicação;
2. `20260911173000_my_tomorrow_trip_lifecycle.sql` — Fase 2 — pendente de aplicação;
3. TERCEIRA MIGRATION — ainda não criada; deve ser acumulada antes do gate conjunto.

Os arquivos permanecem separados e ordenados para preservar auditabilidade. A intenção operacional é aplicar as três migrations em uma única janela controlada, depois de revisão do lote completo.

## Decisão de domínio preservada

- `trip_sessions`: planejamento pré-compra e ciclo pessoal;
- `client_trips`: viagem contratada/operacional;
- não criar tabela genérica `trips`;
- não converter automaticamente registros existentes;
- My Tomorrow unifica as duas fontes apenas na experiência de usuário.

## Banco versionado, não aplicado

A migration da Fase 2 adiciona a `trip_sessions`:

- `lifecycle_stage`;
- `origin_name`;
- `origin_iata`;
- `budget_min` / `budget_max`;
- `budget_currency`;
- `linked_client_trip_id` opcional para ponte futura após compra;
- constraints de estágio e faixa de orçamento;
- índices por owner/estágio/atividade e vínculo operacional.

Estágios aceitos:

`dreaming`, `researching`, `planning`, `monitoring`, `ready_to_buy`, `booked`, `traveling`, `completed`, `cancelled`.

`lifecycle_stage` é separado de `trip_sessions.status`, que continua sendo o estado runtime do Trip Composer.

## Backend

Nova Edge Function versionada, não deployada:

`supabase/functions/my-tomorrow-trips/index.ts`

Contrato implementado:

- autenticação JWT obrigatória;
- cliente Supabase com token do usuário e RLS, sem Service Role;
- listagem unificada de planning trips próprias e `client_trips` visíveis pela RLS existente;
- criação de planning trip em `trip_sessions`;
- atualização apenas de planning trip própria;
- update parcial preserva campos omitidos;
- validação de faixa de datas e orçamento no backend;
- `client_trips` permanece read-only nesse fluxo;
- nenhum acesso a `travel_offers` nesta fase.

## Frontend

Rotas protegidas:

- `/minha-area` — shell My Tomorrow mobile-first;
- `/minha-area/viagens` — lista unificada e criação de viagens pré-compra;
- `/minha-area/viagens/:tripId` — detalhe e edição da planning trip;
- `/minha-area/operacional` — dashboard operacional legado preservado para viagens contratadas.

Entregas principais:

- dashboard pessoal com viagens em planejamento e próxima viagem contratada;
- criação em `dreaming`, `researching` ou `planning`;
- edição de destino, origem, aeroporto, período, passageiros e orçamento;
- separação visual entre planejamento e viagem contratada;
- link de planning trip para catálogo público de oportunidades;
- manutenção das abas existentes de Aéreo, Hospedagem, Vouchers, Checklist e Informações no módulo operacional.

Arquivos principais:

- `src/pages/MyTomorrowDashboard.tsx`;
- `src/pages/MyTomorrowTrips.tsx`;
- `src/pages/MyTomorrowTripDetail.tsx`;
- `src/lib/myTomorrowTrips.ts`;
- `src/lib/myTomorrowTrips.test.ts`;
- `src/App.tsx`;
- `supabase/functions/my-tomorrow-trips/index.ts`;
- `supabase/migrations/20260911173000_my_tomorrow_trip_lifecycle.sql`.

## Validação

Run final: `34623380665` — PASS integral.

- testes focados: 1 arquivo / 3 testes PASS;
- TypeScript: PASS;
- ESLint do escopo: PASS;
- build de produção: PASS;
- `deno check` da Edge Function: PASS;
- `git diff --check`: PASS.

Run `34623195201` falhou somente no mock do teste por hoisting do Vitest antes de executar qualquer teste; o mock foi corrigido com `vi.hoisted` e o gate final passou no run acima.

## Fora do escopo

- Radar CRUD;
- matching;
- alertas;
- Travel Profile;
- Téo contextual;
- WhatsApp;
- conversão automática planning → booked;
- publicação;
- execução de migration;
- alteração do prompt/tom/sistema do Téo.

## Próximo passo exato

A Fase 2 de código está fechada. O próximo desenvolvimento é a Fase 3 — Travel Profile + onboarding de preferências — que deverá produzir a terceira migration do lote sem aplicar as duas anteriores. Quando as três estiverem fechadas e revisadas, executar uma única janela de migration na ordem 1 → 2 → 3, seguida dos gates integrados de RLS e E2E.

## Estados

- IMPLEMENTADO: SIM.
- TESTADO em CI/estático: SIM.
- TESTADO em banco/ambiente real: NÃO.
- MERGEADO: NÃO neste checkpoint.
- MIGRATIONS EXECUTADAS: NÃO.
- EDGE FUNCTION DEPLOYADA: NÃO.
- SINCRONIZADO NO LOVABLE: NÃO.
- PUBLICADO: NÃO.
- VALIDADO EM PRODUÇÃO: NÃO.
