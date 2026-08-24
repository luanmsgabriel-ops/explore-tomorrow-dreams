# Tomorrow Travel — Etapa 11 — Performance de imagens

## Estado

Implementada e testada no PR #68. Merge, sincronização Lovable, implantação e validação em produção pendentes neste checkpoint.

## Diagnóstico

- O catálogo já utilizava carregamento lazy, `IntersectionObserver`, `decoding=async` e prioridade reduzida fora da primeira dobra.
- O gargalo restante era o peso e a latência das imagens remotas: a maior parte do inventário ativo de pacotes utiliza arquivos PNG externos.
- O frontend dependia diretamente do servidor de origem para cada carregamento.

## Implementação

- Nova Edge Function pública `travel-offer-image` com contrato fechado por UUID e preset `card`.
- A função resolve a imagem somente no servidor, valida a oferta ativa e a origem permitida, limita tamanho/formato e não aceita URL arbitrária do cliente.
- Primeiro acesso copia a imagem validada para o bucket público `offer-images-cache` com caminho versionado pelo fingerprint da origem.
- A resposta aponta para o render de imagem do Supabase Storage em 720x405, `cover`, qualidade 72, permitindo otimização de formato e CDN.
- Cards usam a URL otimizada, mantêm lazy loading, dimensões e `sizes`, e fazem fallback para a imagem pública original se a otimização falhar.
- Nenhum `raw_data`, `source_url`, credencial ou link interno é retornado ao navegador pela nova função.

## Arquivos

- `src/components/opportunities/DeferredOfferImage.tsx`
- `src/components/opportunities/OpportunityCard.tsx`
- `src/lib/offerImages.ts`
- `src/lib/offerImages.test.ts`
- `supabase/config.toml`
- `supabase/functions/travel-offer-image/core.ts`
- `supabase/functions/travel-offer-image/core_test.ts`
- `supabase/functions/travel-offer-image/index.ts`
- `supabase/migrations/20260824030000_offer_images_cache_bucket.sql`

## Validação

GitHub Actions run `32684881928` aprovado:

- Vitest focado;
- ESLint do escopo;
- TypeScript sem novos erros;
- teste Deno do contrato da Edge Function;
- `deno check` da Edge Function;
- build Vite/PWA de produção;
- `git diff --check`.

O workflow temporário foi removido após a validação.

## Próxima ação exata

Mergear o PR #68; depois sincronizar o SHA no Lovable, aplicar a migration do bucket, implantar somente `travel-offer-image`, publicar o frontend somente mediante autorização e validar no domínio real o peso/tempo das imagens do catálogo e Tomorrow Live.
