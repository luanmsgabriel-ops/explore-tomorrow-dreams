# Checkpoint — My Tomorrow Fase 3 — Travel Profile + preferências

Data: 2026-09-11
Branch: `feat/my-tomorrow-phase-3-travel-profile`
Base: `dff4decf33ffc43db2468bae18af149fe417f1bc`
Estado: IMPLEMENTAÇÃO DE CÓDIGO CONCLUÍDA — gate de CI pendente neste checkpoint

## Escopo

A Fase 3 implementa o Travel Profile e o onboarding de preferências explícitas sem iniciar Radar, matching, alertas, Téo contextual ou WhatsApp.

## Decisão de catálogo

A inspeção read-only do banco confirmou que `travel_places` e `travel_experiences` ainda não possuem conteúdo editorial curado suficiente para um onboarding por destinos/experiências reais.

Portanto:

- não foram inventados destinos, hotéis, experiências ou ofertas;
- o onboarding v1 usa apenas as 16 categorias canônicas previstas no PRD;
- o contrato suporta evolução futura para catálogo curado sem alterar a raiz de ownership.

## Terceira migration do lote

Arquivo:

`supabase/migrations/20260911181000_my_tomorrow_travel_profile.sql`

Cria:

- `traveler_profile_settings` — dados estruturais explícitos de conta;
- `traveler_preference_events` — log auditável de respostas;
- `traveler_affinities` — agregação derivada e reconstruível;
- RPC `rebuild_my_traveler_affinities()`.

Regras:

- ownership por `auth.uid()`;
- RLS por usuário e admin;
- eventos antigos são revogados, não apagados silenciosamente;
- score deriva exclusivamente de respostas explícitas ativas;
- score fica entre -1 e 1;
- reset revoga sinais ativos e reconstrói a agregação vazia;
- nenhuma inferência comportamental externa entra nesta fase.

## Lote completo de migrations

1. `20260911162000_my_tomorrow_identity_ownership.sql` — Fase 1;
2. `20260911173000_my_tomorrow_trip_lifecycle.sql` — Fase 2;
3. `20260911181000_my_tomorrow_travel_profile.sql` — Fase 3.

As três permanecem NÃO APLICADAS até revisão conjunta e execução em uma única janela controlada, na ordem 1 → 2 → 3.

## Backend

Nova Edge Function:

`supabase/functions/my-tomorrow-profile/index.ts`

Contrato:

- JWT obrigatório;
- usa cliente Supabase com token do usuário e RLS;
- não usa Service Role;
- `get` retorna perfil, afinidades e respostas ativas mais recentes;
- `update_profile` faz upsert do perfil estrutural;
- `answer` revoga a resposta ativa anterior da mesma categoria, persiste novo evento e recalcula afinidades;
- `reset_preferences` revoga todos os sinais ativos e recalcula;
- valida IATA, orçamento e enums no backend.

## Frontend

Rotas protegidas:

- `/minha-area/perfil` — origem habitual, grupo típico, faixa de orçamento, preferência de voo e hospedagem;
- `/minha-area/preferencias` — onboarding por categorias com `Quero`, `Gosto`, `Tanto faz`, `Não é para mim`.

A nova área é acessível diretamente pelo dashboard My Tomorrow.

## Categorias do onboarding v1

- praia;
- neve;
- parques;
- cidade;
- natureza;
- gastronomia;
- compras;
- aventura;
- resort;
- all inclusive;
- cruzeiro;
- eventos;
- cultura;
- vida noturna;
- família;
- casal.

## Arquivos principais

- `supabase/migrations/20260911181000_my_tomorrow_travel_profile.sql`;
- `supabase/functions/my-tomorrow-profile/index.ts`;
- `src/lib/myTomorrowProfile.ts`;
- `src/lib/myTomorrowProfile.test.ts`;
- `src/pages/MyTomorrowProfile.tsx`;
- `src/pages/MyTomorrowPreferences.tsx`;
- `src/pages/MyTomorrowDashboard.tsx`;
- `src/App.tsx`.

## Fora do escopo

- popular `travel_places` / `travel_experiences` com conteúdo inventado;
- Radar CRUD;
- matching engine;
- alertas;
- alteração do Téo;
- WhatsApp;
- publicação;
- execução de migrations;
- deploy da Edge Function.

## Gate da Fase 3

Antes do merge:

1. testes focados do contrato frontend → Edge Function;
2. TypeScript;
3. ESLint do escopo;
4. build de produção;
5. `deno check` da Edge Function;
6. `git diff --check`;
7. revisão final do diff;
8. remover workflow temporário de validação.

Após o merge, ainda NÃO marcar banco, deploy, sync ou produção como validados.

## Próximo passo após fechar o código

Como o lote de três migrations estará completo, o próximo gate será revisar as três migrations em conjunto e então aplicar 1 → 2 → 3 na mesma janela controlada, seguida por testes integrados de RLS, signup/recovery, claim, My Tomorrow, Travel Profile e isolamento entre usuários.
