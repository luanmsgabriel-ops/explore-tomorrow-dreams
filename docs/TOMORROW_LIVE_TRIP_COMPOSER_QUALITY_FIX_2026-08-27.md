# Tomorrow Live Trip Composer — Correção de qualidade de experiências e UI

Data: 2026-08-27
Baseline: `065842ef93cd8109ecd4efbd016fb713cb80b30e`

## Problemas observados em teste real

1. Pedido por experiência de aventura em Santiago retornava principalmente agências de turismo em vez de experiências/lugares.
2. O Trip Composer informava que opções estavam na tela, mas os cards não ficavam visíveis no viewport principal.
3. O backend carregava referências de fotos do Google Places, mas o frontend esperava URLs resolvidas.
4. Tempo e distância calculados pelo Planner não eram mapeados para os cards.
5. Uma escolha podia ser narrada como “rota na interface”, apesar de o mapa vivo ainda não fazer parte desta etapa.

## Correções

- buscas de aventura são expandidas deterministicamente para atrações de natureza, trilhas, montanhas e esportes de aventura;
- locais classificados como `travel_agency` e outros provedores de serviço são filtrados antes do Planner;
- resultados de múltiplas buscas são deduplicados por Place ID;
- fotos dos três candidatos finais são resolvidas server-side por `trip-composer-discovery?action=photo`, sem expor a API key;
- cards passam a receber URLs reais de imagem e atribuição quando disponível;
- `estimated_travel_minutes` e `estimated_distance_meters` são mapeados corretamente para a UI;
- duração não é exibida como fato quando não existe duração curada/factual; o fallback interno do Planner permanece apenas como estimativa operacional de scoring;
- o Trip Composer visual passa a ser um overlay flutuante dentro da experiência Live, em vez de ficar abaixo da primeira dobra da página.

## Limite conhecido

Google Places representa lugares e atrações, não um inventário comercial confiável de excursões com duração e disponibilidade. Portanto, o MVP deve recomendar experiências/lugares reais e deixar a comercialização/cotação para o fluxo posterior aprovado da Tomorrow Travel. Não transformar agência em experiência e não inventar duração comercial.

## Validação

GitHub Actions run `33033121578`:

- `deno check` de `trip-composer-window`: PASS;
- testes focados Window/Planner: PASS;
- testes frontend Trip Composer: PASS;
- ESLint do escopo alterado: PASS;
- build completo: PASS.

Workflow temporário removido antes do PR.

## Estado

- IMPLEMENTADO: sim, na branch;
- TESTADO: sim;
- MERGEADO: não neste checkpoint;
- EDGE FUNCTION atualizada no Cloud: não;
- FRONTEND publicado: não;
- VALIDADO EM PRODUÇÃO: não.
