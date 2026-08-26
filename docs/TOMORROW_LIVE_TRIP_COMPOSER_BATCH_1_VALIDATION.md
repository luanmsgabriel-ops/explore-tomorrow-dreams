# Tomorrow Live Trip Composer — Batch 1 Cloud Validation

## Estado

Batch 1 (Etapas 1–3) aplicado no Lovable Cloud/Supabase em 25/08/2026, após merge no Git.

## Baseline informado ao deploy

`6f77a5a9f39001edaf8cffe049061b6b5ddc8b2f`

Após a operação, o Lovable criou commit automático e a `main` avançou para `438450f0e5cc119943d91c599abb02cdadf12f05`.

## Migrations aplicadas

- `20260826001500_trip_composer_stage1_foundation.sql`
- `20260826010000_trip_composer_stage2_discovery.sql`

## Ajuste de plataforma realizado no Cloud

O Lovable informou necessidade de `GRANT` para `authenticated` e `service_role` nas 7 tabelas novas, pois o Data API do projeto não concede privilégios padrão no schema `public`.

Esse ajuste foi realizado pela plataforma durante a aplicação. O commit automático do Lovable adicionou migrations geradas correspondentes; não reescrever as migrations canônicas antigas para duplicar o efeito.

## Validação informada

- 7/7 tabelas com RLS habilitado;
- uma policy administrativa por tabela;
- nenhuma policy para `anon`;
- `travel_offers`, `client_trips`, `active_trips` e WhatsApp não alterados.

## Edge Functions

Implantadas:

- `trip-composer-discovery`;
- `trip-composer-planner`.

`verify_jwt = false` preservado conforme `supabase/config.toml`.

A plataforma não forneceu deployment IDs nem SHA efetivo por função. Portanto, registrar como **implantadas por confirmação operacional**, mas não como **SHA de função independentemente verificado**.

## Linter

Foram reportados 29 achados pré-existentes e nenhum novo achado atribuído às Etapas 1–2.

## Estado por marco

- Etapas 1–3 implementadas: sim.
- Mergeadas: sim.
- Migrations aplicadas: sim.
- Edge Functions implantadas: sim, por confirmação operacional.
- SHA de deploy das funções verificado: não disponível.
- Frontend: inalterado.
- Téo/WhatsApp: inalterados.
- Publicação: não realizada.
