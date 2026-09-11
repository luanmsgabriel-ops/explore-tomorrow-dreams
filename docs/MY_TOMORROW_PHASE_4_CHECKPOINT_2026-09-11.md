# Checkpoint — My Tomorrow Fase 4 — Radar CRUD

Data: 2026-09-11
Branch: `feat/my-tomorrow-phase-4-radar-crud`
Base: `1ede19c85dff16eec2e4744eee126d1172225031`
Estado: IMPLEMENTAÇÃO DE CÓDIGO CONCLUÍDA — banco ainda não aplicado nesta fase

## Preflight

- `main` reconfirmada em `1ede19c85dff16eec2e4744eee126d1172225031`;
- master plan lido e reconhecido como historicamente desatualizado em relação à `main` atual;
- roadmap My Tomorrow lido;
- checkpoint da Fase 3 lido;
- gate integrado das Fases 1–3 foi informado pelo Lovable como aplicado e validado e o estado do banco confirma as tabelas principais;
- PRs concorrentes abertos concentram-se em Tomorrow Live e não foram alterados;
- contrato público do catálogo reconfirmado em `travel-offers-public` e `CatalogFilterValues`.

## Escopo implementado

### Banco versionado, não aplicado

Migration:

`supabase/migrations/20260911193000_my_tomorrow_radar_crud.sql`

Cria `public.travel_radars` com:

- owner `user_id`;
- vínculo opcional `trip_session_id`;
- nome e status;
- origem e destino;
- datas e flexibilidade em dias;
- mínimo/máximo de noites;
- passageiros;
- orçamento e moeda;
- tipo/subtipo/categoria compatíveis com o contrato público;
- origem do radar (`manual` ou `catalog`);
- snapshot sanitizado dos filtros de origem;
- `last_checked_at` reservado ao matching;
- exclusão lógica via `deleted_at`;
- RLS por `auth.uid()` e policy admin existente.

Status aceitos: `active`, `paused`, `archived`.

### Backend

Edge Function versionada:

`supabase/functions/my-tomorrow-radars/index.ts`

Ações:

- `list`;
- `get`;
- `create`;
- `update`;
- `pause`;
- `resume`;
- `archive`;
- `delete` com soft delete.

Características:

- JWT obrigatório;
- cliente Supabase com token do usuário e RLS;
- sem Service Role;
- validações de datas, orçamento, passageiros, noites, enums e flexibilidade;
- associação a planning trip protegida também pela policy da tabela;
- nenhum acesso a `travel_offers` interno.

### Frontend

Rotas protegidas:

- `/minha-area/radares`;
- `/minha-area/radares/:radarId`.

Entregas:

- lista de radares;
- criação manual;
- vínculo opcional a uma planning trip;
- edição;
- pausa;
- reativação;
- exclusão lógica;
- campos de flexibilidade e duração;
- acesso direto pelo dashboard My Tomorrow.

### Conversão catálogo → Radar

O catálogo continua usando seu contrato público atual. O último conjunto de filtros efetivamente aplicado é persistido em `sessionStorage` somente com campos públicos do filtro.

CTA `Salvar busca como radar`:

- aparece somente em `/oportunidades/catalogo`;
- abre a criação protegida do My Tomorrow;
- carrega origem, destino, datas, passageiros, orçamento, tipo, subtipo e categoria;
- não persiste resultados, preço de uma oferta específica, `raw_data`, `source_url` ou dado interno de fornecedor.

## Fora do escopo

- matching engine;
- criação de `travel_radar_matches`;
- varredura agendada;
- alertas;
- e-mail;
- WhatsApp;
- Téo contextual;
- publicação do frontend;
- aplicação da migration da Fase 4;
- deploy da nova Edge Function.

## Gate de saída da Fase 4

Antes do merge:

1. testes focados;
2. TypeScript;
3. ESLint do escopo;
4. build;
5. `deno check`;
6. `git diff --check`;
7. revisão de diff;
8. remover workflow temporário.

Depois do merge, aplicar migration e Edge Function em janela controlada e validar RLS A × B e CRUD real antes de iniciar a Fase 5.
