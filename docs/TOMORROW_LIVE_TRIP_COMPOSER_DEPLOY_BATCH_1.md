# Tomorrow Live Trip Composer — Deployment Batch 1

## Escopo

Lote consolidado das Etapas 1, 2 e 3. Este manifesto existe para evitar sincronizações/implantações fragmentadas no Lovable Cloud/Supabase.

## Baseline esperado após merge

A preencher com o SHA final da `main` após merge da Etapa 3.

## Migrations pendentes, em ordem

1. `supabase/migrations/20260826001500_trip_composer_stage1_foundation.sql`
2. `supabase/migrations/20260826010000_trip_composer_stage2_discovery.sql`

## Edge Functions novas pendentes

1. `trip-composer-discovery`
2. `trip-composer-planner`

Ambas estão registradas em `supabase/config.toml` com `verify_jwt = false`, mas ainda não estão conectadas ao frontend nem ao Téo.

## Variáveis já esperadas

- `GOOGLE_MAPS_API_KEY` — confirmar existência no ambiente sem revelar o valor.

Não criar nem expor chave em frontend.

## Validação obrigatória após aplicação

### Banco

- confirmar existência de `traveler_profiles`, `trip_sessions`, `trip_days`, `trip_day_items`, `trip_preferences`;
- confirmar existência de `travel_places`, `travel_experiences`;
- confirmar RLS habilitado nas sete tabelas;
- confirmar policies administrativas e ausência de leitura pública direta;
- executar ciclo controlado de sessão de teste e remover dados de teste ao final.

### Discovery

- pesquisar um lugar real por destino;
- confirmar Place ID, nome, coordenadas e endereço coerentes;
- confirmar retorno de múltiplas fotos quando disponíveis;
- confirmar atribuições de foto;
- confirmar que a chave Google não aparece na resposta.

### Planner

- executar testes unitários de `_shared/trip-composer-planner.test.ts`;
- testar janela curta e confirmar exclusão de candidato inviável;
- testar preferência de categoria;
- testar contexto de chuva;
- testar Google Route Matrix e confirmar tempo/distância reais;
- confirmar máximo de três candidatos.

## Não fazer neste lote

- não alterar prompt/tom/ferramentas do Téo;
- não alterar `whatsapp-webhook`;
- não conectar o Composer ao frontend;
- não publicar o site;
- não alterar `public.travel_offers`;
- não copiar respostas completas do Google Places para o banco;
- não registrar ou exibir valores de secrets.

## Estados esperados após o lote

- código: mergeado;
- migrations: aplicadas e validadas;
- Edge Functions: implantadas e smoke-tested;
- frontend: inalterado;
- Lovable sync: confirmado no SHA final;
- publicação pública: não realizada.
