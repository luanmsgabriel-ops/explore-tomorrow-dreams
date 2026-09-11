# Checkpoint — My Tomorrow Fase 2 — Shell + ciclo de viagens

Data: 2026-09-11
Branch: `feat/my-tomorrow-phase-2-trip-shell`
Base: `1a885ccaa34d5b5b87e74a2a1aaf5c7e79eeaa7c`
Estado: INICIADA — primeiro slice implementado, banco não aplicado

## Autorização que altera o gate anterior

O checkpoint da Fase 1 bloqueava a Fase 2 até aplicação/validação E2E da migration de ownership. Em 11/09/2026 o proprietário do projeto autorizou explicitamente acumular três migrations e iniciar a Fase 2 antes da aplicação do lote.

Consequência:

- a Fase 2 pode ser IMPLEMENTADA e TESTADA estaticamente;
- nenhuma migration será executada agora;
- nenhum estado que dependa do banco será marcado como validado;
- as migrations devem ser aplicadas juntas somente quando o lote atingir três migrations e houver autorização de execução.

## Lote de migrations

1. `20260911162000_my_tomorrow_identity_ownership.sql` — Fase 1 — pendente de aplicação;
2. `20260911173000_my_tomorrow_trip_lifecycle.sql` — Fase 2 — pendente de aplicação;
3. TERCEIRA MIGRATION — ainda não criada; deve ser acumulada antes do gate conjunto.

Não consolidar os três arquivos fisicamente em um único SQL antes de eles estarem fechados e revisados. A intenção operacional é aplicar o lote de três em uma única janela controlada, preservando ordem e auditabilidade.

## Decisão de domínio preservada

- `trip_sessions`: planejamento pré-compra e ciclo pessoal;
- `client_trips`: viagem contratada/operacional;
- não criar tabela genérica `trips`;
- não converter automaticamente registros existentes;
- My Tomorrow unifica as duas fontes apenas na experiência de usuário.

## Primeiro slice implementado

### Banco versionado, não aplicado

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

O campo é separado de `trip_sessions.status`, que permanece runtime do Trip Composer.

### Backend

Nova Edge Function versionada, não deployada:

`supabase/functions/my-tomorrow-trips/index.ts`

Responsabilidades do primeiro slice:

- autenticação JWT obrigatória;
- listagem unificada de planning trips e `client_trips` acessíveis por RLS;
- criação de planning trip;
- atualização de planning trip própria;
- validação de data e orçamento no backend;
- nenhum acesso direto a `travel_offers`;
- nenhum uso de Service Role no fluxo do cliente.

### Frontend

Novas rotas protegidas:

- `/minha-area` — nova shell My Tomorrow;
- `/minha-area/viagens` — lista e criação de viagens;
- `/minha-area/viagens/:tripId` — rota reservada ao detalhe da viagem, ainda usando o slice da lista nesta primeira entrega;
- `/minha-area/operacional` — dashboard legado preservado para viagem contratada.

Arquivos principais:

- `src/pages/MyTomorrowDashboard.tsx`;
- `src/pages/MyTomorrowTrips.tsx`;
- `src/lib/myTomorrowTrips.ts`;
- `src/App.tsx`.

## Fora do escopo deste slice

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

## Próximo passo exato da Fase 2

1. validar TypeScript, ESLint, build e `deno check` do slice atual;
2. corrigir qualquer falha encontrada;
3. implementar detalhe/edit de planning trip em `/minha-area/viagens/:tripId`;
4. adicionar navegação explícita aos módulos operacionais quando a entidade for `booked`;
5. registrar os testes finais da Fase 2;
6. manter as duas migrations acumuladas sem execução;
7. somente depois seguir para a fase que produzirá a terceira migration do lote.

## Estados neste checkpoint

- IMPLEMENTADO: PARCIAL — primeiro slice.
- TESTADO: PENDENTE do gate deste branch.
- MERGEADO: NÃO.
- MIGRATIONS EXECUTADAS: NÃO.
- EDGE FUNCTIONS DEPLOYADAS: NÃO.
- SINCRONIZADO NO LOVABLE: NÃO.
- PUBLICADO: NÃO.
- VALIDADO EM PRODUÇÃO: NÃO.
