# Checkpoint — My Tomorrow Fase 4 — Radar CRUD

Data: 2026-09-11
Branch: `feat/my-tomorrow-phase-4-radar-crud`
Base: `1ede19c85dff16eec2e4744eee126d1172225031`
PR: #112
Estado: IMPLEMENTADA E TESTADA EM CI — migration e Edge Function ainda não aplicadas

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

## Validação

Run final: `34636090081` — PASS integral.

- testes focados: 1 arquivo / 4 testes PASS;
- TypeScript: PASS;
- ESLint do escopo: PASS;
- build de produção: PASS;
- `deno check` de `my-tomorrow-radars`: PASS;
- `git diff --check`: PASS;
- revisão de diff: 12 arquivos, sem alteração de Téo, WhatsApp ou Tomorrow Live.

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

## Próximo passo exato

Após merge:

1. aplicar `20260911193000_my_tomorrow_radar_crud.sql`;
2. deployar somente `my-tomorrow-radars`;
3. validar RLS com usuário A × B;
4. validar criar/editar/pausar/reativar/excluir;
5. validar vínculo com planning trip própria e rejeição de trip alheia;
6. validar conversão catálogo → radar;
7. confirmar sync do Lovable;
8. somente depois iniciar Fase 5 — Matching Engine v1.

## Estados

- IMPLEMENTADO: SIM.
- TESTADO em CI/estático: SIM.
- TESTADO em banco real: NÃO nesta fase.
- MERGEADO: NÃO neste checkpoint.
- MIGRATION EXECUTADA: NÃO.
- EDGE FUNCTION DEPLOYADA: NÃO.
- SINCRONIZADO NO LOVABLE: NÃO confirmado.
- PUBLICADO: NÃO.
- VALIDADO EM PRODUÇÃO: NÃO.
