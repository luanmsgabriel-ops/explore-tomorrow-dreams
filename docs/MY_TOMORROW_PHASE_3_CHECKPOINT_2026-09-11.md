# Checkpoint — My Tomorrow Fase 3 — Travel Profile + preferências

Data: 2026-09-11
Branch: `feat/my-tomorrow-phase-3-travel-profile`
Base: `dff4decf33ffc43db2468bae18af149fe417f1bc`
PR: #110
Estado: IMPLEMENTADA E TESTADA EM CI — banco não aplicado

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
- RPC `rebuild_my_traveler_affinities()`;
- RPC `record_my_travel_preference(...)`;
- RPC `reset_my_travel_preferences()`.

Regras finais:

- ownership por `auth.uid()`;
- RLS por usuário e admin;
- cliente lê seu histórico e suas afinidades;
- escrita de eventos não fica disponível diretamente ao cliente;
- respostas e reset passam por RPCs transacionais;
- eventos antigos são revogados, não apagados silenciosamente;
- trigger impede mutação de conteúdo histórico fora da revogação permitida;
- `traveler_affinities` é derivada e não possui policy de escrita para o cliente;
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

Contrato implementado:

- JWT obrigatório;
- usa cliente Supabase com token do usuário e RLS;
- não usa Service Role;
- `get` retorna perfil, afinidades e respostas ativas mais recentes;
- `update_profile` faz upsert do perfil estrutural;
- `answer` valida chave/resposta e chama RPC transacional de gravação + rebuild;
- `reset_preferences` chama RPC transacional de revogação + rebuild;
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

## Validação

Run final: `34626667665` — PASS integral.

- testes focados: 1 arquivo / 4 testes PASS;
- TypeScript: PASS;
- ESLint do escopo: PASS;
- build de produção: PASS;
- `deno check` de `my-tomorrow-profile`: PASS;
- `git diff --check`: PASS.

Run anterior `34626455989` também passou, mas foi sucedido pelo endurecimento de integridade que moveu gravação/reset para RPCs transacionais. O run `34626667665` é o gate definitivo da Fase 3.

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

## Próximo passo exato

O lote de três migrations está completo. Antes de iniciar a Fase 4, executar o gate integrado do lote:

1. revisar os três SQLs em conjunto e a ordem 1 → 2 → 3;
2. aplicar as três migrations na mesma janela controlada;
3. publicar somente as Edge Functions necessárias às Fases 1–3;
4. validar signup/recovery e role `user`;
5. validar isolamento RLS com dois usuários;
6. validar claim guest → owner e invalidação do token;
7. validar criar/editar planning trip no My Tomorrow;
8. validar Travel Profile, resposta, substituição e reset de preferência;
9. confirmar que `client_trips` operacional permanece intacto;
10. somente após esse gate decidir o início da Fase 4 — Radar CRUD.

## Estados

- IMPLEMENTADO: SIM.
- TESTADO em CI/estático: SIM.
- TESTADO em banco/ambiente real: NÃO.
- MERGEADO: pendente no momento deste checkpoint.
- MIGRATIONS EXECUTADAS: NÃO.
- EDGE FUNCTION DEPLOYADA: NÃO.
- SINCRONIZADO NO LOVABLE: NÃO confirmado.
- PUBLICADO: NÃO.
- VALIDADO EM PRODUÇÃO: NÃO.
